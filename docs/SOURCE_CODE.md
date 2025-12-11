# Source Code Bundle

This document contains the complete source code for the Obsidian Live Preview for Google Antigravity extension.

## Table of Contents

1.  [package.json](#packagejson)
2.  [tsconfig.json](#tsconfigjson)
3.  [esbuild.config.js](#esbuildconfigjs)
4.  [src/extension.ts](#srcextensionts)
5.  [src/editor/obsidianLivePreviewEditor.ts](#srceditorobsidianliveprevieweditorts)
6.  [src/webview/editor.ts](#srcwebvieweditorts)
7.  [media/editor.css](#mediaeditorcss)

---

## package.json

```json
{
  "name": "obsidian-live-preview-antigravity",
  "displayName": "Obsidian Live Preview for Antigravity",
  "description": "True Obsidian-style inline markdown live preview with syntax hiding and instant rendering",
  "version": "1.0.0",
  "license": "MIT",
  "engines": {
    "vscode": "^1.95.0"
  },
  "categories": [
    "Markdown",
    "Formatters"
  ],
  "keywords": [
    "markdown",
    "obsidian",
    "live-preview",
    "wysiwyg",
    "editor"
  ],
  "activationEvents": [
    "onLanguage:markdown"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "obsidian-live-preview.enable",
        "title": "Enable Obsidian Live Preview"
      },
      {
        "command": "obsidian-live-preview.disable",
        "title": "Disable Obsidian Live Preview"
      },
      {
        "command": "obsidian-live-preview.toggle",
        "title": "Toggle Obsidian Live Preview"
      }
    ],
    "keybindings": [
      {
        "command": "obsidian-live-preview.toggle",
        "key": "ctrl+shift+l",
        "mac": "cmd+shift+l",
        "when": "editorLangId == markdown"
      }
    ],
    "configuration": [
      {
        "title": "Obsidian Live Preview",
        "properties": {
          "obsidian-live-preview.enabled": {
            "type": "boolean",
            "default": true,
            "description": "Enable live preview on markdown files"
          },
          "obsidian-live-preview.theme": {
            "type": "string",
            "enum": [
              "obsidian-dark",
              "obsidian-light"
            ],
            "default": "obsidian-dark",
            "description": "Color theme for the editor"
          },
          "obsidian-live-preview.debounceMs": {
            "type": "number",
            "default": 150,
            "description": "Debounce time in milliseconds for parsing"
          },
          "obsidian-live-preview.maxFileSize": {
            "type": "number",
            "default": 1000000,
            "description": "Maximum file size in bytes for live preview"
          },
          "obsidian-live-preview.renderImages": {
            "type": "boolean",
            "default": true,
            "description": "Render inline images"
          },
          "obsidian-live-preview.renderMath": {
            "type": "boolean",
            "default": true,
            "description": "Render LaTeX math expressions"
          },
          "obsidian-live-preview.syncScroll": {
            "type": "boolean",
            "default": true,
            "description": "Sync scroll position between editor and content"
          }
        }
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run esbuild-base -- --minify",
    "esbuild-base": "esbuild ./src/extension.ts --bundle --outfile=out/extension.js --external:vscode --format=cjs --platform=node",
    "esbuild": "npm run esbuild-base -- --sourcemap",
    "esbuild-watch": "npm run esbuild-base -- --sourcemap --watch",
    "typecheck": "tsc --noEmit",
    "dev": "npm run esbuild-watch"
  },
  "dependencies": {
    "@codemirror/autocomplete": "^6.14.0",
    "@codemirror/commands": "^6.3.3",
    "@codemirror/language": "^6.10.1",
    "@codemirror/lang-markdown": "^6.2.2",
    "@codemirror/search": "^6.5.5",
    "@codemirror/state": "^6.4.0",
    "@codemirror/theme-one-dark": "^6.1.2",
    "@codemirror/view": "^6.27.0",
    "markdown-it": "^14.0.0",
    "markdown-it-footnote": "^3.0.3",
    "markdown-it-front-matter": "^0.2.4",
    "markdown-it-task-lists": "^2.1.1",
    "markdown-it-strikethrough": "^3.0.3",
    "markdown-it-sub": "^1.0.0",
    "markdown-it-sup": "^1.0.0",
    "markdown-it-emoji": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/vscode": "^1.95.0",
    "@vscode/vsce": "^2.25.0",
    "esbuild": "^0.20.0",
    "typescript": "^5.3.3"
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./out",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "importHelpers": true,
    "lib": ["ES2020", "DOM"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out", "**/*.test.ts"]
}
```

---

## esbuild.config.js

```javascript
/**
 * esbuild configuration for bundling
 * Bundles both extension.ts and webview editor into single files
 */

const esbuild = require('esbuild');
const path = require('path');

const isProduction = process.argv.includes('--minify');

const baseConfig = {
  bundle: true,
  sourcemap: !isProduction,
  minify: isProduction,
  external: ['vscode'],
};

// Build extension
esbuild.build({
  ...baseConfig,
  entryPoints: ['src/extension.ts'],
  outfile: 'out/extension.js',
  format: 'cjs',
  platform: 'node',
});

// Build webview editor
esbuild.build({
  ...baseConfig,
  entryPoints: ['src/webview/editor.ts'],
  outfile: 'out/editor.js',
  format: 'iife',
  platform: 'browser',
  globalName: 'editor',
}).catch(() => process.exit(1));

console.log('✓ Build complete');
```

---

## src/extension.ts

```typescript
/**
 * VS Code Extension for Obsidian Live Preview in Google Antigravity
 * 
 * This extension integrates the CodeMirror 6-based live preview editor
 * into Google Antigravity by replacing the default markdown editor view.
 */

import * as vscode from 'vscode';
import * as path from 'path';

interface EditorSession {
  panel: vscode.WebviewPanel;
  document: vscode.TextDocument;
  disposables: vscode.Disposable[];
}

const editorSessions = new Map<string, EditorSession>();

export function activate(context: vscode.ExtensionContext) {
  console.log('Obsidian Live Preview extension activated');

  // Command: Enable live preview for current file
  const enableCommand = vscode.commands.registerCommand(
    'obsidian-live-preview.enable',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      if (editor.document.languageId !== 'markdown') {
        vscode.window.showErrorMessage('This file is not markdown');
        return;
      }

      await createLivePreviewEditor(editor.document, context);
    }
  );

  // Command: Disable live preview
  const disableCommand = vscode.commands.registerCommand(
    'obsidian-live-preview.disable',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const sessionKey = editor.document.uri.toString();
        const session = editorSessions.get(sessionKey);
        if (session) {
          session.panel.dispose();
          session.disposables.forEach(d => d.dispose());
          editorSessions.delete(sessionKey);
          vscode.window.showInformationMessage('Live preview disabled');
        }
      }
    }
  );

  // Command: Toggle live preview
  const toggleCommand = vscode.commands.registerCommand(
    'obsidian-live-preview.toggle',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'markdown') {
        return;
      }

      const sessionKey = editor.document.uri.toString();
      if (editorSessions.has(sessionKey)) {
        vscode.commands.executeCommand('obsidian-live-preview.disable');
      } else {
        vscode.commands.executeCommand('obsidian-live-preview.enable');
      }
    }
  );

  // Auto-enable for markdown files if configured
  const shouldAutoEnable = vscode.workspace.getConfiguration('obsidian-live-preview').get('enabled');
  if (shouldAutoEnable) {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === 'markdown') {
        const sessionKey = editor.document.uri.toString();
        if (!editorSessions.has(sessionKey)) {
          createLivePreviewEditor(editor.document, context);
        }
      }
    });
  }

  context.subscriptions.push(enableCommand, disableCommand, toggleCommand);
}

async function createLivePreviewEditor(
  document: vscode.TextDocument,
  context: vscode.ExtensionContext
) {
  const sessionKey = document.uri.toString();

  // Cleanup existing session
  const existingSession = editorSessions.get(sessionKey);
  if (existingSession) {
    existingSession.panel.dispose();
    existingSession.disposables.forEach(d => d.dispose());
  }

  // Create webview panel
  const panel = vscode.window.createWebviewPanel(
    'obsidianLivePreview',
    `Live Preview: ${path.basename(document.fileName)}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'out')),
        vscode.Uri.file(path.join(context.extensionPath, 'media')),
      ],
    }
  );

  // Get resource URIs
  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'out', 'editor.js'))
  );
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'editor.css'))
  );

  // Set initial HTML
  panel.webview.html = getWebviewContent(scriptUri, styleUri, document.getText());

  const disposables: vscode.Disposable[] = [];

  // Sync changes from VS Code editor to webview
  const docChangeListener = vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document === document) {
      panel.webview.postMessage({
        command: 'updateContent',
        content: document.getText(),
      });
    }
  });

  // Listen for messages from webview
  const messageListener = panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.command) {
      case 'updateFromEditor':
        // Update VS Code editor from webview changes
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
          document.uri,
          new vscode.Range(
            new vscode.Position(0, 0),
            document.lineAt(document.lineCount - 1).range.end
          ),
          message.content
        );
        await vscode.workspace.applyEdit(edit);
        break;

      case 'ready':
        console.log('Live preview editor ready');
        break;

      case 'log':
        console.log('Editor:', message.message);
        break;
    }
  });

  // Cleanup on panel close
  const panelDisposeListener = panel.onDidDispose(() => {
    disposables.forEach(d => d.dispose());
    editorSessions.delete(sessionKey);
  });

  disposables.push(docChangeListener, messageListener, panelDisposeListener);

  // Store session
  editorSessions.set(sessionKey, {
    panel,
    document,
    disposables,
  });
}

