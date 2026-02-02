import { TitleBar } from './components/layout/TitleBar.js'
import { MainGrid, PlaceholderPanels } from './components/layout/MainGrid.js'
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
        <PlaceholderPanels />
      </MainGrid>
    </div>
  )
}

export default App
