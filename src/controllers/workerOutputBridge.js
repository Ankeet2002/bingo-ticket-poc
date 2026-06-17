import { TicketStore } from '../store/TicketStore.js'
import { GameOutputType } from '../worker/externals/output.js'
import { GameWorkerCommunicator } from './GameWorkerCommunicator.js'

let initialized = false

/** Wire worker postMessage output → TicketStore events (call once on app start). */
export function initWorkerOutputBridge() {
  if (initialized) return
  initialized = true

  GameWorkerCommunicator.subscribe(GameOutputType.TICKETS_ADD, (tickets) => {
    TicketStore.addTickets(tickets)
  })

  GameWorkerCommunicator.subscribe(GameOutputType.TICKETS_RESTORE, (tickets) => {
    TicketStore.addTickets(tickets, true)
  })

  GameWorkerCommunicator.subscribe(GameOutputType.TICKETS_REMOVE, (ids) => {
    TicketStore.removeTickets(ids)
  })

  GameWorkerCommunicator.subscribe(GameOutputType.TICKETS_UPDATE, (tickets) => {
    TicketStore.updateTickets(tickets)
  })

  GameWorkerCommunicator.subscribe(GameOutputType.TICKETS_SORT, (ticketIds, delay = 0) => {
    if (delay) {
      window.setTimeout(() => TicketStore.sortTickets(ticketIds), delay)
    } else {
      TicketStore.sortTickets(ticketIds)
    }
  })

  GameWorkerCommunicator.subscribe(GameOutputType.ONE_TO_GO, (entries) => {
    TicketStore.setOneToGo(entries)
  })
}
