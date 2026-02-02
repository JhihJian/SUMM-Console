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
