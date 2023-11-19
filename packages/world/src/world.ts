import {Point} from 'mathutil'

export interface BaseWorld<T = Uint8Array> {
  size: Point
  data: T

  setCell: (x: number, y: number, value?: number) => void
  getCell: (x: number, y?: number) => number
}

export class World implements BaseWorld<Uint8ClampedArray> {
  size: Point
  data: Uint8ClampedArray

  constructor(x: number, y: number) {
    this.size = Point.of(x, y)
    this.data = new Uint8ClampedArray(x * y)
  }

  setCell(x: number, y: number, value: number): void
  setCell(idx: number, value: number): void
  setCell(x: number, y: number, value?: number): void {
    if (value == null) {
      this.data[x] = y
      return
    }

    this.data[y * this.size.x + x] = value
  }

  getCell(x: number, y: number): number
  getCell(idx: number): number
  getCell(x: number, y?: number): number {
    if (y == null) {
      return this.data[x]
    }

    return this.data[y * this.size.x + x]
  }

  /** ------------ */
  // Non-toroidal (i.e. no wrapping)
  // For speed we're going to avoid allocate and do things manually
  getNumNeighbours(idx: number): number {
    // Top-left corner
    if (idx === 0) {
      return (
        this.data[idx + 1] +
        this.data[idx + this.size.x] +
        this.data[idx + this.size.x + 1]
      )
    }

    // Top-right corner
    if (idx === this.size.x - 1) {
      return (
        this.data[idx - 1] +
        this.data[idx + this.size.x - 1] +
        this.data[idx + this.size.x]
      )
    }

    // Bottom-left corner
    if (idx === this.data.length - this.size.x) {
      return (
        this.data[idx - this.size.x] +
        this.data[idx - this.size.x + 1] +
        this.data[idx + 1]
      )
    }

    // Bottom-right corner
    if (idx === this.data.length - 1) {
      return (
        this.data[idx - this.size.x - 1] +
        this.data[idx - this.size.x] +
        this.data[idx - 1]
      )
    }

    // Top edge
    if (idx < this.size.x) {
      return (
        this.data[idx - 1] +
        this.data[idx + 1] +
        this.data[idx + this.size.x - 1] +
        this.data[idx + this.size.x] +
        this.data[idx + this.size.x + 1]
      )
    }

    // Bottom edge
    if (idx > this.data.length - this.size.x) {
      return (
        this.data[idx - this.size.x - 1] +
        this.data[idx - this.size.x] +
        this.data[idx - this.size.x + 1] +
        this.data[idx - 1] +
        this.data[idx + 1]
      )
    }

    // Left edge
    if (idx % this.size.x === 0) {
      return (
        this.data[idx - this.size.x] +
        this.data[idx - this.size.x + 1] +
        this.data[idx + 1] +
        this.data[idx + this.size.x] +
        this.data[idx + this.size.x + 1]
      )
    }

    // Right edge
    if ((idx - (this.size.x - 1)) % this.size.x === 0) {
      return (
        this.data[idx - this.size.x - 1] +
        this.data[idx - this.size.x] +
        this.data[idx - 1] +
        this.data[idx + this.size.x - 1] +
        this.data[idx + this.size.x]
      )
    }

    // Fall through, i.e all 8 neighbours
    return (
      this.data[idx - this.size.x - 1] +
      this.data[idx - this.size.x] +
      this.data[idx - this.size.x + 1] +
      this.data[idx - 1] +
      this.data[idx + 1] +
      this.data[idx + this.size.x - 1] +
      this.data[idx + this.size.x] +
      this.data[idx + this.size.x + 1]
    )
  }
}
