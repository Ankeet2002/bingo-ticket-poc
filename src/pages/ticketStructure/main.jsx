import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import TicketStructurePage from './TicketStructurePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TicketStructurePage />
  </StrictMode>,
)