function getWebviewContent(
  scriptUri: vscode.Uri,
  styleUri: vscode.Uri,
  initialDoc: string
): string {
  // Escape for HTML
  const escapedDoc = initialDoc.replace(/`/g, '\\`');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Obsidian Live Preview</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="editor" class="editor-container"></div>
    
    <script src="${scriptUri}"></script>
    <script>
        // Initialize editor with initial content
        window.initializeEditor(\`${escapedDoc}\`);
    </script>
</body>
</html>`;
}

export function deactivate() {
  // Cleanup all sessions
  editorSessions.forEach((session) => {
    session.panel.dispose();
    session.disposables.forEach(d => d.dispose());
  });
  editorSessions.clear();
}
```

---

## src/editor/obsidianLivePreviewEditor.ts

```typescript
/**
 * Obsidian Live Preview Editor for Google Antigravity
 * 
 * Implements true Obsidian-style inline markdown rendering with:
 * - Syntax hiding (## becomes invisible, heading text shows formatted)
 * - Cursor-aware rendering (raw markdown at cursor, rendered elsewhere)
 * - Instant parsing and decoration updates
 * - Full markdown support (headings, lists, bold, italic, code, links, etc)
 */

import { EditorState, EditorView, ViewPlugin, ViewUpdate, Decoration, WidgetType, DecorationSet } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import MarkdownIt from 'markdown-it';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItStrikethrough from 'markdown-it-strikethrough';
import markdownItSub from 'markdown-it-sub';
import markdownItSup from 'markdown-it-sup';

interface ParsedNode {
  type: string;
  line: number;
  startPos: number;
  endPos: number;
  content: string;
  meta?: Record<string, any>;
}

interface Token {
  type: string;
  tag: string;
  nesting: number;
  content: string;
  markup: string;
  level: number;
  block: boolean;
  children: any[] | null;
  meta: Record<string, any> | null;
  hidden: boolean;
  map: number[] | null;
}

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

class HeadingWidget extends WidgetType {
  constructor(readonly level: number, readonly text: string) {
    super();
  }

  toDOM() {
    const elem = document.createElement(`h${this.level}`);
    elem.className = `cm-heading cm-heading-${this.level}`;
    elem.textContent = this.text;
    return elem;
  }

  eq(other: HeadingWidget) {
    return this.level === other.level && this.text === other.text;
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

class CodeBlockWidget extends WidgetType {
  constructor(readonly code: string, readonly language: string) {
    super();
  }

  toDOM() {
    const pre = document.createElement('pre');
    pre.className = `cm-code-block cm-language-${this.language}`;
    const code = document.createElement('code');
    code.textContent = this.code;
    pre.appendChild(code);
    return pre;
  }

  eq(other: CodeBlockWidget) {
    return this.code === other.code && this.language === other.language;
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

    const label = document.createElement('label');
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

class BlockquoteWidget extends WidgetType {
  constructor(readonly content: string) {
    super();
  }

  toDOM() {
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'cm-blockquote-widget';
    blockquote.textContent = this.content;
    return blockquote;
  }

  eq(other: BlockquoteWidget) {
    return this.content === other.content;
  }
}

/**
 * Main Live Preview Plugin
 */
export class ObsidianLivePreviewPlugin {
  private view: EditorView;
  private parser: MarkdownIt;
  private cursorLine: number = -1;
  private cachedDecorations: DecorationSet = Decoration.none;

  constructor(view: EditorView) {
    this.view = view;
    this.initializeParser();
    this.updateCursorPosition();
  }

  private initializeParser() {
    this.parser = new MarkdownIt({
      html: false,
      breaks: true,
      linkify: true,
      typographer: true,
    });

    // Add extensions
    this.parser.use(markdownItTaskLists);
    this.parser.use(markdownItStrikethrough);
    this.parser.use(markdownItSub);
    this.parser.use(markdownItSup);
  }

  update(update: ViewUpdate) {
    const selectionChanged = update.selectionSet;
    const docChanged = update.docChanged;

    if (selectionChanged) {
      this.updateCursorPosition();
    }

    if (docChanged || selectionChanged) {
      this.cachedDecorations = this.computeDecorations();
    }
  }

  get decorations(): DecorationSet {
    return this.cachedDecorations;
  }

  private updateCursorPosition() {
    const cursorPos = this.view.state.selection.main.head;
    this.cursorLine = this.view.state.doc.lineAt(cursorPos).number - 1;
  }

  private computeDecorations(): DecorationSet {
    const decorations: any[] = [];
    const text = this.view.state.doc.toString();
    const lines = text.split('\n');

    let charPos = 0;

    lines.forEach((line, lineIndex) => {
      // Skip rendering at cursor line - show raw markdown
      if (lineIndex === this.cursorLine) {
        charPos += line.length + 1;
        return;
      }

      const lineDecorations = this.decorateLine(line, charPos, lineIndex);
      decorations.push(...lineDecorations);

      charPos += line.length + 1; // +1 for newline
    });

    return Decoration.set(decorations.sort((a, b) => a.from - b.from));
  }

  private decorateLine(line: string, lineStartPos: number, lineIndex: number): any[] {
    const decorations: any[] = [];

    // Skip empty lines
    if (!line.trim()) {
      return decorations;
    }

    // Heading detection and decoration
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      return this.decorateHeading(headingMatch, lineStartPos, line);
    }

    // Blockquote detection
    if (line.match(/^>\s*/)) {
      return this.decorateBlockquote(line, lineStartPos);
    }

    // Task list detection
    const taskMatch = line.match(/^[\s]*[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      return this.decorateTaskList(taskMatch, lineStartPos);
    }

    // Ordered/unordered list
    if (line.match(/^[\s]*[-*+]\s+/)) {
      decorations.push(this.decorateListItem(line, lineStartPos));
      return decorations;
    }

    // Code fence handling would be here but requires multi-line context
    // For now, handle inline code
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

    return decorations;
  }

  private decorateHeading(match: RegExpMatchArray, lineStartPos: number, line: string): any[] {
    const level = match[1].length;
    const headingText = match[2];
    const markupEnd = lineStartPos + match[1].length + 1; // +1 for space

    return [
      // Hide the hash marks
      Decoration.replace({
        widget: new HiddenMarkupWidget(match[1]),
      }).range(lineStartPos, markupEnd),
      // Style the heading text
      Decoration.mark({
        class: `cm-heading cm-heading-${level}`,
        attributes: { style: this.getHeadingStyle(level) },
      }).range(markupEnd, lineStartPos + line.length),
    ];
  }

  private getHeadingStyle(level: number): string {
    const sizes = {
      1: 'font-size: 1.8em; font-weight: 700; margin: 0.5em 0 0.25em 0;',
      2: 'font-size: 1.6em; font-weight: 700; margin: 0.4em 0 0.2em 0;',
      3: 'font-size: 1.4em; font-weight: 700; margin: 0.3em 0 0.15em 0;',
      4: 'font-size: 1.2em; font-weight: 700; margin: 0.2em 0 0.1em 0;',
      5: 'font-size: 1.1em; font-weight: 700; margin: 0.1em 0;',
      6: 'font-size: 1em; font-weight: 700; margin: 0.1em 0;',
    };
    return sizes[level as keyof typeof sizes] || '';
  }

  private decorateBlockquote(line: string, lineStartPos: number): any[] {
    const match = line.match(/^(>\s*)(.+)$/);
    if (!match) return [];

    const markupLength = match[1].length;
    const contentStart = lineStartPos + markupLength;

    return [
      // Hide the > character
      Decoration.replace({
        widget: new HiddenMarkupWidget('>'),
      }).range(lineStartPos, contentStart),
      // Style the blockquote
      Decoration.mark({
        class: 'cm-blockquote',
        attributes: {
          style: 'border-left: 4px solid var(--color-accent); padding-left: 1em; color: var(--color-text-muted); font-style: italic;',
        },
      }).range(contentStart, lineStartPos + line.length),
    ];
  }

  private decorateTaskList(match: RegExpMatchArray, lineStartPos: number): any[] {
    const leadingSpace = match[0].match(/^[\s]*/)?.[0] || '';
    const checkbox = match[1];
    const text = match[2];
    const checked = checkbox !== ' ';

    const checkboxStart = lineStartPos + leadingSpace.length + 1; // +1 for list marker
    const checkboxEnd = checkboxStart + 3; // [x]

    return [
      // Replace checkbox with widget
      Decoration.replace({
        widget: new TaskListWidget(checked, text),
      }).range(lineStartPos, lineStartPos + match[0].length),
    ];
  }

  private decorateListItem(line: string, lineStartPos: number): any {
    const match = line.match(/^([\s]*)([-*+])\s+/);
    if (!match) return null;

    const bullet = match[2];
    const bulletStart = lineStartPos + match[1].length;
    const bulletEnd = bulletStart + 1;

    return Decoration.mark({
      class: 'cm-list-item',
      attributes: { style: 'list-style: none;' },
    }).range(lineStartPos, lineStartPos + match[0].length);
  }

  private decorateInlineCode(line: string, lineStartPos: number): any[] {
    const decorations: any[] = [];
    const codeRegex = /`([^`]+)`/g;
    let match;

    while ((match = codeRegex.exec(line)) !== null) {
      const codeStart = lineStartPos + match.index;
      const codeEnd = codeStart + match[0].length;
      const codeContent = match[1];

      decorations.push(
        // Hide backticks
        Decoration.replace({
          widget: new HiddenMarkupWidget('`'),
        }).range(codeStart, codeStart + 1),

        Decoration.replace({
          widget: new HiddenMarkupWidget('`'),
        }).range(codeEnd - 1, codeEnd),

        // Style code
        Decoration.mark({
          class: 'cm-inline-code',
          attributes: {
            style: 'background: var(--color-code-bg); padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; font-size: 0.9em;',
          },
        }).range(codeStart + 1, codeEnd - 1)
      );
    }

    return decorations;
  }

  private decorateBold(line: string, lineStartPos: number): any[] {
    const decorations: any[] = [];
    const boldRegex = /\*\*([^\*]+)\*\*|\*\*([^\*]+)\*\*/g;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      const boldStart = lineStartPos + match.index;
      const boldEnd = boldStart + match[0].length;
      const boldContent = match[1] || match[2];

      decorations.push(
        // Hide opening **
        Decoration.replace({
          widget: new HiddenMarkupWidget('**'),
        }).range(boldStart, boldStart + 2),

        // Hide closing **
        Decoration.replace({
          widget: new HiddenMarkupWidget('**'),
        }).range(boldEnd - 2, boldEnd),

        // Bold text
        Decoration.mark({
          class: 'cm-bold',
          attributes: { style: 'font-weight: 700;' },
        }).range(boldStart + 2, boldEnd - 2)
      );
    }

    return decorations;
  }

  private decorateItalic(line: string, lineStartPos: number): any[] {
    const decorations: any[] = [];
    // Avoid single * in **bold** patterns
    const italicRegex = /(?<!\*)\*(?!\*)([^\*]+)\*(?!\*)/g;
    let match;

    while ((match = italicRegex.exec(line)) !== null) {
      const italicStart = lineStartPos + match.index;
      const italicEnd = italicStart + match[0].length;

      decorations.push(
        // Hide opening *
        Decoration.replace({
          widget: new HiddenMarkupWidget('*'),
        }).range(italicStart, italicStart + 1),

        // Hide closing *
        Decoration.replace({
          widget: new HiddenMarkupWidget('*'),
        }).range(italicEnd - 1, italicEnd),

        // Italic text
        Decoration.mark({
          class: 'cm-italic',
          attributes: { style: 'font-style: italic;' },
        }).range(italicStart + 1, italicEnd - 1)
      );
    }

    return decorations;
  }

  private decorateStrikethrough(line: string, lineStartPos: number): any[] {
    const decorations: any[] = [];
    const strikeRegex = /~~([^~]+)~~/g;
    let match;

    while ((match = strikeRegex.exec(line)) !== null) {
      const strikeStart = lineStartPos + match.index;
      const strikeEnd = strikeStart + match[0].length;

      decorations.push(
        // Hide opening ~~
        Decoration.replace({
          widget: new HiddenMarkupWidget('~~'),
        }).range(strikeStart, strikeStart + 2),

        // Hide closing ~~
        Decoration.replace({
          widget: new HiddenMarkupWidget('~~'),
        }).range(strikeEnd - 2, strikeEnd),

        // Strikethrough text
        Decoration.mark({
          class: 'cm-strikethrough',
          attributes: { style: 'text-decoration: line-through;' },
        }).range(strikeStart + 2, strikeEnd - 2)
      );
    }

    return decorations;
  }

  private decorateLinks(line: string, lineStartPos: number): any[] {
    const decorations: any[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      const linkStart = lineStartPos + match.index;
      const linkEnd = linkStart + match[0].length;
      const linkText = match[1];
      const linkUrl = match[2];

      decorations.push(
        Decoration.replace({
          widget: new LinkWidget(linkText, linkUrl),
        }).range(linkStart, linkEnd)
      );
    }

    return decorations;
  }

  private decorateImages(line: string, lineStartPos: number): any[] {
    const decorations: any[] = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(line)) !== null) {
      const imageStart = lineStartPos + match.index;
      const imageEnd = imageStart + match[0].length;
      const alt = match[1] || 'image';
      const src = match[2];

      decorations.push(
        Decoration.replace({
          widget: new ImageWidget(alt, src),
        }).range(imageStart, imageEnd)
      );
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
    debounceMs?: number;
  }
): EditorView {
  const theme = options?.theme || 'dark';

  // Create the plugin
  const livePreviewPlugin = ViewPlugin.fromClass(ObsidianLivePreviewPlugin, {
    decorations: (instance) => instance.decorations,
  });

  const state = EditorState.create({
    doc: initialDoc,
    extensions: [
      markdown(),
      livePreviewPlugin,
      EditorView.lineNumbers(),
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
 * Set editor content
 */
export function setEditorContent(view: EditorView, content: string) {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: content,
    },
  });
}
```

---

## src/webview/editor.ts

```typescript
/**
 * Webview Editor Script
 * 
 * Runs in the webview context and manages the CodeMirror 6 editor
 * with Obsidian-style live preview rendering.
 */

import { EditorView, EditorState, ViewPlugin, Decoration, WidgetType } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { createObsidianLivePreviewEditor, getEditorContent, setEditorContent } from '../editor/obsidianLivePreviewEditor';

declare global {
  interface Window {
    initializeEditor: (content: string) => void;
    vscode?: any;
  }
}

let editorView: EditorView | null = null;
let updateTimeout: NodeJS.Timeout | null = null;
const UPDATE_DEBOUNCE = 150;

/**
 * Initialize the editor in the webview
 */
window.initializeEditor = function (initialContent: string) {
  const editorContainer = document.getElementById('editor');
  if (!editorContainer) {
    console.error('Editor container not found');
    return;
  }

  try {
    // Create the editor
    editorView = createObsidianLivePreviewEditor(editorContainer, initialContent, {
      theme: 'dark',
    });

    // Setup change listener
    editorView.addEventListener('change', (e: any) => {
      if (updateTimeout) clearTimeout(updateTimeout);

      updateTimeout = setTimeout(() => {
        if (editorView) {
          const content = getEditorContent(editorView);
          // Send changes to VS Code
          if (window.vscode) {
            window.vscode.postMessage({
              command: 'updateFromEditor',
              content: content,
            });
          }
        }
      }, UPDATE_DEBOUNCE);
    });

    // Notify VS Code we're ready
    if (window.vscode) {
      window.vscode.postMessage({
        command: 'ready',
      });
    }
  } catch (error) {
    console.error('Failed to initialize editor:', error);
    if (window.vscode) {
      window.vscode.postMessage({
        command: 'log',
        message: `Initialization error: ${error}`,
      });
    }
  }
};

/**
 * Handle messages from VS Code
 */
if (window.vscode) {
  window.vscode.setMessageListener((message: any) => {
    if (message.command === 'updateContent') {
      if (editorView) {
        const currentContent = getEditorContent(editorView);
        // Only update if content actually changed
        if (currentContent !== message.content) {
          setEditorContent(editorView, message.content);
        }
      }
    }
  });
}

// Export for global access
export { editorView, getEditorContent, setEditorContent };
```

---

## media/editor.css

```css
/**
 * Obsidian Live Preview Editor Styles
 * 
 * Comprehensive styling for true Obsidian-like appearance and behavior
 */

:root {
  /* Light mode colors */
  --color-text: #3b3b3b;
  --color-text-muted: #999;
  --color-text-faint: #ccc;
  --color-background: #f6f5f0;
  --color-surface: #fff;
  --color-accent: #705dc8;
  --color-accent-hover: #6a54b8;
  --color-code-bg: #f0efeb;
  --color-code-text: #3b3b3b;
  --color-link: #705dc8;
  --color-link-hover: #6a54b8;
  --color-blockquote: #999;
  --color-heading: #3b3b3b;
  --color-hr: #e0ddd9;
  
  /* Dark mode colors */
  --color-text-dark: #e0def4;
  --color-text-muted-dark: #9399b2;
  --color-text-faint-dark: #6e6a86;
  --color-background-dark: #191724;
  --color-surface-dark: #1f1d2e;
  --color-accent-dark: #9ccfd8;
  --color-accent-hover-dark: #8fd7e0;
  --color-code-bg-dark: #2a2839;
  --color-code-text-dark: #e0def4;
  --color-link-dark: #9ccfd8;
  --color-link-hover-dark: #8fd7e0;
  --color-blockquote-dark: #6e6a86;
  --color-heading-dark: #e0def4;
  --color-hr-dark: #372f4a;

  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  --font-family-mono: 'Monaco', 'Courier New', monospace;
  --font-size-base: 15px;
  --line-height-base: 1.6;

  /* Spacing */
  --space-xs: 0.25em;
  --space-sm: 0.5em;
  --space-md: 1em;
  --space-lg: 1.5em;
  --space-xl: 2em;

  /* Radius */
  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-lg: 8px;
}

/* Dark mode by default for Antigravity */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: var(--color-text-dark);
    --color-text-muted: var(--color-text-muted-dark);
    --color-text-faint: var(--color-text-faint-dark);
    --color-background: var(--color-background-dark);
    --color-surface: var(--color-surface-dark);
    --color-accent: var(--color-accent-dark);
    --color-accent-hover: var(--color-accent-hover-dark);
    --color-code-bg: var(--color-code-bg-dark);
    --color-code-text: var(--color-code-text-dark);
    --color-link: var(--color-link-dark);
    --color-link-hover: var(--color-link-hover-dark);
    --color-blockquote: var(--color-blockquote-dark);
    --color-heading: var(--color-heading-dark);
    --color-hr: var(--color-hr-dark);
  }
}

