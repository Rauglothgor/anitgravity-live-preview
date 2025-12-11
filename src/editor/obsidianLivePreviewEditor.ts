/**
 * Antigravity Live Preview Editor
 *
 * Implements true inline markdown rendering with:
 * - Syntax hiding (## becomes invisible, heading text shows formatted)
 * - Cursor-aware rendering (raw markdown at cursor, rendered elsewhere)
 * - Instant parsing and decoration updates
 * - Full markdown support (headings, lists, bold, italic, code, links, etc)
 */

import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, WidgetType, keymap } from '@codemirror/view';
import { EditorState, StateField, StateEffect, Facet } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import MarkdownIt from 'markdown-it';
import katex from 'katex';

/**
 * Preview mode types
 * - source: Raw markdown only, no rendering
 * - live-preview: Rendered markdown with cursor-aware editing (default)
 * - reading: Fully rendered markdown, no raw syntax visible
 */
export type PreviewMode = 'source' | 'live-preview' | 'reading';

/**
 * State effect for changing preview mode
 */
const setModeEffect = StateEffect.define<PreviewMode>();

/**
 * Facet for configuring initial preview mode
 */
const initialModeFacet = Facet.define<PreviewMode, PreviewMode>({
  combine: values => values[0] ?? 'live-preview'
});

/**
 * State field to track current preview mode
 * Uses initialModeFacet for configurable initial value
 */
const modeField = StateField.define<PreviewMode>({
  create: (state) => state.facet(initialModeFacet),
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setModeEffect)) {
        return effect.value;
      }
    }
    return value;
  },
});

/**
 * Widget types for various markdown elements
 */

class HiddenMarkupWidget extends WidgetType {
  constructor(readonly markup: string) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-hidden-markup';
    span.setAttribute('aria-hidden', 'true');
    return span;
  }

  eq(other: HiddenMarkupWidget) {
    return this.markup === other.markup;
  }
}

class LinkWidget extends WidgetType {
  constructor(readonly text: string, readonly url: string) {
    super();
  }

  toDOM() {
    const a = document.createElement('a');
    a.className = 'cm-link-widget';
    a.href = this.url;
    a.textContent = this.text;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.addEventListener('click', (e) => {
      // In editor context, prevent default but allow external view
      e.preventDefault();
    });
    return a;
  }

  eq(other: LinkWidget) {
    return this.text === other.text && this.url === other.url;
  }
}

class ImageWidget extends WidgetType {
  constructor(readonly alt: string, readonly src: string) {
    super();
  }

  toDOM() {
    const img = document.createElement('img');
    img.className = 'cm-image-widget';
    img.alt = this.alt;
    img.src = this.src;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '4px';
    img.style.margin = '0.5em 0';
    return img;
  }

  eq(other: ImageWidget) {
    return this.alt === other.alt && this.src === other.src;
  }
}

class TaskListWidget extends WidgetType {
  constructor(readonly checked: boolean, readonly text: string) {
    super();
  }

  toDOM() {
    const container = document.createElement('div');
    container.className = 'cm-task-list-item';
    container.style.display = 'flex';
    container.style.alignItems = 'flex-start';
    container.style.gap = '0.5em';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.checked;
    checkbox.className = 'cm-task-checkbox';
    checkbox.style.marginTop = '0.25em';

    const label = document.createElement('span');
    label.className = 'cm-task-text';
    label.textContent = this.text;

    container.appendChild(checkbox);
    container.appendChild(label);
    return container;
  }

  eq(other: TaskListWidget) {
    return this.checked === other.checked && this.text === other.text;
  }
}

/**
 * Widget for rendering [[wikilinks]] and [[wikilinks|display text]]
 */
class WikilinkWidget extends WidgetType {
  constructor(readonly target: string, readonly displayText: string) {
    super();
  }

  toDOM() {
    const a = document.createElement('a');
    a.className = 'cm-wikilink';
    a.href = '#';
    a.textContent = this.displayText;
    a.title = `Open: ${this.target}`;
    a.dataset.target = this.target;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      // Dispatch custom event for webview to handle
      const event = new CustomEvent('wikilink-click', {
        detail: { target: this.target },
        bubbles: true,
      });
      a.dispatchEvent(event);
    });
    return a;
  }

  eq(other: WikilinkWidget) {
    return this.target === other.target && this.displayText === other.displayText;
  }
}

