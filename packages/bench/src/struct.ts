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

// class Array2D extends StructBaseBench {
//   data: Array<Array<number>>
//   strategy: (data: Array<Array<number>>) => void

//   constructor(
//     x: number,
//     y: number,
//     strategy: (data: Array<Array<number>>) => void,
//   ) {
//     super(x, y)
//     this.data = Array.from({length: y}).map((_) =>
//       Array.from({length: x}).map((__) => 0),
//     )
//     this.strategy = strategy
//   }

//   run = (): void => {
//     this.strategy(this.data)
//   }
// }

// interface Cell {
//   temperature: number
//   humidity: number
//   precipitation: number
// }
// class ArrayOfObjectsBench extends StructBaseBench {
//   data: Array<Cell>
//   constructor(x: number, y: number) {
//     super(x, y)
//     this.data = Array.from({length: x * y}).map((_) => ({
//       temperature: 0,
//       humidity: 0,
//       precipitation: 0,
//     }))
//   }

//   run = (): void => {
//     for (let idx = 0; idx < this.data.length; idx++) {
//       // this.data[idx].temperature = this.data[idx].temperature + 1
//       // if (this.data[idx].temperature >= 255) {
//       //   this.data[idx].temperature = 0
//       // }

//       // This is faster, reducing access calls even with the GC allocation dur to temp variables
//       const temp = this.data[idx].temperature
//       this.data[idx].temperature = temp >= 255 ? 0 : temp + 1

//       // const hum = this.data[idx].humidity
//       // this.data[idx].humidity = hum >= 255 ? 0 : hum + 1
//     }
//   }
// }

// class TypedArrayOfObjectsBench extends StructBaseBench {
//   data: Uint8ClampedArray
//   stride: number
//   constructor(x: number, y: number) {
//     super(x, y)

//     this.stride = 3
//     const buffer = new ArrayBuffer(x * y * this.stride)
//     this.data = new Uint8ClampedArray(buffer)
//   }

//   run = (): void => {
//     for (let idx = 0; idx < this.data.length; idx++) {
//       const temp = this.data[idx]
//       this.data[idx] = temp >= 255 ? 0 : temp + 1

//       // const humid = this.data[idx + 1]
//       // this.data[idx + 1] = humid >= 255 ? 0 : humid + 1

//       // const pre = this.data[idx + 2]
//       // this.data[idx + 2] = pre >= 255 ? 0 : pre + 1

//       idx = idx + this.stride - 1
//     }
//   }
// }

// class ArrayRandomAccessBench extends StructBaseBench {
//   data: Array<number>

//   constructor(x: number, y: number) {
//     super(x, y)
//     this.data = Array.from({length: x * y}).map((_) => 0)
//   }

//   run = (): void => {
//     // this.strategy(this.data)

//     // This is significantly faster than calling this.strategy
//     for (let idx = 0; idx < this.data.length; idx++) {
//       const rnd = (Math.random() * this.data.length) | 0
//       const cell = this.data[rnd]
//       this.data[rnd] = cell >= 255 ? 0 : cell + 1
//     }
//   }
// }

// class TypedArrayRandomAccessBench extends StructBaseBench {
//   data: Uint8ClampedArray

//   constructor(x: number, y: number) {
//     super(x, y)
//     const buffer = new ArrayBuffer(x * y)
//     this.data = new Uint8ClampedArray(buffer)
//   }

//   run = (): void => {
//     // this.strategy(this.data)

//     // This is significantly faster than calling this.strategy
//     for (let idx = 0; idx < this.data.length; idx++) {
//       const rnd = (Math.random() * this.data.length) | 0
//       const cell = this.data[rnd]
//       this.data[rnd] = cell >= 255 ? 0 : cell + 1
//     }
//   }
// }

// class ClampedArrayBench extends StructBaseBench {
//   data: Uint8ClampedArray
//   strategy: (data: Uint8ClampedArray) => void

//   constructor(x: number, y: number, strategy: Strategy<Uint8ClampedArray>) {
//     super(x, y)
//     const buffer = new ArrayBuffer(x * y)
//     this.data = new Uint8ClampedArray(buffer)
//     this.strategy = strategy
//   }

//   run = (): void => {
//     // this.strategy(this.data)

//     // This is significantly faster than calling this.strategy
//     for (let idx = 0; idx < this.data.length; idx++) {
//       this.data[idx] = this.data[idx] + 1
//       if (this.data[idx] >= 255) {
//         this.data[idx] = 0
//       }
//     }
//   }
// }

// const buffer = new ArrayBuffer(1000 * 1000)
// class ClampedArrayFasterBench extends StructBaseBench {
//   // constructor(x: number, y: number) {
//   //   super(x, y)
//   // }

//   run = (): void => {
//     // This is faster, even though we create the view for each run
//     // Actually slower now we've sorted out access to strategy functions
//     const view = new Uint8ClampedArray(buffer)
//     for (let idx = 0; idx < view.length; idx++) {
//       view[idx] = view[idx] + 1
//       if (view[idx] >= 255) {
//         view[idx] = 0
//       }
//     }
//   }
// }

// class MapBench extends StructBaseBench {
//   data: Map<number, number>
//   strategy: Strategy<Map<number, number>>

