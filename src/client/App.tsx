import React from 'react'
import { TitleBar } from './components/layout/TitleBar.js'
import { MainGrid } from './components/layout/MainGrid.js'
import { TodoPanel } from './components/TodoPanel.js'
import { DraftPanel } from './components/DraftPanel.js'
import { ChatPanel } from './components/ChatPanel.js'
import { DisplayPanel } from './components/DisplayPanel.js'
import { SessionsPanel } from './components/SessionsPanel.js'
import { ProgressPanel } from './components/ProgressPanel.js'
import { TokenPanel } from './components/TokenPanel.js'
import './styles/global.css'
import styles from './App.module.css'

function App() {
  return (
    <div style={{
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <TitleBar status="online" />
      <MainGrid>
        <TodoPanel />
        <DraftPanel />
        <ChatPanel />
        <DisplayPanel />
        <SessionsPanel />
        <ProgressPanel />
        <TokenPanel />
      </MainGrid>
    </div>
  )
}

export default App
