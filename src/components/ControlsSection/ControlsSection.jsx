import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  BET_AMOUNT_OPTIONS,
  formatReturnAmount,
  MAX_BET_PER_TICKET,
  MAX_TICKET_COUNT,
  MIN_BET_PER_TICKET,
  TICKET_BET_SPOTS,
} from '../../config/gameConstants.js'
import { TicketStore } from '../../store/TicketStore.js'
import {
  buyTickets,
  drawNextBall,
  getBetPerTicket,
  getMockGameState,
  setBetPerTicket,
  startNewRound,
  subscribeMockGame,
} from '../../mock/MockGameController.js'
import MockTicketPreview from '../ticketStructure/MockTicketPreview.jsx'
import './ControlsSection.css'

export default function ControlsSection() {
  const { drawnBalls, remainingBalls, phase, gameId } = useSyncExternalStore(
    subscribeMockGame,
    getMockGameState,
    getMockGameState,
  )

  const [ticketCount, setTicketCount] = useState(0)
  const [betInput, setBetInput] = useState(String(getBetPerTicket()))

  useEffect(() => {
    setTicketCount(TicketStore.getTicketCount())
    return TicketStore.addEventListener('count', setTicketCount)
  }, [])

  useEffect(() => {
    return TicketStore.addEventListener('betChange', (price) => {
      setBetInput(String(price))
    })
  }, [])

  const applyBetAmount = (value) => {
    setBetPerTicket(value)
    setBetInput(String(getBetPerTicket()))
  }

  const lastBall = drawnBalls[drawnBalls.length - 1]
  const totalBalls = drawnBalls.length + remainingBalls.length
  const atMaxTickets = ticketCount >= MAX_TICKET_COUNT
  const betPerTicket = getBetPerTicket()

  return (
    <section className="controls">
      <div className="controls__top">
        <div className="controls__intro">
          <h1>Ticket Game POC</h1>
          <p className="controls__subtitle">
            Round {gameId} · 6 numbers · match-count wins · FLIP sort
          </p>
        </div>
        <MockTicketPreview />
      </div>

      <div className="controls__group">
        <span className="controls__label">Bet per ticket (all tickets)</span>
        <div className="controls__buttons">
          {BET_AMOUNT_OPTIONS.map((amount) => (
            <button
              key={amount}
              type="button"
              className={betPerTicket === amount ? 'controls__chip--active' : ''}
              onClick={() => applyBetAmount(amount)}
            >
              {formatReturnAmount(amount)}
            </button>
          ))}
        </div>
        <div className="controls__betInput">
          <label htmlFor="bet-amount">Custom</label>
          <input
            id="bet-amount"
            type="number"
            min={MIN_BET_PER_TICKET}
            max={MAX_BET_PER_TICKET}
            step="1"
            value={betInput}
            onChange={(e) => setBetInput(e.target.value)}
            onBlur={() => applyBetAmount(betInput)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyBetAmount(betInput)
            }}
          />
          <span className="controls__betHint">
            Current: {formatReturnAmount(betPerTicket)} per ticket
          </span>
        </div>
      </div>

      <div className="controls__group">
        <span className="controls__label">Add tickets</span>
        <div className="controls__buttons">
          {TICKET_BET_SPOTS.map((spot) => (
            <button
              key={spot}
              type="button"
              onClick={() => buyTickets(spot)}
              disabled={atMaxTickets}
            >
              +{spot}
            </button>
          ))}
        </div>
        <div className="controls__status">
          <span>
            Tickets: {ticketCount} / {MAX_TICKET_COUNT}
          </span>
        </div>
      </div>

      <div className="controls__group">
        <span className="controls__label">Draw phase</span>
        <div className="controls__buttons">
          <button
            type="button"
            onClick={() => drawNextBall()}
            disabled={!remainingBalls.length}
          >
            Draw ball
          </button>
          <button type="button" onClick={() => startNewRound()}>
            New round
          </button>
        </div>

        <div className="controls__status">
          <span>Phase: {phase}</span>
          <span>Last ball: {lastBall ?? '—'}</span>
          <span>
            Drawn: {drawnBalls.length} / {totalBalls}
          </span>
        </div>

        {drawnBalls.length > 0 && (
          <div className="controls__balls">
            {drawnBalls.map((ball, index) => (
              <span key={index} className="controls__ball">
                {ball}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
