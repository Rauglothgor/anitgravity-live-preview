# Quick Start Guide

Get the Obsidian Live Preview extension up and running in 5 minutes.

## Prerequisites

- Node.js 16+ and npm
- Google Antigravity IDE (or VS Code 1.95+)
- Git

## 1. Clone & Install (2 minutes)

```bash
git clone https://github.com/your-username/obsidian-live-preview-antigravity.git
cd obsidian-live-preview-antigravity
npm install
```

## 2. Build the Extension (1 minute)

```bash
npm run dev
# Starts development build with file watching
```

## 3. Load in Antigravity (1 minute)

**Option A: Development Mode**
```bash
# In the cloned repo, press:
# F5 (Windows/Linux) or Cmd+F5 (Mac)
# This launches a new Antigravity window with the extension loaded
```

**Option B: Install from VSIX**
```bash
npm run esbuild-base -- --minify
npm install -g @vscode/vsce
vsce package
# Then in Antigravity: Ctrl+Shift+X → Install from VSIX → select .vsix file
```

## 4. Try It Out (1 minute)

1. Open any `.md` file in Antigravity
2. Press `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac)
3. See the live preview activate!

### Test Content

Create a test file `test.md` with:

```markdown
# Welcome to Obsidian Live Preview

## Features
This editor supports:
- **Bold text**
- *Italic text*
- `Inline code`
- [Links](https://example.com)

> Blockquotes
> Look great too

### Nested Headings

- [ ] Task lists
- [x] With checkboxes

## Try It Out

1. Edit this text
2. Watch it update in real-time
3. No split panels, pure focused editing
```

Edit this file and watch the formatting appear and disappear as you move your cursor!

## Configuration

Open VS Code/Antigravity settings and add:

```json
{
  "obsidian-live-preview.enabled": true,
  "obsidian-live-preview.theme": "obsidian-dark",
  "obsidian-live-preview.debounceMs": 150
}
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle live preview | `Ctrl+Shift+L` |
| Command palette | `Ctrl+Shift+P` |
| (Then search "Obsidian" to see all commands) | |

## What You Should See

### Before (Raw Markdown)
```
# Heading
**bold** and *italic* text
[Click here](https://example.com)
```

### After (Live Preview Enabled)
- `#` symbols disappear
- "Heading" appears as large text
- `**...**` becomes bold
- `*...*` becomes italic  
- Link becomes clickable text
- Move cursor to line → sees raw markdown again
- Move cursor away → sees formatted text

## Troubleshooting

### "Extension not loading"
```bash
# Rebuild and check for errors
npm run typecheck
npm run dev
```

### "File won't render"
1. Make sure file is `.md` extension
2. Check file isn't empty
3. Try with test content above

### "Changes not syncing"
1. Check VS Code console: `Ctrl+Shift+J`
2. Look for error messages
3. Try reloading window: `Ctrl+Shift+P` → "Reload Window"

### "Performance is slow"
Increase debounce time in settings:
```json
{
  "obsidian-live-preview.debounceMs": 300
}
```

## Next Steps

### Learn the Code
1. Read `IMPLEMENTATION_GUIDE.md` for architecture
2. Explore `src/editor/obsidianLivePreviewEditor.ts` for decoration logic
3. Check `media/editor.css` for styling

### Extend Functionality
- Add support for math: `$x^2 + y^2 = z^2$`
- Add wikilinks: `[[Page Name]]`
- Add embeds: `![[image.png]]`
- Custom themes

See `IMPLEMENTATION_GUIDE.md` for examples.

### Deploy to Marketplace

```bash
# Create GitHub personal access token
# https://github.com/settings/tokens/new

vsce publish --pat <YOUR_TOKEN>
# Extension published to VS Code Marketplace!
```

## File Structure

```
obsidian-live-preview-antigravity/
├── src/
│   ├── extension.ts                 # Main extension entry
│   ├── editor/
│   │   └── obsidianLivePreviewEditor.ts   # CodeMirror setup
│   └── webview/
│       └── editor.ts               # Webview initialization
├── media/
│   └── editor.css                  # All styling
├── out/                            # Compiled files (generated)
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config
├── README.md                       # Full documentation
├── IMPLEMENTATION_GUIDE.md         # Technical deep dive
└── QUICKSTART.md                   # This file!
```

## Development Tips

### Hot Reload During Development

1. Keep `npm run dev` running in terminal
2. Edit files in `src/`
3. Files auto-rebuild
4. In Antigravity: `Ctrl+Shift+P` → "Reload Window"
5. Changes appear instantly

### Debug Logging

Add to any TypeScript file:
```typescript
console.log('Debug info:', myVariable);
```

View logs in Antigravity's debug console: `Ctrl+Shift+J`

### Modify Styles

Edit `media/editor.css` while running `npm run dev`:
- Changes auto-apply to webview
- No reload needed for CSS

### Test Different Files

Large markdown file? Create `test-large.md`:
```bash
# Generate 1000-line markdown file
node -e "console.log(Array(1000).fill('# Test\n\nSome content\n\n').join(''))" > test-large.md
```

Test performance with different `debounceMs` settings.

## Getting Help

- 📚 **Documentation**: `README.md` and `IMPLEMENTATION_GUIDE.md`
- 🐛 **Issues**: GitHub Issues on the repo
- 💬 **Discussions**: GitHub Discussions
- 📧 **Email**: support@example.com

## What's Next?

Once you have it working:

1. **Customize** — Edit CSS theme, add new markdown syntax support
2. **Extend** — Add plugins for math, diagrams, embeds
3. **Deploy** — Share with the world via Marketplace
4. **Contribute** — Submit PRs for improvements

Happy editing! 🚀
