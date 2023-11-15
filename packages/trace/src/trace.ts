import {proxy} from 'valtio'
import {proxyMap} from 'valtio/utils'

export class Timer {
  key: string
  values: Array<number>

  constructor(key: string) {
    this.values = [performance.now()]
    this.key = key
  }

  start(): this {
    this.values = [performance.now()]
    return this
  }

  track(): void {
    this.values.push(performance.now())
  }

  getDuration(): number {
    return this.values[this.values.length - 1] - this.values[0]
  }
}

export interface TraceDataShape {
  trackers: Map<string, string | number>
  timers: Map<string, Timer>
}

export class Trace {
  private data: TraceDataShape

  constructor() {
    this.data = proxy<TraceDataShape>({
      trackers: proxyMap(),
      timers: proxyMap(),
    })
  }

  /**
   * Get timer by key.
   * Getting a timer will also start the timer.
   * If no timer exists one will be created.
   * @example
   * ```
   *   const timer = trace.getTimer('foo')
   *   ...
   *   timer.track()
   * ```
   */
  getTimer(key: string): Timer {
    let timer: Timer
    if (this.data.timers.has(key)) {
      timer = this.data.timers.get(key) as Timer
    } else {
      timer = this.data.timers.set(key, new Timer(key)).get(key) as Timer
    }

    timer.start()
    return timer
  }

  /**
   * Returns a proxied version of the variable being tracked which allows the tracer to react to changes in the variable
   *
   * @deprecated trace won't handle primitives without requiring code changes, which is not what we are after at all. Shame.
   */
  on<T extends string | number>(key: string, variable: number): number {
    return variable
  }

  /**
   * Set a specific tracking key to a value
   */
  set<T extends string | number>(key: string, value: T): void {
    this.data.trackers.set(key, value)
  }

  /**
   * Returns the proxy for snapshots
   */
  getProxy(): TraceDataShape {
    return this.data
  }
}
