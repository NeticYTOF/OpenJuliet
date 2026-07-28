# Keyboard Shortcuts Reference

OpenJuliet comes with a comprehensive set of keyboard shortcuts for navigation, editing, task management, GitHub operations, and general actions. Press **`⌘⇧K`** (or **`Ctrl+Shift+K`** on Windows/Linux) at any time to open the interactive shortcuts reference modal.

---

## Modifier Key Legend

| Symbol | Key |
|--------|-----|
| `⌘` | Command (macOS) / Ctrl (Windows/Linux) |
| `⌥` | Option (macOS) / Alt (Windows/Linux) |
| `⇧` | Shift |
| `⌃` | Ctrl (macOS only) |
| `⎋` | Escape |

> **Note:** On Windows and Linux, `⌘` should be read as `Ctrl` throughout this document. For example, `⌘1` = `Ctrl+1`.

---

## Navigation Shortcuts

| Shortcut | Action | View |
|----------|--------|------|
| `⌘1` | Dashboard view | Dashboard |
| `⌘2` | Repositories view | Repository browser |
| `⌘3` | Issues view | Issue browser |
| `⌘4` | Tasks view | Task queue & management |
| `⌘5` | History view | Execution logs & history |
| `⌘6` | Editor view | Code editor |
| `⌘,` | Open Settings | Settings panel |
| `⌘B` | Toggle sidebar | Show/hide the navigation sidebar |
| `⌘K` | Command palette | Open the command palette |
| `⌘⇧K` | Keyboard shortcuts | Open this shortcuts reference |

### View Mapping

| Number | View | Primary Use |
|--------|------|-------------|
| `1` | **Dashboard** | Task overview, recent projects, demo button |
| `2` | **Repositories** | GitHub repo browser and management |
| `3` | **Issues** | GitHub issue browser and filtering |
| `4` | **Tasks** | Task queue, active task, and controls |
| `5` | **History** | Execution logs, stage breakdown, performance |
| `6` | **Editor** | Monaco code editor, file explorer, diff viewer |
| `,` | **Settings** | All configuration panels |

---

## Editor Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘S` | Save file | Editor pane |
| `⌘Z` | Undo | Editor pane |
| `⌘⇧Z` | Redo | Editor pane |
| `⌘F` | Find in file | Search within the active document |
| `⌘H` | Find and replace | Search and replace in the active document |
| `⌘D` | Duplicate selection | Duplicate the current selection or line |
| `⌘/` | Toggle comment | Comment or uncomment the current line/selection |
| `⌘]` | Indent | Increase indentation |
| `⌘[` | Outdent | Decrease indentation |

The editor is powered by **Monaco Editor** (the same editor that powers VS Code). Most VS Code editing shortcuts also work.

---

## Task Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘N` | New task | Create a new task in the queue |
| `⌘⇧Enter` | Run selected task | Execute the selected or active task |
| `⌘P` | Pause/resume task | Toggle the active task's pause state |
| `⌘⇧P` | Task palette | Open the task navigation palette |
| `⌘.` | Cancel running task | Stop the currently executing task |
| `⎋` (Escape) | Cancel/close | Close dialogs, dismiss notifications |

### Task Lifecycle Controls

```
Create (⌘N) → Run (⌘⇧Enter) → Monitor → Pause (⌘P) → Resume (⌘P) → Complete
                              → Cancel (⌘.) → History
```

---

## GitHub Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘⇧G` | Open GitHub panel | Repositories, Issues, or PRs view |
| `⌘⇧I` | Open Issues | Navigate to the Issues browser |
| `⌘⇧R` | Create PR | Open the pull request creation dialog |
| `⌘⇧C` | Clone repository | Open the clone repository dialog |

---

## General Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘K` | Command palette | Fuzzy-search commands and navigate |
| `⌘⇧K` | Keyboard shortcuts | Open this reference |
| `⎋` (Escape) | Close modals/dialogs | Dismiss any open modal or dialog |
| `⌘W` | Close tab/panel | Close the active tab or side panel |
| `⌘Q` | Quit application | Exit OpenJuliet |
| `⌘M` | Minimize window | Minimize to dock/taskbar |
| `⌘R` | Reload app | Reload the renderer process (developer use) |
| `⌘⇧T` | Theme customizer | Open the theme customization panel |
| `⌘⌥I` | Developer tools | Toggle Chrome DevTools |

