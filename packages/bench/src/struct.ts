import type {BenchmarkConfig, BaseBenchmark, Strategy} from './bench.ts'

import {Point} from 'mathutil'

abstract class StructBaseBench implements BaseBenchmark {
  size: Point

  constructor(x: number, y: number) {
    this.size = Point.of(x, y)
  }

  abstract run: () => void
}

class ArrayBenchPreAllocated extends StructBaseBench {
  data: Array<number>
  strategy: (data: Array<number> | Uint8Array) => void

  constructor(
    x: number,
    y: number,
    strategy: (data: Array<number> | Uint8Array) => void,
  ) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    this.strategy = strategy
  }

  run = (): void => {
    this.strategy(this.data)
  }
}

class ArrayBenchDynamic extends StructBaseBench {
  data: Array<number>
  strategy: (data: Array<number> | Uint8Array) => void

  constructor(
    x: number,
    y: number,
    strategy: (data: Array<number> | Uint8Array) => void,
  ) {
    super(x, y)
    this.data = new Array()
    this.strategy = strategy
  }

  run = (): void => {
    this.strategy(this.data)
  }
}

export const strategies = {
  array: {
    forLoop: (data: Array<number> | Uint8Array) => {
      for (let idx = 0; idx < data.length; idx++) {
        data[idx] = data[idx] + 1
        if (data[idx] >= 255) {
          data[idx] = 0
        }
      }
    },
    forEach: (data: Array<number>) => {
      data.forEach((v, idx) => {
        data[idx] = v + 1
        if (data[idx] >= 255) {
          data[idx] = 0
        }
      })
    },
  },
}

export function createBenchmarks(x: number, y: number): Array<BenchmarkConfig> {
  return [
    {
      name: 'Array pre allocated - for loop',
      bench: new ArrayBenchPreAllocated(x, y, strategies.array.forLoop),
    },
    {
      name: 'Array pre allocated - foreach',
      bench: new ArrayBenchPreAllocated(x, y, strategies.array.forLoop),
    },
  ]
}
