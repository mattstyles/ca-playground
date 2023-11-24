import type {TickEvent} from 'sketch-application'
import type {ApplicationInstance} from 'sketch-loop'

import {Point} from 'mathutil'
import {RateLimiter} from '@ca/rate-limiter'
import {createPresetKernel, KernelPresets} from '@ca/kernel'
import {setUpdate, setRender, setHeading} from '../tools/track.ts'
import {size, cellSize, period} from '../tools/init.ts'

type TickAction = TickEvent<ApplicationInstance>['action']
type Action = [[x: number, y: number], value: number]

setHeading('Simulation K3 - 2d')

export class Simulation {
  origin: Point
  cellSize: Point
  updateFps: number
  cells: Array<Array<number>>

  actions: Set<Action>
  rateLimiter: RateLimiter<TickAction>

  constructor() {
    this.origin = Point.of(0, 0)

    this.cells = Array.from({length: size.y}).map((_) => {
      return Array.from({length: size.x}).map((__) => {
        return 0
      })
    })
    this.cellSize = Point.of(cellSize.x, cellSize.y)
    this.updateFps = 20

    this.actions = new Set()
    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)

    // Set initial state - blinky (more of a perf test than anything else)
    for (let y = 2; y < this.cells.length; y = y + period) {
      for (let x = 2; x < this.cells[0].length; x = x + period) {
        this.setCell(x, y - 1, 1)
        this.setCell(x, y, 1)
        this.setCell(x, y + 1, 1)
      }
    }

    this.#applyActions()
  }

  private render: TickAction = ({app}) => {
    const start = performance.now()

    app.ctx.fillStyle = '#f6f6f8'
    app.ctx.fillRect(
      this.origin.x,
      this.origin.y,
      this.cells[0].length * this.cellSize.x,
      this.cells.length * this.cellSize.y,
    )

    const padding = 1
    for (let y = 0; y < this.cells.length; y++) {
      for (let x = 0; x < this.cells[y].length; x++) {
        const state = this.cells[y][x]

        if (state > 0) {
          app.ctx.fillStyle = '#2d3032'
          app.ctx.fillRect(
            x * this.cellSize.x + padding,
            y * this.cellSize.y + padding,
            this.cellSize.x - padding,
            this.cellSize.y - padding,
          )
        }
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

    for (let y = 0; y < this.cells.length; y++) {
      for (let x = 0; x < this.cells[y].length; x++) {
        value = this.cells[y][x]

        neighbours = convolve2d(
          kernel,
          x,
          y,
          size.x,
          size.y,
          this.cells,
          sum,
          buffer,
        )

        if (value === 0) {
          if (neighbours === 3) {
            this.actions.add([[x, y], 1])
          }
          continue
        }

        // Dead cell
        if (neighbours < 2 || neighbours > 3) {
          this.actions.add([[x, y], 0])
        }
      }
    }

    this.#applyActions()

    setUpdate(performance.now() - start)
  }

  #applyActions(): void {
    for (const action of this.actions) {
      this.cells[action[0][1]][action[0][0]] = action[1]
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
    this.actions.add([[x, y], value])
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

function applyKernel2d(
  k: Kernel<KPoint>,
  x: number,
  y: number,
  w: number,
  h: number,
  src: Array<Array<number>>,
  buffer: Array<number>,
): Array<number> {
  for (let i = 0; i < k.length; i++) {
    const [weight, point] = k[i]

    buffer[i] =
      src[
        // eslint-disable-next-line no-nested-ternary -- test
        y < -point[1]
          ? h + point[1]
          : y >= h - point[1]
          ? point[1] - 1
          : y + point[1]
      ][
        // eslint-disable-next-line no-nested-ternary -- test
        x < -point[0]
          ? w + point[0]
          : x >= w - point[0]
          ? point[0] - 1
          : x + point[0]
      ] * weight
  }
  return buffer
}

function convolve2d<T>(
  k: Kernel<KPoint>,
  x: number,
  y: number,
  w: number,
  h: number,
  src: Array<Array<number>>,
  reducer: (src: Array<number>) => T,
  buffer: Array<number>,
): T {
  return reducer(applyKernel2d(k, x, y, w, h, src, buffer))
}
