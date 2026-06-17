import { GameOutputType } from '../externals/output.js'

export function send(type, payload, force = false) {
  if (type == undefined || !payload || (!force && payload instanceof Array && payload.length === 0)) return
  self.postMessage({ type, payload })
}

export function sendTickets(payload, game) {
  if (!payload || (payload instanceof Array && payload.length === 0)) return

  game.sortTickets()

  self.postMessage({ type: GameOutputType.TICKETS_SORT, payload: game.getSortedIds() })
  self.postMessage({ type: GameOutputType.TICKETS_UPDATE, payload })
  self.postMessage({ type: GameOutputType.ONE_TO_GO, payload: game.getOneToGo() })
}

export function restoreTickets(game) {
  if (!game.totalTickets) return

  game.sortTickets()

  self.postMessage({ type: GameOutputType.TICKETS_RESTORE, payload: game.getSerialisedTickets() })
  self.postMessage({ type: GameOutputType.ONE_TO_GO, payload: game.getOneToGo() })
}

export function sendMultipliers(payload, game, delay) {
  if (!game.initialized || !payload || (payload instanceof Array && payload.length === 0)) return

  game.sortTickets()

  self.postMessage({ type: GameOutputType.TICKETS_UPDATE, payload })
  self.postMessage({ type: GameOutputType.TICKETS_SORT, payload: game.getSortedIds(), delay })
}
