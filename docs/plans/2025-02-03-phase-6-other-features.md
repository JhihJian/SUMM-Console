# Phase 6: Other Feature Modules - Detailed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete remaining features - todo creation modal, keyboard shortcuts, error boundaries, and performance optimizations.

**Architecture:** React modal for todo creation, event listeners for shortcuts, error boundary components, React.memo optimizations.

**Tech Stack:** React hooks, TypeScript, CSS Modules

---

## Task 1: Todo Creation Modal

**Files:**
- Create: `src/client/components/modals/TodoCreateModal.tsx`
- Create: `src/client/components/modals/TodoCreateModal.module.css`

**Step 1: Create modal styles**

Create: `src/client/components/modals/TodoCreateModal.module.css`

```css
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  alignItems: center;
  justifyContent: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease-out;
}

.modalContainer {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 500px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modalHeader {
  display: flex;
  alignItems: center;
  justifyContent: space-between;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.modalTitle {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--color-accent-cyan);
}

.modalClose {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  transition: color var(--transition-fast);
}

.modalClose:hover {
  color: var(--color-accent-magenta);
}

.modalBody {
  padding: var(--spacing-md);
}

.formGroup {
  margin-bottom: var(--spacing-md);
}

.formLabel {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.formInput,
.formTextarea,
.formSelect {
  width: 100%;
  padding: var(--spacing-sm);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 14px;
}

.formInput:focus,
.formTextarea:focus,
.formSelect:focus {
  outline: none;
  border-color: var(--color-accent-cyan);
}

.formTextarea {
  min-height: 80px;
  resize: vertical;
}

.formRow {
  display: flex;
  gap: var(--spacing-md);
}

.formRow .formGroup {
  flex: 1;
}

.modalFooter {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  display: flex;
  justifyContent: flex-end;
  gap: var(--spacing-sm);
}

.button {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.buttonPrimary {
  background: var(--color-accent-cyan);
  border: 1px solid var(--color-accent-cyan);
  color: var(--color-bg-primary);
}

.buttonPrimary:hover {
  background: transparent;
  color: var(--color-accent-cyan);
}

.buttonSecondary {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.buttonSecondary:hover {
  border-color: var(--color-text-secondary);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sliderContainer {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-accent-cyan);
  border-radius: 50%;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-accent-cyan);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.sliderValue {
  min-width: 40px;
  text-align: right;
  font-size: 12px;
  color: var(--color-accent-cyan);
}
```

**Step 2: Create TodoCreateModal component**

Create: `src/client/components/modals/TodoCreateModal.tsx`

```typescript
import React, { useState } from 'react'
import { useTodos } from '../../hooks/useTodos.js'
import styles from './TodoCreateModal.module.css'

interface TodoCreateModalProps {
  onClose: () => void
}

export const TodoCreateModal: React.FC<TodoCreateModalProps> = ({ onClose }) => {
  const { createTodo } = useTodos()
  const [title, setTitle] = useState('')
  const [statusDesc, setStatusDesc] = useState('')
  const [progress, setProgress] = useState(0)
  const [state, setState] = useState<'pending' | 'working' | 'completed'>('pending')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    setSubmitting(true)
    try {
      await createTodo({
        title: title.trim(),
        statusDesc: statusDesc.trim(),
        progress,
        state
      })
      onClose()
    } catch (err) {
      console.error('Failed to create todo:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create TODO</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title *</label>
              <input
                type="text"
                className={styles.formInput}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>State</label>
                <select
                  className={styles.formSelect}
                  value={state}
                  onChange={e => setState(e.target.value as any)}
                >
                  <option value="pending">Pending</option>
                  <option value="working">Working</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Progress</label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    className={styles.slider}
                    min="0"
                    max="100"
                    value={progress}
                    onChange={e => setProgress(Number(e.target.value))}
                  />
                  <span className={styles.sliderValue}>{progress}%</span>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status Description</label>
              <textarea
                className={styles.formTextarea}
                value={statusDesc}
                onChange={e => setStatusDesc(e.target.value)}
                placeholder="Current status or notes..."
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={!title.trim() || submitting}
            >
              {submitting ? 'Creating...' : 'Create TODO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

**Step 3: Add create button to TodoPanel**

Edit: `src/client/components/TodoPanel.tsx`

Add to panel actions and state:
```typescript
const [showCreateModal, setShowCreateModal] = useState(false)

