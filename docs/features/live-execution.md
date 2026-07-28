# Live Execution

The Live Execution view shows real-time progress of autonomous tasks.

## Activity Feed

Displays what's currently happening:
- **Current file** being edited
- **Current tool** being run (linter, test runner, etc.)
- **Current command** being executed
- **Current git branch** for the repository

## Progress Visualization

Each workflow stage shows progress from 0-100%:
- **Analyze** — reading repository structure
- **Plan** — creating implementation plan
- **Implement** — editing code files
- **Test** — running tests and linters
- **Review** — checking code quality
- **Commit** — creating git commit
- **PR** — generating pull request

## Timeline View

Visual stage progression with:
- Vertical timeline with status icons for each stage
- Connecting lines that animate between stages
- Click to expand stage details
- Current stage pulses/highlights
- Failed stages shown in red
- Completed stages show duration

## Resource Monitoring

During execution, the panel shows:
- **CPU usage** — radial gauge
- **Memory usage** — radial gauge
- **Tokens consumed** — counter (tracks AI API usage)
- **Files modified** — counter

## Time Tracking

- **Elapsed time** — running clock from task start
- **Estimated completion** — calculated from stage progress

## Log Viewer

Searchable, filterable log viewer:
- **Search** within logs (highlights matches)
- **Filter by level**: info, warn, error, debug
- **Filter by stage**: analyze, plan, implement, test, review, commit, pr
- **Timestamp** for each log entry
- **Copy log** content button
- **Clear logs** button
- **Auto-scroll** to latest entries
- **Animated** new entries (slide in)

## Control Buttons

| Button | Action |
|--------|--------|
| ▶ Run | Start the task |
| ⏸ Pause | Pause execution (preserves state) |
| ⏹ Cancel | Stop execution (irreversible) |
| 🔄 Retry | Re-run a completed or failed task |

## Stage Status Icons

| Icon | Meaning |
|------|---------|
| ⏳ | Pending (queued) |
| 🔄 | Active (currently running) |
| ✅ | Completed successfully |
| ❌ | Failed with errors |
| ⏭ | Skipped (not applicable) |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘⏎ | Execute current task |
| ⎋ | Cancel running task |
| ⌘⇧P | Pause task |
