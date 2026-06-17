/** Numbers on each ticket (linear row, not a grid). */
export const NUMBERS_PER_TICKET = 6

/** Inclusive range for ticket numbers and drawn balls. */
export const NUMBER_MIN = 1
export const NUMBER_MAX = 60

/** Balls drawn per round. */
export const BALLS_PER_ROUND = 6

/**
 * Win multiplier by match count on a ticket.
 * 0–1 matches = no payout tier.
 */
export const MATCH_PAYOUTS = {
  2: 2,
  3: 4,
  4: 14,
  5: 59,
  6: 99,
}

/** Default mock pool size (simulates server `tickets` message). */
export const MOCK_POOL_SIZE = 1000

/** Maximum tickets a player can own per round. */
export const MAX_TICKET_COUNT = 1000

/** Bet spot increments for adding tickets. */
export const TICKET_BET_SPOTS = [1, 5, 50, 100]

/** FLIP sort animation — same timing pattern as production bingo. */
export const SHUFFLE_ANIMATION_DELAY = 1350
export const TICKET_ANIMATED_COUNT = 5
export const TICKET_ANIMATED_DELAY = 80

/** Max 1-to-go entries surfaced to UI (top by total win amount). */
export const ONE_TO_GO_COUNT = 3

/** Default stake per ticket for return amount display in POC. */
export const DEFAULT_BET_PER_TICKET = 10

export const MIN_BET_PER_TICKET = 1
export const MAX_BET_PER_TICKET = 1000

/** Quick-select bet amounts (applies to all tickets). */
export const BET_AMOUNT_OPTIONS = [1, 5, 10, 25, 50, 100]

/**
 * Returns payout multiplier for a match count, or 0 if below winning threshold.
 * @param {number} matchCount
 */
export function getMultiplierForMatches(matchCount) {
  return MATCH_PAYOUTS[matchCount] ?? 0
}

/**
 * @param {number} amount
 * @param {string} [currency]
 */
export function formatReturnAmount(amount, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}
