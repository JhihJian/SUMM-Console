import React, { useState } from 'react'
import { useSessions } from '../hooks/useSessions.js'
import { SessionTerminalModal } from './modals/SessionTerminalModal.js'
import styles from './SessionsPanel.module.css'
import { Panel } from './layout/Panel.js'
import type { Session } from '../../shared/types.js'

export const SessionsPanel = React.memo(() => {
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
})
