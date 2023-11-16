/* eslint-disable @typescript-eslint/prefer-for-of -- we are comparing for loops */
import type {BenchmarkConfig, BaseBenchmark} from './bench.ts'

import {Point} from 'mathutil/point'

abstract class StructBaseBench implements BaseBenchmark {
  size: Point

  constructor(x: number, y: number) {
    this.size = Point.of(x, y)
  }

  abstract run: () => void
}

/**
 * We access this array sequentially each loop, this optimises to a typed array under the hood.
 * Compare with random access tests, which are better for genuine typed arrays than regular arrays (which will tend not to optimise to typed arrays with this access pattern)
 */
class ArrayPreAllocatedForLoopBench extends StructBaseBench {
  data: Array<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
  }

  run = (): void => {
    // this.strategy(this.data)
    for (let idx = 0; idx < this.data.length; idx++) {
      this.data[idx] = this.data[idx] + 1
      if (this.data[idx] >= 255) {
        this.data[idx] = 0
      }
    }
  }
}

class ArrayPreAllocatedForEachBench extends StructBaseBench {
  data: Array<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
  }

  run = (): void => {
    // this.strategy(this.data)
    this.data.forEach((v, idx) => {
      this.data[idx] = v + 1
      if (this.data[idx] >= 255) {
        this.data[idx] = 0
      }
    })
  }
}

/**
 * This isn't really dynamic as we set up the size of the array during initialisation, still shows a difference in iteration speed though
 */
class ArrayDynamicForLoopBench extends StructBaseBench {
  data: Array<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = new Array<number>()

    for (let idx = 0; idx < x * y; idx++) {
      this.data[idx] = 0
    }
  }

  run = (): void => {
    for (let idx = 0; idx < this.data.length; idx++) {
      this.data[idx] = this.data[idx] + 1
      if (this.data[idx] >= 255) {
        this.data[idx] = 0
      }
    }
  }
}

class ArrayDynamicForEachBench extends StructBaseBench {
  data: Array<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = new Array<number>()

    for (let idx = 0; idx < x * y; idx++) {
      this.data[idx] = 0
    }
  }

  run = (): void => {
    this.data.forEach((v, idx) => {
      this.data[idx] = v + 1
      if (this.data[idx] >= 255) {
        this.data[idx] = 0
      }
    })
  }
}

class Array2DBench extends StructBaseBench {
  data: Array<Array<number>>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: y}).map((_) =>
      Array.from({length: x}).map((__) => 0),
    )
  }

  run = (): void => {
    for (let y = 0; y < this.data.length; y++) {
      for (let x = 0; x < this.data[0].length; x++) {
        this.data[y][x] = this.data[y][x] + 1
        if (this.data[y][x] >= 255) {
          this.data[y][x] = 0
        }
      }
    }
  }
}

interface Cell {
  temperature: number
  humidity: number
  precipitation: number
}
class ArrayOfObjectsBench extends StructBaseBench {
  data: Array<Cell>
  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => ({
      temperature: 0,
      humidity: 0,
      precipitation: 0,
    }))
  }

  run = (): void => {
    for (let idx = 0; idx < this.data.length; idx++) {
      // this.data[idx].temperature = this.data[idx].temperature + 1
      // if (this.data[idx].temperature >= 255) {
      //   this.data[idx].temperature = 0
      // }

      // This is faster, reducing access calls even with the GC allocation dur to temp variables
      const temp = this.data[idx].temperature
      this.data[idx].temperature = temp >= 255 ? 0 : temp + 1

      // const hum = this.data[idx].humidity
      // this.data[idx].humidity = hum >= 255 ? 0 : hum + 1
    }
  }
}

class TypedArrayOfObjectsBench extends StructBaseBench {
  data: Uint8ClampedArray
  stride: number
  constructor(x: number, y: number) {
    super(x, y)

    this.stride = 3
    const buffer = new ArrayBuffer(x * y * this.stride)
    this.data = new Uint8ClampedArray(buffer)
  }

  run = (): void => {
    for (let idx = 0; idx < this.data.length; idx++) {
      const temp = this.data[idx]
      this.data[idx] = temp >= 255 ? 0 : temp + 1

      // const humid = this.data[idx + 1]
      // this.data[idx + 1] = humid >= 255 ? 0 : humid + 1

      // const pre = this.data[idx + 2]
      // this.data[idx + 2] = pre >= 255 ? 0 : pre + 1

      idx = idx + this.stride - 1
    }
  }
}

