import React, { useState, useRef, useCallback } from 'react'
import { todoApi } from '../../api.js'
import type { TodoFile } from '../../../shared/types.js'
import styles from './TodoFilesModal.module.css'

interface TodoFilesModalProps {
  todoId: string
  todoTitle: string
  files: TodoFile[]
  onClose: () => void
  onRefresh: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString()
}

export const TodoFilesModal: React.FC<TodoFilesModalProps> = ({
  todoId,
  todoTitle,
  files,
  onClose,
  onRefresh
}) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadFile(file)
    e.target.value = ''
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await uploadFile(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      await todoApi.uploadFile(todoId, file)
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      await todoApi.deleteFile(todoId, fileId)
      onRefresh()
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{todoTitle}</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {error && <div className={styles.errorState}>{error}</div>}

          <div
            className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={!uploading ? handleFileSelect : undefined}
          >
            {uploading ? (
              <div className={styles.loadingState}>Uploading...</div>
            ) : (
              <>
                <div>Drag & drop files here</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>or click to browse</div>
                <button className={styles.uploadButton} style={{ marginTop: '16px' }}>
                  Select File
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className={styles.uploadInput}
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className={styles.filesList} style={{ marginTop: '16px' }}>
              {files.map(file => (
                <div key={file.id} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileMeta}>
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </div>
                  </div>
                  <button
                    className={styles.fileDelete}
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && !uploading && (
            <div className={styles.emptyState}>No files attached</div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.uploadButton}
            onClick={onClose}
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
