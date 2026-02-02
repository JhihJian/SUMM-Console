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
