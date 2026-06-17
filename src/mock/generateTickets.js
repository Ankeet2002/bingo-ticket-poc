import {
  BALLS_PER_ROUND,
  MOCK_POOL_SIZE,
  NUMBER_MAX,
  NUMBER_MIN,
  NUMBERS_PER_TICKET,
} from '../config/gameConstants.js'

/**
 * Pick `count` unique integers in [min, max].
 * @param {number} count
 * @param {number} [min]
 * @param {number} [max]
 * @returns {number[]}
 */
export function pickUniqueNumbers(count, min = NUMBER_MIN, max = NUMBER_MAX) {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const picked = []

  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(index, 1)[0])
  }

  return picked
}

/**
 * Simulates server `tickets` message payload.
 * @param {number} [size]
 * @returns {import('../worker/externals/output.js').InputTicket[]}
 */
export function generateTicketPool(size = MOCK_POOL_SIZE) {
  return Array.from({ length: size }, (_, index) => ({
    no: String(index + 1).padStart(4, '0'),
    val: /** @type {import('../worker/externals/output.js').TicketBalls} */ (
      pickUniqueNumbers(NUMBERS_PER_TICKET)
    ),
  }))
}

/**
 * Simulates the sequence of balls drawn in a round.
 * @param {number} [count]
 * @returns {number[]}
 */
export function generateBallSequence(count = BALLS_PER_ROUND) {
  return pickUniqueNumbers(count)
}
