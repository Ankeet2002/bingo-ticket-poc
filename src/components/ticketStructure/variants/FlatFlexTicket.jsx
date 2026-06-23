import { MOCK_TICKET } from '../mockTicketData.js'
import styles from './FlatFlexTicket.module.css'

/** @typedef {'normal' | 'gold' | 'disabled'} TicketVariant */

/**
 * Option 5 — drop the numbers wrapper; six spans are direct children of article
 * (flex-wrap row). One fewer element than option 4.
 */
export default function FlatFlexTicket({
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
      {numbers.map((n, i) => (
        <span key={i} className={styles.num}>
          {n}
        </span>
      ))}
    </article>
  )
}

export function FlatFlexTicketVariants(props) {
  return (
    <div className={styles.variantStack}>
      <FlatFlexTicket {...props} variant="normal" />
      <FlatFlexTicket {...props} variant="gold" />
      <FlatFlexTicket {...props} variant="disabled" />
    </div>
  )
}
