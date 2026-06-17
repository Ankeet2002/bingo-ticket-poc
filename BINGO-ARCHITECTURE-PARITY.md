# Architecture parity with production bingo

This document explains how **bingo-ticket-poc** relates to the production bingo game at `frontend/games/bingo`. It focuses on **technical and architectural** similarities: what patterns were borrowed, why they work well, what was intentionally simplified, and what can be carried forward when integrating with a real backend.

For game rules, setup, and file-by-file POC documentation, see [README.md](./README.md).

---

## Executive summary

The POC is **not a rewrite from scratch**. It is a **deliberate subset** of the production bingo ticket stack:

- Same **three-layer ticket model** (worker logic → EventBus store → imperative DOM)
- Same **worker message contract** (`TICKETS_ADD`, `TICKETS_UPDATE`, `TICKETS_SORT`, `ONE_TO_GO`, …)
- Same **performance patterns** (worker off main thread, no ticket state in Redux, FLIP sort, bulk-add animation rules)
- **Different game math** inside the worker (`Ticket.makeHit` — match count vs lines/full house)

If you understand the production bingo ticket pipeline, you already understand ~80% of this POC. The remaining 20% is game-specific worker logic and a mock server instead of WebSocket processors.

---

## Side-by-side architecture

```
PRODUCTION BINGO                          BINGO-TICKET-POC
─────────────────                         ─────────────────

WebSocket server                          MockGameController
       │                                        │
       ▼                                        ▼
GameCommunicationProcessors               (direct calls)
  BallGameCommunicationProcessor                │
  TicketsGameCommunicationProcessor             │
       │                                        │
       └──────────────┬─────────────────────────┘
                      ▼
            GameWorkerCommunicator
            postMessage ↔ Web Worker
                      │
                      ▼
            worker/worker.ts          →   worker/worker.js
            game/game.ts              →   game/game.js
            game/ticket.ts            →   game/ticket.js
                      │
                      ▼
            workerOutputBridge          →   workerOutputBridge.js
            (processors subscribe)            (init on app mount)
                      │
                      ▼
            TicketStore (EventBus)      →   TicketStore.js
                      │
                      ▼
            TicketCatalogConnected      →   TicketCatalogConnected.jsx
            Ticket.ts (imperative DOM)  →   Ticket.js
```

**Key insight:** The POC removes the WebSocket + processor layer and replaces it with `MockGameController`, but everything from `GameWorkerCommunicator` downward is structurally the same.

---

## The three ticket concepts (shared in both)

Both codebases use **three different `Ticket` types**. This is intentional and was preserved in the POC.

| Layer | Production bingo | POC |
|-------|------------------|-----|
| **Worker logic** | `worker/game/ticket.ts` | `worker/game/ticket.js` |
| **Client store** | `store/TicketStore.ts` | `store/TicketStore.js` |
| **DOM rendering** | `components/ticket/Ticket.ts` | `components/ticket/Ticket.js` |

| Responsibility | Worker `Ticket` | Store | DOM `Ticket` |
|----------------|-----------------|-------|--------------|
| Hit / win calculation | ✅ | — | — |
| Sort weight | ✅ | — | — |
| Hold serialized state | — | ✅ | — |
| Paint cells, animate | — | — | ✅ |

**Why this is good:** Hundreds of tickets never flow through React render cycles. The worker computes diffs; the store holds patches; DOM classes apply only what changed.

---

## Patterns taken from production bingo

### 1. Web Worker for all ticket game logic

| | Production | POC |
|---|------------|-----|
| Entry | `worker/worker.ts` | `worker/worker.js` |
| Orchestration | `game/game.ts` | `game/game.js` |
| Per-ticket logic | `game/ticket.ts` | `game/game.js` |

**Taken:** Buy, sell, ball play, sort, restore, 1-to-go — all run in a worker thread.

**Benefit:** Main thread stays free for scroll, animations, and input. Ball draws over many tickets do not block UI.

**POC adaptation:** `makeHit()` uses **match count + multiplier table** instead of line detection (`xCalculatorPath`, `lines[]`, `isFullHouse`).

---

### 2. Typed worker I/O contract

