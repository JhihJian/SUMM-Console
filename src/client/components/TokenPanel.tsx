import React from 'react'
import { useTokenUsage } from '../hooks/useTokenUsage.js'
import styles from './TokenPanel.module.css'
import { Panel } from './layout/Panel.js'

function getPercentageClass(percentage: number): 'low' | 'medium' | 'high' {
  if (percentage >= 80) return 'high'
  if (percentage >= 50) return 'medium'
  return 'low'
}

export const TokenPanel: React.FC = () => {
  const { usage, loading } = useTokenUsage()

  if (loading) {
    return (
      <Panel title="Token Usage" variant="tertiary" compact>
        <div className={styles.loadingState}>Loading...</div>
      </Panel>
    )
  }

  const percentageClass = getPercentageClass(usage.percentage)
  const segmentCount = 20
  const activeSegments = Math.round((usage.percentage / 100) * segmentCount)

  return (
    <Panel title="Token Usage" variant="tertiary" compact>
      <div className={styles.tokenContainer}>
        <div className={styles.tokenMain}>
          <span className={styles.tokenUsed}>
            {usage.used.toLocaleString()}
            <span className={styles.tokenTotal}> / {usage.limit.toLocaleString()}</span>
          </span>
          <span className={`${styles.tokenPercentage} ${styles[percentageClass]}`}>
            {usage.percentage}%
          </span>
        </div>

        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${styles[percentageClass]}`}
            style={{ width: `${usage.percentage}%` }}
          />
        </div>

        <div className={styles.tokenSegments}>
          {Array.from({ length: segmentCount }).map((_, i) => (
            <div
              key={i}
              className={`${styles.tokenSegment} ${i < activeSegments ? styles.active : ''}`}
            />
          ))}
        </div>
      </div>
    </Panel>
  )
}
