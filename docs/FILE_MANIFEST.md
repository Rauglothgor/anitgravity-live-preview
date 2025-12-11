# File Manifest & Description

Complete inventory of all files in the Obsidian Live Preview for Google Antigravity project.

## Project Root Files

### package.json (128 lines)
**Purpose:** Dependency management and build configuration
**Contains:**
- Extension metadata (name, version, license)
- Extension activation events (onLanguage:markdown)
- Commands registration (enable, disable, toggle)
- Keybindings (Ctrl+Shift+L)
- Configuration schema (enabled, theme, debounce, etc.)
- All npm dependencies and dev dependencies
- Build scripts (dev, esbuild, typecheck)

**Key Dependencies:**
- `@codemirror/view` — Editor rendering
- `@codemirror/state` — State management
- `@codemirror/lang-markdown` — Markdown language support
- `markdown-it` — Markdown parser
- `markdown-it-*` — Plugin extensions
- TypeScript, esbuild for development

### tsconfig.json (23 lines)
**Purpose:** TypeScript compilation configuration
**Key Settings:**
- Target: ES2020
- Module: ESNext (for bundling)
- Strict: true (no `any` types)
- Include `src/**/*`
- Output to `out/`
- Source maps for debugging

### esbuild.config.js (37 lines)
**Purpose:** Build bundling configuration
**Builds Two Outputs:**
1. `out/extension.js` — Node.js CJS format for extension host
2. `out/editor.js` — Browser IIFE format for webview

**Configuration:**
- Bundles all dependencies
- Minifies in production mode
- Generates source maps in development
- Externals: vscode (not bundled)

### .gitignore (22 lines)
**Purpose:** Git ignore rules
**Excluded:**
- `node_modules/`
- `out/` (compiled, generated)
- `*.vsix` (packaged extension)
- `.DS_Store`, `.env`, IDE files

---

## Source Code

### src/extension.ts (222 lines)
**Purpose:** VS Code Extension entry point and lifecycle

**Key Functions:**
```
activate(context)
  ├─ registerCommand('obsidian-live-preview.enable')
  ├─ registerCommand('obsidian-live-preview.disable')
  ├─ registerCommand('obsidian-live-preview.toggle')
  ├─ onDidChangeActiveTextEditor hook
  └─ Auto-enable logic if configured

createLivePreviewEditor(document, context)
  ├─ Cleanup existing session
  ├─ Create webview panel
  ├─ Setup HTML with bundled scripts
  ├─ Attach document change listener
  ├─ Handle webview messages
  └─ Store session in Map

getWebviewContent(scriptUri, styleUri, initialDoc)
  └─ Generate HTML for webview
```

**Data Structures:**
```typescript
interface EditorSession {
  panel: vscode.WebviewPanel
  document: vscode.TextDocument
  disposables: vscode.Disposable[]
}

editorSessions: Map<uri, EditorSession>  // One per file
```

**Message Protocol:**
- From webview: `{ command: 'updateFromEditor', content: string }`
- To webview: `{ command: 'updateContent', content: string }`

### src/editor/obsidianLivePreviewEditor.ts (639 lines)
**Purpose:** Core CodeMirror 6 editor with live preview rendering

**Architecture:**
```
ObsidianLivePreviewPlugin (ViewPlugin)
├─ Parser: MarkdownIt instance
├─ State: cursorLine, cachedDecorations
└─ Methods:
    ├─ computeDecorations() — Main decoration logic
    ├─ decorateLine(line, pos, index) — Single line
    ├─ decorateHeading() — Hide # marks, style text
    ├─ decorateBold() — Hide ** markers, bold text
    ├─ decorateItalic() — Hide * markers, italic text
    ├─ decorateStrikethrough() — Hide ~~ marks
    ├─ decorateInlineCode() — Hide backticks
    ├─ decorateLinks() — Replace with widgets
    ├─ decorateImages() — Replace with widgets
    ├─ decorateBlockquote() — Hide >, style
    ├─ decorateTaskList() — Replace with widget
    └─ decorateListItem() — List styling
```

**Widget Classes:**
- `HiddenMarkupWidget` — Invisible markup (h1, **, etc.)
- `HeadingWidget` — Styled heading elements
- `LinkWidget` — Clickable link elements
- `ImageWidget` — Inline image rendering
- `CodeBlockWidget` — Code block containers
- `TaskListWidget` — Checkbox with label
- `BlockquoteWidget` — Blockquote styling

**Key Methods:**
```typescript
createObsidianLivePreviewEditor(element, initialDoc, options)
  └─ Factory function to create and configure editor

getEditorContent(view): string
  └─ Extract all text from editor

setEditorContent(view, content): void
  └─ Replace entire document
```

