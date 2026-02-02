# Phase 2: Frontend Basic Framework - Detailed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the React application infrastructure with layout system, API client, base styles, and component structure.

**Architecture:** React 18 with hooks-based state management, CSS Modules for styling, REST API + WebSocket for data.

**Tech Stack:** React 18, TypeScript, Vite, xterm.js, @dnd-kit, react-markdown, CSS Modules

---

## Task 1: Global Styles - CSS Variables

**Files:**
- Create: `src/client/styles/variables.css`

**Step 1: Create CSS variables file**

Create: `src/client/styles/variables.css`

```css
:root {
  /* Colors */
  --color-bg-primary: #0a0a12;
  --color-bg-secondary: #12121a;
  --color-bg-tertiary: #1a1a24;
  --color-bg-panel: #14141c;

  --color-text-primary: #e0e0e8;
  --color-text-secondary: #a0a0a8;
  --color-text-muted: #606068;

  --color-accent-cyan: #00fff9;
  --color-accent-magenta: #ff00ff;
  --color-accent-amber: #ffb800;
  --color-accent-green: #00ff88;

  --color-border: #2a2a32;
  --color-border-dim: #1a1a22;

  /* Fonts */
  --font-display: 'VT323', monospace;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

**Step 2: Commit**

```bash
git add src/client/styles/variables.css
git commit -m "feat: add CSS variables for theming

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Global Styles - Base Styles

**Files:**
- Create: `src/client/styles/global.css`

**Step 1: Create global CSS file**

Create: `src/client/styles/global.css`

```css
@import './variables.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  font-family: var(--font-mono);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-cyan);
}

/* Selection */
::selection {
  background: var(--color-accent-cyan);
  color: var(--color-bg-primary);
}

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--color-accent-cyan);
  outline-offset: 2px;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-blink {
  animation: blink 1s step-end infinite;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

/* Scanline overlay effect */
.scanlines::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 1000;
}
```

**Step 2: Commit**

```bash
git add src/client/styles/global.css
git commit -m "feat: add global styles with retro tech aesthetic

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: API Client Module

**Files:**
- Create: `src/client/api.ts`

**Step 1: Create API client**

Create: `src/client/api.ts`

```typescript
const API_BASE = '/api'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      success: false,
      error: data.error || `HTTP ${response.status}`
    }
  }

  return { success: true, data }
}

// TODO API
export const todoApi = {
  list: () => request<Todo[]>('/todos'),

  get: (id: string) => request<Todo>(`/todos/${id}`),

  create: (data: { title: string; progress?: number; statusDesc?: string; state?: string }) =>
    request<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id: string, data: Partial<Todo>) =>
    request<Todo>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id: string) =>
    request(`/todos/${id}`, { method: 'DELETE' }),

  archive: (id: string) =>
    request(`/todos/${id}/archive`, { method: 'POST' }),

  // File operations
  getFiles: (id: string) => request<TodoFile[]>(`/todos/${id}/files`),

  uploadFile: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return fetch(`${API_BASE}/todos/${id}/files`, {
      method: 'POST',
      body: formData
    }).then(res => res.json())
  },

  deleteFile: (id: string, fileId: string) =>
    request(`/todos/${id}/files/${fileId}`, { method: 'DELETE' })
}

// Draft API
export const draftApi = {
  get: () => request<{ content: string; updatedAt: string }>('/draft'),

  save: (content: string) =>
    request<{ content: string; updatedAt: string }>('/draft', {
      method: 'PUT',
      body: JSON.stringify({ content })
    })
}

// Progress API
export const progressApi = {
  get: () => request<ProgressItem[]>('/progress'),

  add: (description: string, todoId?: string) =>
    request<ProgressItem>('/progress', {
      method: 'POST',
      body: JSON.stringify({ description, todoId })
    }),

  archive: () =>
    request('/progress/archive', { method: 'POST' })
}

// Plan API
export const planApi = {
  get: () => request<{ content: string }>('/plan')
}

