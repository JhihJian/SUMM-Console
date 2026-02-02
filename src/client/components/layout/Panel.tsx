import React from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title?: string
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary'
  compact?: boolean
  className?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export const Panel: React.FC<PanelProps> = ({
  title,
  variant = 'default',
  compact = false,
  className,
  children,
  actions
}) => {
  const panelClasses = [
    styles.panel,
    variant !== 'default' && styles[variant],
    compact && styles.compact,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={panelClasses}>
      {title && (
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{title}</h2>
          {actions && <div className={styles.panelActions}>{actions}</div>}
        </div>
      )}
      <div className={styles.panelBody}>
        {children}
      </div>
    </div>
  )
}
