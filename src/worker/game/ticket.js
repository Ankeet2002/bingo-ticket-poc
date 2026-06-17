import { getMultiplierForMatches } from '../../config/gameConstants.js'
import { id } from '../helpers/unique.js'

/** Scales current win multiplier so it dominates the sort bitmask (same idea as bingo). */
const PAYOUT_MULTIPLIER = 4294967296

/**
 * Worker-side ticket — match-count wins only (no lines / full house).
 *
 * Sort weight priority:
 * 1. Current win multiplier (from match count)
 * 2. Match count
 * 3. Best 1-to-go payout if one more number on this ticket hits
 * 4. Raw hit count (same as match count, kept for bitmask layout parity)
 */
export class Ticket {
  static map = new Map()

  id = id()
  serverNumber = ''
  ticketOrder = 0

  /** @type {boolean[]} */
  hitPositions = new Array(6).fill(false)

  matchCount = 0
  hits = 0
  weight = 0
  winWeight = 0
  winMultiplier = 0

  /** Ball values on this ticket not yet hit — used for 1-to-go. */
  potentials = []

  /** Patch sent to UI on the latest change. */
  changes = {}

  capped = undefined

  /** @type {import('../externals/output.js').TicketBalls} */
  #balls = []

  /** @type {Set<number>} */
  #ballSet = new Set()

  /**
   * @param {number} ticketOrder
   * @param {import('../externals/output.js').InputTicket} ticketInformation
   */
  constructor(ticketOrder, ticketInformation) {
    this.ticketOrder = ticketOrder
    this.balls = ticketInformation.val
    this.serverNumber = ticketInformation.no

    if (ticketInformation.capped) {
      this.capped = ticketInformation.win ?? 0
    }

    Ticket.map.set(ticketInformation.no, this)
  }

  /** @param {import('../externals/output.js').TicketBalls} balls */
  set balls(balls) {
    this.#balls = balls
    this.#ballSet = new Set(balls)
    this.potentials = [...balls]
  }

  get balls() {
    return this.#balls
  }

  /** @param {number} ball */
  isBallOnTicket(ball) {
    return this.#ballSet.has(ball)
  }

  /** @param {number} [capped] */
  cleanTicket(capped) {
    this.capped = capped
    this.hitPositions = new Array(6).fill(false)
    this.matchCount = 0
    this.hits = 0
    this.weight = 0
    this.winWeight = 0
    this.winMultiplier = 0
    this.potentials = [...this.#balls]
    this.changes = {}
  }

  /**
   * Apply a drawn ball to this ticket.
   * @param {number} number — drawn ball value (1–60)
   * @param {number} [ticketCap]
   * @returns {number[]} ball values still on ticket that would gain one more match if drawn next
   */
  makeHit(number, ticketCap) {
    const index = this.#balls.indexOf(number)
    if (index === -1 || this.hitPositions[index]) {
      return []
    }

    this.hitPositions[index] = true
    this.matchCount++
    this.hits = this.matchCount

    this.changes = {
      hits: [index],
      matchCount: this.matchCount,
    }

    const multiplier = getMultiplierForMatches(this.matchCount)
    if (multiplier) {
      this.winMultiplier = this.changes.multiplier = multiplier
      this.winWeight = multiplier * PAYOUT_MULTIPLIER
    }

    this.potentials = this.#collectPotentials()
    const maxOneToGo = this.#maxOneToGoPayout()

    this.weight =
      (this.matchCount << 18) | (maxOneToGo << 10) | (this.hits << 5) | (maxOneToGo > 0 ? 1 : 0)
    this.weight += this.winWeight

    if (ticketCap != undefined) {
      this.changes.capped = ticketCap
    }

    return this.potentials
  }

  /** Unhit numbers on this ticket — each is one match away from a higher tier. */
  #collectPotentials() {
    return this.#balls.filter((ball, index) => !this.hitPositions[index])
  }

  /** Best payout tier reachable with one more match on this ticket. */
  #maxOneToGoPayout() {
    const nextTier = getMultiplierForMatches(this.matchCount + 1)
    return nextTier
  }

  /**
   * @param {boolean} [full]
   * @returns {Partial<import('../externals/output.js').TicketOutput>}
   */
  serialize(full = false) {
    if (full) {
      return {
        id: this.id,
        index: this.ticketOrder,
        no: this.serverNumber,
        balls: this.#balls,
        hits: this.hitPositions.reduce((acc, hit, index) => {
          if (hit) acc.push(index)
          return acc
        }, /** @type {import('../externals/output.js').BallIndex[]} */ ([])),
        matchCount: this.matchCount,
        multiplier: this.winMultiplier || undefined,
        capped: this.capped ?? undefined,
      }
    }

    return {
      id: this.id,
      index: this.ticketOrder,
      no: this.serverNumber,
      balls: this.#balls,
    }
  }
}
