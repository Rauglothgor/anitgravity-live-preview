# Antigravity Live Preview - Feature Roadmap

## Status Legend
- [x] Completed
- [ ] Pending
- [~] Partial/In Progress

---

## Completed Features

### Core Infrastructure
- [x] VS Code extension framework
- [x] CodeMirror 6 editor integration
- [x] Webview panel management
- [x] Bidirectional sync (VS Code <-> Webview)
- [x] Undo/Redo support (history extension)
- [x] Error handling & crash recovery

### Preview Modes
- [x] Source Mode (raw markdown)
- [x] Live Preview Mode (cursor-aware rendering)
- [x] Reading Mode (fully rendered)
- [x] Mode cycling (Ctrl+E)
- [x] Status bar indicator

### Markdown Rendering
- [x] Headings (h1-h6) with styling
- [x] Bold, Italic, Strikethrough
- [x] Inline code
- [x] Links (markdown style)
- [x] Images
- [x] Blockquotes
- [x] Task lists (checkboxes)
- [x] Ordered/Unordered lists
- [x] Wikilinks `[[Page]]` and `[[Page|Display]]`
- [x] Math (KaTeX) - inline `$...$` and block `$$...$$`
- [x] Callouts/Admonitions `> [!NOTE]`, `> [!WARNING]`, etc.

### Styling
- [x] Shimmering Focus theme (Rosé Pine inspired)
- [x] Multiple color schemes (Everforest, Gruvbox, Coffee, Gamma, Light)
- [x] Responsive design
- [x] Accessibility features

---

## Phase B: Remaining Markdown Features

### Table Rendering
**Priority**: Medium | **Complexity**: Medium

Render markdown tables as formatted HTML tables with Shimmering Focus styling.

**Features**:
- Detect pipe-delimited table syntax
- Parse alignment markers (`:---`, `:---:`, `---:`)
- Render as styled `<table>` elements
- Active cell highlighting
- Alternating row colors

**Files to modify**:
- `src/editor/obsidianLivePreviewEditor.ts` (add TableWidget, detectTable)
- `media/editor.css` (table styles already exist, may need refinement)

---

### Syntax Highlighting in Code Blocks
**Priority**: Medium | **Complexity**: Medium

Add syntax highlighting for fenced code blocks using highlight.js.

**Features**:
- Detect language from code fence (```javascript, ```python, etc.)
- Apply syntax highlighting colors
- Support common languages (JS, TS, Python, CSS, HTML, JSON, etc.)

**Implementation**:
1. Install highlight.js: `npm install highlight.js`
2. Create `CodeBlockWidget` that renders highlighted code
3. Include highlight.js theme CSS in webview

**Files to modify**:
- `package.json` (add highlight.js dependency)
- `src/editor/obsidianLivePreviewEditor.ts` (add/enhance CodeBlockWidget)
- `src/extension.ts` (include highlight.js CSS)
- `media/editor.css` (syntax theme overrides)

---

### Embeds Support
**Priority**: Low | **Complexity**: Medium

Support Obsidian-style embeds: `![[image.png]]` and `![[note.md]]`.

**Features**:
- Inline image embeds with workspace path resolution
- Note content preview embeds
- Fallback for missing files

**Files to modify**:
- `src/editor/obsidianLivePreviewEditor.ts` (add EmbedWidget)
- `media/editor.css` (embed styling)

---

### Footnotes Support
**Priority**: Low | **Complexity**: Medium

Add footnote syntax `[^1]` and `[^1]: Footnote text`.

**Features**:
- Inline footnote references
- Footnote definitions at bottom
- Click navigation between ref and definition
- Hover preview

**Files to modify**:
- `src/editor/obsidianLivePreviewEditor.ts` (FootnoteRefWidget, FootnoteDefWidget)
- `media/editor.css` (footnote styling)

---

### Mermaid Diagrams
**Priority**: Low | **Complexity**: High

Render Mermaid diagrams in code blocks.

