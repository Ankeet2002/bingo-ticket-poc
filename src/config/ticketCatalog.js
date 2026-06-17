export const CONFIG = {
  COLUMNS: 4,
  VISIBLE_ROWS: 4,
  TICKET_HEIGHT: 118,
  get CATALOG_MAX_HEIGHT() {
    return this.VISIBLE_ROWS * this.TICKET_HEIGHT
  },
  get VISIBLE_TICKETS_COUNT() {
    return this.COLUMNS * this.VISIBLE_ROWS
  },
  ANIMATION: {
    /** Skip fade-in when adding this many or more tickets at once (production bingo). */
    NEW_TICKETS_THRESHOLD: 25,
    DELAY_INCREMENT: 40,
    INITIAL_DELAY: 200,
    SHUFFLE_DURATION: 500,
  },
}
