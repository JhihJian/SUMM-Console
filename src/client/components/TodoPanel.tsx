import React, { useState } from 'react'
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTodos } from '../hooks/useTodos.js'
import type { Todo } from '../../shared/types.js'
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