**Decoration Types Used:**
1. `Decoration.replace()` — Hide markup completely
2. `Decoration.mark()` — Apply styling without changing content
3. Custom widgets for complex elements

### src/webview/editor.ts (93 lines)
**Purpose:** Webview script initialization and messaging

**Key Functions:**
```typescript
window.initializeEditor(initialContent)
  ├─ Get editor container DOM
  ├─ Create CodeMirror editor
  ├─ Setup change listener (150ms debounce)
  ├─ Sync changes to VS Code
  └─ Signal ready to VS Code

vscode.setMessageListener(message)
  └─ Handle 'updateContent' messages from VS Code
```

**Global APIs Exposed:**
- `window.initializeEditor(content)` — Called from HTML
- `window.vscode` — Message bridge to VS Code

---

## Media & Styling

### media/editor.css (438 lines)
**Purpose:** Complete styling system for Obsidian Live Preview

**Sections:**
```
1. CSS Variables (Light & Dark modes)
   ├─ Text colors (text, muted, faint)
   ├─ Background colors (background, surface)
   ├─ Accent colors (links, highlights)
   ├─ Component colors (code, blockquote, heading)
   └─ Spacing & radius variables

2. Base Styles
   ├─ HTML/body resets
   ├─ Typography defaults
   ├─ Font family specifications

3. CodeMirror Overrides
   ├─ .cm-editor — Main container
   ├─ .cm-content — Editable area with padding
   ├─ .cm-gutters — Line numbers area
   ├─ .cm-cursor — Caret styling
   ├─ .cm-selectionBackground — Selection color

4. Markdown Element Styles
   ├─ Headings (.cm-heading-1 through h6)
   ├─ Inline formatting (.cm-bold, .cm-italic)
   ├─ Code (.cm-inline-code, .cm-code-block)
   ├─ Links (.cm-link-widget with hover)
   ├─ Images (.cm-image-widget)
   ├─ Blockquotes (.cm-blockquote)
   ├─ Lists (.cm-list-item)
   ├─ Task lists (.cm-task-list-item)

5. Interactive Elements
   ├─ Focus states
   ├─ Scrollbar styling
   ├─ Selection highlighting

6. Accessibility
   ├─ High contrast support
   ├─ Reduced motion support
   └─ Keyboard navigation

7. Responsive Design
   ├─ Mobile adjustments
   └─ Large screen optimizations

8. Print Styles
```

**Color Scheme:**
```
Light Mode (default):
  Text: #3b3b3b (dark gray)
  Background: #f6f5f0 (warm light)
  Accent: #705dc8 (purple)

Dark Mode (Antigravity):
  Text: #e0def4 (light)
  Background: #191724 (very dark)
  Accent: #9ccfd8 (cyan)
```

---

## Documentation

### README.md (365 lines)
**Sections:**
1. Features & capabilities
2. Installation instructions
3. Usage guide (3 methods to enable)
4. Configuration reference
5. How it works (architecture)
6. Advanced features guide
7. Performance tuning
8. Theming guide
9. Troubleshooting FAQ
10. Comparison with Obsidian
11. Contributing guidelines
12. License and credits

**Target Audience:** End users and extension developers

### IMPLEMENTATION_GUIDE.md (722 lines)
**Sections:**
1. Architecture overview (flow diagrams)
2. Core components (extension, plugin, webview)
3. Decoration system (3 types, combining, cursor-aware)
4. Widget system (base class, examples, custom)
5. Building & deployment (dev, production, distribution)
6. Advanced customization (wikilinks, math, themes, performance)
7. Debugging & logging
8. Testing setup

**Target Audience:** Developers extending or modifying the extension

### QUICKSTART.md (241 lines)
**Sections:**
1. 5-minute quick start
2. Development workflow
3. Configuration options
4. Keyboard shortcuts
5. What you should see (before/after)
6. Troubleshooting
7. Next steps & learning path

**Target Audience:** New users getting started

### PROJECT_SUMMARY.md (356 lines)
**Sections:**
1. Project overview
2. What's included
3. File structure
4. Technology stack
5. How it works (rendering pipeline)
6. Getting started (3 steps)
7. Key design decisions
8. Extending guide
9. Performance metrics
10. What's not included (yet)
11. Why production-ready
12. Next steps

**Target Audience:** Project stakeholders, prospective contributors

### FILE_MANIFEST.md (This file)
**Purpose:** Complete inventory of all files with descriptions

---

## Compiled Output (Generated)

### out/extension.js (Generated by esbuild)
**Source:** `src/extension.ts` + dependencies
**Format:** CommonJS (Node.js)
**Size:** ~50-100KB (minified)
**Contains:**
- Extension entry point
- Command handlers
- Webview lifecycle management

