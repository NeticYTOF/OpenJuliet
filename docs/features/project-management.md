# Project Management

OpenJuliet provides comprehensive project and task management.

## Multiple Repositories

OpenJuliet supports working with multiple repositories:
- **Clone from GitHub** — clone any accessible repository
- **Open local folder** — work with existing local repositories
- **Recent projects** — quickly switch between recent repos
- **Repository state** — each repo tracked independently

## Task Queue

Manage multiple tasks with a queue system:
- **Add tasks** — create tasks from issues or manually
- **Reorder** — drag and drop to change priority
- **Prioritize** — assign priority levels
- **Batch operations** — start, cancel, or prioritize multiple tasks
- **Search/filter** — find tasks by name, status, or priority

## Task States

Each task progresses through these states:

```
Queued → Running → Paused → Running → Completed
                    → Cancelled
                    → Failed → Retry → Queued
```

| State | Description |
|-------|-------------|
| **Queued** | Waiting in queue, not yet started |
| **Running** | Currently being executed |
| **Paused** | Execution paused, can be resumed |
| **Completed** | Finished successfully |
| **Failed** | Finished with errors |
| **Cancelled** | Stopped by user |

## Background Execution

Tasks run in the background without blocking the UI:
- Continue using other features while task executes
- Real-time progress updates via IPC
- Notifications on completion
- Multiple tasks can run in parallel (configurable concurrency)

## Execution History

Every task execution is recorded:
- **Searchable log** — find past tasks by name, date, status
- **Filterable** — by status (completed, failed, cancelled)
- **Details** — expand to see full execution log
- **Duration** — how long each task took
- **Results** — files changed, tests passed/failed

## Task Retry

Failed tasks can be retried:
- **Single retry** — retry a specific failed task
- **Batch retry** — retry all failed tasks
- **Modified retry** — edit parameters before retrying

## Archived Tasks

Completed tasks can be archived:
- **Archive** — move out of the active task list
- **Unarchive** — restore to active list
- **Search archived** — still searchable
- **Auto-archive** — configurable threshold

## Priority Levels

| Level | Color | Description |
|-------|-------|-------------|
| Low | Muted | Optional improvements |
| Medium | Blue | Normal priority |
| High | Amber | Important, should be done soon |
| Critical | Red | Must be done immediately |

## Scheduled Execution

Tasks can be scheduled to run at specific times:
- **One-shot** — run at a specific date/time
- **Recurring** — run on a schedule (cron expression)
- **Delay** — run after a delay
- **Chained** — run after another task completes
