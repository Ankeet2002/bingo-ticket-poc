import { EventBus } from '../lib/EventBus.js'
import { DEFAULT_BET_PER_TICKET } from '../config/gameConstants.js'
import { mergeTickets } from '../worker/helpers/merge.js'

/**
 * Main-thread ticket state. Intentionally outside Redux (same as production bingo).
 *
 * Events:
 * - add(ids, replace)
 * - remove(ids)
 * - update(ids)
 * - sort(ids)
 * - reset()
 * - count(number)
 * - oneToGo(entries)
 * - betChange(price)
 */
class TicketStoreClass extends EventBus {
  #eventQueue = []
  #eventReady = false
  #tickets = {}
  #lastChanges = {}
  #ticketCount = 0
  #oneToGo = []
  ticketPrice = DEFAULT_BET_PER_TICKET

  getTicketUpdate(id, withLast) {
    if (this.#tickets[id]?.update) {
      const update = this.#tickets[id].update
      this.#tickets[id].update = undefined
      return [update, (withLast && this.#lastChanges[id]) || {}]
    }
  }

  processQueue() {
    this.#eventReady = true
    let event
    while ((event = this.#eventQueue.shift())) {
      this.dispatchEvent(event[0], ...event[1])
    }
  }

  stopQueue() {
    this.#eventReady = false
  }

  getTicketCount() {
    return this.#ticketCount
  }

  getTicketNoById(id) {
    return this.#tickets[id]?.serverNumber
  }

  getTicketNos() {
    return Object.values(this.#tickets).map((ticket) => ticket.serverNumber)
  }

  getOneToGo() {
    return this.#oneToGo
  }

  /** @param {import('../worker/externals/output.js').TicketOutput[]} tickets */
  addTickets(tickets, replace = false) {
    const ids = new Array(tickets.length)

    if (replace) {
      this.#ticketCount = tickets.length
    } else {
      this.#ticketCount += tickets.length
    }

    tickets.forEach((ticket, index) => {
      this.#tickets[(ids[index] = ticket.id)] = {
        serverNumber: ticket.no,
        update: ticket,
      }
    })

    this.dispatchEvent('add', ids, replace)
    this.dispatchEvent('count', this.#ticketCount)
  }

  removeTickets(ids) {
    this.#ticketCount -= ids.length
    this.dispatchEvent('count', this.#ticketCount)
    ids.forEach((id) => delete this.#tickets[id])
    this.dispatchEvent('remove', ids)
  }

  sortTickets(ticketIds) {
    this.dispatchEvent('sort', ticketIds)
  }

  /** @param {import('../worker/externals/output.js').TicketUpdate[]} tickets */
  updateTickets(tickets) {
    this.#lastChanges = {}

    const ids = tickets.map((ticket) => {
      if (this.#tickets[ticket.id].update) {
        mergeTickets(this.#tickets[ticket.id].update, ticket.changes)
      } else {
        this.#tickets[ticket.id].update = ticket.changes
      }

      this.#lastChanges[ticket.id] = ticket.changes
      return ticket.id
    })

    this.dispatchEvent('update', ids)
  }

  /** @param {import('../worker/externals/output.js').OneToGo[]} entries */
  setOneToGo(entries) {
    this.#oneToGo = entries
    this.dispatchEvent('oneToGo', entries)
  }

  setTicketPrice(price) {
    this.ticketPrice = price
    this.dispatchEvent('betChange', price)
  }

  reset() {
    this.dispatchEvent('reset')
    this.dispatchEvent('count', 0)
    this.#tickets = {}
    this.#ticketCount = 0
    this.#lastChanges = {}
    this.#oneToGo = []
  }

  dispatchEvent(event, ...args) {
    if (!this.#eventReady) {
      this.#eventQueue.push([event, args])
      return
    }
    super.dispatchEvent(event, ...args)
  }
}

export const TicketStore = new TicketStoreClass()
