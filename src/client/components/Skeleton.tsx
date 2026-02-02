import React from 'react'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return <div className={`${styles.skeleton} ${className || ''}`} />
}

export const TodoSkeleton: React.FC = () => (
  <div style={{ padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
    <Skeleton className={styles.title} />
    <Skeleton className={styles.bar} />
  </div>
)

export const SessionSkeleton: React.FC = () => (
  <div style={{ padding: '8px', background: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <Skeleton className={styles.id} />
      <Skeleton className={styles.status} />
    </div>
    <Skeleton className={styles.task} />
  </div>
)