/**
 * Widget for rendering inline math $...$
 */
class InlineMathWidget extends WidgetType {
  constructor(readonly latex: string) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-math cm-math-inline';
    try {
      katex.render(this.latex, span, {
        throwOnError: false,
        displayMode: false,
      });
    } catch (e) {
      span.textContent = `$${this.latex}$`;
      span.className += ' cm-math-error';
    }
    return span;
  }

  eq(other: InlineMathWidget) {
    return this.latex === other.latex;
  }
}

/**
 * Widget for rendering block math $$...$$
 */
class BlockMathWidget extends WidgetType {
  constructor(readonly latex: string) {
    super();
  }

  toDOM() {
    const div = document.createElement('div');
    div.className = 'cm-math cm-math-block';
    try {
      katex.render(this.latex, div, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (e) {
      div.textContent = `$$${this.latex}$$`;
      div.className += ' cm-math-error';
    }
    return div;
  }

  eq(other: BlockMathWidget) {
    return this.latex === other.latex;
  }
}

/**
 * Callout types with their icons and default colors
 */
const CALLOUT_TYPES: Record<string, { icon: string; colorClass: string }> = {
  note: { icon: '📝', colorClass: 'cm-callout-note' },
  abstract: { icon: '📋', colorClass: 'cm-callout-abstract' },
  summary: { icon: '📋', colorClass: 'cm-callout-abstract' },
  tldr: { icon: '📋', colorClass: 'cm-callout-abstract' },
  info: { icon: 'ℹ️', colorClass: 'cm-callout-info' },
  todo: { icon: '☑️', colorClass: 'cm-callout-todo' },
  tip: { icon: '💡', colorClass: 'cm-callout-tip' },
  hint: { icon: '💡', colorClass: 'cm-callout-tip' },
  important: { icon: '🔥', colorClass: 'cm-callout-tip' },
  success: { icon: '✅', colorClass: 'cm-callout-success' },
  check: { icon: '✅', colorClass: 'cm-callout-success' },
  done: { icon: '✅', colorClass: 'cm-callout-success' },
  question: { icon: '❓', colorClass: 'cm-callout-question' },
  help: { icon: '❓', colorClass: 'cm-callout-question' },
  faq: { icon: '❓', colorClass: 'cm-callout-question' },
  warning: { icon: '⚠️', colorClass: 'cm-callout-warning' },
  caution: { icon: '⚠️', colorClass: 'cm-callout-warning' },
  attention: { icon: '⚠️', colorClass: 'cm-callout-warning' },
  failure: { icon: '❌', colorClass: 'cm-callout-failure' },
  fail: { icon: '❌', colorClass: 'cm-callout-failure' },
  missing: { icon: '❌', colorClass: 'cm-callout-failure' },
  danger: { icon: '⛔', colorClass: 'cm-callout-danger' },
  error: { icon: '⛔', colorClass: 'cm-callout-danger' },
  bug: { icon: '🐛', colorClass: 'cm-callout-bug' },
  example: { icon: '📖', colorClass: 'cm-callout-example' },
  quote: { icon: '💬', colorClass: 'cm-callout-quote' },
  cite: { icon: '💬', colorClass: 'cm-callout-quote' },
};

/**
 * Widget for rendering Obsidian-style callouts
 * Syntax: > [!TYPE] Optional Title
 */
class CalloutWidget extends WidgetType {
  constructor(
    readonly calloutType: string,
    readonly title: string,
    readonly content: string,
    readonly isFolded: boolean
  ) {
    super();
  }

  toDOM() {
    const typeInfo = CALLOUT_TYPES[this.calloutType.toLowerCase()] ||
      { icon: '📌', colorClass: 'cm-callout-note' };

    const container = document.createElement('div');
    container.className = `cm-callout ${typeInfo.colorClass}`;
    if (this.isFolded) {
      container.classList.add('cm-callout-folded');
    }

    // Header with icon and title
    const header = document.createElement('div');
    header.className = 'cm-callout-header';

    const icon = document.createElement('span');
    icon.className = 'cm-callout-icon';
    icon.textContent = typeInfo.icon;

    const title = document.createElement('span');
    title.className = 'cm-callout-title';
    title.textContent = this.title || this.calloutType.charAt(0).toUpperCase() + this.calloutType.slice(1);

    header.appendChild(icon);
    header.appendChild(title);

    // Fold indicator if foldable
    if (this.isFolded) {
      const foldIcon = document.createElement('span');
      foldIcon.className = 'cm-callout-fold';
      foldIcon.textContent = '▶';
      header.appendChild(foldIcon);
    }

    container.appendChild(header);

    // Content (only if not folded or has content)
    if (this.content && !this.isFolded) {
      const contentDiv = document.createElement('div');
      contentDiv.className = 'cm-callout-content';
      contentDiv.textContent = this.content;
      container.appendChild(contentDiv);
    }

    return container;
  }

  eq(other: CalloutWidget) {
    return this.calloutType === other.calloutType &&
           this.title === other.title &&
           this.content === other.content &&
           this.isFolded === other.isFolded;
  }
}

/**
 * Main Live Preview Plugin
 */
export class ObsidianLivePreviewPlugin {
  private view: EditorView;
  private parser!: MarkdownIt;
  private cursorLine: number = -1;
  private cachedDecorations: DecorationSet = Decoration.none;

  constructor(view: EditorView) {
    this.view = view;
    this.initializeParser();
    try {
      this.updateCursorPosition();
      this.cachedDecorations = this.computeDecorations();
    } catch (error) {
      console.error('Plugin initialization error:', error);
      this.cachedDecorations = Decoration.none;
    }
  }

  private initializeParser() {
    this.parser = new MarkdownIt({
      html: false,
      breaks: true,
      linkify: true,
      typographer: true,
    });
  }

  update(update: ViewUpdate) {
    try {
      const selectionChanged = update.selectionSet;
      const docChanged = update.docChanged;
      const modeChanged = update.transactions.some(tr =>
        tr.effects.some(effect => effect.is(setModeEffect))
      );

      if (selectionChanged) {
        this.updateCursorPosition();
      }

      if (docChanged || selectionChanged || modeChanged) {
        this.cachedDecorations = this.computeDecorations();
      }
    } catch (error) {
      console.error('Plugin update error:', error);
      // Don't crash - keep existing decorations
    }
  }

  get decorations(): DecorationSet {
    return this.cachedDecorations;
  }

  private updateCursorPosition() {
    try {
      const cursorPos = this.view.state.selection.main.head;
      this.cursorLine = this.view.state.doc.lineAt(cursorPos).number - 1;
    } catch (error) {
      console.error('Cursor position update error:', error);
      this.cursorLine = -1;
    }
  }

  private computeDecorations(): DecorationSet {
    try {
      // Get current mode from state
      const mode = this.view.state.field(modeField);

      // Source mode: no decorations, show raw markdown
      if (mode === 'source') {
        return Decoration.none;
      }

      const decorations: Array<{from: number; to: number; value: Decoration}> = [];
      const text = this.view.state.doc.toString();
      const lines = text.split('\n');

      let charPos = 0;
      const docLength = this.view.state.doc.length;

      lines.forEach((line, lineIndex) => {
        // Live preview mode: skip rendering at cursor line - show raw markdown
        // Reading mode: render all lines (ignore cursor position)
        if (mode === 'live-preview' && lineIndex === this.cursorLine) {
          charPos += line.length + 1;
          return;
        }

        try {
          const lineDecorations = this.decorateLine(line, charPos, lineIndex);
          // Filter out any decorations that exceed document bounds
          for (const deco of lineDecorations) {
            if (deco.from >= 0 && deco.to <= docLength && deco.from < deco.to) {
              decorations.push(deco);
            }
          }
        } catch (lineError) {
          // Skip this line if decoration fails, don't crash the whole plugin
          console.warn('Decoration error on line', lineIndex, lineError);
        }

        charPos += line.length + 1; // +1 for newline
      });

      // Sort decorations by position
      decorations.sort((a, b) => a.from - b.from);

      return Decoration.set(decorations.map(d => d.value.range(d.from, d.to)));
    } catch (error) {
      // If decoration computation fails entirely, return empty decorations
      // This prevents the plugin from crashing
      console.error('Decoration computation failed:', error);
      return Decoration.none;
    }
  }

  private decorateLine(line: string, lineStartPos: number, _lineIndex: number): Array<{from: number; to: number; value: Decoration}> {
    const decorations: Array<{from: number; to: number; value: Decoration}> = [];

    // Skip empty lines
    if (!line.trim()) {
      return decorations;
    }

    // Heading detection and decoration
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      return this.decorateHeading(headingMatch, lineStartPos, line);
    }

    // Callout detection (must come before blockquote)
    // Syntax: > [!TYPE] Optional Title or > [!TYPE]- Folded Title
    const calloutMatch = line.match(/^>\s*\[!(\w+)\](-?)\s*(.*)?$/);
    if (calloutMatch) {
      return this.decorateCallout(calloutMatch, lineStartPos, line);
    }

    // Blockquote detection (regular blockquotes without callout syntax)
    if (line.match(/^>\s*/)) {
      return this.decorateBlockquote(line, lineStartPos);
    }

    // Task list detection
    const taskMatch = line.match(/^[\s]*[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      return this.decorateTaskList(taskMatch, lineStartPos, line);
    }

    // Ordered/unordered list
    const listMatch = line.match(/^[\s]*[-*+]\s+/);
    if (listMatch) {
      const listDeco = this.decorateListItem(line, lineStartPos);
      if (listDeco) {
        decorations.push(listDeco);
      }
    }

    // Inline code decoration
    const codeDecorations = this.decorateInlineCode(line, lineStartPos);
    decorations.push(...codeDecorations);

    // Bold decoration
    const boldDecorations = this.decorateBold(line, lineStartPos);
    decorations.push(...boldDecorations);

    // Italic decoration
    const italicDecorations = this.decorateItalic(line, lineStartPos);
    decorations.push(...italicDecorations);

    // Strikethrough decoration
    const strikethroughDecorations = this.decorateStrikethrough(line, lineStartPos);
    decorations.push(...strikethroughDecorations);

    // Link decoration
    const linkDecorations = this.decorateLinks(line, lineStartPos);
    decorations.push(...linkDecorations);

    // Image decoration
    const imageDecorations = this.decorateImages(line, lineStartPos);
    decorations.push(...imageDecorations);

    // Wikilink decoration [[Page Name]] or [[Page Name|Display Text]]
    const wikilinkDecorations = this.decorateWikilinks(line, lineStartPos);
    decorations.push(...wikilinkDecorations);

    // Math decoration $...$ and $$...$$
    const mathDecorations = this.decorateMath(line, lineStartPos);
    decorations.push(...mathDecorations);

    return decorations;
  }

  private decorateHeading(match: RegExpMatchArray, lineStartPos: number, line: string): Array<{from: number; to: number; value: Decoration}> {
    const level = match[1].length;
    const markupEnd = lineStartPos + match[1].length + 1; // +1 for space

    return [
      // Hide the hash marks
      {
        from: lineStartPos,
        to: markupEnd,
        value: Decoration.replace({
          widget: new HiddenMarkupWidget(match[1]),
        }),
      },
      // Style the heading text
      {
        from: markupEnd,
        to: lineStartPos + line.length,
        value: Decoration.mark({
          class: `cm-heading cm-heading-${level}`,
          attributes: { style: this.getHeadingStyle(level) },
        }),
      },
    ];
  }

  private getHeadingStyle(level: number): string {
    const sizes: Record<number, string> = {
      1: 'font-size: 1.8em; font-weight: 700; margin: 0.5em 0 0.25em 0;',
      2: 'font-size: 1.6em; font-weight: 700; margin: 0.4em 0 0.2em 0;',
      3: 'font-size: 1.4em; font-weight: 700; margin: 0.3em 0 0.15em 0;',
      4: 'font-size: 1.2em; font-weight: 700; margin: 0.2em 0 0.1em 0;',
      5: 'font-size: 1.1em; font-weight: 700; margin: 0.1em 0;',
      6: 'font-size: 1em; font-weight: 700; margin: 0.1em 0;',
    };
    return sizes[level] || '';
  }

  private decorateCallout(match: RegExpMatchArray, lineStartPos: number, line: string): Array<{from: number; to: number; value: Decoration}> {
    const calloutType = match[1].toLowerCase();
    const isFolded = match[2] === '-';
    const title = match[3] || '';

    // For now, we only handle the first line of a callout
    // Multi-line callout content would require tracking state across lines
    return [
      {
        from: lineStartPos,
        to: lineStartPos + line.length,
        value: Decoration.replace({
          widget: new CalloutWidget(calloutType, title, '', isFolded),
        }),
      },
    ];
  }

  private decorateBlockquote(line: string, lineStartPos: number): Array<{from: number; to: number; value: Decoration}> {
    const match = line.match(/^(>\s*)(.*)$/);
    if (!match) return [];

    const markupLength = match[1].length;
    const contentStart = lineStartPos + markupLength;

    return [
      // Hide the > character
      {
        from: lineStartPos,
        to: contentStart,
        value: Decoration.replace({
          widget: new HiddenMarkupWidget('>'),
        }),
      },
      // Style the blockquote
      {
        from: contentStart,
        to: lineStartPos + line.length,
        value: Decoration.mark({
          class: 'cm-blockquote',
          attributes: {
            style: 'border-left: 4px solid var(--color-accent); padding-left: 1em; color: var(--color-text-muted); font-style: italic;',
          },
        }),
      },
    ];
  }

  private decorateTaskList(match: RegExpMatchArray, lineStartPos: number, line: string): Array<{from: number; to: number; value: Decoration}> {
    const checkbox = match[1];
    const text = match[2];
    const checked = checkbox !== ' ';

    return [
      // Replace entire line with task widget
      {
        from: lineStartPos,
        to: lineStartPos + line.length,
        value: Decoration.replace({
          widget: new TaskListWidget(checked, text),
        }),
      },
    ];
  }

  private decorateListItem(line: string, lineStartPos: number): {from: number; to: number; value: Decoration} | null {
    const match = line.match(/^([\s]*)([-*+])\s+/);
    if (!match) return null;

    return {
      from: lineStartPos,
      to: lineStartPos + match[0].length,
      value: Decoration.mark({
        class: 'cm-list-item',
        attributes: { style: 'list-style: none;' },
      }),
    };
  }

  private decorateInlineCode(line: string, lineStartPos: number): Array<{from: number; to: number; value: Decoration}> {
    const decorations: Array<{from: number; to: number; value: Decoration}> = [];
    const codeRegex = /`([^`]+)`/g;
    let match;

    while ((match = codeRegex.exec(line)) !== null) {
      const codeStart = lineStartPos + match.index;
      const codeEnd = codeStart + match[0].length;

      decorations.push(
        // Hide opening backtick
        {
          from: codeStart,
          to: codeStart + 1,
          value: Decoration.replace({
            widget: new HiddenMarkupWidget('`'),
          }),
        },
        // Hide closing backtick
        {
          from: codeEnd - 1,
          to: codeEnd,
          value: Decoration.replace({
            widget: new HiddenMarkupWidget('`'),
          }),
        },
        // Style code
        {
          from: codeStart + 1,
          to: codeEnd - 1,
          value: Decoration.mark({
            class: 'cm-inline-code',
            attributes: {
              style: 'background: var(--color-code-bg); padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; font-size: 0.9em;',
            },
          }),
        }
      );
    }

    return decorations;
  }

  private decorateBold(line: string, lineStartPos: number): Array<{from: number; to: number; value: Decoration}> {
    const decorations: Array<{from: number; to: number; value: Decoration}> = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      const boldStart = lineStartPos + match.index;
      const boldEnd = boldStart + match[0].length;

      decorations.push(
        // Hide opening **
        {
          from: boldStart,
          to: boldStart + 2,
          value: Decoration.replace({
            widget: new HiddenMarkupWidget('**'),
          }),
        },
        // Hide closing **
        {
          from: boldEnd - 2,
          to: boldEnd,
          value: Decoration.replace({
            widget: new HiddenMarkupWidget('**'),
          }),
        },
        // Bold text
        {
          from: boldStart + 2,
          to: boldEnd - 2,
          value: Decoration.mark({
            class: 'cm-bold',
            attributes: { style: 'font-weight: 700;' },
          }),
        }
      );
    }

    return decorations;
  }

  private decorateItalic(line: string, lineStartPos: number): Array<{from: number; to: number; value: Decoration}> {
    const decorations: Array<{from: number; to: number; value: Decoration}> = [];
    // Avoid single * in **bold** patterns
    const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g;
    let match;

    while ((match = italicRegex.exec(line)) !== null) {
      const italicStart = lineStartPos + match.index;
      const italicEnd = italicStart + match[0].length;

      decorations.push(
        // Hide opening *
        {
          from: italicStart,
          to: italicStart + 1,
          value: Decoration.replace({
            widget: new HiddenMarkupWidget('*'),
          }),
        },
        // Hide closing *
        {
          from: italicEnd - 1,
          to: italicEnd,
          value: Decoration.replace({
            widget: new HiddenMarkupWidget('*'),
          }),
        },
        // Italic text
        {
          from: italicStart + 1,
          to: italicEnd - 1,
          value: Decoration.mark({
            class: 'cm-italic',
            attributes: { style: 'font-style: italic;' },
          }),
        }
      );
    }

    return decorations;
  }

  private decorateStrikethrough(line: string, lineStartPos: number): Array<{from: number; to: number; value: Decoration}> {
    const decorations: Array<{from: number; to: number; value: Decoration}> = [];
    const strikeRegex = /~~([^~]+)~~/g;
    let match;

    while ((match = strikeRegex.exec(line)) !== null) {
      const strikeStart = lineStartPos + match.index;
      const strikeEnd = strikeStart + match[0].length;

      decorations.push(
        // Hide opening ~~
        {
          from: strikeStart,
          to: strikeStart + 2,
          value: Decoration.replace({
            widget: new HiddenMarkupWidget('~~'),
          }),
        },
        // Hide closing ~~
        {
          from: strikeEnd - 2,
          to: strikeEnd,
          value: Decoration.replace({
            widget: new HiddenMarkupWidget('~~'),
          }),
        },
        // Strikethrough text
        {
          from: strikeStart + 2,
          to: strikeEnd - 2,
          value: Decoration.mark({
            class: 'cm-strikethrough',
            attributes: { style: 'text-decoration: line-through;' },
          }),
        }
      );
    }

    return decorations;
  }

  private decorateLinks(line: string, lineStartPos: number): Array<{from: number; to: number; value: Decoration}> {
    const decorations: Array<{from: number; to: number; value: Decoration}> = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      const linkStart = lineStartPos + match.index;
      const linkEnd = linkStart + match[0].length;
      const linkText = match[1];
      const linkUrl = match[2];

      decorations.push({
        from: linkStart,
        to: linkEnd,
        value: Decoration.replace({
          widget: new LinkWidget(linkText, linkUrl),
        }),
      });
    }

    return decorations;
  }

  private decorateImages(line: string, lineStartPos: number): Array<{from: number; to: number; value: Decoration}> {
    const decorations: Array<{from: number; to: number; value: Decoration}> = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(line)) !== null) {
      const imageStart = lineStartPos + match.index;
      const imageEnd = imageStart + match[0].length;
      const alt = match[1] || 'image';
      const src = match[2];

      decorations.push({
        from: imageStart,
        to: imageEnd,
        value: Decoration.replace({
          widget: new ImageWidget(alt, src),
        }),
      });
    }

    return decorations;
  }

  private decorateWikilinks(line: string, lineStartPos: number): Array<{from: number; to: number; value: Decoration}> {
    const decorations: Array<{from: number; to: number; value: Decoration}> = [];
    // Match [[target]] or [[target|display text]]
    const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    let match;

    while ((match = wikilinkRegex.exec(line)) !== null) {
      const linkStart = lineStartPos + match.index;
      const linkEnd = linkStart + match[0].length;
      const target = match[1];
      const displayText = match[2] || match[1]; // Use target as display if no pipe

      decorations.push({
        from: linkStart,
        to: linkEnd,
        value: Decoration.replace({
          widget: new WikilinkWidget(target, displayText),
        }),
      });
    }

    return decorations;
  }

  private decorateMath(line: string, lineStartPos: number): Array<{from: number; to: number; value: Decoration}> {
    const decorations: Array<{from: number; to: number; value: Decoration}> = [];

    // Block math $$...$$ (must be checked first to avoid matching as inline)
    const blockMathRegex = /\$\$([^$]+)\$\$/g;
    let match;

    while ((match = blockMathRegex.exec(line)) !== null) {
      const mathStart = lineStartPos + match.index;
      const mathEnd = mathStart + match[0].length;
      const latex = match[1].trim();

      decorations.push({
        from: mathStart,
        to: mathEnd,
        value: Decoration.replace({
          widget: new BlockMathWidget(latex),
        }),
      });
    }

    // Inline math $...$ (avoid matching $$)
    // Use negative lookbehind/lookahead to avoid $$ matches
    const inlineMathRegex = /(?<!\$)\$(?!\$)([^$]+)\$(?!\$)/g;

    while ((match = inlineMathRegex.exec(line)) !== null) {
      const mathStart = lineStartPos + match.index;
      const mathEnd = mathStart + match[0].length;
      const latex = match[1].trim();

      // Skip if this position was already decorated by block math
      const alreadyDecorated = decorations.some(
        d => mathStart >= d.from && mathStart < d.to
      );
      if (alreadyDecorated) continue;

      decorations.push({
        from: mathStart,
        to: mathEnd,
        value: Decoration.replace({
          widget: new InlineMathWidget(latex),
        }),
      });
    }

    return decorations;
  }
}

