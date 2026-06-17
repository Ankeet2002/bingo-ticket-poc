import { GameWorkerCommunicator } from '../controllers/GameWorkerCommunicator.js'
import {
  DEFAULT_BET_PER_TICKET,
  MAX_BET_PER_TICKET,
  MAX_TICKET_COUNT,
  MIN_BET_PER_TICKET,
} from '../config/gameConstants.js'
import { TicketStore } from '../store/TicketStore.js'
import { generateBallSequence, generateTicketPool } from './generateTickets.js'

/** @typedef {{ gameId: number, drawnBalls: number[], remainingBalls: number[], phase: 'betting' | 'drawing' | 'finished' }} MockGameState */

let gameId = 1
/** @type {number[]} */
let ballSequence = []
/** @type {number[]} */
let drawnBalls = []
/** @type {Set<() => void>} */
const listeners = new Set()

/** Stable snapshot reference — required for useSyncExternalStore. */
/** @type {MockGameState} */
let snapshot = createSnapshot()

function createSnapshot() {
  const remainingBalls = ballSequence.slice(drawnBalls.length)
  const phase =
    drawnBalls.length === 0
      ? 'betting'
      : remainingBalls.length === 0
        ? 'finished'
        : 'drawing'

  return { gameId, drawnBalls: [...drawnBalls], remainingBalls, phase }
}

function refreshSnapshot() {
  snapshot = createSnapshot()
}

function notify() {
  refreshSnapshot()
  listeners.forEach((listener) => listener())
}

/** @returns {MockGameState} */
export function getMockGameState() {
  return snapshot
}

export function subscribeMockGame(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setupWorkerSession() {
  GameWorkerCommunicator.setup({ gameId, beforeInit: true })
  GameWorkerCommunicator.payouts({ payouts: [] })
  GameWorkerCommunicator.init()
  GameWorkerCommunicator.setupTickets({ tickets: generateTicketPool() })
  GameWorkerCommunicator.setBetPerTicket({ betPerTicket: TicketStore.ticketPrice })
}

/** Simulates server subscribe + tickets messages on app start or new round. */
export function initMockGame() {
  ballSequence = generateBallSequence()
  drawnBalls = []
  setupWorkerSession()
  notify()
}

export function buyTickets(amount) {
  const current = TicketStore.getTicketCount()
  const remaining = MAX_TICKET_COUNT - current
  if (remaining <= 0) return

  GameWorkerCommunicator.buyTickets({ amount: Math.min(amount, remaining) })
}

export function setBetPerTicket(amount) {
  const clamped = Math.min(
    MAX_BET_PER_TICKET,
    Math.max(MIN_BET_PER_TICKET, Number(amount) || DEFAULT_BET_PER_TICKET),
  )

  TicketStore.setTicketPrice(clamped)
  GameWorkerCommunicator.setBetPerTicket({ betPerTicket: clamped })
}

/** @returns {number} */
export function getBetPerTicket() {
  return TicketStore.ticketPrice
}

/** @returns {number | null} */
export function drawNextBall() {
  const remaining = ballSequence.slice(drawnBalls.length)
  if (!remaining.length) return null

  const ball = remaining[0]
  drawnBalls.push(ball)

  GameWorkerCommunicator.playBall({
    balls: [{ val: ball }],
    beforeInit: false,
  })

  notify()
  return ball
}

export function startNewRound() {
  TicketStore.reset()
  gameId += 1
  ballSequence = generateBallSequence()
  drawnBalls = []
  setupWorkerSession()
  notify()
}
