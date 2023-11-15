import {Point} from 'mathutil'

interface IWorld<T = Uint8Array> {
  size: Point
  data: T

  setCell: (x: number, y: number, value?: number) => void
  getCell: (x: number, y?: number) => number
}

export class World implements IWorld<Uint8ClampedArray> {
  size: Point
  data: Uint8ClampedArray

  constructor(x: number, y: number) {
    this.size = Point.of(x, y)

    const buffer = new ArrayBuffer(x * y)
    this.data = new Uint8ClampedArray(buffer)
  }

  setCell(x: number, y: number, value: number): void
  setCell(idx: number, value: number): void
  setCell(x: number, y: number, value?: number) {
    if (value == null) {
      this.data[x] = y
      return
    }

    this.data[y * this.size.x + x] = value
  }

  getCell(x: number, y: number): number
  getCell(idx: number): number
  getCell(x: number, y?: number) {
    if (y == null) {
      return this.data[x]
    }

    return this.data[y * this.size.x + x]
  }
}
