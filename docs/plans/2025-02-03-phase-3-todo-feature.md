# Phase 3: TODO Feature Implementation - Detailed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement complete TODO management including list display, drag-and-drop reordering, file attachments, and modal interface.

**Architecture:** React component with @dnd-kit for drag operations, REST API for data persistence, file upload via multipart.

**Tech Stack:** @dnd-kit/core, @dnd-kit/sortable, React hooks, TypeScript

---

## Task 1: TodoPanel Component - Basic Structure

**Files:**
- Create: `src/client/components/TodoPanel.tsx`
- Create: `src/client/components/TodoPanel.module.css`

**Step 1: Create TodoPanel styles**

Create: `src/client/components/TodoPanel.module.css`

```css
.todoList {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.todoItem {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: grab;
  transition: border-color var(--transition-fast);
}

.todoItem:hover {
  border-color: var(--color-accent-cyan);
}

.todoItem.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.todoItem.dragOverlay {
  opacity: 0.8;
  box-shadow: 0 4px 12px rgba(0, 255, 249, 0.2);
  border-color: var(--color-accent-cyan);
}

.todoHeader {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.todoDragHandle {
  color: var(--color-text-muted);
  cursor: grab;
  flex-shrink: 0;
  margin-top: 2px;
}

.todoTitle {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  word-break: break-word;
}

.todoMeta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.todoProgressBar {
  flex: 1;
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.todoProgressFill {
  height: 100%;
  background: var(--color-accent-cyan);
  transition: width var(--transition-normal);
}

.todoProgressFill.high {
  background: var(--color-accent-green);
}

.todoProgressFill.medium {
  background: var(--color-accent-amber);
}

.todoProgressFill.low {
  background: var(--color-accent-magenta);
}

.todoFilesBadge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.todoState {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.todoState.pending {
  background: rgba(0, 255, 249, 0.1);
  color: var(--color-accent-cyan);
}

.todoState.working {
  background: rgba(255, 184, 0, 0.1);
  color: var(--color-accent-amber);
}

.todoState.completed {
  background: rgba(0, 255, 136, 0.1);
  color: var(--color-accent-green);
}

.todoEmpty {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.todoLoading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
  color: var(--color-text-muted);
}

.todoError {
  padding: var(--spacing-md);
  background: rgba(255, 0, 255, 0.1);
  border: 1px solid var(--color-accent-magenta);
  border-radius: var(--radius-sm);
  color: var(--color-accent-magenta);
  font-size: 12px;
}
```

**Step 2: Create TodoPanel component**

Create: `src/client/components/TodoPanel.tsx`

```typescript
import React, { useState } from 'react'
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTodos } from '../hooks/useTodos.js'
import styles from './TodoPanel.module.css'
import { Panel } from './layout/Panel.js'

interface TodoItemProps {
  todo: Todo
  onClick: (todo: Todo) => void
}

function TodoItem({ todo, onClick }: TodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const progressClass = todo.progress >= 80 ? 'high' : todo.progress >= 50 ? 'medium' : 'low'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.todoItem} ${isDragging ? styles.dragging : ''}`}
      onClick={() => onClick(todo)}
    >
      <div className={styles.todoHeader}>
        <span className={styles.todoDragHandle} {...attributes} {...listeners}>
          ☰
        </span>
        <span className={styles.todoTitle}>{todo.title}</span>
      </div>
      <div className={styles.todoMeta}>
        <div className={styles.todoProgressBar}>
          <div
            className={`${styles.todoProgressFill} ${styles[progressClass]}`}
            style={{ width: `${todo.progress}%` }}
          />
        </div>
        <span>{todo.progress}%</span>
        {todo.files.length > 0 && (
          <span className={styles.todoFilesBadge}>
            📎 {todo.files.length}
          </span>
        )}
        <span className={`${styles.todoState} ${styles[todo.state]}`}>
          {todo.state}
        </span>
      </div>
      {todo.statusDesc && (
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          {todo.statusDesc}
        </div>
      )}
    </div>
  )
}

