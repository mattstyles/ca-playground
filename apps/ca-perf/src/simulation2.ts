import type {TickEvent} from 'sketch-application'
import type {ApplicationInstance} from 'sketch-loop'

import {Point, wrap} from 'mathutil'
import {RateLimiter} from '@ca/rate-limiter'
// import {Trace} from '@ca/trace'
import {World} from '@ca/world'
import {createPresetKernel, KernelPresets} from '@ca/kernel'
import {setUpdate, setRender} from './track.ts'

type TickAction = TickEvent<ApplicationInstance>['action']

interface TickParams {
  app: ApplicationInstance
  dt: number
}
type TickHandler = (params: TickParams) => void
function rateLimiter(fps: number, cb: TickHandler): TickHandler {
  const budget = 1000 / fps
  let last = 0
  return function rateLimited(params) {
    last = last + params.dt
    if (last > budget) {
      cb(params)
      last = last - budget
    }
  }
}

type Action = [idx: number, value: number]

interface BaseSimulation {
  origin: Point
  cellSize: Point
  updateFps: number
  world: World

  createTickHandler: () => TickAction
  setCell: (x: number, y: number, value: number) => void
  // setUps: (ups: number) => void
}

export class Simulation implements BaseSimulation {
  origin: Point
  cellSize: Point
  updateFps: number
  world: World

  actions: Set<Action>
  // rateLimiter: RateLimiter<TickAction>

  constructor() {
    this.origin = Point.of(0, 0)
    // this.world = new World(1200, 600)
    // this.world.cellsize = Point.of(3, 3)
    this.world = new World(1200, 600)
    this.cellSize = Point.of(3, 3)
    this.updateFps = 20

    this.actions = new Set()
    // this.rateLimiter = new RateLimiter(this.updateFps)
    // this.rateLimiter.register(this.update)

    // Set initial state - blinky (more of a perf test than anything else)
    const stride = 3
    for (let y = stride; y < this.world.size.y; y = y + 3 + stride) {
      for (let x = stride; x < this.world.size.x; x = x + 3 + stride) {
        this.setCell(x, y - 1, 1)
        this.setCell(x, y, 1)
        this.setCell(x, y + 1, 1)
      }
    }

    // Set initial state - 25%-75% random
    // const p = 0.25 + Math.random() * 0.5 // 0.25...0.75
    // for (let i = 0; i < this.world.data.length * p; i++) {
    //   this.setCell(
    //     Math.floor(Math.random() * this.world.size.x),
    //     Math.floor(Math.random() * this.world.size.y),
    //     1,
    //   )
    // }

    this.#applyActions()

    // Set trace
    // trace.set('World size', `[${this.world.size.x}, ${this.world.size.y}]`)
    // trace.set('Cells', this.world.data.length)
  }

  private render: TickAction = ({app}) => {
    const start = performance.now()
    // const timer = trace.getTimer('render')

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

    // timer.track()
    setRender(performance.now() - start)
  }

  private update: TickAction = () => {
    // const timer = trace.getTimer('update')
    const start = performance.now()
    // const stride = this.world.size.x
    // const kernel = createPresetKernel(KernelPresets.Moore, {
    //   stride: stride,
    // })

    this.world.iterate()

    // timer.track()
    setUpdate(performance.now() - start)
  }

  #applyActions(): void {
    for (const action of this.actions) {
      this.world.setCell(action[0], action[1])
    }
    this.actions.clear()
  }

  createTickHandler(): TickAction {
    const fn = rateLimiter(20, this.update.bind(this))
    return (params) => {
      this.render(params)

      // No difference, slow down is not caused by ratelimiter class
      // this.rateLimiter.apply(params)
      fn(params)
    }
  }

  setCell(x: number, y: number, value: number): void {
    this.actions.add([y * this.world.size.x + x, value])
  }

  // setUps(ups: number): void {
  //   this.updateFps = ups
  //   this.rateLimiter.setFps(ups)
  //   // trace.set('updateFps', ups)
  // }

  step(app: ApplicationInstance): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test
    this.update({app: app, dt: 0})
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test
    this.render({app: app, dt: 0})
  }

  // Non-toroidal (i.e. no wrapping)
  // For speed we're going to avoid allocate and do things manually
  private getNumNeighbours(idx: number): number {
    // Top-left corner
    if (idx === 0) {
      return (
        this.world.data[idx + 1] +
        this.world.data[idx + this.world.size.x] +
        this.world.data[idx + this.world.size.x + 1]
      )
    }

    // Top-right corner
    if (idx === this.world.size.x - 1) {
      return (
        this.world.data[idx + this.world.size.x - 1] +
        this.world.data[idx - 1] +
        this.world.data[idx + this.world.size.x]
      )
    }

    // Bottom-left corner
    if (idx === this.world.data.length - this.world.size.x) {
      return (
        this.world.data[idx - this.world.size.x] +
        this.world.data[idx - this.world.size.x + 1] +
        this.world.data[idx + 1]
      )
    }

    // Bottom-right corner
    if (idx === this.world.data.length - 1) {
      return (
        this.world.data[idx - this.world.size.x - 1] +
        this.world.data[idx - this.world.size.x] +
        this.world.data[idx - 1]
      )
    }

    // Top edge
    if (idx < this.world.size.x) {
      return (
        this.world.data[idx - 1] +
        this.world.data[idx + 1] +
        this.world.data[idx + this.world.size.x - 1] +
        this.world.data[idx + this.world.size.x] +
        this.world.data[idx + this.world.size.x + 1]
      )
    }

    // Bottom edge
    if (idx > this.world.data.length - this.world.size.x) {
      return (
        this.world.data[idx - this.world.size.x - 1] +
        this.world.data[idx - this.world.size.x] +
        this.world.data[idx - this.world.size.x + 1] +
        this.world.data[idx - 1] +
        this.world.data[idx + 1]
      )
    }

    // Left edge
    if (idx % this.world.size.x === 0) {
      return (
        this.world.data[idx - this.world.size.x] +
        this.world.data[idx - this.world.size.x + 1] +
        this.world.data[idx + 1] +
        this.world.data[idx + this.world.size.x] +
        this.world.data[idx + this.world.size.x + 1]
      )
    }

    // Right edge
    if ((idx - (this.world.size.x - 1)) % this.world.size.x === 0) {
      return (
        this.world.data[idx - this.world.size.x - 1] +
        this.world.data[idx - this.world.size.x] +
        this.world.data[idx - 1] +
        this.world.data[idx + this.world.size.x - 1] +
        this.world.data[idx + this.world.size.x]
      )
    }

    // Fall through, i.e all 8 neighbours
    return (
      this.world.data[idx - this.world.size.x - 1] +
      this.world.data[idx - this.world.size.x] +
      this.world.data[idx - this.world.size.x + 1] +
      this.world.data[idx - 1] +
      this.world.data[idx + 1] +
      this.world.data[idx + this.world.size.x - 1] +
      this.world.data[idx + this.world.size.x] +
      this.world.data[idx + this.world.size.x + 1]
    )
  }
}

function setInitialState(buffer: Uint8ClampedArray): void {
  buffer[2 * 50 + 2] = 1
  buffer[2 * 50 + 3] = 1
  buffer[2 * 50 + 4] = 1
}
