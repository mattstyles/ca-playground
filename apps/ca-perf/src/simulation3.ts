import type {ApplicationInstance} from 'sketch-loop'

// import {Point, Rect} from 'mathutil'
// import {Point, Rect} from './struct'
// import {debugState} from './debug'

export class Point {
  x: number
  y: number
  static of(x: number, y: number) {
    return new Point(x, y)
  }
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

export class Rect {
  x1: number
  y1: number
  x2: number
  y2: number
  static of(x1: number, y1: number, x2: number, y2: number) {
    return new Rect(x1, y1, x2, y2)
  }
  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
  }

  contains(point: Point) {
    return (
      point.x >= this.x1 &&
      point.y >= this.y1 &&
      point.x < this.x2 &&
      point.y < this.y2
    )
  }
}

type TickParams = {app: ApplicationInstance; dt: number}
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
  dim: Point
  cellSize: Point
  board: Rect
  updateFps: number

  // Methods
  getEvents(): Record<string, TickHandler>
}

export class Simulation implements CASimulation {
  origin: Point
  dim: Point
  cellSize: Point
  board: Rect
  updateFps: number
  cells: Uint8Array
  actions: Set<Action>
  points: Array<Point>

  constructor() {
    this.origin = new Point(0, 0)
    this.dim = Point.of(1200, 600)
    this.cellSize = Point.of(3, 3)
    this.board = Rect.of(
      this.origin.x,
      this.origin.y,
      this.origin.x + this.dim.x,
      this.origin.y + this.dim.y,
    )
    this.updateFps = 20

    const buffer = new ArrayBuffer(this.dim.x * this.dim.y)
    this.cells = new Uint8Array(buffer)

    this.actions = new Set()

    // Cache Points for rendering
    this.points = []
    for (let y = 0; y < this.dim.y; y++) {
      for (let x = 0; x < this.dim.x; x++) {
        this.points.push(Point.of(x, y))
      }
    }

    // Initial state
    const stride = 3
    for (let y = stride; y < this.dim.y; y = y + 3 + stride) {
      for (let x = stride; x < this.dim.x; x = x + 3 + stride) {
        this.toggleCell(x, y - 1, true)
        this.toggleCell(x, y, true)
        this.toggleCell(x, y + 1, true)
        // num = num + 3
      }
    }
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
    this.cells[this.to1d(x, y)] = Number(flag)
  }

  private to1d(x: number, y: number) {
    return y * this.dim.x + x
  }
  private from1d(x: number) {
    return Point.of(x % this.dim.x, (x / this.dim.x) | 0)
  }

  // Non-toroidal (i.e. no wrapping)
  // For speed we're going to avoid allocate and do things manually
  private getNumNeighbours(idx: number) {
    // Top-left corner
    if (idx === 0) {
      return (
        this.cells[idx + 1] +
        this.cells[idx + this.dim.x] +
        this.cells[idx + this.dim.x + 1]
      )
    }

    // Top-right corner
    if (idx === this.dim.x - 1) {
      return (
        this.cells[idx - 1] +
        this.cells[idx + this.dim.x - 1] +
        this.cells[idx + this.dim.x]
      )
    }

    // Bottom-left corner
    if (idx === this.cells.length - this.dim.x) {
      return (
        this.cells[idx - this.dim.x] +
        this.cells[idx - this.dim.x + 1] +
        this.cells[idx + 1]
      )
    }

    // Bottom-right corner
    if (idx === this.cells.length - 1) {
      return (
        this.cells[idx - this.dim.x - 1] +
        this.cells[idx - this.dim.x] +
        this.cells[idx - 1]
      )
    }

    // Top edge
    if (idx < this.dim.x) {
      return (
        this.cells[idx - 1] +
        this.cells[idx + 1] +
        this.cells[idx + this.dim.x - 1] +
        this.cells[idx + this.dim.x] +
        this.cells[idx + this.dim.x + 1]
      )
    }

    // Bottom edge
    if (idx > this.cells.length - this.dim.x) {
      return (
        this.cells[idx - this.dim.x - 1] +
        this.cells[idx - this.dim.x] +
        this.cells[idx - this.dim.x + 1] +
        this.cells[idx - 1] +
        this.cells[idx + 1]
      )
    }

    // Left edge
    if (idx % this.dim.x === 0) {
      return (
        this.cells[idx - this.dim.x] +
        this.cells[idx - this.dim.x + 1] +
        this.cells[idx + 1] +
        this.cells[idx + this.dim.x] +
        this.cells[idx + this.dim.x + 1]
      )
    }

    // Right edge
    if ((idx - (this.dim.x - 1)) % this.dim.x === 0) {
      return (
        this.cells[idx - this.dim.x - 1] +
        this.cells[idx - this.dim.x] +
        this.cells[idx - 1] +
        this.cells[idx + this.dim.x - 1] +
        this.cells[idx + this.dim.x]
      )
    }

    // Fall through, i.e all 8 neighbours
    return (
      this.cells[idx - this.dim.x - 1] +
      this.cells[idx - this.dim.x] +
      this.cells[idx - this.dim.x + 1] +
      this.cells[idx - 1] +
      this.cells[idx + 1] +
      this.cells[idx + this.dim.x - 1] +
      this.cells[idx + this.dim.x] +
      this.cells[idx + this.dim.x + 1]
    )
  }

  private render({app}: TickParams) {
    const start = performance.now()

    const padding = 1

    app.ctx.fillStyle = '#f6f6f8'
    app.ctx.fillRect(
      this.origin.x,
      this.origin.y,
      this.dim.x * this.cellSize.x,
      this.dim.y * this.cellSize.y,
    )

    app.ctx.fillStyle = '#2d3032'
    // for (let [idx, value] of this.cells.entries()) {
    //   if (value === 1) {
    //     // We could pool all of the points easy enough, at a cost of memory, but save on the GC
    //     const {x, y} = this.from1d(idx)
    //     app.ctx.fillRect(
    //       x * this.cellSize.x + padding,
    //       y * this.cellSize.y + padding,
    //       this.cellSize.x - padding,
    //       this.cellSize.y - padding
    //     )
    //   }
    // }

    for (let idx = 0; idx < this.cells.length; idx++) {
      if (this.cells[idx] === 1) {
        // const {x, y} = this.from1d(idx)
        // const {x, y} = this.points[idx]
        app.ctx.fillRect(
          this.points[idx].x * this.cellSize.x + padding,
          this.points[idx].y * this.cellSize.y + padding,
          this.cellSize.x - padding,
          this.cellSize.y - padding,
        )
      }
    }

    // debugState.renderTime = performance.now() - start
  }

  private update() {
    const start = performance.now()

    // console.log('')
    // console.log('>>')

    let neighboursAlive = 0
    // Naive, check every cell neighbourhood
    for (let [idx, value] of this.cells.entries()) {
      neighboursAlive = this.getNumNeighbours(idx)

      // Rules
      // Alive cell
      if (value === 1) {
        if (neighboursAlive < 2 || neighboursAlive >= 4) {
          // Kill cell
          this.actions.add([idx, false])
          continue
        }
      }

      // Dead cell
      if (neighboursAlive === 3) {
        // Birth cell
        this.actions.add([idx, true])
      }
    }

    // Process actions to update board state
    for (let action of this.actions) {
      this.cells[action[0]] = Number(action[1])
    }
    this.actions.clear()

    // console.log('<<')

    // debugState.updateTime = performance.now() - start
  }
}
