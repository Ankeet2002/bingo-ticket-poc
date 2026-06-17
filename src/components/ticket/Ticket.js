import { TicketStore } from '../../store/TicketStore.js'
import { formatReturnAmount } from '../../config/gameConstants.js'
import styles from './Ticket.module.css'

export class Ticket {
  dom
  #header
  #returnEl
  #numberEl
  #numbersRow
  #cells = []
  #hitIndices = new Set()
  #displayIndex = 0
  #matchCount = 0
  #multiplier = 0

  constructor(id) {
    this.id = id

    this.dom = document.createElement('article')
    this.dom.className = styles.ticket
    this.dom.dataset.ticketId = id

    this.#header = document.createElement('div')
    this.#header.className = styles.header

    this.#returnEl = document.createElement('span')
    this.#returnEl.className = styles.return

    this.#numberEl = document.createElement('span')
    this.#numberEl.className = styles.ticketNumber

    this.#header.append(this.#returnEl, this.#numberEl)

    this.#numbersRow = document.createElement('div')
    this.#numbersRow.className = styles.numbers

    this.dom.append(this.#header, this.#numbersRow)

    this.updateTicketFromStore()
  }

  updateTicketFromStore(withAnimations = false) {
    const state = TicketStore.getTicketUpdate(this.id, withAnimations)
    if (state) {
      this.updateTicket(state[0], state[1], withAnimations)
    }
  }

  updateTicket(update, last, withAnimations = false) {
    if (update.index !== undefined) {
      this.#displayIndex = update.index
      this.#numberEl.textContent = String(update.index + 1)
    } else if (!this.#numberEl.textContent) {
      this.#numberEl.textContent = TicketStore.getTicketNoById(this.id) ?? ''
    }

    if (update.balls) {
      this.#renderNumbers(update.balls)
    }

    const newHits = last.hits ? update.hits?.slice(-last.hits.length) : update.hits
    if (newHits?.length) {
      newHits.forEach((index) => {
        this.#hitIndices.add(index)
        const cell = this.#cells[index]
        cell?.classList.add(styles.cellHit)

        if (withAnimations && last.hits) {
          cell?.querySelector(`.${styles.ball}`)?.animate(
            [
              { transform: 'scale(1)' },
              { transform: 'scale(1.12)' },
              { transform: 'scale(1)' },
            ],
            { duration: 280, easing: 'ease-out' },
          )
        }
      })
    }

    if (update.matchCount !== undefined) {
      this.#matchCount = update.matchCount
    }

    if (update.multiplier !== undefined) {
      this.#multiplier = update.multiplier
      this.#applyWinningState()
    } else if (this.#matchCount >= 2) {
      this.#applyWinningState()
    }
  }

  #renderNumbers(balls) {
    this.#cells = balls.map((ball, index) => {
      const cell = document.createElement('div')
      cell.className = styles.cell

      const ballEl = document.createElement('span')
      ballEl.className = styles.ball
      ballEl.textContent = String(ball)

      if (this.#hitIndices.has(index)) {
        cell.classList.add(styles.cellHit)
      }

      cell.append(ballEl)
      return cell
    })

    this.#numbersRow.replaceChildren(...this.#cells)
  }

  refreshBetDisplay() {
    if (this.#multiplier > 0) {
      this.#applyWinningState()
    }
  }

  #applyWinningState() {
    const isWinning = this.#multiplier > 0

    this.dom.classList.toggle(styles.ticketWinning, isWinning)

    if (isWinning) {
      const returnAmount = TicketStore.ticketPrice * this.#multiplier
      this.#returnEl.textContent = formatReturnAmount(returnAmount)
    } else {
      this.#returnEl.textContent = ''
    }
  }
}
