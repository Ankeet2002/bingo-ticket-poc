import { FIGMA_TICKET_L } from '../figmaTicketTokens.js'
import styles from './SvgBackgroundTicket.module.css'

const W = FIGMA_TICKET_L.width
const H = FIGMA_TICKET_L.bodyHeight
const SEP_H = FIGMA_TICKET_L.separatorHeight
const SEP_Y1 = (H - SEP_H) / 2
const SEP_Y2 = SEP_Y1 + SEP_H
const COL_W = W / 6
const TEXT_Y = H / 2

/** @typedef {'normal' | 'gold' | 'disabled'} TicketVariant */

const VARIANT_STYLES = {
  normal: {
    body: 'body-normal',
    separator: 'rgba(177, 151, 151, 0.5)',
    number: '#704f4f',
  },
  gold: {
    body: 'body-gold',
    separator: '#cb9330',
    number: '#704f4f',
  },
  disabled: {
    body: 'body-disabled',
    separator: '#0a4744',
    number: '#193b3a',
  },
}

/** @param {{ variant: TicketVariant, id: string, numbers: number[] }} props */
export function TicketNumbersSvg({ variant, id, numbers }) {
  const separatorXs = [1, 2, 3, 4, 5].map((i) => i * COL_W)
  const { separator, number } = VARIANT_STYLES[variant]
  const bodyFill =
    variant === 'disabled' ? '#0d5b58' : `url(#${id}-${VARIANT_STYLES[variant].body})`

  return (
    <svg
      className={styles.numbersSvg}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Ticket numbers: ${numbers.join(', ')}`}
    >
      <defs>
        <linearGradient id={`${id}-body-normal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3eae0" />
        </linearGradient>
        <linearGradient id={`${id}-body-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe96e" />
          <stop offset="50%" stopColor="#ffd054" />
          <stop offset="100%" stopColor="#f98900" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={bodyFill} />

      {separatorXs.map((x) => (
        <line
          key={x}
          x1={x}
          y1={SEP_Y1}
          x2={x}
          y2={SEP_Y2}
          stroke={separator}
          strokeWidth={FIGMA_TICKET_L.separatorWidth}
          strokeLinecap="round"
        />
      ))}

      {numbers.map((n, i) => (
        <text
          key={i}
          x={(i + 0.5) * COL_W}
          y={TEXT_Y}
          fill={number}
          fontFamily="Onest, system-ui, sans-serif"
          fontSize={FIGMA_TICKET_L.numberFontSize}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {n}
        </text>
      ))}
    </svg>
  )
}
