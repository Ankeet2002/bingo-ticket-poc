import { GameInputType } from '../worker/externals/input.js'

class GameWorkerCommunicatorClass {
  #worker = new Worker(new URL('../worker/worker.js', import.meta.url), { type: 'module' })
  #listeners = {}

  constructor() {
    this.#worker.addEventListener('message', (event) => {
      const messageType = event.data?.type
      if (typeof messageType !== 'undefined' && this.#listeners[messageType]) {
        this.#listeners[messageType].forEach((listener) =>
          listener(event.data.payload, event.data.delay),
        )
      }
    })
  }

  setup = this.#sendToWorker.bind(this, GameInputType.SETUP_GAME)
  init = this.#sendToWorker.bind(this, GameInputType.INIT_GAME)
  payouts = this.#sendToWorker.bind(this, GameInputType.SETUP_PAYOUTS)
  setupTickets = this.#sendToWorker.bind(this, GameInputType.SETUP_TICKETS)
  restoreTickets = this.#sendToWorker.bind(this, GameInputType.TICKETS_RESTORE)
  buyTickets = this.#sendToWorker.bind(this, GameInputType.TICKETS_BUY)
  sellTicket = this.#sendToWorker.bind(this, GameInputType.TICKETS_SELL)
  setTicketsCount = this.#sendToWorker.bind(this, GameInputType.TICKETS_COUNT)
  replaceTickets = this.#sendToWorker.bind(this, GameInputType.TICKETS_REPLACE)
  setMultipliers = this.#sendToWorker.bind(this, GameInputType.SETUP_MULTIPLIERS)
  playBall = this.#sendToWorker.bind(this, GameInputType.BALLS)
  undoBall = this.#sendToWorker.bind(this, GameInputType.UNDO_BALL)
  setBetPerTicket = this.#sendToWorker.bind(this, GameInputType.SET_BET)

  subscribe(name, callback) {
    if (!this.#listeners[name]) this.#listeners[name] = []
    this.#listeners[name].push(callback)
  }

  #sendToWorker(type, parameters) {
    this.#worker.postMessage({ type, parameters })
  }
}

export const GameWorkerCommunicator = new GameWorkerCommunicatorClass()
