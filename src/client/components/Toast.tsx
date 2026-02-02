import React, { useEffect } from 'react'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastProps extends ToastItem {
  onRemove: (id: string) => void
}

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onRemove])

  return (
    <div className={styles.toast}>
      <span className={`${styles.toastIcon} ${styles[type]}`}>
        {ICONS[type]}
      </span>
      <div className={styles.toastContent}>
        <div className={styles.toastMessage}>{message}</div>
      </div>
      <button
        className={styles.toastClose}
        onClick={() => onRemove(id)}
      >
        ×
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className={styles.toastContainer}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
