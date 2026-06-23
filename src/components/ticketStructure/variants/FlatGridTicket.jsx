import { MOCK_TICKET } from '../mockTicketData.js'
import styles from './FlatGridTicket.module.css'

/** @typedef {'normal' | 'gold' | 'disabled'} TicketVariant */

/**
 * Option 4 — same flex layout as option 2; header text via data-* + pseudo-elements
 * (saves two span nodes vs option 2).
 */
export default function FlatGridTicket({
  numbers = MOCK_TICKET.numbers,
  ticketNumber = MOCK_TICKET.ticketNumber,
  returnAmount = MOCK_TICKET.returnAmount,
  variant = 'normal',
}) {
  const ticketClass = [styles.ticket, styles[variant]].filter(Boolean).join(' ')
  const showReturn = variant === 'gold' ? returnAmount : ''

  return (
    <article className={ticketClass}>
      <div
        className={styles.header}
        data-return={showReturn}
        data-ticket={ticketNumber}
        aria-label={`Ticket ${ticketNumber}`}
      />
      <div className={styles.numbers}>
        {numbers.map((n, i) => (
          <span key={i} className={styles.num}>
            {n}
          </span>
        ))}
      </div>
    </article>
  )
}

export function FlatGridTicketVariants(props) {
  return (
    <div className={styles.variantStack}>
      <FlatGridTicket {...props} variant="normal" />
      <FlatGridTicket {...props} variant="gold" />
      <FlatGridTicket {...props} variant="disabled" />
    </div>
  )
}
