// import type {Application} from 'sketch-react-loop'
import type {ApplicationInstance} from 'sketch-loop'
import type {TickHandler} from 'sketch-application'
import type {BaseWorld} from '@ca/world'

import {Point} from 'mathutil'
import {RateLimiter} from '@ca/rate-limiter'
import {Trace} from '@ca/trace'
import {World} from '@ca/world'
import {
  type Kernel2d,
  createPresetKernel,
  KernelPresets,
  convolveGol,
} from '@ca/kernel'

export const trace = new Trace()

type Action = [idx: number, value: number]

interface BaseSimulation {
  origin: Point
  cellSize: Point
  updateFps: number
  world: World

  createTickHandler: () => TickHandler<ApplicationInstance>
  setCell: (x: number, y: number, value: number) => void
  setUps: (ups: number) => void
}

export class Simulation implements BaseSimulation {
  origin: Point
  cellSize: Point
  updateFps: number
  world: World

  actions: Set<Action>
  rateLimiter: RateLimiter<TickHandler<ApplicationInstance>>

  constructor() {
    this.origin = Point.of(0, 0)
    this.world = new World(1000, 600)
    this.cellSize = Point.of(3, 3)
    this.updateFps = 20

    this.actions = new Set()
    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)

    setInitialState('random', this.world)
    this.#applyActions()

    // Set trace
    trace.set('World size', `[${this.world.size.x}, ${this.world.size.y}]`)
    trace.set('Cells', this.world.data.length)
  }

  private render: TickHandler<ApplicationInstance> = ({app}) => {
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
    //         this.world.dataize.x - padding,
    //         this.world.dataize.y - padding,
    //       )
    //     }
    //   }
    // }

    timer.track()
  }

  private update: TickHandler<ApplicationInstance> = () => {
    const timer = trace.getTimer('update')

    let value = 0
    let neighbours = 0

    // @TODO won't handle edges
    for (let idx = 0; idx < this.world.data.length; idx++) {
      value = this.world.getCell(idx)

      // This is about 4-5ms faster
      // neighbours = this.world.getNumNeighbours(idx)

      // This is so much slower...
      neighbours = convolveGol(idx, this.world.size.pos, this.world.data)

      // Starvation and competition
      if (value === 1) {
        if (neighbours < 2 || neighbours > 3) {
          this.actions.add([idx, 0])
        }
        continue
      }

      // Birth
      if (neighbours === 3) {
        this.actions.add([idx, 1])
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

  createTickHandler(): TickHandler<ApplicationInstance> {
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

function setInitialState(
  strategy: keyof typeof initialStateStrategy,
  world: BaseWorld,
): void {
  initialStateStrategy[strategy](world)
}

const initialStateStrategy = {
  // Set initial state - blinky (more of a perf test than anything else)
  blinky: (world: BaseWorld) => {
    const stride = 3
    for (let y = stride; y < world.size.y; y = y + 3 + stride) {
      for (let x = stride; x < world.size.x; x = x + 3 + stride) {
        world.setCell(x, y - 1, 1)
        world.setCell(x, y, 1)
        world.setCell(x, y + 1, 1)
      }
    }
  },
  // Set initial state - 25%-75% random
  random: (world: BaseWorld) => {
    const p = 0.25 + Math.random() * 0.5 // 0.25...0.75
    for (let i = 0; i < world.data.length * p; i++) {
      world.setCell(
        Math.floor(Math.random() * world.size.x),
        Math.floor(Math.random() * world.size.y),
        1,
      )
    }

    trace.set('Initial random population:', p.toFixed(3))
  },
}
