/* eslint-disable no-nested-ternary -- testing logic */
import type {BenchmarkConfig, BaseBenchmark} from './bench.ts'

import {Point} from 'mathutil'
import {
  type Kernel,
  presets,
  KernelPresets,
  type Point as KPoint,
} from '@ca/kernel'

function applyOffset(
  x: number,
  y: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
): [number, number] {
  return [
    x < -ox ? w + ox : x >= w - ox ? ox - 1 : x + ox,
    y < -oy ? h + oy : y >= h - oy ? oy - 1 : y + oy,
  ]
}

abstract class IterationBaseBench implements BaseBenchmark {
  size: Point

  constructor(x: number, y: number) {
    this.size = Point.of(x, y)
  }

  abstract run: () => void
}

/**
 * Apply the kernal across a 2d space with wrapping
 */
export class Search2d extends IterationBaseBench {
  data: Array<number>
  kernel: Kernel<KPoint>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    this.kernel = presets[KernelPresets.Moore]
  }

  to1d(x: number, y: number): number {
    return y * this.size.x + x
  }

  run = (): void => {
    // Gather ys
    for (let y = 0; y < this.size.y; y++) {
      // Gather xs
      for (let x = 0; x < this.size.x; x++) {
        // Offsets
        for (const [ox, oy] of this.kernel) {
          const xx =
            x < -ox ? this.size.x + ox : x >= this.size.x - ox ? ox - 1 : x + ox
          const yy =
            y < -oy ? this.size.y + oy : y >= this.size.y - oy ? oy - 1 : y + oy

          // Bit flop 0...1
          this.data[this.to1d(xx, yy)] ^= 1
        }
      }
    }
  }
}

export class Search2dOffsetFn extends IterationBaseBench {
  data: Array<number>
  kernel: Kernel<KPoint>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    this.kernel = presets[KernelPresets.Moore]
  }

  to1d(x: number, y: number): number {
    return y * this.size.x + x
  }

  run = (): void => {
    // Gather ys
    for (let y = 0; y < this.size.y; y++) {
      // Gather xs
      for (let x = 0; x < this.size.x; x++) {
        // Offsets
        for (const [ox, oy] of this.kernel) {
          const [xx, yy] = applyOffset(x, y, ox, oy, this.size.x, this.size.y)

          // Bit flop 0...1
          this.data[this.to1d(xx, yy)] ^= 1
        }
      }
    }
  }
}

/**
 * Apply the kernal across a 1d with conversion to 2d and wrapping
 *
 * This has near identical performance against the dual loops, implying that they optimise to the same thing anyways
 */
export class Search2dConvert extends IterationBaseBench {
  data: Array<number>
  kernel: Kernel<KPoint>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    this.kernel = presets[KernelPresets.Moore]
  }

  to1d(x: number, y: number): number {
    return y * this.size.x + x
  }

  run = (): void => {
    // 1d sequential access
    for (let i = 0; i < this.data.length; i++) {
      const x = i % this.size.x
      const y = (i / this.size.x) | 0
      for (const [ox, oy] of this.kernel) {
        const [xx, yy] = applyOffset(x, y, ox, oy, this.size.x, this.size.y)
        this.data[this.to1d(xx, yy)] ^= 1
      }
    }
  }
}

/**
 * Use a lookup to convert between 2d and 1d
 */
export class Search2dLookup extends IterationBaseBench {
  data: Array<number>
  lookup: Uint8Array
  kernel: Kernel<KPoint>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    this.lookup = new Uint8Array(x * y * 2)
    this.kernel = presets[KernelPresets.Moore]

    // Set up lookups
    for (let j = 0; j < this.size.y; j++) {
      for (let i = 0; i < this.size.x; i++) {
        const index = j * this.size.x + i
        this.lookup[index] = i
        this.lookup[index + 1] = j
      }
    }
  }

  to1d(x: number, y: number): number {
    return y * this.size.x + x
  }

  run = (): void => {
    // 1d sequential access
    for (let i = 0; i < this.data.length; i++) {
      const x = this.lookup[i * 2]
      const y = this.lookup[i * 2 + 1]
      for (const [ox, oy] of this.kernel) {
        const [xx, yy] = applyOffset(x, y, ox, oy, this.size.x, this.size.y)
        this.data[this.to1d(xx, yy)] ^= 1
      }
    }
  }
}

/**
 * Do not apply wrapping which makes application much easier.
 * This requires a dual for loop for x and y, but removes the cost of a wrapping function.
 */
export class Search2dNoWrap extends IterationBaseBench {
  data: Array<number>
  kernel: Kernel<KPoint>

  constructor(x: number, y: number) {
    super(x, y)
    // Pad for border
    this.data = Array.from({length: (x + 2) * (y + 2)}).map((_) => 0)
    this.kernel = presets[KernelPresets.Moore]
  }

  to1d(x: number, y: number): number {
    return y * this.size.x + x
  }

  run = (): void => {
    for (let y = 1; y < this.size.y - 1; y++) {
      for (let x = 1; x < this.size.x - 1; x++) {
        for (const [ox, oy] of this.kernel) {
          // Bit flop 0...1
          this.data[this.to1d(x + ox, y + oy)] ^= 1
        }
      }
    }
  }
}

export function createIterationSuite(
  x: number,
  y: number,
): Array<BenchmarkConfig> {
  return [
    {
      name: 'Iterate - 2d',
      bench: new Search2d(x, y),
    },
    {
      name: 'Iterate - 2d using function',
      bench: new Search2dOffsetFn(x, y),
    },
    {
      name: 'Iterate - 2d conversion',
      bench: new Search2dConvert(x, y),
    },
    {
      name: 'Iterate - 2d convert with lookup',
      bench: new Search2dLookup(x, y),
    },
    {
      name: 'Iterate - 2d no wrap',
      bench: new Search2dNoWrap(x, y),
    },
  ]
}
