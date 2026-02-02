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