/* Base styles */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  color: var(--color-text);
  background: var(--color-background);
  overflow: hidden;
}

/* Editor container */
.editor-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* CodeMirror overrides */
.cm-editor {
  width: 100%;
  height: 100%;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

.cm-content {
  padding: 2rem 2rem;
  max-width: 900px;
  margin: 0 auto;
  caret-color: var(--color-accent);
}

.cm-gutters {
  background: var(--color-background);
  border-right: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
}

.cm-lineNumbers {
  color: var(--color-text-muted);
  font-size: 0.85em;
  font-family: var(--font-family-mono);
}

.cm-activeLine {
  background: color-mix(in srgb, var(--color-accent) 5%, transparent);
}

.cm-cursor {
  border-left: 2px solid var(--color-accent) !important;
  border-left-color: var(--color-accent) !important;
}

.cm-selectionBackground {
  background: color-mix(in srgb, var(--color-accent) 30%, transparent) !important;
}

/* Hidden markup - completely invisible */
.cm-hidden-markup {
  display: none !important;
}

/* Headings */
.cm-heading {
  color: var(--color-heading);
  font-weight: 700;
  line-height: 1.3;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
  letter-spacing: -0.01em;
}

.cm-heading-1 {
  font-size: 1.8em;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.cm-heading-2 {
  font-size: 1.6em;
  margin-top: 0.8em;
  margin-bottom: 0.4em;
}

.cm-heading-3 {
  font-size: 1.4em;
  margin-top: 0.6em;
  margin-bottom: 0.3em;
}

.cm-heading-4 {
  font-size: 1.2em;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
}

.cm-heading-5 {
  font-size: 1.1em;
  margin-top: 0.4em;
  margin-bottom: 0.2em;
}

.cm-heading-6 {
  font-size: 1em;
  margin-top: 0.3em;
  margin-bottom: 0.15em;
}

/* Bold text */
.cm-bold {
  font-weight: 700;
  color: var(--color-text);
}

/* Italic text */
.cm-italic {
  font-style: italic;
  color: var(--color-text);
}

/* Inline code */
.cm-inline-code {
  background: var(--color-code-bg);
  color: var(--color-code-text);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  line-height: 1;
}

/* Code blocks */
.cm-code-block {
  background: var(--color-code-bg);
  padding: 1em;
  border-radius: var(--radius-md);
  margin: 1em 0;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
}

.cm-code-block code {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  color: var(--color-code-text);
}

/* Strikethrough */
.cm-strikethrough {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

/* Links */
.cm-link-widget {
  color: var(--color-link);
  text-decoration: none;
  cursor: pointer;
  border-bottom: 1px solid color-mix(in srgb, var(--color-link) 50%, transparent);
  transition: all 200ms ease;
}

.cm-link-widget:hover {
  color: var(--color-link-hover);
  background: color-mix(in srgb, var(--color-link) 10%, transparent);
}

/* Images */
.cm-image-widget {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  margin: 1em 0;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-text) 10%, transparent);
  display: block;
}

/* Blockquotes */
.cm-blockquote {
  border-left: 4px solid var(--color-accent);
  padding-left: 1em;
  color: var(--color-blockquote);
  font-style: italic;
  margin-left: 0;
  margin-right: 0;
}

.cm-blockquote-widget {
  border-left: 4px solid var(--color-accent);
  padding-left: 1em;
  color: var(--color-blockquote);
  font-style: italic;
}

/* Lists */
.cm-list-item {
  list-style: none;
  margin-left: 2em;
}

/* Task lists */
.cm-task-list-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin: 0.5em 0;
  padding: 0.25em 0;
}

