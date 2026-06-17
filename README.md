# Bingo Ticket POC

A standalone proof-of-concept for a **linear 6-number ticket game**. It mirrors the architecture of the production bingo frontend (`frontend/games/bingo`) — Web Worker game logic, EventBus ticket store, imperative DOM tickets, and FLIP sort animation — adapted for a different win model (match-count payouts, no grid/lines/full house).

**Related:** [BINGO-ARCHITECTURE-PARITY.md](./BINGO-ARCHITECTURE-PARITY.md) — technical comparison with production bingo (what was reused, what differs, reuse path).

---

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`).

**Try this flow:**

1. Set **bet per ticket** (applies to all tickets)
2. Add tickets with **+1 / +5 / +50 / +100**
3. **Draw ball** — hits circle, winning tickets turn gold with return amount
4. Watch **1-to-go** badges and **FLIP reorder** (catalog scrolled to top)
5. **New round** to reset

---

## Game rules

| Rule | Value |
|------|--------|
| Numbers per ticket | **6** (linear row, not a grid) |
| Number range | **1–60** (inclusive) |
| Balls drawn per round | **6** |
| Max tickets per player | **1000** |
| Bet per ticket | **Shared** — one amount applies to every ticket |

### Win tiers (by match count)

| Matches on ticket | Multiplier |
|-------------------|------------|
| 0–1 | No win |
| 2 | 2× |
| 3 | 4× |
| 4 | 14× |
| 5 | 59× |
| 6 | 99× |

**Return amount per ticket** = `betPerTicket × multiplier`

There are **no lines**, **no full house**, and **no grid layout** — only how many of the ticket’s 6 numbers have been drawn.

### 1-to-go (1TG)

Shows the **top 3** numbers that would produce the highest **total win** if drawn next.

If number `34` appears on 7 tickets, **each ticket contributes** its own potential win (`bet × next-tier multiplier`). Those amounts are **summed**:

```
Ticket A (1 match, bet R$10) → next tier 2× → R$20
Ticket B (2 matches, bet R$10) → next tier 4× → R$40
… (all tickets containing 34 contribute)
→ 1TG for 34 = sum of all contributions
```

Numbers with the same total win are grouped in one badge, e.g. `1TG R$140,00 — 34, 12`.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  React UI                                                        │
│  ControlsSection          TicketCatalogConnected                 │
│  (bet, buy, draw)         (listens to TicketStore, FLIP sort)   │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│  MockGameController      │    │  TicketStore (EventBus)       │
│  simulates server        │    │  ticket state, NOT Redux      │
└──────────────┬───────────┘    └──────────────▲───────────────┘
               │                               │
               ▼                               │
┌──────────────────────────┐    ┌─────────────┴───────────────┐
│  GameWorkerCommunicator  │◄──►│  workerOutputBridge          │
│  postMessage ↔ worker    │    │  TICKETS_* → TicketStore     │
└──────────────┬───────────┘    └──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Web Worker (src/worker/)                                        │
│  Game — buy, playBall, sort, 1-to-go                            │
│  Ticket — hits, matchCount, multiplier, weight                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why this split?**

- **Worker** — heavy ticket logic off the main thread (same as production bingo)
- **TicketStore** — ticket state outside Redux to avoid re-rendering hundreds of tickets
- **Imperative `Ticket` DOM** — each ticket is a class that patches its own DOM (hits, gold state, return amount)

---

## End-to-end flows

### 1. Ticket creation (buy)

```
User clicks +5
  → MockGameController.buyTickets(5)
  → GameWorkerCommunicator.buyTickets({ amount: 5 })
  → Worker: game.buyTickets() — splices 5 from server pool, new Ticket() each
  → postMessage TICKETS_ADD
  → workerOutputBridge → TicketStore.addTickets()
  → event 'add' → TicketCatalogConnected creates Ticket DOM nodes
```

Tickets come from a mock pool (`generateTicketPool`) shaped like the real server: `{ no: "0001", val: [6 unique numbers 1–60] }`.

### 2. Ball draw (update)

```
User clicks Draw ball
  → MockGameController.drawNextBall()
  → GameWorkerCommunicator.playBall({ balls: [{ val: N }] })
  → Worker: foreach owned ticket → ticket.makeHit(N) if number on ticket
  → Updates: hits[], matchCount, multiplier, sort weight
  → postMessage TICKETS_SORT + TICKETS_UPDATE + ONE_TO_GO
  → TicketStore → catalog updates visible tickets + 1TG badges
