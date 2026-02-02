# Phase 4: Terminal Interaction Implementation - Detailed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement SUMM main agent terminal with xterm.js, WebSocket communication, and decision detection.

**Architecture:** WebSocket client using xterm.js for terminal rendering, bidirectional communication with backend.

**Tech Stack:** xterm.js, xterm-addon-fit, WebSocket API, React hooks, TypeScript

---

## Task 1: useTerminal Hook

**Files:**
- Create: `src/client/hooks/useTerminal.ts`

**Step 1: Create useTerminal hook**

Create: `src/client/hooks/useTerminal.ts`

```typescript
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
    const wsUrl = sessionId
      ? `ws://localhost:3000/ws/terminal/session/${sessionId}`
      : `ws://localhost:3000/ws/terminal/summ`

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
        }, 3000)
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
```

**Step 2: Install xterm CSS**

Add to `src/client/styles/global.css`:

```css
/* xterm.js overrides */
.xterm {
  padding: 8px;
}

.xterm .xterm-viewport {
  overflow-y: auto;
}
```

**Step 3: Commit**

```bash
git add src/client/hooks/useTerminal.ts src/client/styles/global.css
git commit -m "feat: add useTerminal hook with WebSocket

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: ChatPanel Component

**Files:**
- Create: `src/client/components/ChatPanel.tsx`
- Create: `src/client/components/ChatPanel.module.css`

**Step 1: Create ChatPanel styles**

Create: `src/client/components/ChatPanel.module.css`

```css
.chatContainer {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.terminalContainer {
  flex: 1;
  overflow: hidden;
  background: #000;
}

.statusBar {
  display: flex;
  alignItems: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  font-size: 11px;
}

.statusLeft {
  display: flex;
  alignItems: center;
  gap: var(--spacing-sm);
}

.connectionStatus {
  display: flex;
  alignItems: center;
  gap: 4px;
}

.connectionDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.connectionDot.connected {
  background: var(--color-accent-green);
}

.connectionDot.disconnected {
  background: var(--color-text-muted);
}

.decisionIndicator {
  display: flex;
  alignItems: center;
  gap: 4px;
  color: var(--color-accent-amber);
  animation: pulse 1s ease-in-out infinite;
}

.decisionDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent-amber);
  animation: blink 1s step-end infinite;
}

.reconnecting {
  color: var(--color-accent-amber);
}
```

**Step 2: Create ChatPanel component**

Create: `src/client/components/ChatPanel.tsx`

```typescript
import React from 'react'
import { useTerminal } from '../hooks/useTerminal.js'
import styles from './ChatPanel.module.css'
import { Panel } from './layout/Panel.js'

export const ChatPanel: React.FC = () => {
  const { containerRef, connected, needsDecision } = useTerminal()

  return (
    <Panel title="SUMM Chat" variant="secondary" compact>
      <div className={styles.chatContainer}>
        <div ref={containerRef} className={styles.terminalContainer} />
        <div className={styles.statusBar}>
          <div className={styles.statusLeft}>
            <div className={styles.connectionStatus}>
              <span
                className={`${styles.connectionDot} ${connected ? styles.connected : styles.disconnected}`}
              />
              <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {needsDecision && (
              <div className={styles.decisionIndicator}>
                <span className={styles.decisionDot} />
                <span>Decision Needed</span>
              </div>
            )}
          </div>
          <div>SUMM Main</div>
        </div>
      </div>
    </Panel>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/ChatPanel.tsx src/client/components/ChatPanel.module.css
git commit -m "feat: add ChatPanel component with xterm terminal

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update App with ChatPanel

**Files:**
- Modify: `src/client/App.tsx`

**Step 1: Import and use ChatPanel**

Edit: `src/client/App.tsx`

Add import:
```typescript
import { ChatPanel } from './components/ChatPanel.js'
```

Add to MainGrid:
```typescript
<ChatPanel />
```

**Step 2: Commit**

```bash
git add src/client/App.tsx
git commit -m "feat: integrate ChatPanel into App

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: SessionTerminalModal Component

