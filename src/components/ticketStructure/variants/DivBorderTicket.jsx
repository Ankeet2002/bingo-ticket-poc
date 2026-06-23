import { MOCK_TICKET } from '../mockTicketData.js'
import styles from './DivBorderTicket.module.css'

/** @typedef {'normal' | 'gold' | 'disabled'} TicketVariant */

/**
 * Option 1 — Figma TicketsMobile (L): div per number + separate separator divs.
 *
 * @param {{
 *   numbers?: number[]
 *   ticketNumber?: number
 *   returnAmount?: string
 *   variant?: TicketVariant
 * }} props
 */
export default function DivBorderTicket({
  numbers = MOCK_TICKET.numbers,
  ticketNumber = MOCK_TICKET.ticketNumber,
  returnAmount = MOCK_TICKET.returnAmount,
  variant = 'normal',
}) {
  const ticketClass = [styles.ticket, styles[variant]].filter(Boolean).join(' ')

  return (
    <article className={ticketClass}>
      <div className={styles.header}>
        <span className={styles.return}>{variant === 'gold' ? returnAmount : ''}</span>
        <span className={styles.ticketNumber}>{ticketNumber}</span>
      </div>
      <div className={styles.numbers}>
        {numbers.flatMap((n, i) => {
          const items = []
          if (i > 0) {
            items.push(<div key={`sep-${i}`} className={styles.separator} aria-hidden />)
          }
          items.push(
            <div key={`num-${i}`} className={styles.cell}>
              {n}
            </div>,
          )
          return items
        })}
      </div>
    </article>
  )
}

/** Stacked preview of all three Figma states. */
export function DivBorderTicketVariants(props) {
  return (
    <div className={styles.variantStack}>
      <DivBorderTicket {...props} variant="normal" />
      <DivBorderTicket {...props} variant="gold" />
      <DivBorderTicket {...props} variant="disabled" />
    </div>
  )
}
