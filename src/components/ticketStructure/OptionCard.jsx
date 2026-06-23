import { useLayoutEffect, useRef, useState } from 'react'
import { countTicketDomElements } from './countDomElements.js'
import styles from './OptionCard.module.css'

/**
 * @param {{
 *   title: string
 *   description: React.ReactNode
 *   domHint: string
 *   children: React.ReactNode
 * }} props
 */
export default function OptionCard({ title, description, domHint, children }) {
  const previewRef = useRef(null)
  const [nodesPerTicket, setNodesPerTicket] = useState(0)

  useLayoutEffect(() => {
    setNodesPerTicket(countTicketDomElements(previewRef.current))
  })

  return (
    <li className={styles.card}>
      <div className={styles.meta}>
        <div className={styles.nodeCountRow}>
          <span className={styles.nodeCount}>
            <strong>{nodesPerTicket}</strong> DOM elements per ticket
          </span>
          <span className={styles.nodeCountDetail}>measured on one rendered ticket</span>
        </div>
        <span className={styles.title}>{title}</span>
        <div className={styles.description}>{description}</div>
        <code className={styles.domHint}>{domHint}</code>
      </div>
      <div ref={previewRef} className={styles.preview}>
        {children}
      </div>
    </li>
  )
}
