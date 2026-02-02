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
