import OptionCard from '../../components/ticketStructure/OptionCard.jsx'
import { DivBorderTicketVariants } from '../../components/ticketStructure/variants/DivBorderTicket.jsx'
import { FlatFlexTicketVariants } from '../../components/ticketStructure/variants/FlatFlexTicket.jsx'
import { PseudoHeaderTicketVariants } from '../../components/ticketStructure/variants/PseudoHeaderTicket.jsx'
import { FlatGridTicketVariants } from '../../components/ticketStructure/variants/FlatGridTicket.jsx'
import { SingleDivEvenTicketVariants } from '../../components/ticketStructure/variants/SingleDivEvenTicket.jsx'
import { SvgBackgroundTicketVariants } from '../../components/ticketStructure/variants/SvgBackgroundTicket.jsx'
import styles from './TicketStructurePage.module.css'

export default function TicketStructurePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Ticket structure POC</h1>
          <p className={styles.subtitle}>
            Compare DOM layouts and styles. Add variants in{' '}
            <code>src/components/ticketStructure/variants/</code>
          </p>
        </div>
        <a className={styles.backLink} href="/">
          ← Back to game
        </a>
      </header>

      <section className={styles.reference}>
        <h2 className={styles.sectionLabel}>Reference — Figma GUI states</h2>
        <div className={styles.referenceStack}>
          <DivBorderTicketVariants />
        </div>
      </section>

      <section className={styles.options}>
        <h2 className={styles.sectionLabel}>Structure options</h2>
        <ul className={styles.optionList}>
          <OptionCard
            title="Option 1 — Div cells + separator divs (Figma)"
            description={
              <p>
                Matches Figma <strong>TicketsMobile</strong> size L. One div per number; short
                separator divs between them (19px tall, not full row height). Three states:{' '}
                <strong>normal</strong>, <strong>gold</strong>, <strong>disabled</strong>.
              </p>
            }
            domHint="cell | separator | cell | …  ·  tokens: figmaTicketTokens.js"
          >
            <DivBorderTicketVariants />
          </OptionCard>

          <OptionCard
            title="Option 2 — Single div, equal flex spans"
            description={
              <p>
                One <code>div.numbers</code> holds six <code>span</code> children with{' '}
                <code>flex: 1</code> so each number gets an equal column. Separators via{' '}
                <code>::after</code> on each span (except last).
              </p>
            }
            domHint="<div.numbers> → <span.num> × 6  |  display: flex; .num { flex: 1 }"
          >
            <SingleDivEvenTicketVariants />
          </OptionCard>

          <OptionCard
            title="Option 3 — Single div + full SVG layer"
            description={
              <p>
                One <code>div.numbers</code> containing a single <code>svg</code> that draws the
                body gradient, separator lines, and numbers as <code>&lt;text&gt;</code> centred
                in each column. No HTML wrappers per number — but many SVG child nodes inflate the
                total count.
              </p>
            }
            domHint="<div.numbers> → <svg> rect + line × 5 + text × 6"
          >
            <SvgBackgroundTicketVariants />
          </OptionCard>

          <OptionCard
            title="Option 4 — Compact header (leanest HTML)"
            description={
              <p>
                Same flex layout as option 2, but header text comes from{' '}
                <code>data-return</code> / <code>data-ticket</code> via <code>::before</code> and{' '}
                <code>::after</code> — saves two <code>span</code> nodes. Visually matches the
                Figma reference.
              </p>
            }
            domHint="<article> → <div.header> + <div.numbers> → <span.num> × 6  (9 nodes)"
          >
            <FlatGridTicketVariants />
          </OptionCard>

          <OptionCard
            title="Option 5 — Flat flex, no numbers wrapper (8 nodes)"
            description={
              <p>
                Like option 4 but removes <code>div.numbers</code> — the six spans are direct
                children of <code>article</code> via <code>flex-wrap</code>. Lowest count while
                keeping one element per number for hit-testing.
              </p>
            }
            domHint="<article> → <div.header> + <span.num> × 6  (8 nodes)"
          >
            <FlatFlexTicketVariants />
          </OptionCard>

          <OptionCard
            title="Option 6 — Pseudo header on article (7 nodes, minimum)"
            description={
              <p>
                Drops the header <code>div</code> entirely — return and ticket # render via{' '}
                <code>article::before</code> / <code>::after</code>, layered{' '}
                <code>background</code> paints header + body.{' '}
                <strong>7 nodes is the floor</strong> with six per-number elements and no canvas.
              </p>
            }
            domHint="<article data-return data-ticket> → <span.num> × 6  (7 nodes)"
          >
            <PseudoHeaderTicketVariants />
          </OptionCard>
        </ul>
      </section>
    </main>
  )
}