// Sessions API
export const sessionsApi = {
  list: (status?: 'running' | 'idle' | 'stopped') =>
    request<Session[]>(`/sessions${status ? `?status=${status}` : ''}`)
}

// Token Usage API
export const tokenApi = {
  get: () => request<TokenUsage>('/token-usage')
}

// Type imports for reference
import type { Todo, TodoFile, ProgressItem, Session, TokenUsage } from '../shared/types.js'
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 3: Commit**

```bash
git add src/client/api.ts
git commit -m "feat: add API client module

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Panel Component

**Files:**
- Create: `src/client/components/layout/Panel.tsx`
- Create: `src/client/components/layout/Panel.module.css`

**Step 1: Create Panel styles**

Create: `src/client/components/layout/Panel.module.css`

```css
.panel {
  background: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  min-height: 40px;
}

.panelTitle {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-accent-cyan);
}

.panelActions {
  display: flex;
  gap: var(--spacing-sm);
}

.panelBody {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-md);
}

/* Panel variants */
.panel.primary {
  border-color: var(--color-accent-cyan);
}

.panel.primary .panelTitle {
  color: var(--color-accent-cyan);
}

.panel.secondary {
  border-color: var(--color-accent-magenta);
}

.panel.secondary .panelTitle {
  color: var(--color-accent-magenta);
}

.panel.tertiary {
  border-color: var(--color-accent-amber);
}

.panel.tertiary .panelTitle {
  color: var(--color-accent-amber);
}

/* Compact variant */
.panel.compact .panelHeader {
  padding: var(--spacing-xs) var(--spacing-sm);
  min-height: 32px;
}

.panel.compact .panelTitle {
  font-size: 16px;
}

