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

setHeading('Simulation K2')

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

    this.world = new World(size.x, size.y)
    this.cellSize = Point.of(cellSize.x, cellSize.y)
    this.updateFps = 20

    this.actions = new Set()
    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)

    setInitialState(this.world)

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
    /**
     * Creating this buffer once per tick is significantly better than within every convolution
     */
    const buffer: Array<number> = Array.from({length: kernel.length})

    for (let idx = 0; idx < this.world.data.length; idx++) {
      value = this.world.getCell(idx)
      neighbours = convolve2d(
        kernel,
        idx,
        [this.world.size.x, this.world.size.y],
        this.world.data,
        sum,
        buffer,
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

type Kernel<T> = Array<[number, T]>
type KPoint = [x: number, y: number]

const kernel = createPresetKernel(KernelPresets.Moore) as Kernel<KPoint>

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
  s: KPoint,
  src: ArrayLike<number>,
  buffer: Array<number>,
): Array<number> {
  for (let i = 0; i < k.length; i++) {
    const target = applyToroidalPermutedOffset(
      idx % s[0],
      (idx / s[0]) | 0,
      k[i][1][0],
      k[i][1][1],
      s[0],
      s[1],
    )
    buffer[i] = src[target] * k[i][0]
  }
  return buffer
}

function convolve2d<T>(
  k: Kernel<KPoint>,
  idx: number,
  s: KPoint,
  src: ArrayLike<number>,
  reducer: (src: Array<number>) => T,
  buffer: Array<number>,
): T {
  return reducer(applyKernel2d(k, idx, s, src, buffer))
}
