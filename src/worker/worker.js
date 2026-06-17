import { GameInputType } from './externals/input.js'
import { GameOutputType } from './externals/output.js'
import { Game } from './game/game.js'
import { restoreTickets, send, sendMultipliers, sendTickets } from './helpers/exec.js'

const game = new Game()

self.onmessage = ({ data }) => {
  const { type, parameters } = data

  switch (type) {
    case GameInputType.SETUP_GAME:
      game.setupGame(parameters.gameId, parameters.beforeInit)
      return

    case GameInputType.INIT_GAME:
      game.initGame()
      if (!game.hasQueue()) return restoreTickets(game)
      return

    case GameInputType.SETUP_TICKETS:
      game.setupTickets(parameters.tickets)
      return

    case GameInputType.TICKETS_RESTORE:
      game.restoreTickets(parameters.tickets)
      return

    case GameInputType.TICKETS_BUY: {
      const ticketsData = game.buyTickets(parameters.amount)
      send(GameOutputType.TICKETS_ADD, ticketsData)
      return
    }

    case GameInputType.TICKETS_SELL: {
      const ticketsData = game.sellTicket(parameters.ticketIds, parameters.searchByNumber ? 'serverNumber' : 'id')
      send(GameOutputType.TICKETS_REMOVE, ticketsData.sellTickets)
      send(GameOutputType.TICKETS_UPDATE, ticketsData.updateTickets)
      return
    }

    case GameInputType.TICKETS_COUNT: {
      const ticketsData = game.setTicketCount(parameters.count)
      send(GameOutputType.TICKETS_ADD, ticketsData.buyTickets)
      send(GameOutputType.TICKETS_REMOVE, ticketsData.sellTickets)
      return
    }

    case GameInputType.TICKETS_REPLACE: {
      const ticketsData = game.upsertTicket(parameters.tickets)
      send(GameOutputType.TICKETS_UPDATE, ticketsData)
      return
    }

    case GameInputType.SETUP_MULTIPLIERS: {
      // Not used in this game variant — kept for protocol compatibility
      sendMultipliers([], game, parameters.delay ?? 0)
      return
    }

    case GameInputType.SETUP_PAYOUTS: {
      const balls = game.setupPayouts(parameters.payouts)
      if (balls.length) {
        game.playBalls(balls, true)
        return restoreTickets(game)
      }
      return
    }

    case GameInputType.BALLS: {
      const changes = game.playBalls(parameters.balls, parameters.beforeInit)
      return sendTickets(changes, game)
    }

    case GameInputType.UNDO_BALL:
      game.undoBall(parameters.ball)
      return restoreTickets(game)

    case GameInputType.SET_BET: {
      const oneToGo = game.setBetPerTicket(parameters.betPerTicket)
      send(GameOutputType.ONE_TO_GO, oneToGo, true)
      return
    }
  }
}
