import type {TickAction} from 'sketch-react-loop'

import {Point, Rect} from 'mathutil'
import {each} from '@ca/fn'
import {RateLimiter} from '@ca/rate-limiter'
import {Trace} from '@ca/trace'
import {World, makeKernel, KernelVariants} from '@ca/world'

export const trace = new Trace()

type Action = [idx: number, value: number]

interface BaseSimulation {
  origin: Point
  // dim: Point
  cellSize: Point
  // frame: Rect
  updateFps: number
  world: World

  createTickHandler: () => TickAction
  setCell: (x: number, y: number, value: number) => void
  setUps: (ups: number) => void
}

export class Simulation implements BaseSimulation {
  origin: Point
  // dim: Point
  cellSize: Point
  // frame: Rect
  updateFps: number
  world: World

  cells: Uint8Array
  actions: Set<Action>
  rateLimiter: RateLimiter<TickAction>

  constructor() {
    this.origin = Point.of(0, 0)
    // this.dim = Point.of(400, 200)
    this.cellSize = Point.of(7, 7)
    // this.frame = Rect.of(
    //   this.origin.x,
    //   this.origin.y,
    //   this.origin.x + this.world.size.x,
    //   this.origin.y + this.world.size.dim.y,
    // )
    this.updateFps = 20
    this.world = new World(500, 260)

    this.cells = new Uint8Array(this.world.size.x * this.world.size.y)

    this.actions = new Set()
    this.rateLimiter = new RateLimiter(this.updateFps)
    this.rateLimiter.register(this.update)
  }

  private render: TickAction = ({app}) => {
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
      if (this.world.getCell(idx)) {
        // Its probably the hex toString here that is slow rather than the alpha
        // Might get more change out of a gradient function that takes the cell value and returns hex characters, it might not be as smooth though but if values are all integers we could do this as a table lookup
        // app.ctx.fillStyle = '#2d3032' + this.world.getCell(idx).toString(16)
        app.ctx.fillStyle = '#2d3032'
        app.ctx.fillRect(
          (idx % this.world.size.x) * this.cellSize.x + padding,
          (idx / this.world.size.x) * this.cellSize.y + padding,
          this.cellSize.x - padding,
          this.cellSize.y - padding,
        )
      }
    }
    // Surprisingly, this is slightly slower :(
    // each((_, idx) => {
    //   if (this.world.getCell(idx)) {
    //     app.ctx.fillStyle = '#2d3032' + this.world.getCell(idx).toString(16)
    //     app.ctx.fillRect(
    //       (idx % this.world.size.x) * this.cellSize.x + padding,
    //       (idx / this.world.size.x) * this.cellSize.y + padding,
    //       this.cellSize.x - padding,
    //       this.cellSize.y - padding,
    //     )
    //   }
    // }, this.world.data)

    timer.track()
  }

  private update: TickAction = () => {
    const timer = trace.getTimer('update')
    const stride = this.world.size.x
    // const kernel = [-stride, 1, stride, -1]
    const kernel = makeKernel(KernelVariants.Cardinal, {
      stride: stride,
    })
    let value = 0
    for (let idx = 0; idx < this.world.data.length; idx++) {
      value = this.world.getCell(idx)
      if (value === 0) {
        continue
      }

      // Shield
      if (value < 16) {
        this.actions.add([idx, 0])
        continue
      }

      const strength = Math.floor(value * 0.95)
      const decay = Math.floor(value * 0.75)

      // Propagate
      // if (this.world.getCell(idx - this.world.size.x) === 0) {
      //   this.actions.add([idx - this.world.size.x, strength])
      // }

      // if (this.world.getCell(idx + 1) === 0) {
      //   this.actions.add([idx + 1, strength])
      // }

      // if (this.world.getCell(idx + this.world.size.x) === 0) {
      //   this.actions.add([idx + this.world.size.x, strength])
      // }

      // if (this.world.getCell(idx - 1) === 0) {
      //   this.actions.add([idx - 1, strength])
      // }

      // This is, perhaps, a fraction slower than the above
      for (const im of kernel) {
        if (this.world.getCell(idx + im) === 0) {
          this.actions.add([idx + im, strength])
        }
      }

      // each((im) => {
      //   if (this.world.getCell(idx + im) === 0) {
      //     this.actions.add([idx + im, strength])
      //   }
      // }, kernel)

      this.actions.add([idx, decay])
    }

    // Update board state
    for (const action of this.actions) {
      // this.cells[action[0]] = action[1]
      this.world.setCell(action[0], action[1])
    }
    this.actions.clear()

    timer.track()
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
    trace.set('updateFps', ups)
  }
}
