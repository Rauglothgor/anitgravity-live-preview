# Antigravity Live Preview

A true **Obsidian-style inline markdown live preview** extension for Google Antigravity IDE. No split panels, no distractions—just clean, formatted markdown that hides syntax and renders inline as you type.

## Features

### ✨ Core Live Preview Capabilities

- **True inline rendering** — Markdown syntax is hidden, formatted content displays in the editor
- **Cursor-aware rendering** — Raw markdown shows at cursor position only
- **Instant parsing** — Real-time updates with intelligent debouncing
- **Syntax hiding** — `# Heading` becomes invisible `Heading` styled as h1
- **No split panels** — Everything in one clean view

### 🔄 Preview Modes

Three viewing modes, just like Obsidian:

- **Source Mode** — Raw markdown, no rendering
- **Live Preview Mode** — Cursor-aware rendering (default)
- **Reading Mode** — Fully rendered, no raw syntax

Toggle with `Ctrl+E` (Windows/Linux) or `Cmd+E` (Mac)

### 📝 Supported Markdown

- **Headings** (h1-h6) with proper styling and sizing
- **Bold** and *italic* text
- **Inline code** with syntax highlighting context
- **Links** with clickable widgets
- **Images** with inline rendering
- **Blockquotes** with left border styling
- **Task lists** with interactive checkboxes
- **Strikethrough** text
- **Lists** (ordered and unordered)
- **Code blocks** with language support
- **Horizontal rules**
- **Wikilinks** — `[[Page]]` and `[[Page|Display Text]]` with click-to-navigate
- **Math (KaTeX)** — Inline `$E=mc^2$` and block `$$...$$` expressions
- **Callouts/Admonitions** — `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, etc.

### 🎨 Design & UX

- **Shimmering Focus theme** — Minimalist dark mode optimized for keyboard-centric workflows
- **Responsive typography** — Clear heading hierarchy with distinctive styles
- **Color-coded syntax** — Links, code, blockquotes visually distinct
- **Smooth interactions** — Hover effects and smooth transitions
- **Accessibility** — High contrast, keyboard navigation, screen reader support

### ⚙️ Performance

- **Viewport-aware rendering** — Only decorates visible content
- **Debounced parsing** — 150ms default debounce for smooth typing
- **Memory efficient** — Reuses widget instances
- **File size limits** — Handles files up to 1MB by default

## Installation

### From VS Code Marketplace (Coming Soon)

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rauglothgor/anitgravity-live-preview.git
   cd antigravity-live-preview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run esbuild
   ```

4. Package for installation:
   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```

5. Install in Google Antigravity:
   - Open Antigravity
   - Go to Extensions
   - Click "Install from VSIX"
   - Select the `.vsix` file

## Usage

### Enabling Live Preview

**Method 1: Command Palette**
- Open command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
- Search "Toggle Live Preview"
- Press Enter

**Method 2: Keyboard Shortcut**
- Press `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows/Linux)

**Method 3: Auto-enable**
- Set `antigravity-live-preview.enabled: true` in settings
- Live preview enables automatically for all markdown files

### Configuration

Open VS Code/Antigravity settings and customize:

```json
{
  "antigravity-live-preview.enabled": true,
  "antigravity-live-preview.mode": "live-preview",
  "antigravity-live-preview.theme": "obsidian-dark",
  "antigravity-live-preview.debounceMs": 150,
  "antigravity-live-preview.maxFileSize": 1000000,
  "antigravity-live-preview.renderImages": true,
  "antigravity-live-preview.renderMath": true,
  "antigravity-live-preview.syncScroll": true
}
```

**Mode options:**
- `source` — Raw markdown only
- `live-preview` — Cursor-aware rendering (default)
- `reading` — Fully rendered view

## How It Works

### Architecture

```
VS Code / Google Antigravity
    ↓
Extension Handler (src/extension.ts)
    ↓
Webview Panel
    ↓
CodeMirror 6 Editor
    ├─ Parser: markdown-it
    ├─ Math: KaTeX
    ├─ Decorations: Syntax hiding + formatting
    └─ Widgets: Headings, links, images, callouts, math, wikilinks
```

### Decoration Pipeline

1. **Parse** — markdown-it parses source to tokens
2. **Analyze** — Extract syntax patterns (headings, bold, links, etc)
3. **Hide** — Create `Decoration.replace()` for markup symbols
4. **Style** — Apply `Decoration.mark()` for formatting
5. **Replace** — Use `WidgetType` for complex elements (links, images)
6. **Render** — CodeMirror applies decorations to viewport

### Cursor-Aware Rendering

- When cursor is on a line, that line displays raw markdown
- All other lines show formatted content
- Updates in real-time as you move the cursor

### Sync Between Editors

- VS Code editor ← → Webview editor
- Changes sync bidirectionally
- File state stays in sync with VS Code

## Development

### Project Structure

```
antigravity-live-preview/
├── src/
│   ├── extension.ts                 # VS Code extension handler
│   ├── editor/
│   │   └── obsidianLivePreviewEditor.ts    # CodeMirror 6 setup
│   └── webview/
│       └── editor.ts               # Webview initialization
├── media/
│   └── editor.css                  # Shimmering Focus styling
├── out/                            # Compiled JavaScript
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

### Building

```bash
# Development with watch mode
npm run dev

# Production build
npm run esbuild-base -- --minify