class ArrayRandomAccessBench extends StructBaseBench {
  data: Array<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
  }

  run = (): void => {
    // this.strategy(this.data)

    // This is significantly faster than calling this.strategy
    for (let idx = 0; idx < this.data.length; idx++) {
      const rnd = (Math.random() * this.data.length) | 0
      const cell = this.data[rnd]
      this.data[rnd] = cell >= 255 ? 0 : cell + 1
    }
  }
}

class TypedArrayRandomAccessBench extends StructBaseBench {
  data: Uint8ClampedArray

  constructor(x: number, y: number) {
    super(x, y)
    const buffer = new ArrayBuffer(x * y)
    this.data = new Uint8ClampedArray(buffer)
  }

  run = (): void => {
    for (let idx = 0; idx < this.data.length; idx++) {
      const rnd = (Math.random() * this.data.length) | 0
      const cell = this.data[rnd]
      this.data[rnd] = cell >= 255 ? 0 : cell + 1
    }
  }
}

class TypedArrayBench extends StructBaseBench {
  data: Uint8ClampedArray

  constructor(x: number, y: number) {
    super(x, y)
    const buffer = new ArrayBuffer(x * y)
    this.data = new Uint8ClampedArray(buffer)
  }

  run = (): void => {
    // This is significantly faster than calling this.strategy
    for (let idx = 0; idx < this.data.length; idx++) {
      this.data[idx] = this.data[idx] + 1
      if (this.data[idx] >= 255) {
        this.data[idx] = 0
      }
    }
  }
}

class MapForOfBench extends StructBaseBench {
  data: Map<number, number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = new Map()

    for (let idx = 0; idx < x * y; idx++) {
      this.data.set(idx, 0)
    }
  }

  run = (): void => {
    for (const [k, v] of this.data) {
      // this.data.set(k, v + 1)
      // if (v >= 255) {
      //   this.data.set(k, 0)
      // }

      // No difference using the above or this ternary, even though the above has two sets (JS optimisation I'd guess)
      this.data.set(k, v >= 255 ? 0 : v + 1)
    }
  }
}

class MapForEachBench extends StructBaseBench {
  data: Map<number, number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = new Map()

    for (let idx = 0; idx < x * y; idx++) {
      this.data.set(idx, 0)
    }
  }

  run = (): void => {
    this.data.forEach((v, k) => {
      this.data.set(k, v + 1)
      if (v >= 255) {
        this.data.set(k, 0)
      }
    })
  }
}

export function createBenchmarks(x: number, y: number): Array<BenchmarkConfig> {
  return [
    {
      name: 'Array - pre-alloc, for loop',
      bench: new ArrayPreAllocatedForLoopBench(x, y),
    },
    {
      name: 'Array - pre-alloc, for each',
      bench: new ArrayPreAllocatedForEachBench(x, y),
    },
    {
      name: 'Array - dynamic, for loop',
      bench: new ArrayDynamicForLoopBench(x, y),
    },
    {
      name: 'Array - dynamic, for each',
      bench: new ArrayDynamicForEachBench(x, y),
    },
    {
      name: 'Array - 2D',
      bench: new Array2DBench(x, y),
    },
    /**
     * Object access
     */
    {
      name: 'Array - Objects',
      bench: new ArrayOfObjectsBench(x, y),
    },
    {
      name: 'Typed array - Objects',
      bench: new TypedArrayOfObjectsBench(x, y),
    },
    /**
     * Typed arrays
     */
    {
      name: 'Typed array',
      bench: new TypedArrayBench(x, y),
    },
    /**
     * Random access
     */
    {
      name: 'Array - random access',
      bench: new ArrayRandomAccessBench(x, y),
    },
    {
      name: 'Typed array - random access',
      bench: new TypedArrayRandomAccessBench(x, y),
    },
    /**
     * Maps
     */
    {
      name: 'Map - For of',
      bench: new MapForOfBench(x, y),
    },
    {
      name: 'Map - For each',
      bench: new MapForEachBench(x, y),
    },
  ]
}
