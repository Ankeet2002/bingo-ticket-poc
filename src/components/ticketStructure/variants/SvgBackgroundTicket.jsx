import { useId } from 'react'
import { MOCK_TICKET } from '../mockTicketData.js'
import { TicketNumbersSvg } from './TicketNumbersSvg.jsx'
import styles from './SvgBackgroundTicket.module.css'

/** @typedef {'normal' | 'gold' | 'disabled'} TicketVariant */

/**
 * Option 3 — one numbers div; single SVG draws background, separators, and numbers.
 * (HTML text nodes cannot be laid out as 6 grid columns — only elements can.)
 */
export default function SvgBackgroundTicket({
  numbers = MOCK_TICKET.numbers,
  ticketNumber = MOCK_TICKET.ticketNumber,
  returnAmount = MOCK_TICKET.returnAmount,
  variant = 'normal',
}) {
  const svgId = useId().replace(/:/g, '')
  const ticketClass = [styles.ticket, styles[variant]].filter(Boolean).join(' ')

  return (
    <article className={ticketClass}>
      <div className={styles.header}>
        <span className={styles.return}>{variant === 'gold' ? returnAmount : ''}</span>
        <span className={styles.ticketNumber}>{ticketNumber}</span>
      </div>
      <div className={styles.numbers}>
        <TicketNumbersSvg variant={variant} id={svgId} numbers={numbers} />
      </div>
    </article>
  )
}

export function SvgBackgroundTicketVariants(props) {
  return (
    <div className={styles.variantStack}>
      <SvgBackgroundTicket {...props} variant="normal" />
      <SvgBackgroundTicket {...props} variant="gold" />
      <SvgBackgroundTicket {...props} variant="disabled" />
    </div>
  )
}
