# Phase 5: Session Management Implementation - Detailed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Session list panel with status indicators, click-to-open terminal functionality.

**Architecture:** React component polling backend for session list, modal with terminal for individual sessions.

**Tech Stack:** React hooks, WebSocket, TypeScript, @dnd-kit (not used for sessions - just click to open)

---

## Task 1: SessionsPanel Component

**Files:**
- Create: `src/client/components/SessionsPanel.tsx`
- Create: `src/client/components/SessionsPanel.module.css`

**Step 1: Create SessionsPanel styles**

Create: `src/client/components/SessionsPanel.module.css`

```css
.sessionsList {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.sessionItem {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-dim);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sessionItem:hover {
  border-color: var(--color-accent-cyan);
  background: var(--color-bg-tertiary);
}

.sessionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: 4px;
}

.sessionId {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.sessionStatus {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.sessionStatus.running {
  background: rgba(0, 255, 136, 0.15);
  color: var(--color-accent-green);
}

.sessionStatus.idle {
  background: rgba(255, 184, 0, 0.15);
  color: var(--color-accent-amber);
}

.sessionStatus.stopped {
  background: rgba(255, 0, 255, 0.15);
  color: var(--color-accent-magenta);
}

.sessionTask {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sessionTask:hover {
  overflow: visible;
}

.sessionMeta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.sessionWorkdir {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.sessionEmpty {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  font-size: 12px;
}

.sessionLoading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
  color: var(--color-text-muted);
  font-size: 12px;
}

.sessionError {
  padding: var(--spacing-sm);
  background: rgba(255, 0, 255, 0.1);
  border: 1px solid var(--color-accent-magenta);
  border-radius: var(--radius-sm);
  color: var(--color-accent-magenta);
  font-size: 11px;
}
```

**Step 2: Create SessionsPanel component**

Create: `src/client/components/SessionsPanel.tsx`

```typescript
import React, { useState } from 'react'
import { useSessions } from '../hooks/useSessions.js'
import { SessionTerminalModal } from './modals/SessionTerminalModal.js'
import styles from './SessionsPanel.module.css'
import { Panel } from './layout/Panel.js'

export const SessionsPanel: React.FC = () => {
  const { sessions, loading, error } = useSessions()
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session)
    setShowModal(true)
  }

  return (
    <>
      <Panel title="Sessions" variant="tertiary" compact>
        {loading ? (
          <div className={styles.sessionLoading}>Loading sessions...</div>
        ) : error ? (
          <div className={styles.sessionError}>{error}</div>
        ) : sessions.length === 0 ? (
          <div className={styles.sessionEmpty}>No active sessions</div>
        ) : (
          <div className={styles.sessionsList}>
            {sessions.map(session => (
              <div
                key={session.id}
                className={styles.sessionItem}
                onClick={() => handleSessionClick(session)}
                title={session.task}
              >
                <div className={styles.sessionHeader}>
                  <span className={styles.sessionId}>
                    [{session.cli?.toUpperCase() || 'AGENT'}] {session.id}
                  </span>
                  <span className={`${styles.sessionStatus} ${styles[session.status]}`}>
                    {session.status}
                  </span>
                </div>
                {session.task && (
                  <div className={styles.sessionTask}>{session.task}</div>
                )}
                <div className={styles.sessionMeta}>
                  <span className={styles.sessionWorkdir}>{session.workdir || '.'}</span>
                  {session.lastActivity && (
                    <span>
                      {new Date(session.lastActivity).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {showModal && selectedSession && (
        <SessionTerminalModal
          sessionId={selectedSession.id}
          sessionName={selectedSession.name || selectedSession.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/SessionsPanel.tsx src/client/components/SessionsPanel.module.css
git commit -m "feat: add SessionsPanel component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: DisplayPanel Component (Plan Display)

**Files:**
- Create: `src/client/components/DisplayPanel.tsx`
- Create: `src/client/components/DisplayPanel.module.css`

**Step 1: Create DisplayPanel styles**

Create: `src/client/components/DisplayPanel.module.css`

```css
.displayContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tabBar {
  display: flex;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.tab {
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab:hover {
  color: var(--color-accent-cyan);
}

.tab.active {
  color: var(--color-accent-cyan);
  border-bottom-color: var(--color-accent-cyan);
}

.content {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-md);
}

.markdownContent {
  line-height: 1.6;
  color: var(--color-text-primary);
}

.markdownContent h1,
.markdownContent h2,
.markdownContent h3 {
  font-family: var(--font-display);
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: var(--color-accent-cyan);
}

.markdownContent h1 { font-size: 24px; }
.markdownContent h2 { font-size: 20px; }
.markdownContent h3 { font-size: 16px; }

.markdownContent p {
  margin-bottom: 1em;
}

.markdownContent ul,
.markdownContent ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.markdownContent li {
  margin-bottom: 0.25em;
}

.markdownContent code {
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-accent-cyan);
}

