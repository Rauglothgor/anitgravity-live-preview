# Implementation Guide: Obsidian Live Preview for Antigravity

Complete technical documentation for understanding, building, and extending the extension.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Decoration System](#decoration-system)
4. [Widget System](#widget-system)
5. [Building & Deployment](#building--deployment)
6. [Advanced Customization](#advanced-customization)

---

## Architecture Overview

### High-Level Flow

```
User edits markdown in Antigravity
    ↓
VS Code Document Changes
    ↓
extension.ts detects change
    ↓
Sends to webview via postMessage
    ↓
CodeMirror 6 receives update
    ↓
ObsidianLivePreviewPlugin recomputes decorations
    ↓
Parser tokenizes markdown
    ↓
Decorations hide syntax + apply formatting
    ↓
Widgets render formatted elements
    ↓
Visual update in editor
    ↓
User sees formatted markdown
```

### Key Design Decisions

**1. CodeMirror 6 over VS Code decorations**
- VS Code decorations can only overlay, not replace
- CodeMirror 6 allows true syntax replacement
- Full control over rendering pipeline

**2. Single webview panel, not split view**
- Obsidian-style single-view editing
- No context switching between raw and preview
- Cursor-aware rendering shows raw markdown at cursor

**3. Plugin-based decoration system**
- State field manages decoration set
- ViewPlugin updates decorations on changes
- Efficient viewport-aware rendering

**4. Widget classes for complex elements**
- Links, images, task lists use custom widgets
- Semantic HTML rendering
- Extensible for custom markdown syntax

---

## Core Components

### 1. ObsidianLivePreviewPlugin Class

**Purpose:** Main CodeMirror plugin that manages all decorations

**Key Methods:**

```typescript
update(update: ViewUpdate)
  // Called on every editor update
  // Recalculates cursor position and decorations

computeDecorations(): DecorationSet
  // Main decoration computation
  // Iterates through lines, applies formatting

decorateLine(line, lineStartPos, lineIndex): any[]
  // Decorates a single line
  // Routes to specific decoration methods

decorateHeading(match, lineStartPos, line): any[]
  // Hides # marks, styles heading text
  // H1-H6 with appropriate sizing

decorateBold(line, lineStartPos): any[]
  // Hides ** markers, bolds text
  // Uses Decoration.replace + Decoration.mark

decorateLinks(line, lineStartPos): any[]
  // Replaces markdown link with LinkWidget
  // Full replacement, not hidden markup
```

**State Management:**
```typescript
this.cursorLine: number           // Current cursor line
this.cachedDecorations: DecorationSet  // Cached decorations
this.parser: MarkdownIt           // Parser instance
```

### 2. VS Code Extension (extension.ts)

**Activation:**
```typescript
export function activate(context: vscode.ExtensionContext)
  // Called when extension first loads
  // Registers commands
  // Sets up listeners for markdown files
```

**Command Handlers:**
```typescript
'obsidian-live-preview.enable'   // Create new live preview for file
'obsidian-live-preview.disable'  // Dispose live preview for file
'obsidian-live-preview.toggle'   // Toggle for current file
```

**Session Management:**
```typescript
editorSessions: Map<uri, EditorSession>
  // uri = document URI (unique per file)
  // EditorSession = { panel, document, disposables }
  // Prevents duplicate sessions for same file
```

**Message Handling:**
```typescript
// From webview to VS Code
{
  command: 'updateFromEditor',
  content: string  // Entire document text
}

// From VS Code to webview
{
  command: 'updateContent',
  content: string  // New document text
}
```

### 3. Webview Integration (editor.ts)

**Initialization:**
```typescript
window.initializeEditor(content: string)
  // Called from webview HTML with initial content
  // Creates CodeMirror editor
  // Sets up change listeners
  // Notifies VS Code when ready
```

**Change Detection:**
```typescript
editor.addEventListener('change')
  // Debounced (150ms default)
  // Sends updates to VS Code
  // Prevents excessive message passing
```

---

## Decoration System

### Decoration Types

CodeMirror 6 provides three main decoration types:

#### 1. `Decoration.replace()` - Hide and Replace

```typescript
Decoration.replace({
  widget: new HiddenHashWidget('#')
}).range(from, to)

// Effect: Replaces # with empty widget (invisible)
// Use for: Hiding markup (headings, bold asterisks, etc)
```

**Why used for syntax hiding:**
- Completely removes markup from view
- User can't select/interact with hidden text
- Clean visual result

#### 2. `Decoration.mark()` - Style Without Replacing

```typescript
Decoration.mark({
  class: 'cm-bold',
  attributes: { style: 'font-weight: 700;' }
}).range(from, to)

// Effect: Applies CSS to content, content still visible
// Use for: Applying formatting (bold, italic, colors)
```

**Why used for formatting:**
- Keeps text selectable
- Allows inline styling
- Composable with other marks

#### 3. `Decoration.widget()` - Insert Element at Position

```typescript
Decoration.widget({
  widget: new LinkWidget(text, url)
}).range(pos)

// Effect: Inserts widget at position
// Use for: Adding UI elements between text
```

**Use case:**
- Color pickers
- Complex UI elements
- Annotations

### Combining Decorations

Most markdown elements require **multiple decorations:**

```typescript
// Example: Bold text "**hello**"

// Step 1: Hide opening **
Decoration.replace({ widget: new HiddenMarkupWidget('**') }).range(0, 2)

// Step 2: Hide closing **
Decoration.replace({ widget: new HiddenMarkupWidget('**') }).range(7, 9)

// Step 3: Bold the text
Decoration.mark({ class: 'cm-bold' }).range(2, 7)

// Result: "hello" appears bold, ** is invisible
```

### Cursor-Aware Rendering

```typescript
if (block.line === this.cursorLine) {
  // Skip rendering at cursor line
  // User sees raw markdown: **hello**
  return;
}

// Render at other lines
// User sees: bold hello (** hidden)
```

**Why this works:**
- Obsidian's core interaction model
- Editing the raw markdown
- Seeing formatted preview everywhere else
- Intuitive and consistent

---

## Widget System

### Base WidgetType

All widgets extend `CodeMirror.WidgetType`:

```typescript
class MyWidget extends WidgetType {
  toDOM(view: EditorView): HTMLElement {
    // Return DOM element to render
    // Called by CodeMirror when widget enters viewport
  }

  eq(other: MyWidget): boolean {
    // Return true if widget should reuse same DOM
    // Optimization: avoid recreating identical widgets
  }
}
```

### Widget Examples

#### LinkWidget

```typescript
class LinkWidget extends WidgetType {
  constructor(readonly text: string, readonly url: string) {}

  toDOM() {
    const a = document.createElement('a');
    a.href = this.url;
    a.textContent = this.text;
    a.className = 'cm-link-widget';
    return a;
  }

  eq(other: LinkWidget) {
    return this.text === other.text && this.url === other.url;
  }
}

// Usage:
Decoration.replace({
  widget: new LinkWidget('Click here', 'https://example.com')
}).range(from, to)
```

**Rendering:**
```
Markdown: [Click here](https://example.com)
Rendered: Click here (clickable link)
```

#### ImageWidget

```typescript
class ImageWidget extends WidgetType {
  constructor(readonly alt: string, readonly src: string) {}

  toDOM() {
    const img = document.createElement('img');
    img.alt = this.alt;
    img.src = this.src;
    img.style.maxWidth = '100%';
    return img;
  }
}

// Usage:
Decoration.replace({
  widget: new ImageWidget('Alt text', '/path/to/image.png')
}).range(from, to)
```

**Rendering:**
```
Markdown: ![Alt text](/path/to/image.png)
Rendered: [Actual image displayed inline]
```

#### TaskListWidget

```typescript
class TaskListWidget extends WidgetType {
  constructor(readonly checked: boolean, readonly text: string) {}

  toDOM() {
    const container = document.createElement('div');
    container.className = 'cm-task-list-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.checked;

    const label = document.createElement('label');
    label.textContent = this.text;

    container.appendChild(checkbox);
    container.appendChild(label);
    return container;
  }
}
```

**Rendering:**
```
Markdown: - [x] Task completed
Rendered: ☑ Task completed
```

### Creating Custom Widgets

**Example: Adding a custom math widget**

```typescript
class MathWidget extends WidgetType {
  constructor(readonly latex: string) {}

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-math';
    // Use KaTeX or MathJax to render
    katex.render(this.latex, span);
    return span;
  }

  eq(other: MathWidget) {
    return this.latex === other.latex;
  }
}

// Register in ObsidianLivePreviewPlugin
private decorateMath(line: string, lineStartPos: number): any[] {
  const mathRegex = /\$([^$]+)\$/g;
  let match;
  const decorations: any[] = [];

  while ((match = mathRegex.exec(line)) !== null) {
    decorations.push(
      Decoration.replace({
        widget: new MathWidget(match[1])
      }).range(lineStartPos + match.index, lineStartPos + match.index + match[0].length)
    );
  }

  return decorations;
}

// Call in decorateLine()
const mathDecorations = this.decorateMath(line, lineStartPos);
decorations.push(...mathDecorations);
```

---

## Building & Deployment

### Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Start development build with watch
npm run dev

# 3. Open extension in development host
# VS Code: Press F5 to open new window with extension loaded

# 4. Edit files in src/
# Changes automatically rebuild

# 5. Reload window to see changes (Ctrl+R or F5)
```

### Production Build

```bash
# 1. Typecheck
npm run typecheck

# 2. Build minified
npm run esbuild-base -- --minify

# 3. Package extension
npm install -g @vscode/vsce
vsce package

# 4. Output: obsidian-live-preview-antigravity-1.0.0.vsix
```

### Installation in Antigravity

1. **Via VSIX file:**
   - Click Extensions icon (Ctrl+Shift+X)
   - Click "..." menu → "Install from VSIX"
   - Select `.vsix` file

2. **Via local development:**
   - npm run dev
   - F5 to launch development host
   - Extension loads automatically

### Distribution

1. **VS Code Marketplace:**
   ```bash
   vsce publish --pat <github-token>
   ```

2. **GitHub Releases:**
   ```bash
   gh release create v1.0.0 *.vsix --title "Version 1.0.0"
   ```

3. **Open VSX Registry:**
   - Alternative to VS Code Marketplace
   - https://open-vsx.org/

---

## Advanced Customization

### Adding Support for Wikilinks

Example: `[[Page Name]]` → clickable link to page

```typescript
// src/editor/obsidianLivePreviewEditor.ts

class WikiLinkWidget extends WidgetType {
  constructor(readonly pageName: string) {
    super();
  }

  toDOM() {
    const a = document.createElement('a');
    a.className = 'cm-wikilink';
    a.href = `#${this.pageName.toLowerCase().replace(/\s+/g, '-')}`;
    a.textContent = this.pageName;
    a.style.color = 'var(--color-link)';
    return a;
  }

  eq(other: WikiLinkWidget) {
    return this.pageName === other.pageName;
  }
}

// Add to ObsidianLivePreviewPlugin
private decorateWikilinks(line: string, lineStartPos: number): any[] {
  const wikiRegex = /\[\[([^\]]+)\]\]/g;
  let match;
  const decorations: any[] = [];

  while ((match = wikiRegex.exec(line)) !== null) {
    const linkStart = lineStartPos + match.index;
    const linkEnd = linkStart + match[0].length;
    const pageName = match[1];

    decorations.push(
      Decoration.replace({
        widget: new WikiLinkWidget(pageName)
      }).range(linkStart, linkEnd)
    );
  }

  return decorations;
}

// Call in decorateLine()
const wikiDecorations = this.decorateWikilinks(line, lineStartPos);
decorations.push(...wikiDecorations);
```

### Adding LaTeX Math Support

```typescript
// Install: npm install katex markdown-it-katex

import katex from 'katex';
import markdownItKatex from 'markdown-it-katex';

// In initializeParser()
this.parser.use(markdownItKatex);

// Add widget
class KaTeXWidget extends WidgetType {
  constructor(readonly latex: string, readonly inline: boolean) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = this.inline ? 'cm-math-inline' : 'cm-math-block';
    try {
      katex.render(this.latex, span, { displayMode: !this.inline });
    } catch (e) {
      span.textContent = `[Math Error: ${e}]`;
      span.className += ' error';
    }
    return span;
  }

  eq(other: KaTeXWidget) {
    return this.latex === other.latex && this.inline === other.inline;
  }
}

// Register in decorateLine()
const mathDecorations = this.decorateMath(line, lineStartPos);
decorations.push(...mathDecorations);
```

### Custom Theme Support

Edit `media/editor.css` to add new theme:

```css
@media (prefers-color-scheme: light) {
  :root {
    --color-text: #333;
    --color-heading: #000;
    --color-accent: #0066cc;
    --color-link: #0066cc;
    /* ... */
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #e0e0e0;
    --color-heading: #fff;
    --color-accent: #66b3ff;
    --color-link: #66b3ff;
    /* ... */
  }
}
```

### Performance Optimization

**For large files:**

```typescript
// Implement viewport-aware rendering
const visibleRanges = this.view.visibleRanges;

// Only decorate visible lines
for (const range of visibleRanges) {
  const startLine = this.view.state.doc.lineAt(range.from).number;
  const endLine = this.view.state.doc.lineAt(range.to).number;

  for (let i = startLine; i <= endLine; i++) {
    // Only decorate visible lines
    const line = this.view.state.doc.line(i);
    const decorations = this.decorateLine(line.text, line.from, i - 1);
    results.push(...decorations);
  }
}
```

**Caching parsed blocks:**

```typescript
private blockCache = new Map<string, ParsedBlock[]>();

private parseDocument(text: string): ParsedBlock[] {
  const hash = this.hashText(text);
  if (this.blockCache.has(hash)) {
    return this.blockCache.get(hash)!;
  }

  const blocks = this.performExpensiveParsing(text);
  this.blockCache.set(hash, blocks);

  // Limit cache size
  if (this.blockCache.size > 10) {
    const firstKey = this.blockCache.keys().next().value;
    this.blockCache.delete(firstKey);
  }

  return blocks;
}
```

---

## Debugging

### Enable Debug Logging

```typescript
// In ObsidianLivePreviewPlugin
private debug(message: string, data?: any) {
  console.log(`[OLPP] ${message}`, data);
}

// Usage
this.debug('Computing decorations for line', { lineIndex, content: line });
```

### Chrome DevTools for Webview

```typescript
// In extension.ts
const panel = vscode.window.createWebviewPanel(
  'obsidianLivePreview',
  'Live Preview',
  vscode.ViewColumn.One,
  { enableScripts: true, enableDevTools: true } // Add this
);
```

Then press F12 in webview to open DevTools.

### Performance Profiling

```typescript
const start = performance.now();

const decorations = this.computeDecorations();

const elapsed = performance.now() - start;
console.log(`Decoration update took ${elapsed.toFixed(2)}ms`);
```

---

## Testing

### Unit Tests (Optional)

```bash
npm install --save-dev jest @types/jest ts-jest
```

Example test:

```typescript
// src/__tests__/widget.test.ts
import { LinkWidget } from '../editor/obsidianLivePreviewEditor';

describe('LinkWidget', () => {
  it('creates clickable link', () => {
    const widget = new LinkWidget('Test', 'http://example.com');
    const dom = widget.toDOM();

    expect(dom.tagName).toBe('A');
    expect(dom.href).toContain('example.com');
    expect(dom.textContent).toBe('Test');
  });
});
```

---

This guide should give you complete understanding of how the extension works and how to extend it!
