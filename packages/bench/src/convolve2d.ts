import {
  createPresetKernel,
  KernelPresets,
  type Kernel,
  type Point,
} from '@ca/kernel'
import {type BenchmarkConfig, type BaseBenchmark} from './bench.ts'
import {convolve2d as bufferedConvolve} from './convolve2d/buffered.ts'
import {convolve2d as branchedToroidalConvolve} from './convolve2d/branched-toroidal.ts'
import {convolve2d as inlineSumConvolve} from './convolve2d/inline-sum.ts'
import {convolve2d as assumedWeightsConvolve} from './convolve2d/assumed-weights.ts'
import {convolve2d as mooreConvolve} from './convolve2d/moore-kernel.ts'
import {convolve2d as mooreNTConvolve} from './convolve2d/moore-kernal-non-toroidal.ts'

function sum(src: Array<number>): number {
  let total = 0
  for (const value of src) {
    total = total + value
  }
  return total
}

abstract class KernelBase implements BaseBenchmark {
  size: Point

  constructor(x: number, y: number) {
    this.size = [x, y]
  }

  abstract run: () => void
}

/**
 * Passes a reusable buffer to apply to each convolution.
 * Stores results in an output buffer (Set)
 */
export class BufferedConvolution extends KernelBase {
  data: Array<number>
  kernel: Kernel<Point>
  output: Set<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    this.kernel = createPresetKernel(KernelPresets.Moore)

    this.output = new Set()
  }

  run = (): void => {
    const buffer: Array<number> = Array.from({length: this.kernel.length})
    for (let y = 0; y < this.size[1]; y++) {
      for (let x = 0; x < this.size[0]; x++) {
        this.output.add(
          bufferedConvolve(
            this.kernel,
            y * this.size[0] + x,
            this.size[0],
            this.size[1],
            this.data,
            sum,
            buffer,
          ),
        )
      }
    }
  }
}

/**
 * Using branching rather than ternary for the toroidal offset application.
 * This _should_ equate to exactly the same as the ternary version.
 * Yep, its the same, ternaries are not slow.
 */
export class BranchedToroidalLookup extends KernelBase {
  data: Array<number>
  kernel: Kernel<Point>
  output: Set<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    this.kernel = createPresetKernel(KernelPresets.Moore)

    this.output = new Set()
  }

  run = (): void => {
    const buffer: Array<number> = Array.from({length: this.kernel.length})
    for (let y = 0; y < this.size[1]; y++) {
      for (let x = 0; x < this.size[0]; x++) {
        this.output.add(
          branchedToroidalConvolve(
            this.kernel,
            y * this.size[0] + x,
            this.size[0],
            this.size[1],
            this.data,
            sum,
            buffer,
          ),
        )
      }
    }
  }
}

/**
 * Removes the reducer and does the summation in line with the multiplication of weights
 */
export class InlineSum extends KernelBase {
  data: Array<number>
  kernel: Kernel<Point>
  output: Set<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    this.kernel = createPresetKernel(KernelPresets.Moore)

    this.output = new Set()
  }

  run = (): void => {
    for (let y = 0; y < this.size[1]; y++) {
      for (let x = 0; x < this.size[0]; x++) {
        this.output.add(
          inlineSumConvolve(
            this.kernel,
            y * this.size[0] + x,
            this.size[0],
            this.size[1],
            this.data,
          ),
        )
      }
    }
  }
}

/**
 * No reducer and no weights either, inline sums the values from the source. For CA's with boolean state (i.e. Game of Life) this works.
 * @TODO this will currently be wrong though as the kernel includes 0,0 so will effectively include _itself_ as a neighbour
 */
export class AssumedWeights extends KernelBase {
  data: Array<number>
  kernel: Kernel<Point>
  output: Set<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    this.kernel = createPresetKernel(KernelPresets.Moore)

    this.output = new Set()
  }

  run = (): void => {
    for (let y = 0; y < this.size[1]; y++) {
      for (let x = 0; x < this.size[0]; x++) {
        this.output.add(
          assumedWeightsConvolve(
            this.kernel,
            y * this.size[0] + x,
            this.size[0],
            this.size[1],
            this.data,
          ),
        )
      }
    }
  }
}

/**
 * Manually specifies the Moore Kernel and sums the neighbours.
 */
export class MooreKernel extends KernelBase {
  data: Array<number>
  // kernel: Kernel<Point>
  output: Set<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    // this.kernel = createPresetKernel(KernelPresets.Moore)

    this.output = new Set()
  }

  run = (): void => {
    // Manually tracking length makes no difference in perf
    const length = this.data.length
    for (let idx = 0; idx < length; idx++) {
      this.output.add(mooreConvolve(idx, this.size[0], this.data, length))
    }
  }
}

/**
 * Manually specifies the Moore Kernel and sums the neighbours.
 * Non-toroidal variant.
 * Surprisingly this is significantly faster than the toroidal.
 */
export class MooreNTKernel extends KernelBase {
  data: Array<number>
  // kernel: Kernel<Point>
  output: Set<number>

  constructor(x: number, y: number) {
    super(x, y)
    this.data = Array.from({length: x * y}).map((_) => 0)
    // this.kernel = createPresetKernel(KernelPresets.Moore)

    this.output = new Set()
  }

  run = (): void => {
    for (let idx = 0; idx < this.data.length; idx++) {
      this.output.add(mooreNTConvolve(idx, this.size[0], this.data))
    }
  }
}

/**
 * Suite
 */
export function createConvolutionSuite(
  x: number,
  y: number,
): Array<BenchmarkConfig> {
  return [
    {
      name: 'Buffered convolution',
      bench: new BufferedConvolution(x, y),
    },
    {
      name: 'Branched Toroidal Offset',
      bench: new BranchedToroidalLookup(x, y),
    },
    {
      name: 'Inline Summation',
      bench: new InlineSum(x, y),
    },
    {
      name: 'Assumed weights',
      bench: new AssumedWeights(x, y),
    },
    {name: 'Moore kernel', bench: new MooreKernel(x, y)},
    {name: 'Moore kernel - non-toroidal', bench: new MooreNTKernel(x, y)},
  ]
}

// Testing manual benches
const d = Array.from({length: 3 * 3}).map((_) => 0)
d[8] = 1
const out = []
const out2 = []
for (let i = 0; i < d.length; i++) {
  out.push(mooreNTConvolve(i, 3, d))
  out2.push(mooreConvolve(i, 3, d, 9))
}
console.log('Testing manual convolution')
// console.log(out)
// console.log(out2)
console.log('source array')
render(d, 3)
console.log('non-toroidal')
render(out, 3)
console.log('toroidal')
render(out2, 3)

function render(arr: Array<number>, w: number) {
  let row: Array<number> = []
  for (let i = 0; i < arr.length; i++) {
    row.push(arr[i])
    if ((i + 1) % w === 0) {
      const o = []
      for (const v of row) {
        o.push(v)
      }
      console.log(o.join(', '))
      row = []
    }
  }
  console.log('')
}
