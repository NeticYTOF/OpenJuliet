import { useEffect, useRef } from 'react'

export interface XtermWrapperProps {
  /** Called when the user submits a command in the xterm input */
  onCommand?: (command: string) => void
  /** Whether the terminal is connected/active */
  connected?: boolean
}

/**
 * XtermWrapper — Renders a real xterm.js terminal.
 *
 * xterm.js and its addons are dynamically imported (code-split) when this
 * component mounts, i.e. only when the terminal panel is opened.
 */
export function XtermWrapper({
  onCommand,
  connected = true
}: XtermWrapperProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return
    initializedRef.current = true

    let term: import('@xterm/xterm').Terminal | null = null
    let fitAddon: import('@xterm/addon-fit').FitAddon | null = null

    async function init(): Promise<void> {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
      ])

      if (!containerRef.current) return

      fitAddon = new FitAddon()
      term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        theme: {
          background: '#1e1e2e',
          foreground: '#cdd6f4',
          cursor: '#f5e0dc',
          selectionBackground: '#585b7066',
          black: '#45475a',
          red: '#f38ba8',
          green: '#a6e3a1',
          yellow: '#f9e2af',
          blue: '#89b4fa',
          magenta: '#f5c2e7',
          cyan: '#94e2d5',
          white: '#bac2de',
          brightBlack: '#585b70',
          brightRed: '#f38ba8',
          brightGreen: '#a6e3a1',
          brightYellow: '#f9e2af',
          brightBlue: '#89b4fa',
          brightMagenta: '#f5c2e7',
          brightCyan: '#94e2d5',
          brightWhite: '#a6adc8',
        },
        allowTransparency: true,
      })

      term!.loadAddon(fitAddon)
      term!.open(containerRef.current!)
      fitAddon.fit()

      /* Write a welcome message */
      term!.writeln('\x1b[35mTerminal ready\x1b[0m — type a command to start\r\n')

      /* Forward user input to the parent via onCommand */
      let currentLine = ''
      term!.onData((data: string) => {
        if (!connected) return

        if (data === '\r') {
          /* Enter */
          if (currentLine.trim()) {
            onCommand?.(currentLine.trim())
          }
          term!.writeln('')
          currentLine = ''
          term!.write(`\r\n$ `)
        } else if (data === '\x7f') {
          /* Backspace */
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1)
            term!.write('\b \b')
          }
        } else if (data >= ' ' && data !== '\x1b') {
          /* Printable characters */
          currentLine += data
          term!.write(data)
        }
      })

      /* Show prompt */
      term!.write('$ ')
    }

    init().catch(console.error)

    /* Resize handler */
    const onResize = (): void => {
      try {
        fitAddon?.fit()
      } catch {
        /* element may be gone */
      }
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      term?.dispose()
      term = null
      fitAddon = null
    }
  }, [onCommand, connected])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{ background: '#1e1e2e' }}
    />
  )
}

export default XtermWrapper
