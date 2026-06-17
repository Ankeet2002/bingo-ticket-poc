export class EventBus {
  #listeners = new Map()

  addEventListener(event, listener) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set())
    }
    this.#listeners.get(event).add(listener)
    return () => this.removeEventListener(event, listener)
  }

  removeEventListener(event, listener) {
    this.#listeners.get(event)?.delete(listener)
  }

  dispatchEvent(event, ...args) {
    this.#listeners.get(event)?.forEach((listener) => listener(...args))
  }

  clear() {
    this.#listeners.clear()
  }
}
