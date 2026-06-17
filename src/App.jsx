import { useEffect } from 'react'
import ControlsSection from './components/ControlsSection/ControlsSection.jsx'
import TicketCatalogConnected from './components/ticketCatalog/TicketCatalogConnected.jsx'
import { initWorkerOutputBridge } from './controllers/workerOutputBridge.js'
import { initMockGame } from './mock/MockGameController.js'
import './App.css'

function App() {
  useEffect(() => {
    initWorkerOutputBridge()
    initMockGame()
  }, [])

  return (
    <main className="page">
      <ControlsSection />
      <TicketCatalogConnected />
    </main>
  )
}

export default App