/**
 * Create the editor view with all extensions
 */
export function createObsidianLivePreviewEditor(
  element: HTMLElement,
  initialDoc: string = '',
  options?: {
    theme?: 'light' | 'dark';
    mode?: PreviewMode;
  }
): EditorView {
  const theme = options?.theme || 'dark';
  const initialMode = options?.mode || 'live-preview';

  // Create the plugin
  const livePreviewPlugin = ViewPlugin.fromClass(ObsidianLivePreviewPlugin, {
    decorations: (instance) => instance.decorations,
  });

  const state = EditorState.create({
    doc: initialDoc,
    extensions: [
      markdown(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      initialModeFacet.of(initialMode),
      modeField,
      livePreviewPlugin,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ spellcheck: 'true' }),
      theme === 'dark' ? oneDark : [],
    ],
  });

  const view = new EditorView({
    state,
    parent: element,
  });

  return view;
}

/**
 * Get editor content as text
 */
export function getEditorContent(view: EditorView): string {
  return view.state.doc.toString();
}

/**
 * Set editor content while preserving cursor position
 */
export function setEditorContent(view: EditorView, content: string) {
  // Save current selection/cursor position
  const selection = view.state.selection;
  const cursorPos = selection.main.head;

  // Calculate new cursor position (clamp to new document length)
  const newCursorPos = Math.min(cursorPos, content.length);

  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: content,
    },
    // Preserve cursor position after content replacement
    selection: { anchor: newCursorPos },
  });
}

/**
 * Set editor preview mode
 */
export function setEditorMode(view: EditorView, mode: PreviewMode) {
  view.dispatch({
    effects: setModeEffect.of(mode),
  });
}

/**
 * Get current editor preview mode
 */
export function getEditorMode(view: EditorView): PreviewMode {
  // Try to get the mode from state, with fallback
  try {
    return view.state.field(modeField);
  } catch {
    return 'live-preview';
  }
}