**Features**:
- Detect ```mermaid code blocks
- Render SVG diagrams inline
- Support flowcharts, sequence diagrams, etc.

**Implementation**:
1. Install mermaid: `npm install mermaid`
2. Create MermaidWidget with async rendering
3. Handle diagram errors gracefully

**Files to modify**:
- `package.json` (add mermaid dependency)
- `src/editor/obsidianLivePreviewEditor.ts` (add MermaidWidget)
- `media/editor.css` (diagram styling)

---

## Phase C: Core Enhancements

### Theme Toggle (Runtime)
**Priority**: Medium | **Complexity**: Low

Add runtime theme switching between color schemes.

**Features**:
- Command to toggle themes
- Sync with VS Code theme (dark/light)
- Persist preference

**Files to modify**:
- `package.json` (add command)
- `src/extension.ts` (theme toggle handler)
- `src/webview/editor.ts` (handle theme message)

---

### Scroll Sync
**Priority**: Medium | **Complexity**: Medium

Sync scroll position between VS Code source editor and webview.

**Features**:
- Scroll events in webview update VS Code
- Line-based scroll mapping
- Smooth scrolling

**Files to modify**:
- `src/extension.ts` (handle scroll messages)
- `src/webview/editor.ts` (emit scroll events)

---

### Performance Optimization
**Priority**: Medium | **Complexity**: Medium

Optimize for large files.

**Features**:
- Viewport-aware decoration (only visible lines)
- Decoration caching with smart invalidation
- File size limits with graceful degradation
- Optional Web Workers for parsing

**Files to modify**:
- `src/editor/obsidianLivePreviewEditor.ts` (viewport optimization)
- `package.json` (maxFileSize setting)

---

### Custom CSS Support
**Priority**: Low | **Complexity**: Low

Allow users to inject custom CSS.

**Features**:
- Configuration option for custom CSS file path
- Inject user styles into webview
- Hot reload on CSS changes

**Files to modify**:
- `package.json` (add configuration)
- `src/extension.ts` (inject custom CSS)

---

### Export to HTML/PDF
**Priority**: Low | **Complexity**: High

Export rendered markdown to standalone files.

**Features**:
- Export to HTML with embedded styles
- Optional PDF export (puppeteer)
- Include images as data URIs or relative paths

**Files to modify**:
- `package.json` (add command, optional puppeteer)
- `src/extension.ts` (export handlers)

---

## Phase D: Infrastructure

### Unit Testing Setup
**Priority**: High | **Complexity**: Low

Add comprehensive test suite.

**Features**:
- Test decoration computation
- Test widget rendering
- Test regex pattern matching
- Test extension lifecycle

**Implementation**:
1. Install vitest: `npm install -D vitest @vitest/coverage-v8`
2. Create vitest.config.ts
3. Write tests in `src/__tests__/`

**New files**:
- `vitest.config.ts`
- `src/__tests__/extension.test.ts`
- `src/__tests__/obsidianLivePreviewEditor.test.ts`
- `src/__tests__/widgets.test.ts`

---

### CI/CD Pipeline
**Priority**: Medium | **Complexity**: Low

Add GitHub Actions for automated testing and publishing.

**Features**:
- PR testing workflow
- Release publishing workflow
- Badge in README

**New files**:
- `.github/workflows/test.yml`
- `.github/workflows/publish.yml`

---

## Phase E: Agentic Symbiosis Features

These features transform the editor into a collaborative workspace for human-AI symbiosis, integrating with Antigravity's Agent Manager.

### Ghost Cursor - Real-Time Agent Visualization
**Priority**: High | **Complexity**: High

Show the agent's work in real-time with a visible cursor and streaming edits.

**Features**:
- Agent presence indicator with labeled cursor
- Streamed token insertions visible in real-time
- Atomic Ranges to prevent user cursor displacement
- Reasoning tooltips on hover

---

### Interactive Deep Think Artifacts
**Priority**: High | **Complexity**: High

Turn agent-generated plans and task lists into interactive widgets.

**Features**:
- Semantic detection of agent task lists
- Render as Kanban board, checklist, or dependency graph
- Bidirectional feedback to Agent Manager
- Progress bars and status icons

---

### Vibe Coding & Live Diff Interface
**Priority**: High | **Complexity**: High

Natural language commands with inline diff view.

**Features**:
- Inline `/` command palette
- Live Diff decoration (green additions, red deletions)
- Accept/Reject/Revise toolbar

---

### Agent-Driven Outline & Task Panel
**Priority**: Medium | **Complexity**: Medium

Document structure panel with real-time agent status.

**Features**:
- Live outline from markdown headings
- Agent status icons per section
- Ghost cursor position in outline
- Control buttons for agent management

---

### Contextual Snippets Sidebar
**Priority**: Medium | **Complexity**: Medium

Proactive suggestions with code examples and knowledge links.

**Features**:
- Real-time context scanning
- Code snippet suggestions
- Knowledge base links
- Quick-ask buttons

---

### Collaborative Agent Review & Handoff
**Priority**: Medium | **Complexity**: High

Async collaboration with formal handoff and diff-based review.

**Features**:
- Agent-generated handoff notes
- Full Live Diff view
- Accept/reject individual changes
- Merge workflow

---

## Priority Summary

| Category | Completed | Remaining |
|----------|-----------|-----------|
| **Core** | 6 | 4 |
| **Markdown** | 11 | 5 |
| **Styling** | 2 | 1 |
| **Agentic** | 0 | 6 |
| **Infra** | 1 | 2 |

### Recommended Next Steps

1. **Table Rendering** - High impact, medium effort
2. **Syntax Highlighting** - High impact, medium effort
3. **Unit Testing** - Important for stability
4. **Scroll Sync** - Quality of life improvement
5. **CI/CD Pipeline** - Enables reliable releases

### Future Priorities (Agentic Features)

Once core markdown features are complete:
1. Vibe Coding & Live Diff (most user-facing value)
2. Ghost Cursor (visual feedback)
3. Agent-Driven Outline Panel (mission control)
