import type {TickEvent} from 'sketch-application'
import type {ApplicationInstance} from 'sketch-loop'

import {Point} from 'mathutil'
import {RateLimiter} from '@ca/rate-limiter'
// import {Trace} from '@ca/trace'
import {World} from '@ca/world'
import {createPresetKernel, KernelPresets} from '@ca/kernel'
import {setUpdate, setRender, setHeading} from '../tools/track.ts'
import {setInitialState, size, cellSize} from '../tools/init.ts'

type TickAction = TickEvent<ApplicationInstance>['action']
type Action = [idx: number, value: number]

setHeading('Simulation K5')

/**
 * Optimise to pass a reusable buffer to the convolution rather than recreate each tick
 */

export class Simulation {
  origin: Point
  cellSize: Point
  updateFps: number
  world: World
  swap: Uint8Array

  rateLimiter: RateLimiter<TickAction>

  constructor() {
    this.origin = Point.of(0, 0)

    this.world = new World(size.x, size.y)
    this.cellSize = Point.of(cellSize.x, cellSize.y)
    this.updateFps = 20

    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)

    this.swap = new Uint8Array(size.x * size.y)

    setInitialState(this.world, 'blinky')

    // Fill swap buffer with initial state
    for (const i in this.world.data) {
      this.swap[i] = this.world.data[i]
    }

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
        this.world.size.x,
        this.world.size.y,
        this.world.data,
      )

      if (value === 0) {
        if (neighbours === 3) {
          // this.actions.add([idx, 1])
          this.swap[idx] = 1
        }
        continue
      }

      // Dead cell
      if (neighbours < 2 || neighbours > 3) {
        // this.actions.add([idx, 0])
        this.swap[idx] = 0
      }
    }

    this.#applyActions()

    // timer.track()
    setUpdate(performance.now() - start)
  }

  #applyActions(): void {
    // for (const action of this.actions) {
    //   this.world.setCell(action[0], action[1])
    // }
    // this.actions.clear()

    // This is just wrong, it isn't a swap, its an overwrite
    // const temp = this.world.data
    // this.world.data = this.swap
    // this.swap = temp

    // Creating a new copy seems wasteful, and it probably is, but it is faster than using a Set for mutations (more memory though).
    // This creates a new buffer per update frame as well, and it is still marginally faster. An array of mutations might be better than a Set?
    this.world.data = Uint8Array.from(this.swap)
  }

  createTickHandler(): TickAction {
    return (params) => {
      this.render(params)
      this.rateLimiter.apply(params)
    }
  }

  // setCell(x: number, y: number, value: number): void {
  // this.actions.add([y * this.world.size.x + x, value])
  // }

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

type Kernel<T> = Array<[number, T]>
type KPoint = [x: number, y: number]

const kernel: Kernel<KPoint> = [
  [1, [-1, -1]],
  [1, [0, -1]],
  [1, [1, -1]],
  [1, [-1, 0]],
  // [0, [0, 0]],
  [1, [1, 0]],
  [1, [-1, 1]],
  [1, [0, 1]],
  [1, [1, 1]],
]

function applyToroidalPermutedOffset(
  x: number,
  y: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
): number {
  return (
    // eslint-disable-next-line no-nested-ternary -- wrapping
    (x < -ox ? w + ox : x >= w - ox ? ox - 1 : x + ox) +
    // eslint-disable-next-line no-nested-ternary -- wrapping
    (y < -oy ? h + oy : y >= h - oy ? oy - 1 : y + oy) * w
  )
}

function applyKernel2d(
  k: Kernel<KPoint>,
  idx: number,
  w: number,
  h: number,
  src: ArrayLike<number>,
): number {
  let total = 0
  // eslint-disable-next-line @typescript-eslint/prefer-for-of -- for loop is fine
  for (let i = 0; i < k.length; i++) {
    const point = k[i][1]
    const target = applyToroidalPermutedOffset(
      idx % w,
      (idx / w) | 0,
      point[0],
      point[1],
      w,
      h,
    )
    total = src[target] + total
  }
  return total
}

function convolve2d(
  k: Kernel<KPoint>,
  idx: number,
  w: number,
  h: number,
  src: ArrayLike<number>,
): number {
  return applyKernel2d(k, idx, w, h, src)
}
