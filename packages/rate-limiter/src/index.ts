import type {TickHandler} from 'sketch-application'

export class RateLimiter<T extends TickHandler<any>> {
  #budget: number
  #last: number
  #handlers: Set<T>

  constructor(fps: number) {
    this.#budget = 1000 / fps
    this.#last = 0
    this.#handlers = new Set()
  }

  register(cb: T) {
    this.#handlers.add(cb)

    // dispose
    return () => {
      if (this.#handlers.has(cb)) {
        this.#handlers.delete(cb)
      }
    }
  }

  apply = (params: Parameters<T>[0]) => {
    this.#last = this.#last + params.dt
    if (this.#last > this.#budget) {
      for (let handler of this.#handlers) {
        handler(params)
      }
      this.#last = this.#last - this.#budget
    }
  }
}