# Type checking
npm run typecheck
```

### Key Files Explained

**obsidianLivePreviewEditor.ts**
- Core CodeMirror 6 setup with live preview styling
- Widget classes for rendering complex elements
- Decoration logic for each markdown type
- Main `ObsidianLivePreviewPlugin` class

**extension.ts**
- VS Code extension activation and command handling
- Webview panel creation and lifecycle management
- Message passing between editor and webview
- File change synchronization

**editor.css**
- Shimmering Focus theme with 6 color schemes
- Dark mode optimized (default for Antigravity)
- Light mode support
- Responsive design
- Accessibility features

## Advanced Features

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+E` / `Cmd+E` | Cycle preview modes (Source → Live → Reading) |
| `Ctrl+Shift+L` / `Cmd+Shift+L` | Toggle live preview panel |
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |

### Wikilinks

Click any `[[wikilink]]` to navigate:
- Opens existing file if found in workspace
- Creates new file with `# Title` header if not found

Supports display text: `[[actual-page|Display Text]]`

### Callouts

Supported callout types with unique icons and colors:

```markdown
> [!NOTE] Optional title
> Content here

> [!TIP] Helpful hint
> Content here

> [!WARNING] Be careful
> Content here

> [!DANGER] Critical warning
> Content here
```

Other types: `INFO`, `TODO`, `ABSTRACT`, `SUCCESS`, `QUESTION`, `FAILURE`, `BUG`, `EXAMPLE`, `QUOTE`

### Math (KaTeX)

Inline math with single dollar signs:
```markdown
The equation $E = mc^2$ changed physics.
```

Block math with double dollar signs:
```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

### Custom Syntax Support

To add support for additional markdown syntax:

1. Add parsing logic to `decorateLine()` in `obsidianLivePreviewEditor.ts`
2. Create a new widget class extending `WidgetType` if needed
3. Add CSS styling in `media/editor.css`

### Performance Tuning

For large files, adjust debounce and parsing strategy:

```json
{
  "antigravity-live-preview.debounceMs": 300,
  "antigravity-live-preview.maxFileSize": 5000000
}
```

For real-time rendering without debounce (not recommended):

```json
{
  "antigravity-live-preview.debounceMs": 0
}
```

### Theming

To customize colors, edit `media/editor.css`:

```css
:root {
  /* Modify these CSS variables */
  --color-text: #your-color;
  --color-heading: #your-color;
  --color-accent: #your-color;
  /* ... etc */
}
```

## Troubleshooting

### Issue: Extension doesn't activate

**Solution:**
1. Check that file is markdown (`.md` extension)
2. Verify extension is installed: `Ctrl+Shift+X` → Search "Antigravity Live Preview"
3. Check Antigravity version (requires 1.95+)

### Issue: Rendering looks wrong

**Solution:**
1. Reload webview: Press F5 or run "Developer: Reload Window"
2. Clear cache: Delete `.vscode/extensions` folder
3. Check console for errors: `Ctrl+Shift+J`

### Issue: Performance is slow

**Solution:**
1. Increase debounce: `"antigravity-live-preview.debounceMs": 300`
2. Check file size: Extension has 1MB default limit
3. Close other extensions: Disable competing markdown extensions

### Issue: Sync issues between editors

**Solution:**
1. Make sure file isn't open in multiple locations
2. Reload the extension: `Ctrl+Shift+P` → "Reload Window"
3. Check file permissions (shouldn't be read-only)

## Comparison with Obsidian

| Feature | Obsidian | This Extension |
|---------|----------|-----------------|
| Live preview rendering | ✅ | ✅ |
| Syntax hiding | ✅ | ✅ |
| Cursor-aware rendering | ✅ | ✅ |
| Single view editing | ✅ | ✅ |
| Mode cycling (Source/Live/Reading) | ✅ | ✅ |
| Wikilinks | ✅ | ✅ |
| Math rendering (KaTeX) | ✅ | ✅ |
| Callouts/Admonitions | ✅ | ✅ |
| Embeds | ✅ | 🔲 (Planned) |
| Footnotes | ✅ | 🔲 (Planned) |
| Tables | ✅ | 🔲 (Planned) |
| Mermaid diagrams | ✅ | 🔲 (Planned) |
| VS Code integration | ❌ | ✅ |
| Undo/Redo support | ✅ | ✅ |

## Contributing

Contributions welcome!

### Completed Features
- [x] Math rendering (KaTeX)
- [x] Wikilinks with navigation
- [x] Callouts/Admonitions
- [x] Preview mode cycling (Source/Live/Reading)
- [x] Undo/Redo support

### Planned Enhancements
- [ ] Table rendering
- [ ] Syntax highlighting in code blocks
- [ ] Embeds support (`![[file]]`)
- [ ] Footnotes and references
- [ ] Diagram support (Mermaid)
- [ ] Scroll sync between editors
- [ ] Export to HTML/PDF
- [ ] Custom CSS support

## License

MIT © 2025

## Credits

- **CodeMirror 6** — Powerful editor toolkit
- **markdown-it** — Markdown parser
- **KaTeX** — Fast math typesetting
- **Obsidian** — Design inspiration (Shimmering Focus theme)
- **VS Code / Google Antigravity** — Platform

## Support

- 💬 GitHub Issues: [Report a bug](https://github.com/Rauglothgor/anitgravity-live-preview/issues)

---

**Made with ❤️ for markdown lovers using Google Antigravity**
