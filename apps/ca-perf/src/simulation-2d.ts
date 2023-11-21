import type {TickEvent} from 'sketch-application'
import type {ApplicationInstance} from 'sketch-loop'

import {Point, wrap} from 'mathutil'
import {RateLimiter} from '@ca/rate-limiter'
// import {Trace} from '@ca/trace'
import {World} from '@ca/world'
import {createPresetKernel, KernelPresets} from '@ca/kernel'
import {setUpdate, setRender} from './track.ts'

type TickAction = TickEvent<ApplicationInstance>['action']
type Action = [[x: number, y: number], value: number]

interface BaseSimulation {
  origin: Point
  cellSize: Point
  updateFps: number
  cells: Array<Array<number>>

  createTickHandler: () => TickAction
  setCell: (x: number, y: number, value: number) => void
  setUps: (ups: number) => void
}

export class Simulation implements BaseSimulation {
  origin: Point
  cellSize: Point
  updateFps: number
  cells: Array<Array<number>>

  actions: Set<Action>
  rateLimiter: RateLimiter<TickAction>

  constructor() {
    this.origin = Point.of(0, 0)
    this.cells = Array.from({length: 600}).map((_) => {
      return Array.from({length: 1200}).map((__) => {
        return 0
      })
    })
    this.cellSize = Point.of(3, 3)
    this.updateFps = 20

    this.actions = new Set()
    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)

    // Set initial state - blinky (more of a perf test than anything else)
    const stride = 3
    for (let y = stride; y < this.cells.length; y = y + 3 + stride) {
      for (let x = stride; x < this.cells[0].length; x = x + 3 + stride) {
        this.setCell(x, y - 1, 1)
        this.setCell(x, y, 1)
        this.setCell(x, y + 1, 1)
      }
    }

    // Set initial state - 25%-75% random
    // const p = 0.25 + Math.random() * 0.5 // 0.25...0.75
    // for (let i = 0; i < this.cells.length * this.cells[0].length * p; i++) {
    //   this.setCell(
    //     Math.floor(Math.random() * this.cells[0].length),
    //     Math.floor(Math.random() * this.cells.length),
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

    setRender(performance.now() - start)
  }

  private update: TickAction = () => {
    const start = performance.now()

    const stride = this.cells[0].length
    const kernel = createPresetKernel(KernelPresets.Moore, {
      stride: stride,
    })

    let value = 0
    let neighbours = 0

    for (let y = 0; y < this.cells.length; y++) {
      for (let x = 0; x < this.cells[y].length; x++) {
        value = this.cells[y][x]
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

        neighbours = this.getNumNeighbours(x, y)

        if (value === 1) {
          if (neighbours < 2 || neighbours > 3) {
            // Kill cell
            this.actions.add([[x, y], 0])
          }
          continue
        }

        // Dead cell
        if (neighbours === 3) {
          // Birth cell
          this.actions.add([[x, y], 1])
        }
      }
    }

    // Update board state
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

  // Non-toroidal (i.e. no wrapping)
  // For speed we're going to avoid allocate and do things manually
  private getNumNeighbours(x: number, y: number): number {
    if (y === 0) {
      // Top-left corner
      if (x === 0) {
        return (
          this.cells[y][x + 1] + this.cells[y + 1][x] + this.cells[y + 1][x + 1]
        )
      }

      // Top-right corner
      if (x === this.cells[0].length - 1) {
        return (
          this.cells[y][x - 1] + this.cells[y + 1][x] + this.cells[y + 1][x - 1]
        )
      }

      // Top edge
      return (
        this.cells[y][x - 1] +
        this.cells[y][x + 1] +
        this.cells[y + 1][x - 1] +
        this.cells[y + 1][x] +
        this.cells[y + 1][x + 1]
      )
    }

    if (y === this.cells.length - 1) {
      // Bottom-left corner
      if (x === 0) {
        return (
          this.cells[y - 1][x + 1] + this.cells[y - 1][x] + this.cells[y][x + 1]
        )
      }

      // Bottom-right corner
      if (x === this.cells[0].length - 1) {
        return (
          this.cells[y - 1][x - 1] + this.cells[y - 1][x] + this.cells[y][x - 1]
        )
      }

      // Bottom edge
      return (
        this.cells[y - 1][x - 1] +
        this.cells[y - 1][x] +
        this.cells[y - 1][x + 1] +
        this.cells[y][x - 1] +
        this.cells[y][x + 1]
      )
    }

    // Left edge
    if (x === 0) {
      return (
        this.cells[y - 1][x] +
        this.cells[y - 1][x + 1] +
        this.cells[y][x + 1] +
        this.cells[y + 1][x] +
        this.cells[y + 1][x + 1]
      )
    }

    // Right edge
    if (x === this.cells[0].length - 1) {
      return (
        this.cells[y - 1][x - 1] +
        this.cells[y - 1][x] +
        this.cells[y][x - 1] +
        this.cells[y + 1][x - 1] +
        this.cells[y + 1][x]
      )
    }

    // Fall through, i.e all 8 neighbours
    return (
      this.cells[y - 1][x - 1] +
      this.cells[y - 1][x] +
      this.cells[y - 1][x + 1] +
      this.cells[y][x - 1] +
      this.cells[y][x + 1] +
      this.cells[y + 1][x - 1] +
      this.cells[y + 1][x] +
      this.cells[y + 1][x + 1]
    )
  }
}

function setInitialState(buffer: Uint8ClampedArray): void {
  buffer[2 * 50 + 2] = 1
  buffer[2 * 50 + 3] = 1
  buffer[2 * 50 + 4] = 1
}