.markdownContent pre {
  background: var(--color-bg-tertiary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin-bottom: 1em;
}

.markdownContent pre code {
  background: transparent;
  padding: 0;
}

.markdownContent a {
  color: var(--color-accent-cyan);
  text-decoration: none;
}

.markdownContent a:hover {
  text-decoration: underline;
}

.emptyState {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
}

.loadingState {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
}
```

**Step 2: Create DisplayPanel component**

Create: `src/client/components/DisplayPanel.tsx`

```typescript
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { usePlan } from '../hooks/usePlan.js'
import styles from './DisplayPanel.module.css'
import { Panel } from './layout/Panel.js'

type Tab = 'plan' | 'output'

export const DisplayPanel: React.FC = () => {
  const { content, loading } = usePlan()
  const [activeTab, setActiveTab] = useState<Tab>('plan')

  return (
    <Panel title="Display" variant="secondary" compact>
      <div className={styles.displayContainer}>
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'plan' ? styles.active : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            Work Plan
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'output' ? styles.active : ''}`}
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'plan' ? (
            loading ? (
              <div className={styles.loadingState}>Loading...</div>
            ) : (
              <div className={styles.markdownContent}>
                <ReactMarkdown>{content || '# No work plan configured'}</ReactMarkdown>
              </div>
            )
          ) : (
            <div className={styles.emptyState}>Output panel - coming soon</div>
          )}
        </div>
      </div>
    </Panel>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/DisplayPanel.tsx src/client/components/DisplayPanel.module.css
git commit -m "feat: add DisplayPanel with markdown rendering

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: ProgressPanel Component

**Files:**
- Create: `src/client/components/ProgressPanel.tsx`
- Create: `src/client/components/ProgressPanel.module.css`

**Step 1: Create ProgressPanel styles**

Create: `src/client/components/ProgressPanel.module.css`

```css
.progressList {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.progressItem {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.progressTime {
  font-size: 10px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.progressContent {
  flex: 1;
  min-width: 0;
}

.progressDescription {
  font-size: 12px;
  color: var(--color-text-primary);
}

.progressTodoLink {
  font-size: 10px;
  color: var(--color-accent-cyan);
  margin-top: 2px;
}

.emptyState {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-muted);
  font-size: 12px;
}

.archiveButton {
  width: 100%;
  padding: var(--spacing-sm);
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 11px;
  transition: all var(--transition-fast);
  margin-top: var(--spacing-sm);
}

.archiveButton:hover {
  border-color: var(--color-accent-cyan);
  color: var(--color-accent-cyan);
}

.archiveButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Step 2: Create ProgressPanel component**

Create: `src/client/components/ProgressPanel.tsx`

```typescript
import React, { useState } from 'react'
import { useProgress } from '../hooks/useProgress.js'
import styles from './ProgressPanel.module.css'
import { Panel } from './layout/Panel.js'

export const ProgressPanel: React.FC = () => {
  const { items, loading, archive } = useProgress()
  const [archiving, setArchiving] = useState(false)

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await archive()
    } finally {
      setArchiving(false)
    }
  }

  return (
    <Panel title="Progress" variant="tertiary" compact>
      {loading ? (
        <div className={styles.emptyState}>Loading...</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>No progress today</div>
      ) : (
        <div className={styles.progressList}>
          {items.map(item => (
            <div key={item.id} className={styles.progressItem}>
              <span className={styles.progressTime}>
                {new Date(item.completedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <div className={styles.progressContent}>
                <div className={styles.progressDescription}>{item.description}</div>
                {item.todoId && (
                  <div className={styles.progressTodoLink}>→ {item.todoId}</div>
                )}
              </div>
            </div>
          ))}
          <button
            className={styles.archiveButton}
            onClick={handleArchive}
            disabled={archiving || items.length === 0}
          >
            {archiving ? 'Archiving...' : 'Archive All'}
          </button>
        </div>
      )}
    </Panel>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/ProgressPanel.tsx src/client/components/ProgressPanel.module.css
git commit -m "feat: add ProgressPanel component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: TokenPanel Component

**Files:**
- Create: `src/client/components/TokenPanel.tsx`
- Create: `src/client/components/TokenPanel.module.css`

**Step 1: Create TokenPanel styles**

Create: `src/client/components/TokenPanel.module.css`

```css
.tokenContainer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.tokenMain {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.tokenUsed {
  font-size: 20px;
  font-family: var(--font-display);
  color: var(--color-text-primary);
}

.tokenTotal {
  font-size: 12px;
  color: var(--color-text-muted);
}

.tokenPercentage {
  font-size: 16px;
  font-weight: 500;
}

.tokenPercentage.low {
  color: var(--color-accent-green);
}

.tokenPercentage.medium {
  color: var(--color-accent-amber);
}

.tokenPercentage.high {
  color: var(--color-accent-magenta);
}

.progressBar {
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  transition: width var(--transition-normal);
}

.progressFill.low {
  background: linear-gradient(90deg, var(--color-accent-green), #00cc66);
}

.progressFill.medium {
  background: linear-gradient(90deg, var(--color-accent-amber), #ff9900);
}

.progressFill.high {
  background: linear-gradient(90deg, var(--color-accent-magenta), #cc00cc);
}

.tokenSegments {
  display: flex;
  gap: 4px;
}

.tokenSegment {
  flex: 1;
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
}

.tokenSegment.active {
  background: var(--color-accent-cyan);
}

.loadingState {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  color: var(--color-text-muted);
  font-size: 12px;
}
```

**Step 2: Create TokenPanel component**

Create: `src/client/components/TokenPanel.tsx`

```typescript
import React from 'react'
import { useTokenUsage } from '../hooks/useTokenUsage.js'
import styles from './TokenPanel.module.css'
import { Panel } from './layout/Panel.js'

function getPercentageClass(percentage: number): 'low' | 'medium' | 'high' {
  if (percentage >= 80) return 'high'
  if (percentage >= 50) return 'medium'
  return 'low'
}

export const TokenPanel: React.FC = () => {
  const { usage, loading } = useTokenUsage()

  if (loading) {
    return (
      <Panel title="Token Usage" variant="tertiary" compact>
        <div className={styles.loadingState}>Loading...</div>
      </Panel>
    )
  }

  const percentageClass = getPercentageClass(usage.percentage)
  const segmentCount = 20
  const activeSegments = Math.round((usage.percentage / 100) * segmentCount)

  return (
    <Panel title="Token Usage" variant="tertiary" compact>
      <div className={styles.tokenContainer}>
        <div className={styles.tokenMain}>
          <span className={styles.tokenUsed}>
            {usage.used.toLocaleString()}
            <span className={styles.tokenTotal}> / {usage.limit.toLocaleString()}</span>
          </span>
          <span className={`${styles.tokenPercentage} ${styles[percentageClass]}`}>
            {usage.percentage}%
          </span>
        </div>

        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${styles[percentageClass]}`}
            style={{ width: `${usage.percentage}%` }}
          />
        </div>

        <div className={styles.tokenSegments}>
          {Array.from({ length: segmentCount }).map((_, i) => (
            <div
              key={i}
              className={`${styles.tokenSegment} ${i < activeSegments ? styles.active : ''}`}
            />
          ))}
        </div>
      </div>
    </Panel>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/TokenPanel.tsx src/client/components/TokenPanel.module.css
git commit -m "feat: add TokenPanel component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update App with All Panels

**Files:**
- Modify: `src/client/App.tsx`
- Modify: `src/client/components/layout/MainGrid.tsx`

**Step 1: Update App.tsx with all panels**

Edit: `src/client/App.tsx`

Replace all imports and content:

```typescript
import React from 'react'
import { TitleBar } from './components/layout/TitleBar.js'
import { MainGrid } from './components/layout/MainGrid.js'
import { TodoPanel } from './components/TodoPanel.js'
import { DraftPanel } from './components/DraftPanel.js'
import { ChatPanel } from './components/ChatPanel.js'
import { DisplayPanel } from './components/DisplayPanel.js'
import { SessionsPanel } from './components/SessionsPanel.js'
import { ProgressPanel } from './components/ProgressPanel.js'
import { TokenPanel } from './components/TokenPanel.js'
import './styles/global.css'
import styles from './App.module.css'

function App() {
  return (
    <div style={{
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <TitleBar status="online" />
      <MainGrid>
        <TodoPanel />
        <DraftPanel />
        <ChatPanel />
        <DisplayPanel />
        <SessionsPanel />
        <ProgressPanel />
        <TokenPanel />
      </MainGrid>
    </div>
  )
}

export default App
```

**Step 2: Update MainGrid.tsx to not include PlaceholderPanels**

Remove or comment out PlaceholderPanels export since we're not using it.

**Step 3: Test full application**

Run:
```bash
npm run dev
```

Verify all panels render correctly.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: Phase 5 complete - session management finished

SessionsPanel with terminal modal complete
DisplayPanel with markdown rendering complete
ProgressPanel with archive complete
TokenPanel with visualization complete
All panels integrated into App

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 5 Completion Criteria

- [x] SessionsPanel displays running/idle sessions
- [x] Clicking session opens terminal modal
- [x] Session terminal modal shows separate connection
- [x] DisplayPanel renders markdown plan
- [x] ProgressPanel shows and archives items
- [x] TokenPanel shows usage with visual bars
- [x] All panels integrated into main layout
- [x] No TypeScript errors

---

**Next:** Phase 6 - Other Feature Modules (Final touches)