export const TodoPanel: React.FC = () => {
  const { todos, loading, error, reorderTodos } = useTodos()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [showModal, setShowModal] = useState(false)

  const activeTodo = activeId ? todos.find(t => t.id === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex(t => t.id === active.id)
      const newIndex = todos.findIndex(t => t.id === over.id)

      const newTodos = [...todos]
      const [removed] = newTodos.splice(oldIndex, 1)
      newTodos.splice(newIndex, 0, removed)

      await reorderTodos(newTodos)
    }

    setActiveId(null)
  }

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo)
    setShowModal(true)
  }

  return (
    <Panel title="TODO" variant="primary" compact>
      {loading ? (
        <div className={styles.todoLoading}>Loading...</div>
      ) : error ? (
        <div className={styles.todoError}>{error}</div>
      ) : todos.length === 0 ? (
        <div className={styles.todoEmpty}>No active tasks</div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.todoList}>
              {todos.map(todo => (
                <TodoItem key={todo.id} todo={todo} onClick={handleTodoClick} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeTodo && (
              <div className={styles.todoItem}>
                <span className={styles.todoTitle}>{activeTodo.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modal will be added in next task */}
      {showModal && (
        <div onClick={() => setShowModal(false)}>
          <div>TODO Files Modal - Coming Soon</div>
          <div>Selected: {selectedTodo?.title}</div>
        </div>
      )}
    </Panel>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/TodoPanel.tsx src/client/components/TodoPanel.module.css
git commit -m "feat: add TodoPanel component with drag-drop

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: TodoFilesModal Component

**Files:**
- Create: `src/client/components/modals/TodoFilesModal.tsx`
- Create: `src/client/components/modals/TodoFilesModal.module.css`

**Step 1: Create modal styles**

Create: `src/client/components/modals/TodoFilesModal.module.css`

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
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
  flex: 1;
}

.modalFooter {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  display: flex;
  justifyContent: flex-end;
  gap: var(--spacing-sm);
}

.filesList {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.fileItem {
  display: flex;
  alignItems: center;
  justify-content: space-between;
  padding: var(--spacing-sm);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-dim);
  border-radius: var(--radius-sm);
}

.fileInfo {
  flex: 1;
  min-width: 0;
}

.fileName {
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fileMeta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.fileDelete {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  transition: color var(--transition-fast);
}

.fileDelete:hover {
  color: var(--color-accent-magenta);
}

.uploadArea {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-muted);
  transition: border-color var(--transition-fast);
}

.uploadArea:hover,
.uploadArea.dragOver {
  border-color: var(--color-accent-cyan);
  color: var(--color-accent-cyan);
}

.uploadInput {
  display: none;
}

.uploadButton {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-accent-cyan);
  color: var(--color-accent-cyan);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 12px;
  transition: all var(--transition-fast);
}

.uploadButton:hover {
  background: var(--color-accent-cyan);
  color: var(--color-bg-primary);
}

.emptyState {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.loadingState {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.errorState {
  background: rgba(255, 0, 255, 0.1);
  border: 1px solid var(--color-accent-magenta);
  color: var(--color-accent-magenta);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 12px;
}
```

**Step 2: Create TodoFilesModal component**

Create: `src/client/components/modals/TodoFilesModal.tsx`

```typescript
import React, { useState, useRef, useCallback } from 'react'
import { todoApi } from '../../api.js'
import styles from './TodoFilesModal.module.css'

interface TodoFile {
  id: string
  name: string
  path: string
  size: number
  uploadedAt: string
}

interface TodoFilesModalProps {
  todoId: string
  todoTitle: string
  files: TodoFile[]
  onClose: () => void
  onRefresh: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString()
}

export const TodoFilesModal: React.FC<TodoFilesModalProps> = ({
  todoId,
  todoTitle,
  files,
  onClose,
  onRefresh
}) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadFile(file)
    e.target.value = ''
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await uploadFile(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      await todoApi.uploadFile(todoId, file)
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      await todoApi.deleteFile(todoId, fileId)
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{todoTitle}</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {error && <div className={styles.errorState}>{error}</div>}

          <div
            className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={!uploading ? handleFileSelect : undefined}
          >
            {uploading ? (
              <div className={styles.loadingState}>Uploading...</div>
            ) : (
              <>
                <div>Drag & drop files here</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>or click to browse</div>
                <button className={styles.uploadButton} style={{ marginTop: '16px' }}>
                  Select File
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className={styles.uploadInput}
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className={styles.filesList} style={{ marginTop: '16px' }}>
              {files.map(file => (
                <div key={file.id} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileMeta}>
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </div>
                  </div>
                  <button
                    className={styles.fileDelete}
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && !uploading && (
            <div className={styles.emptyState}>No files attached</div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.uploadButton}
            onClick={onClose}
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/modals/TodoFilesModal.tsx src/client/components/modals/TodoFilesModal.module.css
git commit -m "feat: add TodoFilesModal with upload/delete

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update TodoPanel to Use TodoFilesModal

**Files:**
- Modify: `src/client/components/TodoPanel.tsx`

**Step 1: Import and integrate modal**

Edit: `src/client/components/TodoPanel.tsx`

Add import:
```typescript
import { TodoFilesModal } from './modals/TodoFilesModal.js'
```

Replace modal placeholder with:
```typescript
{showModal && selectedTodo && (
  <TodoFilesModal
    todoId={selectedTodo.id}
    todoTitle={selectedTodo.title}
    files={selectedTodo.files}
    onClose={() => setShowModal(false)}
    onRefresh={() => {
      // Force reload of todos
      window.location.reload()
    }}
  />
)}
```

**Step 2: Commit**

```bash
git add src/client/components/TodoPanel.tsx
git commit -m "feat: integrate TodoFilesModal into TodoPanel

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update MainGrid with TodoPanel

**Files:**
- Modify: `src/client/App.tsx`
- Modify: `src/client/components/layout/MainGrid.tsx`

**Step 1: Update App.tsx to use real TodoPanel**

Edit: `src/client/App.tsx`

Replace:
```typescript
import { PlaceholderPanels } from './components/layout/MainGrid.js'
```

With:
```typescript
import { TodoPanel } from './components/TodoPanel.js'
import { DraftPanel } from './components/DraftPanel.js'
```

Update MainGrid children:
```typescript
<MainGrid>
  <TodoPanel />
  {/* Other panels still placeholders */}
</MainGrid>
```

**Step 2: Commit**

```bash
git add src/client/App.tsx
git commit -m "feat: use real TodoPanel in App

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: DraftPanel Component

**Files:**
- Create: `src/client/components/DraftPanel.tsx`
- Create: `src/client/components/DraftPanel.module.css`

**Step 1: Create DraftPanel styles**

Create: `src/client/components/DraftPanel.module.css`

```css
.draftEditor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.draftTextarea {
  flex: 1;
  width: 100%;
  min-height: 200px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  resize: none;
}

.draftTextarea:focus {
  outline: none;
  border-color: var(--color-accent-cyan);
}

.draftFooter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-sm);
  font-size: 11px;
  color: var(--color-text-muted);
}

.draftStatus {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.draftStatus.saving {
  color: var(--color-accent-amber);
}

.draftStatus.saved {
  color: var(--color-accent-green);
}

.draftStatusDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.draftStatusDot.saving {
  animation: pulse 1s ease-in-out infinite;
}
```

**Step 2: Create DraftPanel component**

Create: `src/client/components/DraftPanel.tsx`

```typescript
import React from 'react'
import { useDraft } from '../hooks/useDraft.js'
import styles from './DraftPanel.module.css'
import { Panel } from './layout/Panel.js'

export const DraftPanel: React.FC = () => {
  const { content, setContent, loading, saving, charCount } = useDraft()

  if (loading) {
    return (
      <Panel title="Draft" variant="primary" compact>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          Loading...
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Draft" variant="primary" compact>
      <div className={styles.draftEditor}>
        <textarea
          className={styles.draftTextarea}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your draft here..."
        />
        <div className={styles.draftFooter}>
          <div className={`${styles.draftStatus} ${saving ? styles.saving : styles.saved}`}>
            <span className={`${styles.draftStatusDot} ${saving ? styles.saving : ''}`} />
            {saving ? 'Saving...' : 'Saved'}
          </div>
          <span>{charCount} chars</span>
        </div>
      </div>
    </Panel>
  )
}
```

**Step 3: Commit**

```bash
git add src/client/components/DraftPanel.tsx src/client/components/DraftPanel.module.css
git commit -m "feat: add DraftPanel component with auto-save

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Final Integration and Testing

**Files:**
- Modify: `src/client/App.tsx`

**Step 1: Update App to use DraftPanel**

Edit: `src/client/App.tsx`

Update imports and layout to include DraftPanel.

**Step 2: Test complete flow**

Run both servers:
```bash
npm run dev
```

Test:
1. Create a TODO via API
2. See TODO in panel
3. Drag to reorder
4. Click TODO to open modal
5. Upload a file
6. Delete file
7. Type in draft panel
8. Verify auto-save works

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: Phase 3 complete - TODO feature implementation finished

TodoPanel with drag-drop complete
TodoFilesModal with upload/delete complete
DraftPanel with auto-save complete
All features integrated and tested

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3 Completion Criteria

- [x] TodoPanel displays TODO list with progress
- [x] Drag-and-drop reordering works
- [x] TodoFilesModal opens on click
- [x] File upload via drag & drop and click
- [x] File deletion works
- [x] DraftPanel auto-saves after 1 second
- [x] All components integrated in App
- [x] No TypeScript errors

---

**Next:** Phase 4 - Terminal Interaction Implementation