//   constructor(x: number, y: number, strategy: Strategy<Map<number, number>>) {
//     super(x, y)
//     this.data = new Map()
//     this.strategy = strategy

//     for (let idx = 0; idx < x * y; idx++) {
//       this.data.set(idx, 0)
//     }
//   }

//   run = (): void => {
//     this.strategy(this.data)
//   }
// }

/**
 * I think using strategies might be a little flawed as they are functions which are shared across tests. Would be better to isolate tests than try to share anything.
 */
export const strategies = {
  typedarray: {
    forLoop: (data: Uint8ClampedArray) => {
      for (let idx = 0; idx < data.length; idx++) {
        data[idx] = data[idx] + 1
        if (data[idx] >= 255) {
          data[idx] = 0
        }
      }
    },
  },
  array: {
    forLoop: (data: Array<number> | Uint8ClampedArray) => {
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
    for2d: (data: Array<Array<number>>) => {
      for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[0].length; x++) {
          data[y][x] = data[y][x] + 1
          if (data[y][x] >= 255) {
            data[y][x] = 0
          }
        }
      }
    },
    forLoopRandomAccess: (data: Array<number> | Uint8ClampedArray) => {
      for (let idx = 0; idx < data.length; idx++) {
        const rnd = (Math.random() * data.length) | 0
        data[rnd] = data[rnd] + 1
        if (data[rnd] >= 255) {
          data[rnd] = 0
        }
      }
    },
  },
  map: {
    forEach: (data: Map<number, number>) => {
      data.forEach((v, k) => {
        data.set(k, v + 1)
        if (v >= 255) {
          data.set(k, 0)
        }
      })
    },
    forOf: (data: Map<number, number>) => {
      for (const [k, v] of data) {
        // data.set(k, v + 1)
        // if (v >= 255) {
        //   data.set(k, 0)
        // }

        // No difference using the above or this ternary, even though the above has two sets (JS optimisation I'd guess)
        data.set(k, v >= 255 ? 0 : v + 1)
      }
    },
  },
}

// export function createBenchmarks(x: number, y: number): Array<BenchmarkConfig> {
//   return [
//     // {
//     //   name: 'Array pre allocated - for loop',
//     //   bench: new ArrayBenchPreAllocatedNoStrategy(x, y),
//     // },
//     // {
//     //   name: 'Array pre allocated - foreach',
//     //   bench: new ArrayBenchPreAllocated(x, y, strategies.array.forEach),
//     // },
//     // {
//     //   name: 'Array dynamic - for loop',
//     //   bench: new ArrayBenchDynamicNoStrategy(x, y),
//     // },
//     // {
//     //   name: 'Array dynamic - foreach',
//     //   bench: new ArrayBenchDynamic(x, y, strategies.array.forEach),
//     // },
//     // {
//     //   name: 'Array 2D',
//     //   bench: new Array2D(x, y, strategies.array.for2d),
//     // },
//     // {
//     //   name: 'Array - random access',
//     //   bench: new ArrayBenchPreAllocated(
//     //     x,
//     //     y,
//     //     strategies.array.forLoopRandomAccess,
//     //   ),
//     // },
//     // Note that typed arrays are slower as a class property, but this is still faster compared to the array - random access test (and would be even faster implementing typed array outside of a class @see scripts/struct.ts for an example of a test that does not use a class)
//     // {
//     //   name: 'Typed Array - random access',
//     //   bench: new ClampedArrayBench(x, y, strategies.array.forLoopRandomAccess),
//     // },
//     // This for loop uses the strategy
//     // {
//     //   name: 'Typed Array - for loop',
//     //   bench: new ClampedArrayBench(x, y, strategies.array.forLoop),
//     // },
//     // This one does not, and grabs the view from the outside scope rather than as a class member. Note that this manually sets the size, which may be different than is running for other tests.
//     // {
//     //   name: 'Typed Array - faster for loop **',
//     //   bench: new ClampedArrayFasterBench(x, y),
//     // },
//     // {name: 'Map - foreach', bench: new MapBench(x, y, strategies.map.forEach)},
//     // {name: 'Map - for of', bench: new MapBench(x, y, strategies.map.forOf)},
//     // {
//     //   name: 'Array - of objects',
//     //   bench: new ArrayOfObjectsBench(x, y),
//     // },
//     // {
//     //   name: 'Typed Array - of objects',
//     //   bench: new TypedArrayOfObjectsBench(x, y),
//     // },
//     {
//       name: 'Array - random access',
//       bench: new ArrayRandomAccessBench(x, y),
//     },
//     {
//       name: 'Typed array - random access',
//       bench: new TypedArrayRandomAccessBench(x, y),
//     },
//   ]
// }

export function createBenchmarks(x: number, y: number): Array<BenchmarkConfig> {
  return [
    {
      name: 'Array - pre-alloc, for loop',
      bench: new ArrayPreAllocatedForLoopBench(x, y),
    },
    {
      name: 'Array - dynamic, for loop',
      bench: new ArrayDynamicForLoopBench(x, y),
    },
    {
      name: 'Array - pre-alloc, for each',
      bench: new ArrayPreAllocatedForEachBench(x, y),
    },
    {
      name: 'Array - dynamic, for each',
      bench: new ArrayDynamicForEachBench(x, y),
    },
  ]
}
