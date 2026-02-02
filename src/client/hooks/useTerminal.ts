import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'

interface TerminalOptions {
  sessionId?: string
  onDecisionNeeded?: (needed: boolean) => void
}

interface TerminalMessage {
  type: 'input' | 'output' | 'resize' | 'status'
  data?: string
  cols?: number
  rows?: number
  connected?: boolean
  needsDecision?: boolean
}

export function useTerminal(options: TerminalOptions = {}) {
  const { sessionId, onDecisionNeeded } = options

  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const [connected, setConnected] = useState(false)
  const [needsDecision, setNeedsDecision] = useState(false)
  const reconnectTimeoutRef = useRef<number>()

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: '#0a0a12',
        foreground: '#e0e0e8',
        cursor: '#00fff9',
        selection: 'rgba(0, 255, 249, 0.3)',
        black: '#1a1a24',
        red: '#ff00ff',
        green: '#00ff88',
        yellow: '#ffb800',
        blue: '#00fff9',
        magenta: '#ff00ff',
        cyan: '#00fff9',
        white: '#e0e0e8'
      }
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminal.open(containerRef.current)
    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    // Handle user input
    terminal.onData(data => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'input',
          data
        } as TerminalMessage))
      }
    })

    return () => {
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  // Connect WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const port = import.meta.env.DEV ? '3000' : window.location.port
    const wsUrl = sessionId
      ? `${protocol}//${host}:${port}/ws/terminal/session/${sessionId}`
      : `${protocol}//${host}:${port}/ws/terminal/summ`

    const connect = () => {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setNeedsDecision(false)
      }

      ws.onmessage = (event) => {
        try {
          const msg: TerminalMessage = JSON.parse(event.data)

          if (msg.type === 'output' && msg.data) {
            terminalRef.current?.write(msg.data)
          } else if (msg.type === 'status') {
            setConnected(msg.connected ?? false)
            if (msg.needsDecision !== undefined) {
              setNeedsDecision(msg.needsDecision)
              onDecisionNeeded?.(msg.needsDecision)
            }
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        setNeedsDecision(false)
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect()
        }, 3000) as unknown as number
      }

      ws.onerror = () => {
        // Error will trigger onclose
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [sessionId, onDecisionNeeded])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      fitAddonRef.current?.fit()
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const dims = fitAddonRef.current?.terminal
        wsRef.current.send(JSON.stringify({
          type: 'resize',
          cols: dims?.cols || 80,
          rows: dims?.rows || 24
        } as TerminalMessage))
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Write data to terminal
  const write = useCallback((data: string) => {
    terminalRef.current?.write(data)
  }, [])

  // Clear terminal
  const clear = useCallback(() => {
    terminalRef.current?.clear()
  }, [])

  return {
    containerRef,
    connected,
    needsDecision,
    write,
    clear
  }
}
