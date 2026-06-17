import { useEffect, useRef, useState } from 'react'
import { formatReturnAmount } from '../../config/gameConstants.js'
import { CONFIG } from '../../config/ticketCatalog.js'
import { TICKET_ANIMATED_COUNT } from '../../config/gameConstants.js'
import { TicketStore } from '../../store/TicketStore.js'
import { Ticket } from '../ticket/Ticket.js'
import styles from './TicketCatalog.module.css'
import {
  calculateContainerAttributes,
  fadeInAnimation,
  shuffleAnimationDelayed,
} from './utils.js'

let ticketsSorted = []
/** @type {Record<string, Ticket>} */
let tickets = {}
let containerAttrs = { columns: 4, visibleTicketsCount: 16 }
let isCatalogScrolledToTop = true

export default function TicketCatalogConnected() {
  const ref = useRef(null)
  const [ticketCount, setTicketCount] = useState(0)
  const [oneToGo, setOneToGo] = useState([])

  const showTickets = (withAnimations) => {
    if (!ticketsSorted.length) return

    const visibleSlice = ticketsSorted.slice(0, containerAttrs.visibleTicketsCount)
    const targetIds = withAnimations ?? visibleSlice

    targetIds.forEach((id) => {
      tickets[id]?.updateTicketFromStore(Boolean(withAnimations))
    })
  }

  useEffect(() => {
    const container = ref.current
    if (!container) return

    containerAttrs = calculateContainerAttributes(container)

    const onScroll = () => {
      isCatalogScrolledToTop = container.scrollTop <= 1
    }
    container.addEventListener('scroll', onScroll, { passive: true })

    const countListener = TicketStore.addEventListener('count', (count) => setTicketCount(count))

    const oneToGoListener = TicketStore.addEventListener('oneToGo', (entries) => setOneToGo(entries))

    const addListener = TicketStore.addEventListener('add', (ids, replace) => {
      if (replace) {
        tickets = {}
        ticketsSorted = [...ids]
      } else {
        ticketsSorted.push(...ids)
      }

      const newTickets = ids.map((id) => {
        const ticket = new Ticket(id)
        return (tickets[id] = ticket).dom
      })

      if (replace) {
        container.replaceChildren(...newTickets)
      } else {
        const fragment = document.createDocumentFragment()
        newTickets.forEach((dom) => fragment.append(dom))
        container.append(fragment)
      }

      const scrollTop = container.scrollHeight - container.clientHeight
      const isBulkAdd = ids.length >= CONFIG.ANIMATION.NEW_TICKETS_THRESHOLD

      requestAnimationFrame(() => {
        // Production bingo: only fade the last few tickets, skip entirely on bulk add
        if (!isBulkAdd) {
          newTickets.slice(-TICKET_ANIMATED_COUNT).reduce(
            (delay, dom) => {
              fadeInAnimation(dom, delay)
              return delay + CONFIG.ANIMATION.DELAY_INCREMENT
            },
            ids.length > TICKET_ANIMATED_COUNT ? CONFIG.ANIMATION.INITIAL_DELAY : 0,
          )
        }

        container.scrollTo({
          top: scrollTop,
          behavior: isBulkAdd ? 'instant' : 'smooth',
        })
      })

      showTickets()
    })

    const removeListener = TicketStore.addEventListener('remove', (ids) => {
      ids.forEach((id) => {
        tickets[id]?.dom.remove()
        delete tickets[id]
        ticketsSorted = ticketsSorted.filter((ticketId) => ticketId !== id)
      })
    })

    const resetListener = TicketStore.addEventListener('reset', () => {
      container.textContent = ''
      ticketsSorted = []
      tickets = {}
      isCatalogScrolledToTop = true
      setOneToGo([])
    })

    const sortListener = TicketStore.addEventListener('sort', (ticketIds) => {
      if (ticketIds.length < 2) return

      const prevTicketOrder = ticketsSorted
      ticketsSorted = ticketIds

      if (!isCatalogScrolledToTop) return

      showTickets()
      shuffleAnimationDelayed(container, containerAttrs, prevTicketOrder, ticketIds, tickets)
    })

    const updateListener = TicketStore.addEventListener('update', (ticketIds) => {
      const visibleIds = ticketsSorted
        .slice(0, containerAttrs.visibleTicketsCount)
        .filter((id) => ticketIds.includes(id))

      showTickets(visibleIds)
    })

    const betChangeListener = TicketStore.addEventListener('betChange', () => {
      ticketsSorted.forEach((id) => tickets[id]?.refreshBetDisplay())
    })

    TicketStore.processQueue()

    return () => {
      TicketStore.stopQueue()
      container.removeEventListener('scroll', onScroll)
      countListener()
      oneToGoListener()
      addListener()
      removeListener()
      resetListener()
      sortListener()
      updateListener()
      betChangeListener()
    }
  }, [])

  return (
    <section className={styles.catalogWrap}>
      <div className={styles.meta}>
        <span>{ticketCount} ticket{ticketCount === 1 ? '' : 's'}</span>
        <span className={styles.hint}>FLIP sort when scrolled to top</span>
      </div>

      {oneToGo.length > 0 && (
        <div className={styles.oneToGo}>
          {oneToGo.map((entry) => (
            <span
              key={`${entry.winAmount}-${entry.numbers.join('-')}`}
              className={styles.oneToGoBadge}
            >
              1TG {formatReturnAmount(entry.winAmount)} — {entry.numbers.join(', ')}
            </span>
          ))}
        </div>
      )}

      <div ref={ref} className={styles.catalog}>
        {ticketCount === 0 && (
          <div className={styles.empty}>Add tickets to see them here.</div>
        )}
      </div>
    </section>
  )
}
