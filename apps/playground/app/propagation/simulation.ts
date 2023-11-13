import type {TickAction} from 'sketch-react-loop'

import {Point, Rect} from 'mathutil'
import {RateLimiter} from '@ca/rate-limiter'

type Action = [idx: number, value: number]

interface BaseSimulation {
  origin: Point
  dim: Point
  cellSize: Point
  frame: Rect
  updateFps: number

  createTickHandler: () => TickAction
}

export class Simulation implements BaseSimulation {
  origin: Point
  dim: Point
  cellSize: Point
  frame: Rect
  updateFps: number

  cells: Uint8Array
  actions: Set<Action>
  rateLimiter: RateLimiter<TickAction>

  constructor() {
    this.origin = Point.of(0, 0)
    this.dim = Point.of(400, 200)
    this.cellSize = Point.of(10, 10)
    this.frame = Rect.of(
      this.origin.x,
      this.origin.y,
      this.origin.x + this.dim.x,
      this.origin.y + this.dim.y,
    )
    this.updateFps = 20

    const buffer = new ArrayBuffer(this.dim.x * this.dim.y)
    this.cells = new Uint8Array(buffer)

    this.actions = new Set()
    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)

    this.cells[400 * 123 + 24] = 255
    this.cells[3400] = 255
  }

  private render: TickAction = ({app}) => {
    const start = performance.now()

    app.ctx.fillStyle = '#f6f6f8'
    app.ctx.fillRect(
      this.origin.x,
      this.origin.y,
      this.dim.x * this.cellSize.x,
      this.dim.y * this.cellSize.y,
    )

    const padding = 2
    for (let idx = 0; idx < this.cells.length; idx++) {
      if (this.cells[idx] > 0) {
        app.ctx.fillStyle = '#2d3032' + this.cells[idx].toString(16)
        app.ctx.fillRect(
          (idx % this.dim.x) * this.cellSize.x + padding,
          (idx / this.dim.x) * this.cellSize.y + padding,
          this.cellSize.x - padding,
          this.cellSize.y - padding,
        )
      }
    }

    // console.log('render', performance.now() - start)
  }

  private update: TickAction = () => {
    const start = performance.now()
    let value = 0
    for (let idx = 0; idx < this.cells.length; idx++) {
      value = this.cells[idx]
      if (value === 0) {
        continue
      }

      // Shield
      if (value < 16) {
        this.actions.add([idx, 0])
        continue
      }

      const strength = Math.floor(value * 0.95)
      const decay = Math.floor(value * 0.75)

      // Propagate
      if (this.cells[idx - this.dim.x] === 0) {
        this.actions.add([idx - this.dim.x, strength])
      }

      if (this.cells[idx + 1] === 0) {
        this.actions.add([idx + 1, strength])
      }

      if (this.cells[idx + this.dim.x] === 0) {
        this.actions.add([idx + this.dim.x, strength])
      }

      if (this.cells[idx - 1] === 0) {
        this.actions.add([idx - 1, strength])
      }

      this.actions.add([idx, decay])
    }

    for (const action of this.actions) {
      this.cells[action[0]] = action[1]
    }
    this.actions.clear()

    // console.log('update', performance.now() - start)
  }

  createTickHandler(): TickAction {
    return (params) => {
      this.render(params)
      this.rateLimiter.apply(params)
    }
  }

  setSeed(x: number, y: number, value: number): void {
    // this.cells[y * this.dim.x + x] = value
    this.actions.add([y * this.dim.x + x, value])
  }
}
