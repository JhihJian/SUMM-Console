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
