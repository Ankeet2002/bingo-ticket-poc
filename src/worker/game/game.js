import { BALLS_PER_ROUND, DEFAULT_BET_PER_TICKET, getMultiplierForMatches, ONE_TO_GO_COUNT } from '../../config/gameConstants.js'
import { mergeTickets } from '../helpers/merge.js'
import { fromStart } from '../helpers/unique.js'
import { Ticket } from './ticket.js'

export class Game {
  id = undefined
  initialized = false
  totalTickets = 0

  #availableTickets = []
  #usedTickets = []
  #queue = []
  #oneToGo = {}
  #playedBalls = []
  #totalBallsCount = BALLS_PER_ROUND
  #betPerTicket = DEFAULT_BET_PER_TICKET

  setupGame(id, beforeInit) {
    fromStart(id)
    this.id = id
    this.totalTickets = 0
    this.#totalBallsCount = BALLS_PER_ROUND
    this.#availableTickets = []
    this.#playedBalls = []
    this.#usedTickets = []
    this.#queue = []
    this.#oneToGo = {}
    Ticket.map.clear()

    if (beforeInit) {
      this.initialized = false
    }
  }

  initGame() {
    this.initialized = true
  }

  /** Payout tiers are fixed in gameConstants; clears any queued balls waiting for init. */
  setupPayouts() {
    return this.#queue
  }

  setupTickets(tickets) {
    this.#availableTickets = tickets
  }

  setBetPerTicket(betPerTicket) {
    this.#betPerTicket = betPerTicket
    this.#rebuildOneToGo()
    return this.getOneToGo()
  }

  buyTickets(amount) {
    const newTickets = this.#availableTickets
      .splice(0, amount)
      .map((ticket, index) => new Ticket(this.totalTickets + index, ticket))

    this.totalTickets = this.#usedTickets.push.apply(this.#usedTickets, newTickets)
    return newTickets.map((ticket) => ticket.serialize())
  }

  restoreTickets(tickets) {
    Ticket.map.clear()
    const updated = tickets.map((ticket, index) => new Ticket(index, ticket))
    this.#usedTickets.length = 0
    this.totalTickets = this.#usedTickets.push.apply(this.#usedTickets, updated)
    this.#rebuildOneToGo()
  }

  upsertTicket(tickets) {
    return tickets.reduce((updatedTickets, current) => {
      const result = Ticket.map.get(current.no)
      if (result) {
        updatedTickets.push({
          id: result.id,
          changes: { balls: (result.balls = current.val) },
        })
        result.cleanTicket(result.capped)
        this.#rebuildOneToGo()
      } else {
        this.#availableTickets.push(current)
      }
      return updatedTickets
    }, [])
  }

