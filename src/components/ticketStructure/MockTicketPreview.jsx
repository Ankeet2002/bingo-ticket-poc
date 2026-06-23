import DivBorderTicket from './variants/DivBorderTicket.jsx'
import styles from './MockTicketPreview.module.css'

const STRUCTURE_PAGE = '/ticket-structure.html'

export default function MockTicketPreview() {
  return (
    <section className={styles.section} aria-label="Reference ticket preview">
      <div className={styles.previewWrap}>
        <DivBorderTicket variant="normal" />

        <a href={STRUCTURE_PAGE} className={styles.overlay}>
          <span className={styles.overlayBtn}>View ticket structure options</span>
        </a>
      </div>
    </section>
  )
}
