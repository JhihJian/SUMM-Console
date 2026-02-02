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