```

### 3. Sort (reorder by importance)

After every ball draw the worker sorts tickets by **weight** (descending):

1. Current win multiplier (dominant)
2. Match count
3. Best 1-to-go payout for that ticket
4. Hit count

`TICKETS_SORT` sends the new order. The catalog runs a **FLIP animation** (only when scrolled to top, ≥2 tickets).

### 4. Bet amount change

```
User changes bet chip / custom input
  → setBetPerTicket(amount)
  → TicketStore.setTicketPrice() → event 'betChange' → all winning tickets refresh return display
  → Worker SET_BET → rebuildOneToGo() → ONE_TO_GO with new win amounts
```

All tickets share the same bet; changing it updates every return amount and 1TG values immediately.

---

## Project structure

```
src/
├── config/
│   ├── gameConstants.js      # Payouts, limits, bet options, animation timing
│   └── ticketCatalog.js      # Grid layout (4×4), animation thresholds
│
├── mock/
│   ├── generateTickets.js    # Random ticket pool + ball sequence
│   └── MockGameController.js # Simulates server lifecycle (init, buy, draw, bet)
│
├── worker/
│   ├── worker.js             # Message dispatch entry point
│   ├── externals/
│   │   ├── input.js          # GameInputType (BUY, BALLS, SET_BET, …)
│   │   └── output.js         # GameOutputType, TicketOutput, OneToGo types
│   ├── game/
│   │   ├── game.js           # Game orchestration
│   │   └── ticket.js         # Per-ticket hit/match/weight logic
│   └── helpers/
│       ├── exec.js           # sendTickets, postMessage helpers
│       ├── merge.js          # Merge incremental TicketUpdate patches
│       └── unique.js         # Ticket IDs ({gameId}_1, …)
│
├── controllers/
│   ├── GameWorkerCommunicator.js  # Main thread ↔ worker bridge
│   └── workerOutputBridge.js      # Worker output → TicketStore
│
├── store/
│   └── TicketStore.js        # EventBus store (add/update/sort/1TG/betChange)
│
├── lib/
│   └── EventBus.js           # Lightweight pub/sub
│
├── components/
│   ├── ControlsSection/      # Bet, buy spots, draw, new round
│   ├── ticket/
│   │   ├── Ticket.js         # Imperative DOM ticket (linear 6 numbers)
│   │   └── Ticket.module.css
│   └── ticketCatalog/
│       ├── TicketCatalogConnected.jsx  # Catalog + event listeners
│       ├── utils.js                    # FLIP sort, fade-in
│       └── TicketCatalog.module.css
│
├── App.jsx                   # Wires bridge + mock init + layout
└── main.jsx
```

---

## UI components

### Ticket (linear row)

Matches the design reference:

- **Normal** — beige header, white body, ticket number top-right
- **Winning** (≥2 matches) — gold gradient, **return amount** top-left (`bet × multiplier`)
- **Hit** — matched numbers shown with a **circle** border

### Ticket catalog

- **4 tickets per row**, **4 visible rows** (16 in viewport)
- Scroll for more
- **Fade-in** on add — only last 5 tickets, skipped entirely when adding ≥25 (production bingo pattern)
- **FLIP sort** — 1350ms delay then 500ms slide reorder (when scrolled to top)

### Controls

| Control | Action |
|---------|--------|
| Bet chips / custom input | Set bet for all tickets |
| +1 / +5 / +50 / +100 | Buy tickets (capped at 1000) |
| Draw ball | Draw next of 6 balls |
| New round | Reset tickets, new pool, new ball sequence |

---

## Worker message protocol

Same shape as production bingo for familiarity.

### Main thread → Worker (`GameInputType`)

| Message | Purpose |
|---------|---------|
| `SETUP_GAME` | New round / game ID |
| `INIT_GAME` | Mark worker ready |
| `SETUP_TICKETS` | Load available ticket pool |
| `TICKETS_BUY` | Purchase tickets |
| `BALLS` | Draw ball(s) |
| `SET_BET` | Update bet per ticket, rebuild 1TG |
| `TICKETS_SELL` / `TICKETS_COUNT` / … | Supported for parity, not used in POC UI |

### Worker → Main thread (`GameOutputType`)

| Message | TicketStore action |
|---------|-------------------|
| `TICKETS_ADD` | `addTickets()` |
| `TICKETS_UPDATE` | `updateTickets()` |
| `TICKETS_SORT` | `sortTickets()` |
| `TICKETS_REMOVE` | `removeTickets()` |
| `TICKETS_RESTORE` | `addTickets(..., replace)` |
| `ONE_TO_GO` | `setOneToGo()` |

### TicketStore events

| Event | Listeners |
|-------|-----------|
| `add` | Catalog — create DOM tickets |
| `update` | Catalog — hit/win animations |
| `sort` | Catalog — FLIP reorder |
| `remove` / `reset` | Catalog — clear DOM |
| `count` | Controls — ticket counter |
| `oneToGo` | Catalog — 1TG badges |
| `betChange` | Catalog — refresh return amounts |

Events are **queued** until `TicketStore.processQueue()` runs on catalog mount (prevents lost messages during startup).

---

## Ticket data shape

```js
// Server / pool input
{ no: "0042", val: [12, 34, 5, 60, 8, 41] }

