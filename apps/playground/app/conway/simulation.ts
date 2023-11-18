import type {TickAction} from 'sketch-react-loop'

import {Point, wrap} from 'mathutil'
import {RateLimiter} from '@ca/rate-limiter'
import {Trace} from '@ca/trace'
import {World} from '@ca/world'
import {createPresetKernel, KernelPresets} from '@ca/kernel'

export const trace = new Trace()

type Action = [idx: number, value: number]

interface BaseSimulation {
  origin: Point
  cellSize: Point
  updateFps: number
  world: World

  createTickHandler: () => TickAction
  setCell: (x: number, y: number, value: number) => void
  setUps: (ups: number) => void
}

export class Simulation implements BaseSimulation {
  origin: Point
  cellSize: Point
  updateFps: number
  world: World

  cells: Uint8Array
  actions: Set<Action>
  rateLimiter: RateLimiter<TickAction>

  constructor() {
    this.origin = Point.of(0, 0)
    // this.world = new World(1200, 600)
    // this.cellSize = Point.of(3, 3)
    this.world = new World(1200, 600)
    this.cellSize = Point.of(3, 3)
    this.updateFps = 20

    this.actions = new Set()
    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)

    const stride = 3
    // Set initial state - blinky (more of a perf test than anything else)
    // for (let y = stride; y < this.world.size.y; y = y + 3 + stride) {
    //   for (let x = stride; x < this.world.size.x; x = x + 3 + stride) {
    //     this.setCell(x, y - 1, 1)
    //     this.setCell(x, y, 1)
    //     this.setCell(x, y + 1, 1)
    //   }
    // }

    // Set initial state - 25%-75% random
    const p = 0.25 + Math.random() * 0.5 // 0.25...0.75
    for (let i = 0; i < this.world.data.length * p; i++) {
      this.setCell(
        Math.floor(Math.random() * this.world.size.x),
        Math.floor(Math.random() * this.world.size.y),
        1,
      )
    }

    this.#applyActions()
  }

  private render: TickAction = ({app}) => {
    const timer = trace.getTimer('render')

    app.ctx.fillStyle = '#f6f6f8'
    app.ctx.fillRect(
      this.origin.x,
      this.origin.y,
      this.world.size.x * this.cellSize.x,
      this.world.size.y * this.cellSize.y,
    )

    const padding = 1
    for (let idx = 0; idx < this.world.data.length; idx++) {
      if (this.world.getCell(idx) > 0) {
        app.ctx.fillStyle = '#2d3032'
        app.ctx.fillRect(
          (idx % this.world.size.x) * this.cellSize.x + padding,
          Math.floor(idx / this.world.size.x) * this.cellSize.y + padding,
          this.cellSize.x - padding,
          this.cellSize.y - padding,
        )
      }
    }

    // for (let y = 1; y < this.world.size.y - 1; y++) {
    //   for (let x = 1; x < this.world.size.x - 1; x++) {
    //     if (this.world.getCell(y * this.world.size.x + x)) {
    //       app.ctx.fillStyle = '#2d3032'
    //       app.ctx.fillRect(
    //         x * this.cellSize.x + padding,
    //         y * this.cellSize.y + padding,
    //         this.cellSize.x - padding,
    //         this.cellSize.y - padding,
    //       )
    //     }
    //   }
    // }

    timer.track()
  }

  private update: TickAction = () => {
    const timer = trace.getTimer('update')
    const stride = this.world.size.x
    const kernel = createPresetKernel(KernelPresets.Moore, {
      stride: stride,
    })

    let value = 0
    let neighbours = 0

    // @TODO won't handle edges
    for (let idx = 0; idx < this.world.data.length; idx++) {
      value = this.world.getCell(idx)
      neighbours = 0

      for (const im of kernel) {
        // Ignore central cell from kernel
        if (im === 0) {
          continue
        }

        if (this.world.getCell(idx + im) > 0) {
          neighbours = neighbours + 1
        }
      }

      // Dead cell
      if (value === 0 && neighbours === 3) {
        this.actions.add([idx, 1])
        continue
      }

      // Alive cell
      if (neighbours < 2 || neighbours > 3) {
        this.actions.add([idx, 0])
      }
    }

    // Update board state
    this.#applyActions()

    timer.track()
  }

  #applyActions(): void {
    for (const action of this.actions) {
      this.world.setCell(action[0], action[1])
    }
    this.actions.clear()
  }

  createTickHandler(): TickAction {
    return (params) => {
      this.render(params)
      this.rateLimiter.apply(params)
    }
  }

  setCell(x: number, y: number, value: number): void {
    this.actions.add([y * this.world.size.x + x, value])
  }

  setUps(ups: number): void {
    this.updateFps = ups
    this.rateLimiter.setFps(ups)
    trace.set('updateFps', ups)
  }

  step(app): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test
    this.update({app: app, dt: 0})
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test
    this.render({app: app, dt: 0})
  }
}

function setInitialState(buffer: Uint8ClampedArray): void {
  buffer[2 * 50 + 2] = 1
  buffer[2 * 50 + 3] = 1
  buffer[2 * 50 + 4] = 1
}
