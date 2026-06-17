/** Messages sent from worker → main thread (same protocol shape as bingo). */
export const GameOutputType = {
  TICKETS_ADD: 0,
  TICKETS_UPDATE: 1,
  TICKETS_REMOVE: 2,
  TICKETS_RESTORE: 3,
  TICKETS_SORT: 4,
  ONE_TO_GO: 5,
}

/**
 * @typedef {1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|55|56|57|58|59|60} GameNumber
 */

/**
 * Six unique numbers in display order (linear ticket).
 * @typedef {GameNumber[]} TicketBalls
 */

/**
 * Cell index on the ticket (0–5).
 * @typedef {0|1|2|3|4|5} BallIndex
 */

/**
 * Server-side ticket before purchase.
 * @typedef {{ no: string, val: TicketBalls, capped?: boolean, mul?: number, win?: number }} InputTicket
 */

/**
 * Full ticket state sent to UI after worker logic runs.
 * No lines / full house — wins are match-count only.
 *
 * @typedef {{
 *   id: string,
 *   index: number,
 *   no: string,
 *   balls: TicketBalls,
 *   hits?: BallIndex[],
 *   matchCount?: number,
 *   multiplier?: number,
 *   capped?: number,
 * }} TicketOutput
 */

/**
 * Incremental patch after a ball draw or ticket change.
 * @typedef {{ id: string, changes: Partial<TicketOutput> }} TicketUpdate
 */

/**
 * 1-to-go prediction for next ball — total win if that number is drawn.
 * @typedef {{ winAmount: number, numbers: GameNumber[] }} OneToGo
 */

export {}