  sellTicket(ticketIds, searchField = 'id') {
    const updatedTickets = []
    const removedTickets = []

    let i = 0
    while (i < this.#usedTickets.length) {
      if (~ticketIds.indexOf(this.#usedTickets[i][searchField])) {
        const ticket = this.#usedTickets.splice(i, 1)[0]
        Ticket.map.delete(ticket.serverNumber)
        removedTickets.push(ticket.id)
        continue
      }

      if (this.#usedTickets[i].ticketOrder != i) {
        this.#usedTickets[i].ticketOrder = i
        updatedTickets.push({
          id: this.#usedTickets[i].id,
          changes: { index: this.#usedTickets[i].ticketOrder },
        })
      }
      i++
    }

    this.totalTickets = this.#usedTickets.length
    this.#rebuildOneToGo()

    return { sellTickets: removedTickets, updateTickets: updatedTickets }
  }

  setTicketCount(count) {
    if (this.#usedTickets.length > count) {
      const sellTickets = this.#usedTickets.splice(count).map((ticket) => {
        Ticket.map.delete(ticket.serverNumber)
        return ticket.id
      })
      this.totalTickets = this.#usedTickets.length
      this.#rebuildOneToGo()
      return { sellTickets }
    }

    if (this.#usedTickets.length < count) {
      return { buyTickets: this.buyTickets(count - this.#usedTickets.length) }
    }

    return {}
  }

  sortTickets() {
    this.#usedTickets.sort((a, b) => b.weight - a.weight)
  }

  playBalls(balls, beforeInit) {
    if (beforeInit) {
      balls.forEach((ball) => this.#playBall(ball))
      this.#rebuildOneToGo()
      return []
    }

    if (balls.length === 1) {
      return this.#playBall(balls[0])
    }

    const mergedTickets = balls.reduce((mergedChanges, ball) => {
      const changes = this.#playBall(ball)
      changes.forEach((change) => {
        if (mergedChanges[change.id]) {
          mergeTickets(mergedChanges[change.id], change.changes)
        } else {
          mergedChanges[change.id] = change.changes
        }
      })
      return mergedChanges
    }, {})

    return Object.keys(mergedTickets).map((key) => ({
      id: key,
      changes: mergedTickets[key],
    }))
  }

  hasQueue() {
    return this.#queue.length > 0
  }

  getSortedIds() {
    return this.#usedTickets.map((ticket) => ticket.id)
  }

  getSerialisedTickets() {
    return this.#usedTickets.map((ticket) => ticket.serialize(true))
  }

  getOneToGo(countMax = ONE_TO_GO_COUNT) {
    if (this.#playedBalls.length === this.#totalBallsCount) return []

    const sorted = Object.entries(this.#oneToGo)
      .map(([number, winAmount]) => ({ number: Number(number), winAmount }))
      .sort((a, b) => b.winAmount - a.winAmount)

    if (!sorted.length) return []

    /** @type {import('../externals/output.js').OneToGo[]} */
    const groups = []

    for (const { number, winAmount } of sorted) {
      const last = groups[groups.length - 1]
      if (last && last.winAmount === winAmount) {
        last.numbers.push(number)
      } else {
        groups.push({ winAmount, numbers: [number] })
      }
    }

    return groups.slice(0, countMax)
  }

  undoBall(ball) {
    if (ball.newballscount) {
      this.#totalBallsCount = ball.newballscount
      return
    }

    const playedBalls = this.#playedBalls.slice(0, -1)
    this.#oneToGo = {}
    this.#playedBalls = []

    const ticketLimits = this.#convertCappedTickets(ball.cappedTickets)

    this.#usedTickets.forEach((ticket) => ticket.cleanTicket(ticketLimits[ticket.serverNumber]))

    this.playBalls(
      playedBalls.map((val) => ({ val })),
      true,
    )
    this.#rebuildOneToGo()
  }

  /** @param {{ val: number, cappedTickets?: import('../externals/output.js').InputTicket[], newballscount?: number }} ball */
  #playBall(ball) {
    const changes = []

    if (!this.initialized) {
      this.#queue.push(ball)
      return []
    }

    if (ball.newballscount) {
      this.#totalBallsCount = ball.newballscount
      return []
    }

    this.#playedBalls.push(ball.val)

    const ticketLimits = this.#convertCappedTickets(ball.cappedTickets)

    this.#usedTickets.forEach((ticket) => {
      if (ticket.isBallOnTicket(ball.val)) {
        ticket.makeHit(ball.val, ticketLimits[ticket.serverNumber])
        changes.push({ id: ticket.id, changes: ticket.changes })
      }
    })

    this.#rebuildOneToGo()

    return changes
  }

  /** Sum win if each number is drawn next — every ticket containing it contributes. */
  #rebuildOneToGo() {
    this.#oneToGo = {}

    this.#usedTickets.forEach((ticket) => {
      const nextMultiplier = getMultiplierForMatches(ticket.matchCount + 1)
      if (!nextMultiplier) return

      const winIfHit = this.#betPerTicket * nextMultiplier

      ticket.potentials.forEach((ballNumber) => {
        this.#oneToGo[ballNumber] = (this.#oneToGo[ballNumber] ?? 0) + winIfHit
      })
    })

    this.#playedBalls.forEach((ball) => {
      delete this.#oneToGo[ball]
    })
  }

  #convertCappedTickets(tickets) {
    return tickets
      ? tickets.reduce((accum, current) => {
          if (current.capped) accum[current.no] = current.win ?? 0
          return accum
        }, {})
      : {}
  }
}
