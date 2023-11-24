import type {TickEvent, TickHandler} from 'sketch-application'
import type {ApplicationInstance} from 'sketch-loop'

import {Point, wrap} from 'mathutil'
import {RateLimiter} from '@ca/rate-limiter'
// import {Trace} from '@ca/trace'
import {World} from '@ca/world'
import {createPresetKernel, KernelPresets} from '@ca/kernel'
import {setUpdate, setRender} from './tools/track.ts'
import {setInitialState, size, cellSize} from './tools/init.ts'

type TickAction = TickEvent<ApplicationInstance>['action']

// export const trace = new Trace()

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

  actions: Set<Action>
  rateLimiter: RateLimiter<TickAction>

  constructor() {
    this.origin = Point.of(0, 0)
    // const stride = 5
    this.world = new World(size.x, size.y)
    this.cellSize = Point.of(cellSize.x, cellSize.y)
    this.updateFps = 20

    this.actions = new Set()
    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)

    setInitialState('blinky', this.world)

    // Set initial state - blinky (more of a perf test than anything else)
    // for (let y = (stride * 0.5) | 0; y < this.world.size.y; y = y + stride) {
    //   for (let x = (stride * 0.5) | 0; x < this.world.size.x; x = x + stride) {
    //     this.setCell(x, y - 1, 1)
    //     this.setCell(x, y, 1)
    //     this.setCell(x, y + 1, 1)
    //   }
    // }

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
  }

  private render: TickAction = ({app}) => {
    const start = performance.now()

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

    // timer.track()
    setRender(performance.now() - start)
  }

  private update: TickAction = () => {
    const start = performance.now()

    // const timer = trace.getTimer('update')
    // const stride = this.world.size.x
    // const kernel = createPresetKernel(KernelPresets.Moore, {
    //   stride: stride,
    // })

    let value = 0
    let neighbours = 0

    // @TODO won't handle edges
    for (let idx = 0; idx < this.world.data.length; idx++) {
      value = this.world.getCell(idx)
      // neighbours = 0

      // Iterate over the kernel
      // for (const im of kernel) {
      //   // Ignore central cell from kernel
      //   if (im === 0) {
      //     continue
      //   }

      //   if (this.world.getCell(idx + im) > 0) {
      //     neighbours = neighbours + 1
      //   }
      // }

      neighbours = this.world.getNumNeighbours(idx)

      // Dead cell --> this is the slowdown right here
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
    // this.#applyActions()
    for (const action of this.actions) {
      this.world.setCell(action[0], action[1])
    }
    this.actions.clear()

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
    // trace.set('updateFps', ups)
  }

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
