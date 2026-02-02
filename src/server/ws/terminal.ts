import { WebSocket } from 'ws'
import { attachSession, attachSummMain } from '../daemon.js'

interface WSMessage {
  type: 'input' | 'resize'
  data?: string
  cols?: number
  rows?: number
}

interface TerminalConnection {
  ws: WebSocket
  process: any
  sessionId?: string
}

const connections = new Set<TerminalConnection>()

export function handleTerminalConnection(ws: WebSocket, sessionId?: string) {
  let proc: any

  try {
    // Attach to SUMM or specific session
    proc = sessionId ? attachSession(sessionId) : attachSummMain()

    const connection: TerminalConnection = { ws, process: proc, sessionId }
    connections.add(connection)

    // Send initial status
    ws.send(JSON.stringify({
      type: 'status',
      connected: true,
      needsDecision: false
    }))

    // Forward stdout to WebSocket
    proc.stdout.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: data.toString('utf-8')
        }))
      }
    })

    // Forward stderr to WebSocket
    proc.stderr.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: data.toString('utf-8')
        }))
      }
    })

    // Handle incoming messages
    ws.on('message', (message: string) => {
      try {
        const msg: WSMessage = JSON.parse(message.toString())

        if (msg.type === 'input' && msg.data) {
          proc.stdin.write(msg.data + '\n')
        } else if (msg.type === 'resize' && msg.cols && msg.rows) {
          // Resize handling (for tmux integration)
          // This is handled at the process level
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err)
      }
    })

    // Handle close - don't terminate the process
    ws.on('close', () => {
      connections.delete(connection)
      // Don't kill the process - daemon manages lifecycle
    })

    // Handle process exit
    proc.on('close', () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'status',
          connected: false,
          needsDecision: false
        }))
      }
    })

  } catch (err) {
    ws.send(JSON.stringify({
      type: 'status',
      connected: false,
      needsDecision: false,
      error: 'Failed to connect to terminal'
    }))
    ws.close()
  }
}

export function closeAllConnections() {
  for (const conn of connections) {
    conn.ws.close()
  }
  connections.clear()
}