.panel.compact .panelBody {
  padding: var(--spacing-sm);
}
```

**Step 2: Create Panel component**

Create: `src/client/components/layout/Panel.tsx`

```typescript
import React from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title?: string
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary'
  compact?: boolean
  className?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export const Panel: React.FC<PanelProps> = ({
  title,
  variant = 'default',
  compact = false,
  className,
  children,
  actions
}) => {
  const panelClasses = [
    styles.panel,
    variant !== 'default' && styles[variant],
    compact && styles.compact,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={panelClasses}>
      {title && (
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{title}</h2>
          {actions && <div className={styles.panelActions}>{actions}</div>}
        </div>
      )}
      <div className={styles.panelBody}>
        {children}
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/layout/Panel.tsx src/client/components/layout/Panel.module.css
git commit -m "feat: add Panel layout component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: TitleBar Component

**Files:**
- Create: `src/client/components/layout/TitleBar.tsx`
- Create: `src/client/components/layout/TitleBar.module.css`

**Step 1: Create TitleBar styles**

Create: `src/client/components/layout/TitleBar.module.css`

```css
.titleBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  height: 48px;
}

.titleBarLeft {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.titleBarTitle {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-accent-cyan);
}

.titleBarSubtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.titleBarRight {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.statusIndicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.statusDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent-green);
}

.statusDot.warning {
  background: var(--color-accent-amber);
}

.statusDot.error {
  background: var(--color-accent-magenta);
}

.statusDot.offline {
  background: var(--color-text-muted);
}
```

**Step 2: Create TitleBar component**

Create: `src/client/components/layout/TitleBar.tsx`

```typescript
import React from 'react'
import styles from './TitleBar.module.css'

interface TitleBarProps {
  status?: 'online' | 'warning' | 'error' | 'offline'
}

export const TitleBar: React.FC<TitleBarProps> = ({ status = 'online' }) => {
  return (
    <header className={styles.titleBar}>
      <div className={styles.titleBarLeft}>
        <h1 className={styles.titleBarTitle}>SUMM Console</h1>
        <span className={styles.titleBarSubtitle}>v0.1.0</span>
      </div>
      <div className={styles.titleBarRight}>
        <div className={styles.statusIndicator}>
          <span className={`${styles.statusDot} ${styles[status]}`} />
          <span>{status.toUpperCase()}</span>
        </div>
      </div>
    </header>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/layout/TitleBar.tsx src/client/components/layout/TitleBar.module.css
git commit -m "feat: add TitleBar component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: MainGrid Component

**Files:**
- Create: `src/client/components/layout/MainGrid.tsx`
- Create: `src/client/components/layout/MainGrid.module.css`

**Step 1: Create MainGrid styles**

Create: `src/client/components/layout/MainGrid.module.css`

```css
.mainGrid {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  grid-template-rows: auto 1fr 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  height: calc(100vh - 48px);
  overflow: hidden;
}

/* Column 1: TODO (top) + Draft (bottom) */
.todoPanel {
  grid-column: 1;
  grid-row: 1;
}

.draftPanel {
  grid-column: 1;
  grid-row: 2 / span 2;
}

/* Column 2: Chat (top) + Display (bottom, spans 2 rows) */
.chatPanel {
  grid-column: 2;
  grid-row: 1;
}

.displayPanel {
  grid-column: 2;
  grid-row: 2 / span 2;
}

/* Column 3: Sessions (top) + Progress (middle) + Token (bottom) */
.sessionsPanel {
  grid-column: 3;
  grid-row: 1;
}

.progressPanel {
  grid-column: 3;
  grid-row: 2;
}

.tokenPanel {
  grid-column: 3;
  grid-row: 3;
}

/* Responsive adjustments */
@media (max-width: 1400px) {
  .mainGrid {
    grid-template-columns: 240px 1fr 280px;
  }
}

@media (max-width: 1024px) {
  .mainGrid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    overflow-y: auto;
    height: auto;
  }

  .todoPanel,
  .draftPanel,
  .chatPanel,
  .displayPanel,
  .sessionsPanel,
  .progressPanel,
  .tokenPanel {
    grid-column: 1;
    grid-row: auto;
    height: 400px;
  }
}
```

**Step 2: Create MainGrid component**

Create: `src/client/components/layout/MainGrid.tsx`

```typescript
import React from 'react'
import styles from './MainGrid.module.css'
import { Panel } from './Panel.js'

interface MainGridProps {
  children: React.ReactNode
}

export const MainGrid: React.FC<MainGridProps> = ({ children }) => {
  return (
    <main className={styles.mainGrid}>
      {children}
    </main>
  )
}

// Placeholder panels for testing
export const PlaceholderPanels: React.FC = () => {
  return (
    <>
      <div className={styles.todoPanel}>
        <Panel title="TODO" variant="primary" compact>
          <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            TODO Panel
          </div>
        </Panel>
      </div>
      <div className={styles.draftPanel}>
        <Panel title="Draft" variant="primary" compact>
          <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            Draft Panel
          </div>
        </Panel>
      </div>
      <div className={styles.chatPanel}>
        <Panel title="SUMM Chat" variant="secondary" compact>
          <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            Chat Panel
          </div>
        </Panel>
      </div>
      <div className={styles.displayPanel}>
        <Panel title="Display" variant="secondary" compact>
          <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            Display Panel
          </div>
        </Panel>
      </div>
      <div className={styles.sessionsPanel}>
        <Panel title="Sessions" variant="tertiary" compact>
          <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            Sessions Panel
          </div>
        </Panel>
      </div>
      <div className={styles.progressPanel}>
        <Panel title="Progress" variant="tertiary" compact>
          <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            Progress Panel
          </div>
        </Panel>
      </div>
      <div className={styles.tokenPanel}>
        <Panel title="Token Usage" variant="tertiary" compact>
          <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            Token Panel
          </div>
        </Panel>
      </div>
    </>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/layout/MainGrid.tsx src/client/components/layout/MainGrid.module.css
git commit -m "feat: add MainGrid layout component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update App Component

**Files:**
- Modify: `src/client/App.tsx`

**Step 1: Replace App with new layout**

Edit: `src/client/App.tsx` (replace entire file)

```typescript
import React from 'react'
import { TitleBar } from './components/layout/TitleBar.js'
import { MainGrid, PlaceholderPanels } from './components/layout/MainGrid.js'
import './styles/global.css'

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
        <PlaceholderPanels />
      </MainGrid>
    </div>
  )
}

export default App
```

**Step 2: Commit**

```bash
git add src/client/App.tsx
git commit -m "feat: update App component with new layout

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: useDraft Hook

**Files:**
- Create: `src/client/hooks/useDraft.ts`

**Step 1: Create useDraft hook**

Create: `src/client/hooks/useDraft.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { draftApi } from '../api.js'

interface DraftData {
  content: string
  updatedAt: string
}

export function useDraft() {
  const [draft, setDraft] = useState<DraftData>({
    content: '',
    updatedAt: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load draft on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await draftApi.get()
        if (!cancelled && result.success) {
          setDraft(result.data || { content: '', updatedAt: '' })
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load draft')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  // Auto-save with debounce
  useEffect(() => {
    if (!draft.content) return

    const timer = setTimeout(async () => {
      setSaving(true)
      try {
        await draftApi.save(draft.content)
        setSaving(false)
      } catch (err) {
        setError('Failed to save draft')
        setSaving(false)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [draft.content])

  const setContent = useCallback((content: string) => {
    setDraft(prev => ({ ...prev, content }))
  }, [])

  return {
    content: draft.content,
    setContent,
    loading,
    saving,
    error,
    charCount: draft.content.length
  }
}
```

**Step 2: Commit**

```bash
git add src/client/hooks/useDraft.ts
git commit -m "feat: add useDraft hook with auto-save

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: useTodos Hook

**Files:**
- Create: `src/client/hooks/useTodos.ts`

**Step 1: Create useTodos hook**

Create: `src/client/hooks/useTodos.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { todoApi } from '../api.js'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load todos
  const load = useCallback(async () => {
    try {
      const result = await todoApi.list()
      if (result.success) {
        setTodos(result.data || [])
        setError(null)
      }
    } catch (err) {
      setError('Failed to load todos')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and polling
  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const createTodo = useCallback(async (data: {
    title: string
    progress?: number
    statusDesc?: string
    state?: string
  }) => {
    const result = await todoApi.create(data)
    if (result.success) {
      await load()
      return result.data
    }
    throw new Error(result.error)
  }, [load])

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    const result = await todoApi.update(id, updates)
    if (result.success) {
      await load()
      return result.data
    }
    throw new Error(result.error)
  }, [load])

  const deleteTodo = useCallback(async (id: string) => {
    const result = await todoApi.delete(id)
    if (result.success) {
      await load()
    } else {
      throw new Error(result.error)
    }
  }, [load])

  const archiveTodo = useCallback(async (id: string) => {
    const result = await todoApi.archive(id)
    if (result.success) {
      await load()
    } else {
      throw new Error(result.error)
    }
  }, [load])

  const reorderTodos = useCallback(async (newOrder: Todo[]) => {
    const updates = newOrder.map((todo, index) => ({
      id: todo.id,
      order: index
    }))

    await Promise.all(
      updates.map(u => todoApi.update(u.id, { order: u.order }))
    )

    await load()
  }, [load])

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    archiveTodo,
    reorderTodos,
    refresh: load
  }
}
```

**Step 2: Commit**

```bash
git add src/client/hooks/useTodos.ts
git commit -m "feat: add useTodos hook with polling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: useSessions Hook

**Files:**
- Create: `src/client/hooks/useSessions.ts`

**Step 1: Create useSessions hook**

Create: `src/client/hooks/useSessions.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { sessionsApi } from '../api.js'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await sessionsApi.list()
      if (result.success) {
        setSessions(result.data || [])
        setError(null)
      }
    } catch (err) {
      setError('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [load])

  return {
    sessions,
    loading,
    error,
    refresh: load
  }
}
```

**Step 2: Commit**

```bash
git add src/client/hooks/useSessions.ts
git commit -m "feat: add useSessions hook with polling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: useProgress Hook

**Files:**
- Create: `src/client/hooks/useProgress.ts`

**Step 1: Create useProgress hook**

Create: `src/client/hooks/useProgress.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { progressApi } from '../api.js'

export function useProgress() {
  const [items, setItems] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await progressApi.get()
      if (result.success) {
        setItems(result.data || [])
        setError(null)
      }
    } catch (err) {
      setError('Failed to load progress')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  const archive = useCallback(async () => {
    const result = await progressApi.archive()
    if (result.success) {
      await load()
    } else {
      throw new Error(result.error)
    }
  }, [load])

  const add = useCallback(async (description: string, todoId?: string) => {
    const result = await progressApi.add(description, todoId)
    if (result.success) {
      await load()
      return result.data
    }
    throw new Error(result.error)
  }, [load])

  return {
    items,
    loading,
    error,
    add,
    archive,
    refresh: load
  }
}
```

**Step 2: Commit**

```bash
git add src/client/hooks/useProgress.ts
git commit -m "feat: add useProgress hook with polling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: usePlan Hook

**Files:**
- Create: `src/client/hooks/usePlan.ts`

**Step 1: Create usePlan hook**

Create: `src/client/hooks/usePlan.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { planApi } from '../api.js'

export function usePlan() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await planApi.get()
      if (result.success) {
        setContent(result.data?.content || '')
        setError(null)
      }
    } catch (err) {
      setError('Failed to load plan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  return {
    content,
    loading,
    error,
    refresh: load
  }
}
```

**Step 2: Commit**

```bash
git add src/client/hooks/usePlan.ts
git commit -m "feat: add usePlan hook with polling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: useTokenUsage Hook

**Files:**
- Create: `src/client/hooks/useTokenUsage.ts`

**Step 1: Create useTokenUsage hook**

Create: `src/client/hooks/useTokenUsage.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { tokenApi } from '../api.js'

export function useTokenUsage() {
  const [usage, setUsage] = useState<TokenUsage>({
    used: 0,
    limit: 200000,
    percentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await tokenApi.get()
      if (result.success) {
        setUsage(result.data || { used: 0, limit: 200000, percentage: 0 })
        setError(null)
      }
    } catch (err) {
      setError('Failed to load token usage')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  return {
    usage,
    loading,
    error,
    refresh: load
  }
}
```

**Step 2: Commit**

```bash
git add src/client/hooks/useTokenUsage.ts
git commit -m "feat: add useTokenUsage hook with polling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 14: Final Verification

**Files:** None (verification)

**Step 1: Test frontend starts**

Run: `npm run dev:client`

Expected: Vite starts on http://localhost:5173

**Step 2: Verify layout in browser**

Open: http://localhost:5173

Expected:
- Dark theme with cyan accents
- 3-column grid layout
- 7 panels with titles
- TitleBar at top

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors

**Step 4: Stop and commit**

```bash
git add -A
git commit -m "chore: Phase 2 complete - frontend basic framework finished

All layout components implemented
All data hooks with polling implemented
API client module complete
Global styles with retro tech aesthetic

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2 Completion Criteria

- [x] CSS variables for theming defined
- [x] Global styles with retro tech aesthetic
- [x] Panel, TitleBar, MainGrid layout components
- [x] API client with all endpoints
- [x] useDraft hook with auto-save
- [x] useTodos hook with polling
- [x] useSessions hook with polling
- [x] useProgress hook with polling
- [x] usePlan hook with polling
- [x] useTokenUsage hook with polling
- [x] App component updated with new layout
- [x] No TypeScript errors

---

**Next:** Phase 3 - TODO Feature Implementation
