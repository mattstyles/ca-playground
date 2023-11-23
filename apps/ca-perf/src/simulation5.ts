import type {TickEvent} from 'sketch-application'
import type {ApplicationInstance} from 'sketch-loop'

import {Point, wrap} from 'mathutil'
import {RateLimiter} from '@ca/rate-limiter'
// import {Trace} from '@ca/trace'
import {World} from '@ca/world'
import {createPresetKernel, KernelPresets, convolve2d} from '@ca/kernel'
import {setUpdate, setRender} from './track.ts'

type TickAction = TickEvent<ApplicationInstance>['action']
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
  rateLimiter: RateLimiter<TickAction>

  constructor() {
    this.origin = Point.of(0, 0)
    this.world = new World(4 * 8, 4 * 4) // @TODO non-square does not currently work with the current convolution -- probably this is something to do with the toroidal function and how 2d offsets get mapped to a 1d array
    this.cellSize = Point.of(50, 50)
    this.updateFps = 20

    this.actions = new Set()
    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)

    // Set initial state - blinky (more of a perf test than anything else)
    // const stride = 3
    // for (let y = 1; y < this.world.size.y; y = y + 1 + stride) {
    //   for (let x = 1; x < this.world.size.x; x = x + 1 + stride) {
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

    // Gliders!!
    const stride = 5
    const x = 3
    const y = 3
    // for (let y = 2; y < this.world.size.y - 2; y = y + stride) {
    //   for (let x = 2; x < this.world.size.x - 2; x = x + stride) {
    this.setCell(x + 1, y - 1, 1)
    this.setCell(x, y - 2, 1)
    this.setCell(x - 1, y, 1)
    this.setCell(x, y, 1)
    this.setCell(x + 1, y, 1)
    //   }
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

    // timer.track()
    setRender(performance.now() - start)
  }

  private update: TickAction = () => {
    const start = performance.now()

    let value = 0
    let neighbours = 0

    for (let idx = 0; idx < this.world.data.length; idx++) {
      value = this.world.getCell(idx)
      neighbours = convolve2d(
        kernel,
        idx,
        [this.world.size.x, this.world.size.y],
        this.world.data,
        sum,
      )

      if (value === 0) {
        if (neighbours === 3) {
          this.actions.add([idx, 1])
        }
        continue
      }

      // Dead cell
      if (neighbours < 2 || neighbours > 3) {
        this.actions.add([idx, 0])
      }
    }

    this.#applyActions()

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

  step(app: ApplicationInstance): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test
    this.update({app: app, dt: 0})
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test
    this.render({app: app, dt: 0})
  }
}

function sum(src: Array<number>): number {
  let total = 0
  for (const cell of src) {
    total = total + cell
  }
  return total
}

const kernel = createPresetKernel(KernelPresets.Moore)