| | Production | POC |
|---|------------|-----|
| Input enum | `worker/externals/input.ts` → `GameInputType` | `worker/externals/input.js` (same names) |
| Output enum | `worker/externals/output.ts` → `GameOutputType` | `worker/externals/output.js` |

**Taken message types:**

```
SETUP_GAME, INIT_GAME, SETUP_TICKETS
TICKETS_BUY, TICKETS_SELL, TICKETS_COUNT, TICKETS_RESTORE, TICKETS_REPLACE
BALLS, UNDO_BALL
→ TICKETS_ADD, TICKETS_UPDATE, TICKETS_REMOVE, TICKETS_SORT, ONE_TO_GO
```

**Benefit:** Processors (or mock) and UI do not need to know worker internals — only message types and payloads.

**POC addition:** `SET_BET` — not in production enum, added for shared bet amount + 1TG win recalculation.

---

### 3. `GameWorkerCommunicator` bridge

| | Production | POC |
|---|------------|-----|
| File | `controllers/workerCommunication/GameWorkerCommunicator.ts` | `controllers/GameWorkerCommunicator.js` |

**Taken:**

- Single worker instance via `new Worker(new URL(..., import.meta.url))`
- `subscribe(GameOutputType, callback)` pub/sub from worker replies
- Bound methods: `buyTickets`, `playBall`, `setupTickets`, `setup`, `init`, …

**Benefit:** One place owns worker lifecycle and message routing. UI and mock never call `postMessage` directly.

---

### 4. `TicketStore` as EventBus (not Redux)

| | Production | POC |
|---|------------|-----|
| File | `store/TicketStore.ts` | `store/TicketStore.js` |
| Base | `@pp/core` EventBus | Local `lib/EventBus.js` |

**Taken patterns:**

| Pattern | Purpose |
|---------|---------|
| `addTickets` / `updateTickets` / `sortTickets` | Store patches, emit events |
| `getTicketUpdate(id, withLast)` | Read-once patch + animation delta |
| `lastChanges` per update | Animate only the delta (new hits, not all hits) |
| `mergeTickets` helper | Combine multiple worker patches per ticket |
| **Event queue** | `processQueue()` / `stopQueue()` — buffer until catalog mounts |
| `ticketPrice` | Shared bet for return amount display |

**Benefit:** Ticket updates do not trigger React re-renders across the whole app. Only `TicketCatalogConnected` listens and updates imperative DOM nodes.

**Production extras not in POC:** `audio` event, `ticketLocale`, `ticketOptions`, sound dispatch from `dispatchSounds()`.

---

### 5. Worker output → store bridge

| | Production | POC |
|---|------------|-----|
| Wiring | Per-processor `GameWorkerCommunicator.subscribe` in `TicketReplacedGameCommunicationProcessor`, `TicketsGameCommunicationProcessor`, etc. | Single `initWorkerOutputBridge()` in `controllers/workerOutputBridge.js` |

**Taken mapping:**

```
TICKETS_ADD     → TicketStore.addTickets()
TICKETS_UPDATE  → TicketStore.updateTickets()
TICKETS_SORT    → TicketStore.sortTickets()  (+ optional delay for multipliers)
TICKETS_REMOVE  → TicketStore.removeTickets()
TICKETS_RESTORE → TicketStore.addTickets(tickets, true)
ONE_TO_GO       → TicketStore.setOneToGo()
```

**Benefit:** Worker and UI are decoupled. Swapping mock for WebSocket only changes what *calls* `GameWorkerCommunicator`, not the store or catalog.

---

### 6. `sendTickets()` — sort then update

| | Production | POC |
|---|------------|-----|
| File | `worker/helpers/exec.ts` | `worker/helpers/exec.js` |

**Taken sequence after every ball draw:**

```js
game.sortTickets()
postMessage(TICKETS_SORT, sortedIds)
postMessage(TICKETS_UPDATE, changes)
postMessage(ONE_TO_GO, oneToGo)
```

**Benefit:** UI always receives sort order and content updates in a consistent order. Catalog can refresh content, then FLIP reorder.

---

### 7. Imperative `Ticket` DOM class

| | Production | POC |
|---|------------|-----|
| File | `components/ticket/Ticket.ts` | `components/ticket/Ticket.js` |
| Sub-components | `TicketNumbers`, `TicketHits`, `TicketLines`, … | Single class (hits + return + gold state) |

