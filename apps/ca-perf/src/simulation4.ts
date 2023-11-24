import type {ApplicationInstance} from 'sketch-loop'

import {World} from '@ca/world'

import {Point} from 'mathutil'
import {setUpdate, setRender} from './tools/track.ts'
import {setInitialState, size, cellSize} from './tools/init.ts'

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

type Action = [idx: number, flag: boolean]

interface CASimulation {
  origin: Point
  cellSize: Point
  updateFps: number

  // Methods
  getEvents: () => Record<string, TickHandler>
}

export class Simulation implements CASimulation {
  origin: Point
  cellSize: Point
  updateFps: number
  actions: Set<Action>
  points: Array<Point>
  world: World

  constructor() {
    this.origin = new Point(0, 0)

    this.world = new World(size.x, size.y)
    this.cellSize = Point.of(cellSize.x, cellSize.y)
    this.updateFps = 20
    this.actions = new Set()

    // Cache Points for rendering
    this.points = []
    for (let y = 0; y < this.world.size.y; y++) {
      for (let x = 0; x < this.world.size.x; x++) {
        this.points.push(Point.of(x, y))
      }
    }

    setInitialState('blinky', this.world)
  }

  getEvents() {
    return {
      render: this.render.bind(this),
      update: rateLimiter(this.updateFps, this.update.bind(this)),
    }
  }

  applyEvents(app: ApplicationInstance) {
    app.on({
      type: 'tick',
      action: this.render.bind(this),
    })
    app.on({
      type: 'tick',
      action: rateLimiter(this.updateFps, this.update.bind(this)),
    })
  }

  toggleCell(x: number, y: number, flag: boolean) {
    this.world.data[this.to1d(x, y)] = Number(flag)
  }

  private to1d(x: number, y: number) {
    return y * this.world.size.x + x
  }
  private from1d(x: number) {
    return Point.of(x % this.world.size.x, (x / this.world.size.x) | 0)
  }

  // Non-toroidal (i.e. no wrapping)
  // For speed we're going to avoid allocate and do things manually
  private getNumNeighbours(idx: number) {
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
        this.world.data[idx - 1] +
        this.world.data[idx + this.world.size.x - 1] +
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

  private render({app}: TickParams): void {
    const start = performance.now()

    const padding = 1

    app.ctx.fillStyle = '#f6f6f8'
    app.ctx.fillRect(
      this.origin.x,
      this.origin.y,
      this.world.size.x * this.cellSize.x,
      this.world.size.y * this.cellSize.y,
    )

    app.ctx.fillStyle = '#2d3032'

    for (let idx = 0; idx < this.world.data.length; idx++) {
      if (this.world.data[idx] === 1) {
        app.ctx.fillRect(
          this.points[idx].x * this.cellSize.x + padding,
          this.points[idx].y * this.cellSize.y + padding,
          this.cellSize.x - padding,
          this.cellSize.y - padding,
        )
      }
    }

    setRender(performance.now() - start)
  }

  private update(): void {
    const start = performance.now()

    this.world.iterate()

    setUpdate(performance.now() - start)
  }
}
