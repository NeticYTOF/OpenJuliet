# Editor Experience

OpenJuliet features a full-featured code editor built on **Monaco Editor** — the same engine that powers VS Code.

## Monaco Editor

### Features
- **Syntax highlighting** for 50+ languages (JavaScript, TypeScript, Python, Rust, Go, HTML, CSS, and more)
- **Line numbers** with relative mode support
- **Minimap** for rapid file navigation
- **Search & Replace** with regex support (⌘F / ⌘H)
- **Multi-cursor** editing (⌘D to select next occurrence)
- **Code folding** for functions, classes, imports
- **Bracket matching** with colored guides
- **Auto-indentation** based on language
- **IntelliSense** - code completion, parameter hints, quick info

### Toolbar
- Filename display with language badge
- Search button (⌘F)
- Minimap toggle
- Full-screen toggle
- Split view toggle

### Usage
```typescript
import { CodeViewer } from './components/editor/CodeViewer'

<CodeViewer
  code="const x = 1;"
  language="typescript"
  filename="example.ts"
  showMinimap={true}
  readOnly={true}
/>
```

## Diff Viewer

Side-by-side diff view for comparing file changes.

### Features
- **Side-by-side layout**: old on left, new on right
- **Color-coded** lines: green for additions, red for deletions
- **Line numbers** on both sides
- **File path header** with change type badge (Added, Modified, Deleted)
- **Hunk navigation** for large diffs

### Usage
```typescript
import { DiffViewer } from './components/editor/DiffViewer'

<DiffViewer
  oldCode="const x = 1;"
  newCode="const x = 2;"
  filename="example.ts"
  status="modified"
/>
```

## File Explorer

Tree-based file navigation for repositories.

### Features
- **Directory tree** with expandable folders
- **Git decorations**: modified (amber), added (green), deleted (red)
- **Right-click context menu**: Open, Rename, Delete, Copy Path
- **Search/filter** at the top
- **Animated** expand/collapse
- **File icons** based on extension

## Image Preview
- Supports PNG, JPG, SVG, GIF
- Inline preview in the editor tab
- Zoom and pan controls

## Markdown Preview
- Rendered HTML preview of .md files
- GitHub Flavored Markdown (GFM) support
- Tables, code blocks, lists, images
- Side-by-side edit/preview mode

## Code Outline
- Symbol navigation for structured files
- Shows functions, classes, imports, variables
- Click to jump to definition
- Language-specific parsing

## Find in Project
- Search across all files in the workspace
- Regex support
- Results grouped by file
- Click result to open file at line

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘S | Save file |
| ⌘F | Search in file |
| ⌘H | Search and replace |
| ⌘D | Select next occurrence |
| ⌘⇧F | Find in project |
| ⌘/ | Toggle comment |
| ⌘] | Indent |
| ⌘[ | Outdent |
| ⌘↑/↓ | Scroll to top/bottom |
| ⌥↑/↓ | Move line up/down |
| ⌘⇧K | Delete line |
| ⌘⏎ | Insert line below |