**Taken:**

- `updateTicketFromStore(withAnimations)` → `getTicketUpdate()` → `updateTicket(update, last)`
- `last` drives animation diffing (only new hits animate)
- CSS modules for ticket chrome

**POC simplification:** No line/full-house/multiplier sub-components — linear 6-number row with circled hits and gold winning header.

---

### 8. `TicketCatalogConnected` + FLIP sort

| | Production | POC |
|---|------------|-----|
| Catalog | `components/ticketCatalog/TicketCatalogConnected.tsx` | `components/ticketCatalog/TicketCatalogConnected.jsx` |
| FLIP utils | `components/ticketCatalog/utils.ts` | `components/ticketCatalog/utils.js` |

**Taken:**

| Feature | Production | POC |
|---------|------------|-----|
| Module-level `ticketsSorted`, `tickets` map | ✅ | ✅ |
| Listen to `add`, `update`, `sort`, `remove`, `reset` | ✅ | ✅ |
| FLIP via Web Animations API | ✅ | ✅ |
| `SHUFFLE_ANIMATION_DELAY` (1350ms) | ✅ | ✅ |
| Sort only when scrolled to top | ✅ | ✅ |
| Animate visible viewport tickets only | ✅ | ✅ |
| **Bulk add rule** — skip fade if ≥25 tickets | ✅ | ✅ |
| Fade only last 5 tickets | ✅ | ✅ |
| `DocumentFragment` for large appends | — | ✅ (added for 100-ticket buys) |

**Benefit:** Proven animation rules from production — bulk buys stay instant; small buys feel polished.

---

### 9. Ticket pool + buy from server cache

| | Production | POC |
|---|------------|-----|
| Pool load | WebSocket `tickets` → `setupTickets()` | `MockGameController` → `setupTickets({ tickets: generateTicketPool() })` |
| Buy | `TICKETS_BUY` → splice from `availableTickets` | Same |

**Taken:** Tickets are **not generated on buy** — they come from a server-side pool. Worker splices N tickets and assigns IDs via `unique.js` (`{gameId}_1`, …).

**Benefit:** Matches real backend flow; easy to swap mock pool for WebSocket payload.

---

### 10. Sort weight bitmask

| | Production | POC |
|---|------------|-----|
| File | `worker/game/ticket.ts` → `makeHit()` | `worker/game/ticket.js` → `makeHit()` |

**Taken idea:** Pack sort priority into a numeric `weight` (bitmask + scaled win component). `game.sortTickets()` sorts `usedTickets` by `weight` descending.

**Production factors:** max multipliers, hits, active multiplier, 1TG payout, lines, win weight.

**POC factors:** match count, 1TG payout tier, hits, win multiplier × `PAYOUT_MULTIPLIER`.

**Benefit:** O(n log n) sort without custom comparators; highest-value tickets bubble to top after each draw.

---

### 11. 1-to-go (ONE_TO_GO)

| | Production | POC |
|---|------------|-----|
| Worker | `game.getOneToGo()` after each ball | Same |
| Display | Grouped by multiplier tier | Grouped by **total win amount** |
| Top N | `ONE_TO_GO_COUNT` (2 in bingo, **3 in POC**) | Configurable |

**Taken:** Rebuild potentials after every ball; remove already-drawn numbers; return top groups for UI badges.

**POC extension:** Sum win across **all tickets** containing a number (`bet × next-tier multiplier` per ticket), not `Math.max` per number. Reflects shared-number contribution correctly.

---

## Data flow comparison

### Buy tickets

```
PRODUCTION                              POC
──────────                              ───

BetSpotsConnected.onClick               ControlsSection +N button
  → ticketBuyAction (Redux)               → buyTickets(n)
  → betMiddleware                         → (no Redux)
  → GameWorkerCommunicator.buyTickets     → GameWorkerCommunicator.buyTickets
  → worker TICKETS_BUY                    → worker TICKETS_BUY
  → TicketStore 'add'                     → TicketStore 'add'
  → TicketCatalogConnected DOM create     → TicketCatalogConnected DOM create
  → server place command (async)          → (not implemented)
```

### Ball draw