.cm-task-checkbox {
  margin-top: 0.25em;
  cursor: pointer;
  accent-color: var(--color-accent);
}

.cm-task-checkbox:checked ~ .cm-task-text {
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.cm-task-text {
  flex: 1;
  user-select: text;
}

/* Horizontal rules */
hr,
.cm-hr {
  border: none;
  border-top: 2px solid var(--color-hr);
  margin: 2em 0;
}

/* Subscript and superscript */
sub {
  font-size: 0.8em;
  vertical-align: sub;
}

sup {
  font-size: 0.8em;
  vertical-align: super;
}

/* Focus visible */
.cm-editor:focus-visible {
  outline: none;
}

.cm-editor:focus-within {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

/* Selection highlight */
::selection {
  background: color-mix(in srgb, var(--color-accent) 30%, transparent);
  color: inherit;
}

/* Scrollbar styling */
.cm-editor::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.cm-editor::-webkit-scrollbar-track {
  background: transparent;
}

.cm-editor::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-text) 20%, transparent);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.cm-editor::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--color-text) 30%, transparent);
  background-clip: content-box;
}

/* Firefox scrollbar */
.cm-editor {
  scrollbar-color: color-mix(in srgb, var(--color-text) 20%, transparent) transparent;
  scrollbar-width: thin;
}

/* Print styles */
@media print {
  body {
    background: white;
    color: black;
  }

  .cm-editor {
    background: white;
  }

  .cm-content {
    padding: 0;
    max-width: 100%;
  }

  .cm-gutters {
    display: none;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .cm-content {
    padding: 1rem;
    max-width: 100%;
  }

  .cm-heading-1 {
    font-size: 1.5em;
  }

  .cm-heading-2 {
    font-size: 1.3em;
  }

  .cm-heading-3 {
    font-size: 1.1em;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .cm-link-widget {
    transition: none;
  }
}

@media (prefers-contrast: more) {
  .cm-inline-code {
    border: 1px solid var(--color-code-text);
  }

  .cm-link-widget {
    border-bottom: 2px solid var(--color-link);
  }

  .cm-blockquote {
    border-left-width: 6px;
  }
}
```
