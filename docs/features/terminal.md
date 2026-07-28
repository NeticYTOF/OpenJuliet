# Terminal

OpenJuliet includes a fully integrated terminal emulator powered by **xterm.js**.

## Features

### Core
- **Full terminal emulation** using xterm.js
- **ANSI color support** for colored command output
- **Command history** with arrow up/down navigation
- **Multiple terminal sessions** (one per task)
- **Collapse/expand** toggle for compact view
- **Copy output** button to clipboard
- **Clear terminal** button

### Connection Status
- **Connected indicator**: green dot + "Connected" label
- **Disconnected state**: input disabled, placeholder text
- **Auto-reconnect** when execution starts

### Output Styling
Each line can have a type that determines its color:
- `input` — accent color (user commands)
- `output` — default text color
- `error` — red color
- `info` — blue color
- `system` — muted gray

### Custom Prompt
The terminal prompt is configurable via settings. Default: `$ `

## Architecture

```
Terminal component
├── Header (title, status, controls)
├── XtermTerminal (xterm.js instance)
│   ├── Input handling (keyboard events)
│   ├── Output display (ANSI-rendered text)
│   └── Command history (in-memory stack)
└── Control buttons (copy, clear, collapse)
```

## Integration with Execution Engine

The terminal connects to the execution engine to stream real-time command output:

1. User clicks Execute → task starts in execution engine
2. Engine spawns child_process or Docker container
3. stdout/stderr piped to terminal via IPC events (`execution:log`)
4. Terminal displays output in real-time with ANSI coloring
5. User can type commands in the terminal to interact with the running process

## Usage

```typescript
import { Terminal } from './components/editor/Terminal'

<Terminal
  output={[
    { id: '1', text: '$ npm run build', type: 'input' },
    { id: '2', text: 'Building project...', type: 'output' },
    { id: '3', text: 'Build successful!', type: 'success' }
  ]}
  title="Build Output"
  connected={true}
  onCommand={(cmd) => handleCommand(cmd)}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| output | TerminalLine[] | [] | Array of lines to display |
| title | string | "Terminal" | Terminal panel title |
| connected | boolean | false | Connection status |
| onCommand | (cmd: string) => void | — | Callback when user enters a command |
| className | string | '' | Additional CSS classes |