```
PRODUCTION                              POC
──────────                              ───

WebSocket `ball`                        drawNextBall()
  → BallGameCommunicationProcessor        → MockGameController
  → playBall({ balls: [message] })        → playBall({ balls: [{ val }] })
  → sendTickets()                         → sendTickets()
  → Redux: addBall, setOneToGo (round)    → (round state in mock snapshot only)
  → TicketStore: update + sort            → TicketStore: update + sort
  → Ticket.updateTicketFromStore          → Ticket.updateTicketFromStore
  → shuffleAnimationDelayed (FLIP)        → shuffleAnimationDelayed (FLIP)
```

**Note:** Production splits **round state** (balls, multipliers) in Redux `vbbGameState` and **per-ticket state** in `TicketStore`. POC only has `TicketStore` + lightweight mock game state for the control panel.

---

## What production has that the POC omits

These are **intentionally out of scope** for the POC, not missing by accident:

| Production feature | Location (bingo) | POC status |
|-------------------|-------------------|------------|
| WebSocket / `@pp/core` processors | `controllers/gameCommunication/` | Mock only |
| Redux bet stack, autoplay, undo | `store/`, `betMiddleware` | Not needed |
| Line / full house / multipliers on cells | `ticket.ts`, `TicketLines`, … | Different game rules |
| Ticket sell overlay, refresh | `TicketOverlay`, server messages | Not implemented |
| Audio on hit/line/win | `TicketStore.dispatchSounds` | Not implemented |
| Responsive breakpoint catalog sizing | `ticketCatalog.ts` CONFIG | Fixed 4×4 grid |
| Virtual scroll / complex viewport math | `calculateContainerAttributes` | Simplified |
| TypeScript | Throughout | JavaScript |
| Storybook, tests, pp-builder | Tooling | Vite only |
| Server place / bet validation | `GameCommunicationTicketPlaceSender` | Not implemented |

---

## What the POC can do (reuse path)

### Drop-in without changes

When wiring a real backend, these layers can stay **as-is**:

1. `worker/` — only change game math if rules change again
2. `GameWorkerCommunicator`
3. `workerOutputBridge` (or split subscriptions across processors like production)
4. `TicketStore`
5. `TicketCatalogConnected` + FLIP utils
6. `Ticket` DOM class (adjust styling only)

### Replace mock with processors

Production pattern to copy:

```js
// Instead of MockGameController.buyTickets():
GameWorkerCommunicator.buyTickets({ amount: n })

// Instead of MockGameController.drawNextBall():
GameWorkerCommunicator.playBall({ balls: [{ val: ball.val }], beforeInit: false })

// Instead of setupWorkerSession pool:
GameWorkerCommunicator.setupTickets({ tickets: message.ticket })
```

Create processors that translate WebSocket messages → `GameWorkerCommunicator` calls. Subscribe processor output handlers to the same `TicketStore` methods `workerOutputBridge` already uses.

### Extend toward production parity

| Goal | Suggested approach |
|------|-------------------|
| Real bets / server sync | Add `betMiddleware`-style listener on `TicketStore` `add`/`remove` |
| Sell / refresh ticket | Wire `TICKETS_SELL`, `TICKETS_REPLACE` (already in worker) |
| Sounds | Port `dispatchSounds` + `audio` event from production `TicketStore` |
| Responsive catalog | Port `calculateContainerAttributes` breakpoints from `ticketCatalog.ts` |
| TypeScript | Rename `.js` → `.ts`, add types from `output.ts` |
| Undo ball | `UNDO_BALL` + `restoreTickets` already in worker |

---

## Technical benefits of shared architecture

### Performance

| Approach | Why it works |
|----------|--------------|
| Worker for ticket math | Main thread free during ball draws over 1000 tickets |
| Ticket state outside Redux | No virtual DOM diff for 1000 ticket components |
| Imperative DOM `Ticket` | Patch only changed cells; WAAPI for hit/sort animations |
| Bulk-add animation skip | +100 tickets appear instantly (production-tested rule) |
| Event queue on store | No lost worker messages before catalog mounts |

### Maintainability