// Worker output (partial on buy, full on restore)
{
  id: "1_42",
  index: 41,
  no: "0042",
  balls: [12, 34, 5, 60, 8, 41],
  hits: [1, 4],           // cell indices 0–5
  matchCount: 2,
  multiplier: 2,          // from MATCH_PAYOUTS
}

// 1-to-go entry
{
  winAmount: 140.00,        // total R$ if any listed number is drawn
  numbers: [34, 12],
}
```

---

## Configuration reference

### `src/config/gameConstants.js`

| Constant | Default | Description |
|----------|---------|-------------|
| `NUMBERS_PER_TICKET` | 6 | Linear ticket size |
| `NUMBER_MIN` / `NUMBER_MAX` | 1 / 60 | Valid numbers |
| `BALLS_PER_ROUND` | 6 | Draws per round |
| `MATCH_PAYOUTS` | 2→2×, 3→4×, … | Win tiers |
| `MAX_TICKET_COUNT` | 1000 | Owned ticket cap |
| `MOCK_POOL_SIZE` | 1000 | Server pool size |
| `TICKET_BET_SPOTS` | [1,5,50,100] | Buy buttons |
| `BET_AMOUNT_OPTIONS` | [1,5,10,25,50,100] | Bet chips |
| `ONE_TO_GO_COUNT` | 3 | Top 1TG entries shown |
| `SHUFFLE_ANIMATION_DELAY` | 1350ms | Delay before FLIP sort |

### `src/config/ticketCatalog.js`

| Constant | Default | Description |
|----------|---------|-------------|
| `COLUMNS` | 4 | Tickets per row |
| `VISIBLE_ROWS` | 4 | Rows in viewport |
| `NEW_TICKETS_THRESHOLD` | 25 | Skip fade-in above this |

---

## Differences from production bingo

| Production bingo | This POC |
|------------------|----------|
| 3×3 grid (9 numbers) | Linear row (6 numbers) |
| Numbers 1–30 | Numbers 1–60 |
| Line / full house wins | Match-count multiplier wins |
| Server WebSocket | `MockGameController` |
| Redux for round state | TicketStore only (no Redux) |
| `@pp/core` toolchain | Plain Vite + React |

**Same patterns:** Worker ticket logic, `TicketStore` EventBus, `GameWorkerCommunicator`, FLIP sort, bulk-add animation rules, 1-to-go concept.

---

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## Extending toward production

To wire a real backend:

1. Replace `MockGameController` calls with WebSocket processors (like `BallGameCommunicationProcessor`, `TicketsGameCommunicationProcessor` in bingo)
2. Keep `GameWorkerCommunicator` + `workerOutputBridge` unchanged
3. Map server messages to the same worker `GameInputType` messages
4. `TicketStore` + catalog + `Ticket` DOM stay as-is

The worker I/O contract in `src/worker/externals/` is intentionally aligned with production bingo for this reason.
