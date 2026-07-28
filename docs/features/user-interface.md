# User Interface

OpenJuliet features a premium dark-themed UI inspired by the Nous Research Portal design language.

## Navigation

### Sidebar
The main navigation sidebar provides access to 7 views:

| # | View | Shortcut | Description |
|---|------|----------|-------------|
| 1 | **Dashboard** | ⌘1 | Home screen with stats, activity, quick actions |
| 2 | **Repositories** | ⌘2 | GitHub repo browser and management |
| 3 | **Issues** | ⌘3 | GitHub issue browser |
| 4 | **Tasks** | ⌘4 | Task queue and execution management |
| 5 | **History** | ⌘5 | Execution history and activity feed |
| 6 | **Editor** | ⌘6 | Code editor workspace |
| 7 | **Settings** | ⌘7 | App configuration |

- **Collapsible** — toggle with ⌘B or the arrow button
- **Active indicator** — highlighted item with accent bar
- **Animated** — smooth expand/collapse transition

### Titlebar
Custom frameless titlebar with:
- App icon + name
- Current view name
- Window controls (minimize, maximize, close)
- Notification bell with unread count badge
- Theme toggle (dark/light/system)
- Draggable region

### StatusBar
Bottom bar showing:
- Current view name
- Active workspace directory
- GitHub connection status (with animated dot)
- App version

## Dashboard

The welcome/home screen features:
- **Stat cards** — repositories count, tasks completed, uptime, active tasks
- **Quick actions** — Clone Repository, New Task, Open Settings, Run Demo
- **Recent activity** — timeline of recent events
- **System status** — provider status, workspace info, memory usage
- **GitHub connection** — connected/disconnected status

## Command Palette

Triggered with ⌘K — a powerful search and command interface:
- **Fuzzy search** across all navigation items and actions
- **Sections**: Navigation, Actions, Recent
- **Keyboard navigation**: arrow keys, Enter to select
- **Keyboard shortcuts** shown for each item
- **Recent items** — shows recently accessed views
- **Animated** modal with backdrop blur

## Splash Screen

Animated launch screen shown on first startup:
- Logo animation (scale + rotate + glow)
- Cycling loading tips
- Version number display
- Particle/star background
- Auto-transitions to main app

## Welcome Screen

4-step onboarding wizard presented on first launch:
1. **Welcome** — app introduction
2. **Connect GitHub** — OAuth or PAT setup
3. **Choose Workspace** — select working directory
4. **Configure AI** — choose and set up an AI provider

## Notification Center

Bell icon in the titlebar opens a dropdown panel:
- **Notification types**: execution complete, PR created, error, update available
- **Grouped by time**: Today, Yesterday, This Week, Earlier
- **Mark as read / Mark all read**
- **Clear all** button
- **Badge count** on bell icon
- **Animated** panel with backdrop blur

## Toast Notifications

Temporary notifications that appear at the bottom-right:
- **Auto-dismiss** after configurable duration
- **Types**: success (green), warning (amber), error (red), info (blue)
- **Close button** for manual dismiss
- **Animated** enter/exit (slide + fade)

## Theme

### Dark/Light/System
- **Dark mode** — deep blacks and purples (#0a0a0f background, #6c5ce7 accent)
- **Light mode** — clean whites and light grays
- **System** — follows OS preference

### Accent Color Customization
- Preset colors: Purple (default), Blue, Green, Amber, Red, Pink, Cyan
- Custom hex color picker
- Applied in real-time to all UI elements

### Background Density
- Slider from 0-100%
- Controls backdrop blur intensity on glassmorphic elements
- Lower values = more transparent glass effect

### Animation Speed
- Normal (default)
- Reduced (slower animations)
- None (no animations, for accessibility)

## Responsive Layout

- **Sidebar auto-collapses** on narrow windows (<768px)
- **Stat cards** adjust from 4-column to 2-column to 1-column
- **Titlebar** condenses controls on small screens
- **StatusBar** hides less important info on small screens
- **Settings tabs** go vertical on small screens

## Animations

Powered by **framer-motion**:
- **Page transitions** — smooth opacity + slide between views
- **Sidebar collapse** — spring-based animation
- **Button hover** — subtle lift + scale
- **Card hover** — border glow effect
- **List items** — staggered entrance animations
- **Modals** — scale + fade with backdrop blur
- **Loading states** — shimmer skeleton animations
- **Status indicators** — pulse animation on live dots