---

## Complete Shortcut Table

All 30+ shortcuts in one reference table, organized by category:

### Navigation (8 shortcuts)

| Shortcut | Action | Category |
|----------|--------|----------|
| `⌘1` | Dashboard view | Navigation |
| `⌘2` | Repositories view | Navigation |
| `⌘3` | Issues view | Navigation |
| `⌘4` | Tasks view | Navigation |
| `⌘5` | History view | Navigation |
| `⌘6` | Editor view | Navigation |
| `⌘,` | Open settings | Navigation |
| `⌘B` | Toggle sidebar | Navigation |

### Editor (9 shortcuts)

| Shortcut | Action | Category |
|----------|--------|----------|
| `⌘S` | Save file | Editor |
| `⌘Z` | Undo | Editor |
| `⌘⇧Z` | Redo | Editor |
| `⌘F` | Find in file | Editor |
| `⌘H` | Find and replace | Editor |
| `⌘D` | Duplicate selection | Editor |
| `⌘/` | Toggle comment | Editor |
| `⌘]` | Indent | Editor |
| `⌘[` | Outdent | Editor |

### Tasks (5 shortcuts)

| Shortcut | Action | Category |
|----------|--------|----------|
| `⌘N` | New task | Tasks |
| `⌘⇧Enter` | Run selected task | Tasks |
| `⌘.` | Cancel running task | Tasks |
| `⌘P` | Pause/resume task | Tasks |
| `⌘⇧P` | Open task palette | Tasks |

### GitHub (4 shortcuts)

| Shortcut | Action | Category |
|----------|--------|----------|
| `⌘⇧G` | Open GitHub panel | GitHub |
| `⌘⇧I` | Open issues | GitHub |
| `⌘⇧R` | Create PR | GitHub |
| `⌘⇧C` | Clone repository | GitHub |

### General (8 shortcuts)

| Shortcut | Action | Category |
|----------|--------|----------|
| `⌘K` | Command palette | General |
| `⌘⇧K` | Keyboard shortcuts | General |
| `⎋` (Escape) | Close modals/dialogs | General |
| `⌘W` | Close tab/panel | General |
| `⌘Q` | Quit application | General |
| `⌘M` | Minimize window | General |
| `⌘R` | Reload app | General |
| `⌘⇧T` | Theme customizer | General |

---

## Command Palette

Press **`⌘K`** to open the command palette. This provides fuzzy-search access to:

- All application views
- Settings panels
- Task operations
- GitHub actions
- Help and reference pages

Type part of the command name to filter. Use arrow keys to navigate and `Enter` to execute.

---

## Platform Differences

### macOS
- All shortcuts use `⌘` (Command) as the primary modifier
- `⌥` (Option) is used for secondary modifiers
- `⌃` (Control) is available but rarely needed

### Windows / Linux
- `⌘` → `Ctrl` (Control)
- `⌥` → `Alt`
- `⇧` → Shift

Example conversions:

| macOS | Windows/Linux |
|-------|--------------|
| `⌘S` | `Ctrl+S` |
| `⌘⇧K` | `Ctrl+Shift+K` |
| `⌘,` | `Ctrl+,` |
| `⌘⌥I` | `Ctrl+Shift+I` |

---

## Customizing Shortcuts

Shortcuts are defined in `src/renderer/src/lib/constants.ts` under the `KEYBOARD_SHORTCUTS` array. The `useKeyboard()` hook in `src/renderer/src/hooks/useKeyboard.ts` registers global listeners.

> **Note:** Custom keybinding support is planned for a future release. Currently, shortcuts are hardcoded in the source.

---

## Tips

- Press `⌘K` then type "settings" to jump to any settings tab
- Use `⌘⇧K` when you forget a shortcut — it's the shortcut to remember shortcuts
- In the editor, most VS Code keybindings work out of the box (Monaco Editor compatibility)
- The command palette (`⌘K`) shows available commands contextually based on your current view