// In Panel, add actions prop:
<Panel
  title="TODO"
  variant="primary"
  compact
  actions={
    <button
      onClick={() => setShowCreateModal(true)}
      style={{
        background: 'transparent',
        border: '1px solid var(--color-accent-cyan)',
        color: 'var(--color-accent-cyan)',
        padding: '2px 8px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
      }}
    >
      + New
    </button>
  }
>
  {/* ... */}
</Panel>

// Add create modal:
{showCreateModal && (
  <TodoCreateModal onClose={() => setShowCreateModal(false)} />
)}
```

**Step 4: Commit**

```bash
git add src/client/components/modals/TodoCreateModal.tsx src/client/components/modals/TodoCreateModal.module.css src/client/components/TodoPanel.tsx
git commit -m "feat: add todo creation modal

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Error Boundary Component

**Files:**
- Create: `src/client/components/ErrorBoundary.tsx`

**Step 1: Create ErrorBoundary**

Create: `src/client/components/ErrorBoundary.tsx`

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-accent-magenta)'
        }}>
          <h2>Something went wrong</h2>
          <p style={{ fontSize: '12px', marginTop: '1rem' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '8px 16px',
              background: 'var(--color-accent-cyan)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Step 2: Wrap App in ErrorBoundary**

Edit: `src/client/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.js'
import App from './App.js'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
```

**Step 3: Commit**

```bash
git add src/client/components/ErrorBoundary.tsx src/client/main.tsx
git commit -m "feat: add error boundary component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Keyboard Shortcuts

**Files:**
- Create: `src/client/hooks/useKeyboardShortcuts.ts`

**Step 1: Create useKeyboardShortcuts hook**

Create: `src/client/hooks/useKeyboardShortcuts.ts`

```typescript
import { useEffect } from 'react'

interface Shortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export const SHORTCUTS = {
  NEW_TODO: { key: 'n', ctrlKey: true, description: 'New TODO' },
  CLOSE_MODAL: { key: 'Escape', description: 'Close modal' },
  SAVE: { key: 's', ctrlKey: true, description: 'Save' }
}
```

**Step 2: Add shortcuts to App**

Create: `src/client/hooks/useAppShortcuts.ts`

```typescript
import { useState } from 'react'
import { useKeyboardShortcuts, SHORTCUTS } from './useKeyboardShortcuts.js'

export function useAppShortcuts() {
  const [showCreateTodo, setShowCreateTodo] = useState(false)

  useKeyboardShortcuts([
    {
      ...SHORTCUTS.NEW_TODO,
      action: () => setShowCreateTodo(true)
    },
    {
      ...SHORTCUTS.CLOSE_MODAL,
      action: () => setShowCreateTodo(false)
    }
  ])

  return {
    showCreateTodo,
    setShowCreateTodo: (show: boolean) => setShowCreateTodo(show),
    toggleCreateTodo: () => setShowCreateTodo(v => !v)
  }
}
```

**Step 3: Commit**

```bash
git add src/client/hooks/useKeyboardShortcuts.ts src/client/hooks/useAppShortcuts.ts
git commit -m "feat: add keyboard shortcuts hook

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: React.memo Optimizations

**Files:**
- Modify: `src/client/components/TodoPanel.tsx`
- Modify: `src/client/components/DraftPanel.tsx`
- Modify: `src/client/components/SessionsPanel.tsx`

**Step 1: Memoize TodoItem**

Edit: `src/client/components/TodoPanel.tsx`

Wrap TodoItem:
```typescript
export const TodoItem = React.memo(function TodoItem({ todo, onClick }: TodoItemProps) {
  // ... existing code
})
```

**Step 2: Memoize panels**

Edit each panel file to add React.memo:
```typescript
export const TodoPanel = React.memo(() => {
  // ...
})

export const DraftPanel = React.memo(() => {
  // ...
})

export const SessionsPanel = React.memo(() => {
  // ...
})
```

**Step 3: Commit**

```bash
git add src/client/components/*.tsx
git commit -m "perf: add React.memo to panel components

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Loading Skeletons

**Files:**
- Create: `src/client/components/Skeleton.tsx`

**Step 1: Create skeleton component**

Create: `src/client/components/Skeleton.tsx`

```typescript
import React from 'react'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return <div className={`${styles.skeleton} ${className || ''}`} />
}

export const TodoSkeleton: React.FC = () => (
  <div style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
    <Skeleton className={styles.title} />
    <Skeleton className={styles.bar} />
  </div>
)

export const SessionSkeleton: React.FC = () => (
  <div style={{ padding: '8px', background: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <Skeleton className={styles.id} />
      <Skeleton className={styles.status} />
    </div>
    <Skeleton className={styles.task} />
  </div>
)
```

**Step 2: Create skeleton styles**

Create: `src/client/components/Skeleton.module.css`

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary) 0%,
    var(--color-border) 50%,
    var(--color-bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.title {
  height: 16px;
  width: 60%;
  margin-bottom: 8px;
}

.bar {
  height: 4px;
  width: 100%;
}

.id {
  height: 12px;
  width: 120px;
}

.status {
  height: 12px;
  width: 60px;
}

.task {
  height: 12px;
  width: 80%;
}
```

**Step 3: Use skeletons in panels**

Replace "Loading..." text with skeleton components in relevant panels.

**Step 4: Commit**

```bash
git add src/client/components/Skeleton.tsx src/client/components/Skeleton.module.css
git commit -m "feat: add loading skeleton components

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Toast Notification System

**Files:**
- Create: `src/client/components/Toast.tsx`
- Create: `src/client/components/Toast.module.css`
- Create: `src/client/hooks/useToast.ts`

**Step 1: Create toast styles**

Create: `src/client/components/Toast.module.css`

```css
.toastContainer {
  position: fixed;
  bottom: var(--spacing-md);
  right: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  z-index: 2000;
}

.toast {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  min-width: 300px;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease-out;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.removing {
  animation: slideOut 0.3s ease-in forwards;
}

@keyframes slideOut {
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toastIcon {
  font-size: 16px;
}

.toastIcon.success {
  color: var(--color-accent-green);
}

.toastIcon.error {
  color: var(--color-accent-magenta);
}

.toastIcon.warning {
  color: var(--color-accent-amber);
}

.toastContent {
  flex: 1;
}

.toastMessage {
  font-size: 13px;
  color: var(--color-text-primary);
}

.toastClose {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
}

.toastClose:hover {
  color: var(--color-text-primary);
}
```

**Step 2: Create Toast component**

Create: `src/client/components/Toast.tsx`

```typescript
import React, { useEffect } from 'react'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastProps extends ToastItem {
  onRemove: (id: string) => void
}

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onRemove])

  return (
    <div className={`${styles.toast} ${styles.removing}`}>
      <span className={`${styles.toastIcon} ${styles[type]}`}>
        {ICONS[type]}
      </span>
      <div className={styles.toastContent}>
        <div className={styles.toastMessage}>{message}</div>
      </div>
      <button
        className={styles.toastClose}
        onClick={() => onRemove(id)}
      >
        ×
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className={styles.toastContainer}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
```

**Step 3: Create useToast hook**

Create: `src/client/hooks/useToast.ts`

```typescript
import { useState, useCallback } from 'react'
import { ToastItem, ToastType } from '../components/Toast.js'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${toastId++}`
    const toast: ToastItem = { id, type, message, duration }
    setToasts(prev => [...prev, toast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return addToast('success', message, duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    return addToast('error', message, duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    return addToast('warning', message, duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    return addToast('info', message, duration)
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
```

**Step 4: Add ToastContainer to App**

Edit: `src/client/App.tsx`

```typescript
import { ToastContainer } from './components/Toast.js'
import { useToast } from './hooks/useToast.js'

function App() {
  const { toasts, removeToast } = useToast()

  return (
    <div>
      {/* ...existing content... */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add src/client/components/Toast.tsx src/client/components/Toast.module.css src/client/hooks/useToast.ts src/client/App.tsx
git commit -m "feat: add toast notification system

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Final Integration

**Files:** Multiple

**Step 1: Update all panels to use toast for errors**

Import and use `useToast` in panels for better error feedback.

**Step 2: Final test**

Run: `npm run dev`

Test all features:
- Create TODO with modal (Ctrl+N)
- Keyboard shortcuts
- Toast notifications
- Loading skeletons
- Error boundary (force an error to test)

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: Phase 6 complete - other features finished

Todo creation modal complete
Error boundary complete
Keyboard shortcuts complete
Loading skeletons complete
Toast notification system complete
React.memo optimizations applied

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 6 Completion Criteria

- [x] TodoCreateModal allows creating todos
- [x] Error boundary catches React errors
- [x] Keyboard shortcuts work (Ctrl+N, Escape)
- [x] Loading skeletons show during fetch
- [x] Toast notifications for feedback
- [x] React.memo optimizes re-renders
- [x] All features integrated

---

**Next:** Phase 7 - Integration Testing & Optimization
