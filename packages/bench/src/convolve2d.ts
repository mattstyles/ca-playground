import {
  createPresetKernel,
  KernelPresets,
  type Kernel,
  type Point,
} from '@ca/kernel'
import {BenchmarkConfig, type BaseBenchmark} from './bench.ts'

function applyToroidalPermutedOffset(
  x: number,
  y: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
): number {
  return (
    // eslint-disable-next-line no-nested-ternary -- wrapping
    (x < -ox ? w + ox : x >= w - ox ? ox - 1 : x + ox) +
    // eslint-disable-next-line no-nested-ternary -- wrapping
    (y < -oy ? h + oy : y >= h - oy ? oy - 1 : y + oy) * w
  )
}

function applyKernel2d(
  k: Kernel<Point>,
  idx: number,
  w: number,
  h: number,
  src: ArrayLike<number>,
  buffer: Array<number>,
): Array<number> {
  for (let i = 0; i < k.length; i++) {
    const point = k[i][1]
    const weight = k[i][0]
    const target = applyToroidalPermutedOffset(
      idx % w,
      (idx / w) | 0,
      point[0],
      point[1],
      w,
      h,
    )
    buffer[i] = src[target] * weight
  }
  return buffer
}

function convolve2d<T>(
  k: Kernel<Point>,
  idx: number,
  w: number,
  h: number,
  src: ArrayLike<number>,
  reducer: (src: Array<number>) => T,
  buffer: Array<number>,
): T {
  return reducer(applyKernel2d(k, idx, w, h, src, buffer))
}

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
          convolve2d(
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
  ]
}
