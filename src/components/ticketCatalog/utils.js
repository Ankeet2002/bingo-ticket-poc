import { SHUFFLE_ANIMATION_DELAY, TICKET_ANIMATED_COUNT, TICKET_ANIMATED_DELAY } from '../../config/gameConstants.js'
import { CONFIG } from '../../config/ticketCatalog.js'

export function calculateContainerAttributes(container) {
  const columns = CONFIG.COLUMNS
  const ticketHeight = CONFIG.TICKET_HEIGHT
  const maxHeight = CONFIG.CATALOG_MAX_HEIGHT
  const visibleTicketsCount = CONFIG.VISIBLE_TICKETS_COUNT

  return { columns, ticketHeight, maxHeight, visibleTicketsCount }
}

function calculateCenteringOffset(columns, ticketCount) {
  const remainder = ticketCount % columns
  return remainder ? (columns - remainder) / 2 : 0
}

function calculateDeltas(prevIndex, newIndex, columns, offset, lastRowIndex) {
  const fromRow = (prevIndex / columns) | 0
  const toRow = (newIndex / columns) | 0
  const fromCol = (prevIndex % columns) + (fromRow === lastRowIndex ? offset : 0)
  const toCol = (newIndex % columns) + (toRow === lastRowIndex ? offset : 0)

  return { deltaX: (fromCol - toCol) * 100, deltaY: (fromRow - toRow) * 100 }
}

function createShuffleAnimation(element, deltaX, deltaY) {
  return element.animate(
    [
      { transform: `translate(${deltaX}%, ${deltaY}%)` },
      { transform: 'translate(0, 0)' },
    ],
    { duration: CONFIG.ANIMATION.SHUFFLE_DURATION, easing: 'ease-in-out', fill: 'both' },
  )
}

export function shuffleAnimation(container, containerAttrs, prevTicketOrder, newTicketOrder, tickets) {
  const ticketCount = prevTicketOrder.length
  const columns = containerAttrs.columns
  const lastRowIndex = ((ticketCount - 1) / columns) | 0
  const offset = calculateCenteringOffset(columns, ticketCount)
  const visibleTickets = containerAttrs.visibleTicketsCount

  const prevVisibleTickets = prevTicketOrder.slice(0, visibleTickets)
  const newVisibleTickets = newTicketOrder.slice(0, visibleTickets)
  const ticketsToAnimate = new Set([...prevVisibleTickets, ...newVisibleTickets])

  const animations = Array.from(ticketsToAnimate).map((ticketId) => {
    const prevIndex = prevTicketOrder.indexOf(ticketId)
    const newIndex = newTicketOrder.indexOf(ticketId)
    if (prevIndex === newIndex) return null

    const { deltaX, deltaY } = calculateDeltas(prevIndex, newIndex, columns, offset, lastRowIndex)
    return createShuffleAnimation(tickets[ticketId].dom, deltaX, deltaY)
  })

  const sortedDOM = newTicketOrder.map((id) => tickets[id].dom)
  container.append(...sortedDOM)
  requestAnimationFrame(() => animations.forEach((animation) => animation?.play()))
}

export function shuffleAnimationDelayed(container, containerAttrs, prevTicketOrder, newTicketOrder, tickets) {
  setTimeout(
    () => shuffleAnimation(container, containerAttrs, prevTicketOrder, newTicketOrder, tickets),
    SHUFFLE_ANIMATION_DELAY,
  )
}

export function fadeInAnimation(element, delayMs = 0) {
  element.animate(
    [
      { opacity: 0, transform: 'translate3d(-50%, 0, 0) scale(0.5)' },
      { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
    ],
    {
      duration: TICKET_ANIMATED_DELAY,
      delay: delayMs,
      easing: 'ease-in-out',
      fill: 'both',
    },
  )
}
