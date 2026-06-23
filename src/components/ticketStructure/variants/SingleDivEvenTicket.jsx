import { MOCK_TICKET } from '../mockTicketData.js'
import styles from './SingleDivEvenTicket.module.css'

/** @typedef {'normal' | 'gold' | 'disabled'} TicketVariant */

/**
 * Option 2 — single numbers div; spans flex equally inside.
 *
 * @param {{
 *   numbers?: number[]
 *   ticketNumber?: number
 *   returnAmount?: string
 *   variant?: TicketVariant
 * }} props
 */
export default function SingleDivEvenTicket({
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
        {numbers.map((n, i) => (
          <span key={i} className={styles.num}>
            {n}
          </span>
        ))}
      </div>
    </article>
  )
}

export function SingleDivEvenTicketVariants(props) {
  return (
    <div className={styles.variantStack}>
      <SingleDivEvenTicket {...props} variant="normal" />
      <SingleDivEvenTicket {...props} variant="gold" />
      <SingleDivEvenTicket {...props} variant="disabled" />
    </div>
  )
}