**Files:**
- Create: `src/client/components/modals/SessionTerminalModal.tsx`
- Create: `src/client/components/modals/SessionTerminalModal.module.css`

**Step 1: Create modal styles**

Create: `src/client/components/modals/SessionTerminalModal.module.css`

```css
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  alignItems: center;
  justifyContent: center;
  z-index: 1000;
}

.modalContainer {
  width: 90vw;
  height: 80vh;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modalHeader {
  display: flex;
  alignItems: center;
  justifyContent: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.modalTitle {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--color-accent-cyan);
}

.modalActions {
  display: flex;
  gap: var(--spacing-sm);
}

.modalClose {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--transition-fast);
}

.modalClose:hover {
  border-color: var(--color-accent-magenta);
  color: var(--color-accent-magenta);
}

.modalBody {
  flex: 1;
  overflow: hidden;
  background: #000;
}

.modalFooter {
  display: flex;
  alignItems: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  font-size: 11px;
  color: var(--color-text-muted);
}
```

**Step 2: Create SessionTerminalModal component**

Create: `src/client/components/modals/SessionTerminalModal.tsx`

```typescript
import React from 'react'
import { useTerminal } from '../../hooks/useTerminal.js'
import styles from './SessionTerminalModal.module.css'

interface SessionTerminalModalProps {
  sessionId: string
  sessionName: string
  onClose: () => void
}

export const SessionTerminalModal: React.FC<SessionTerminalModalProps> = ({
  sessionId,
  sessionName,
  onClose
}) => {
  const { containerRef, connected } = useTerminal({ sessionId })

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{sessionName}</h2>
          <div className={styles.modalActions}>
            <button className={styles.modalClose} onClick={onClose}>
              Close (Terminal stays connected)
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        <div className={styles.modalFooter}>
          <span>Session ID: {sessionId}</span>
          <span>{connected ? '● Connected' : '○ Disconnected'}</span>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/modals/SessionTerminalModal.tsx src/client/components/modals/SessionTerminalModal.module.css
git commit -m "feat: add SessionTerminalModal component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Decision Detection on Backend

**Files:**
- Modify: `src/server/ws/terminal.ts`

**Step 1: Add decision detection**

Edit: `src/server/ws/terminal.ts` (update handleTerminalConnection function)

Add decision detection patterns:

```typescript
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

// Update stdout handler to check for decisions
proc.stdout.on('data', (data: Buffer) => {
  if (ws.readyState === WebSocket.OPEN) {
    const output = data.toString('utf-8')
    ws.send(JSON.stringify({
      type: 'output',
      data: output
    }))

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
```

**Step 2: Commit**

```bash
git add src/server/ws/terminal.ts
git commit -m "feat: add decision detection to terminal proxy

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Final Testing

**Files:** None (testing)

**Step 1: Test terminal connection**

Run both servers:
```bash
npm run dev
```

Expected:
- ChatPanel shows connected status
- Terminal displays SUMM output
- Can type and send commands

**Step 2: Test decision detection**

Trigger a decision prompt in SUMM.

Expected:
- "Decision Needed" indicator appears with animation

**Step 3: Test session terminal**

Will be completed in Phase 5 with SessionsPanel integration.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: Phase 4 complete - terminal interaction finished

useTerminal hook complete
ChatPanel with xterm.js complete
SessionTerminalModal complete
Decision detection implemented
WebSocket communication stable

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 4 Completion Criteria

- [x] useTerminal hook manages WebSocket connection
- [x] xterm.js terminal renders in ChatPanel
- [x] Bidirectional communication works
- [x] Decision detection shows indicator
- [x] Auto-reconnect on disconnect
- [x] Terminal resize on window resize
- [x] SessionTerminalModal ready for Phase 5
- [x] No TypeScript errors

---

**Next:** Phase 5 - Session Management Implementation
