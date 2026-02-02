import React from 'react'
import { useDraft } from '../hooks/useDraft.js'
import styles from './DraftPanel.module.css'
import { Panel } from './layout/Panel.js'

export const DraftPanel: React.FC = () => {
  const { content, setContent, loading, saving, charCount } = useDraft()

  if (loading) {
    return (
      <Panel title="Draft" variant="primary" compact>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          Loading...
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Draft" variant="primary" compact>
      <div className={styles.draftEditor}>
        <textarea
          className={styles.draftTextarea}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your draft here..."
        />
        <div className={styles.draftFooter}>
          <div className={`${styles.draftStatus} ${saving ? styles.saving : styles.saved}`}>
            <span className={`${styles.draftStatusDot} ${saving ? styles.saving : ''}`} />
            {saving ? 'Saving...' : 'Saved'}
          </div>
          <span>{charCount} chars</span>
        </div>
      </div>
    </Panel>
  )
}