### out/editor.js (Generated by esbuild)
**Source:** `src/webview/editor.ts` + `src/editor/obsidianLivePreviewEditor.ts`
**Format:** IIFE (browser)
**Size:** ~150-300KB (minified)
**Contains:**
- CodeMirror 6 editor
- All plugins and widgets
- Markdown parser
- Styling system
- Message handling

---

## File Statistics

| Category | Files | Lines | Purpose |
|----------|-------|-------|---------|
| **Configuration** | 3 | 188 | Build & TypeScript config |
| **Source Code** | 3 | 954 | Extension logic |
| **Styling** | 1 | 438 | Complete design system |
| **Documentation** | 5 | 1,684 | Guides & references |
| **Meta** | 2 | 22 | .gitignore |
| **Total** | 14 | 3,286 | Complete project |

## Code Organization

```
By Layer:

Extension (VS Code Interface)
  └─ src/extension.ts

Editor (CodeMirror 6)
  ├─ src/editor/obsidianLivePreviewEditor.ts
  └─ src/webview/editor.ts

Presentation (Styling)
  └─ media/editor.css

Build System
  ├─ package.json
  ├─ tsconfig.json
  └─ esbuild.config.js

Documentation
  ├─ README.md (user)
  ├─ IMPLEMENTATION_GUIDE.md (developer)
  ├─ QUICKSTART.md (getting started)
  ├─ PROJECT_SUMMARY.md (overview)
  └─ FILE_MANIFEST.md (this file)
```

---

## Development Workflow

### Building

```bash
npm install              # Install dependencies from package.json
npm run dev              # Watch build: auto-rebuild on changes
npm run typecheck        # Verify TypeScript types
npm run esbuild-base -- --minify   # Production build
```

### File Changes & Impact

| Changed File | Auto-recompiles? | Impact | Reload Needed? |
|--------------|------------------|--------|-------------------|
| `src/**/*.ts` | Yes (with `npm run dev`) | Changes extension/editor | Yes (F5) |
| `media/editor.css` | N/A (referenced by URL) | Changes styling | No (instant) |
| `package.json` | N/A | Requires reinstall | Yes (npm install) |
| `tsconfig.json` | N/A | Requires rebuild | Yes (npm run dev) |

### Testing Workflow

1. `npm run dev` — Start watch build
2. Edit files in `src/` or `media/`
3. Reload extension (`F5` or `Ctrl+Shift+P` → Reload)
4. Open markdown file and test

---

## Extension Lifecycle

```
1. npm install                 ← Install dependencies

2. npm run dev                 ← Build extension
   └─ out/extension.js created
   └─ out/editor.js created

3. F5 in project               ← Launch Antigravity with extension

4. extension.activate()        ← Extension initializes
   ├─ Register commands
   ├─ Register keybindings
   ├─ Setup listeners

5. User presses Ctrl+Shift+L   ← Enable live preview

6. createLivePreviewEditor()   ← Create webview

7. Webview loads HTML          ← Initializes CodeMirror

8. User edits markdown         ← Live preview updates

9. Close webview or file       ← Cleanup & dispose

10. F5 (reload)                ← Extension unloads & reloads
```

---

## How to Navigate the Codebase

### Quick Question → Answer

**Q: How does it hide markdown syntax?**
A: `src/editor/obsidianLivePreviewEditor.ts` → `Decoration.replace()` → `HiddenMarkupWidget`

**Q: How are links rendered?**
A: `src/editor/obsidianLivePreviewEditor.ts` → `decorateLinks()` → `LinkWidget` class

**Q: How does styling work?**
A: `media/editor.css` → CSS variables + CodeMirror class targeting

**Q: How does VS Code sync work?**
A: `src/extension.ts` → `onDidChangeTextDocument` + `webview.postMessage()`

**Q: What happens when user types?**
A: → `ObsidianLivePreviewPlugin.update()` → `computeDecorations()` → decorated view

**Q: How to add new markdown support?**
A: `src/editor/obsidianLivePreviewEditor.ts` → Add `decorateNewFeature()` method

---

## File Dependencies

```
extension.ts
├─ Requires: vscode, path
├─ Loads: getWebviewContent()
└─ Calls: createLivePreviewEditor()

obsidianLivePreviewEditor.ts
├─ Requires: @codemirror/*, markdown-it, plugins
├─ Exports: ObsidianLivePreviewPlugin, createObsidianLivePreviewEditor()
└─ Uses: All widget classes

editor.ts (webview)
├─ Requires: obsidianLivePreviewEditor.ts, @codemirror/*
├─ Exports: window.initializeEditor()
└─ Uses: vscode.postMessage API

editor.css
├─ References: CodeMirror classes (.cm-*)
├─ Uses: CSS custom properties
└─ No dependencies
```

---

This manifest provides a complete understanding of every file in the project and how they interconnect.
