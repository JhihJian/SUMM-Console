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
  lastOutput?: string[]
}

const connections = new Set<TerminalConnection>()

// Decision detection patterns
const DECISION_PATTERNS = [
  /Do you want to/i,
  /Should I/i,
  /Continue\?/i,
  /Proceed\?/i,
  /Confirm/i,
  /Allow/i,
  /Approve/i
]

function detectDecision(output: string): boolean {
  const lines = output.split('\n').slice(-5) // Check last 5 lines
  return DECISION_PATTERNS.some(pattern =>
    lines.some(line => pattern.test(line))
  )
}

export function handleTerminalConnection(ws: WebSocket, sessionId?: string) {
  let proc: any
  const outputBuffer: string[] = []

  try {
    // Attach to SUMM or specific session
    proc = sessionId ? attachSession(sessionId) : attachSummMain()

    const connection: TerminalConnection = { ws, process: proc, sessionId, lastOutput: outputBuffer }
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
        const output = data.toString('utf-8')
        ws.send(JSON.stringify({
          type: 'output',
          data: output
        }))

        // Track output for decision detection
        outputBuffer.push(...output.split('\n'))
        if (outputBuffer.length > 10) {
          outputBuffer.splice(0, outputBuffer.length - 10)
        }

        // Check if decision is needed
        if (detectDecision(output)) {
          ws.send(JSON.stringify({
            type: 'status',
            connected: true,
            needsDecision: true
          }))
        }
      }
    })

    // Forward stderr to WebSocket
    proc.stderr.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        const output = data.toString('utf-8')
        ws.send(JSON.stringify({
          type: 'output',
          data: output
        }))

        // Track output for decision detection
        outputBuffer.push(...output.split('\n'))
        if (outputBuffer.length > 10) {
          outputBuffer.splice(0, outputBuffer.length - 10)
        }

        // Check if decision is needed
        if (detectDecision(output)) {
          ws.send(JSON.stringify({
            type: 'status',
            connected: true,
            needsDecision: true
          }))
        }
      }
    })

    // Handle incoming messages
    ws.on('message', (message: string) => {
      try {
        const msg: WSMessage = JSON.parse(message.toString())

        if (msg.type === 'input' && msg.data) {
          proc.stdin.write(msg.data)
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
