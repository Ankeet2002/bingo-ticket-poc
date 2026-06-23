import { MOCK_TICKET } from '../mockTicketData.js'
import styles from './PseudoHeaderTicket.module.css'

/** @typedef {'normal' | 'gold' | 'disabled'} TicketVariant */

/**
 * Option 6 — 7 nodes: no header element; return + ticket # on article ::before/::after.
 * Theoretical minimum with one element per number.
 */
export default function PseudoHeaderTicket({
  numbers = MOCK_TICKET.numbers,
  ticketNumber = MOCK_TICKET.ticketNumber,
  returnAmount = MOCK_TICKET.returnAmount,
  variant = 'normal',
}) {
  const ticketClass = [styles.ticket, styles[variant]].filter(Boolean).join(' ')
  const showReturn = variant === 'gold' ? returnAmount : ''

  return (
    <article
      className={ticketClass}
      data-return={showReturn}
      data-ticket={ticketNumber}
      aria-label={`Ticket ${ticketNumber}`}
    >
      {numbers.map((n, i) => (
        <span key={i} className={styles.num}>
          {n}
        </span>
      ))}
    </article>
  )
}

export function PseudoHeaderTicketVariants(props) {
  return (
    <div className={styles.variantStack}>
      <PseudoHeaderTicket {...props} variant="normal" />
      <PseudoHeaderTicket {...props} variant="gold" />
      <PseudoHeaderTicket {...props} variant="disabled" />
    </div>
  )
}