| Approach | Why it works |
|----------|--------------|
| Shared message protocol | Backend, worker, and UI teams agree on `GameInputType` / `GameOutputType` |
| Single communicator | One worker instance, one subscription API |
| Three-layer Ticket split | Clear boundary: logic vs state vs presentation |
| Incremental `TicketUpdate` | Worker sends small patches, not full ticket arrays every ball |

### Testability

| Layer | How to test |
|-------|-------------|
| Worker `Ticket.makeHit` | Unit test in worker context (no DOM) |
| Worker `Game.playBalls` | postMessage in/out integration |
| `TicketStore` | Emit events, assert `getTicketUpdate` |
| Catalog / FLIP | Manual or visual; module-level state like production |

---

## File mapping reference

| Concern | Production (`frontend/games/bingo`) | POC (`bingo-ticket-poc`) |
|---------|-----------------------------------|---------------------------|
| Worker entry | `src/worker/worker.ts` | `src/worker/worker.js` |
| Game logic | `src/worker/game/game.ts` | `src/worker/game/game.js` |
| Ticket logic | `src/worker/game/ticket.ts` | `src/worker/game/ticket.js` |
| Worker I/O | `src/worker/externals/input.ts`, `output.ts` | `src/worker/externals/input.js`, `output.js` |
| postMessage helpers | `src/worker/helpers/exec.ts` | `src/worker/helpers/exec.js` |
| Merge patches | `src/worker/helpers/merge.ts` | `src/worker/helpers/merge.js` |
| Ticket IDs | `src/worker/helpers/unique.ts` | `src/worker/helpers/unique.js` |
| Communicator | `src/controllers/workerCommunication/GameWorkerCommunicator.ts` | `src/controllers/GameWorkerCommunicator.js` |
| Output bridge | Processors in `src/controllers/gameCommunication/processors/` | `src/controllers/workerOutputBridge.js` |
| Ticket store | `src/store/TicketStore.ts` | `src/store/TicketStore.js` |
| Event bus | `@pp/core` toolkit | `src/lib/EventBus.js` |
| Catalog | `src/components/ticketCatalog/TicketCatalogConnected.tsx` | `src/components/ticketCatalog/TicketCatalogConnected.jsx` |
| FLIP animation | `src/components/ticketCatalog/utils.ts` | `src/components/ticketCatalog/utils.js` |
| Ticket DOM | `src/components/ticket/Ticket.ts` | `src/components/ticket/Ticket.js` |
| Server / mock | WebSocket processors | `src/mock/MockGameController.js` |
| Constants | `src/config/gameConstants.ts`, `ticketCatalog.ts` | `src/config/gameConstants.js`, `ticketCatalog.js` |

---

## Game logic: what changed inside the worker

Everything **around** the worker is intentionally similar. What **inside** `Ticket.makeHit()` differs:

| | Production bingo | This POC |
|---|------------------|----------|
| Ticket shape | 3×3 grid, 9 numbers (1–30) | Linear row, 6 numbers (1–60) |
| Win detection | Lines (6 patterns), full house | Match count only |
| Output fields | `hits`, `lines`, `isFullHouse`, `multiplier`, `multipliers` | `hits`, `matchCount`, `multiplier` |
| Sort weight inputs | Lines, 1TG, multipliers on cells | Match count, 1TG tier, win multiplier |
| Payout source | Server `SETUP_PAYOUTS` by line code | Fixed `MATCH_PAYOUTS` table |

The **pipeline** (hit → changes → sort → postMessage → store → DOM) is the same; only the **rules inside `makeHit()`** changed.

---

## Summary

| Question | Answer |
|----------|--------|
| Is this a different architecture? | **No** — same worker + store + imperative DOM pipeline as production bingo |
| What was reused? | Worker contract, communicator, TicketStore patterns, catalog events, FLIP sort, bulk-add rules, pool+buy flow, sort weight idea, 1TG concept |
| What was simplified? | No WebSocket/Redux/core, no lines/multipliers/audio, fixed grid, JS not TS |
| What was adapted? | Match-count wins, linear ticket UI, summed 1TG win amounts, `SET_BET` |
| Can this go to production? | **Yes** — swap mock for processors; keep worker/store/catalog; align worker math with final game rules |

The POC is best understood as a **portable slice** of the production bingo ticket engine with different win rules — not a parallel architecture.
