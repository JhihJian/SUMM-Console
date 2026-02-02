import { TitleBar } from './components/layout/TitleBar.js'
import { MainGrid } from './components/layout/MainGrid.js'
import { TodoPanel } from './components/TodoPanel.js'
import './styles/global.css'

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
        {/* Other panels still placeholders */}
      </MainGrid>
    </div>
  )
}

export default App
