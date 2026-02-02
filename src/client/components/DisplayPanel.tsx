import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { usePlan } from '../hooks/usePlan.js'
import styles from './DisplayPanel.module.css'
import { Panel } from './layout/Panel.js'

type Tab = 'plan' | 'output'

export const DisplayPanel: React.FC = () => {
  const { content, loading } = usePlan()
  const [activeTab, setActiveTab] = useState<Tab>('plan')

  return (
    <Panel title="Display" variant="secondary" compact>
      <div className={styles.displayContainer}>
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'plan' ? styles.active : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            Work Plan
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'output' ? styles.active : ''}`}
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'plan' ? (
            loading ? (
              <div className={styles.loadingState}>Loading...</div>
            ) : (
              <div className={styles.markdownContent}>
                <ReactMarkdown>{content || '# No work plan configured'}</ReactMarkdown>
              </div>
            )
          ) : (
            <div className={styles.emptyState}>Output panel - coming soon</div>
          )}
        </div>
      </div>
    </Panel>
  )
}
