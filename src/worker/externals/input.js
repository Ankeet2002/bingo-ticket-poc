/** Messages sent from main thread → worker (same protocol shape as bingo). */
export const GameInputType = {
  SETUP_GAME: 0,
  INIT_GAME: 1,
  SETUP_PAYOUTS: 2,
  SETUP_TICKETS: 3,
  TICKETS_BUY: 4,
  TICKETS_SELL: 5,
  TICKETS_REPLACE: 6,
  TICKETS_RESTORE: 7,
  TICKETS_COUNT: 8,
  SETUP_MULTIPLIERS: 9,
  BALLS: 10,
  UNDO_BALL: 11,
  SET_BET: 12,
}
