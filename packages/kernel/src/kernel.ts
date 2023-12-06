import type {Point} from '@ca/struct'
import {applyToroidalPermutedOffset} from './transform.ts'

/**
 * The kernel describes a weighting function.
 * In our case this describes the weight for a given offset.
 * We can then apply those offsets to generate indices into our source data and apply weights to handle the convolution.
 */
export type Kernel1d = Array<[weight: number, offset: number]>

export type Kernel2d = Array<[weight: number, offset: Point]>

/**
 * Array of offsets with respect to a certain index in two dimensional space.
 *
 * @param w - width of kernel
 * @param h - height of kernel
 * @param weights - the initial weights of all elements. Note that the origin will be 0 weighted initially despite this value.
 */
export function createKernel2d(
  w: number,
  h: number,
  weights: Array<number>,
): Kernel2d {
  if (weights.length !== w * h) {
    throw new Error(
      `Weights supplied to kernel do not match length of the kernel. [${weights.join(
        ',',
      )}].length does not equal ${w} * ${h} (${w * h})`,
    )
  }
  // Calculate offset ranges from midpoints of given lengths
  const ow = w >> 1
  const oh = h >> 1
  const offsets: Kernel2d = []
  let idx = 0
  // Populate 2d kernel weights and offsets
  for (let j = 0 - oh; j < h - oh; j++) {
    for (let i = 0 - ow; i < w - ow; i++) {
      offsets.push([weights[idx++], [i, j]])
    }
  }

  return offsets
}

/**
 * Translates a kernel into search space indices based on an origin index.
 * Toroidal.
 *
 * @param kernel - the 2d  kernel to use as a transform
 * @param idx - the origin index
 * @param size - 2d dimensions of the search space
 * @param buffer - the storage buffer for the generated indices
 */
export function permuteKernel(
  kernel: Kernel2d,
  idx: number,
  size: Point,
): Kernel1d {
  const buffer: Kernel1d = []
  const x = idx % size[0]
  const y = (idx / size[1]) | 0
  for (const [weight, point] of kernel) {
    buffer.push([
      weight,
      applyToroidalPermutedOffset(x, y, point[0], point[1], size[0], size[1]),
    ])
  }
  return buffer
}

/**
 * Returns a buffer that contains the contents of each cell described by a kernel from the origin index.
 * Toroidal.
 *
 * @param kernel - the 2d kernel to use as a transform
 * @param idx - the origin index
 * @param size - 2d dimensions of the search space
 * @param src - the full search space to index against
 * @param buffer - the storage buffer for the output
 * @returns buffer containing values from source array
 */
export function applyKernel2d(
  kernel: Kernel2d,
  idx: number,
  size: Point,
  src: ArrayLike<number>,
): Array<number> {
  const buffer: Array<number> = Array.from({length: kernel.length})
  for (const [weight, point] of kernel) {
    const target = applyToroidalPermutedOffset(
      idx % size[0],
      (idx / size[0]) | 0,
      point[0],
      point[1],
      size[0],
      size[1],
    )
    buffer.push(src[target] * weight)
  }
  return buffer
}

/**
 * The convolution takes a kernel and the target source, along with an origin index, and returns a value.
 * @param kernel - 2d kernel to use as a transform
 * @param idx - index of the origin cell
 * @param size - point describing dimensions of the source array
 * @param src - source array to operate against
 * @param reducer - function that takes the result of the kernel application and returns a value
 */
export function convolve2d<T>(
  kernel: Kernel2d,
  idx: number,
  size: Point,
  src: ArrayLike<number>,
  reducer: (src: Array<number>) => T,
): T {
  return reducer(applyKernel2d(kernel, idx, size, src))
}

const kernelGol = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]
/**
 * Specialises kernel that is a little faster for calculating the value of all neighbouring cells (ignoring the origin) using the Moore shaped kernel. Convolution used by Conways Game of Life.
 *
 * @param idx - index of the origin cell
 * @param size - point describing dimensions of the source array
 * @param src - source array / search space
 * @returns the value of all neighbouring cells
 */
export function convolveGol(
  idx: number,
  size: Point,
  src: ArrayLike<number>,
): number {
  let total = 0

  const x = idx % size[0]
  const y = (idx / size[0]) | 0

  for (const point of kernelGol) {
    total =
      total +
      src[
        // eslint-disable-next-line no-nested-ternary -- wrapping
        (x < -point[0]
          ? size[0] + point[0]
          : x >= size[0] - point[0]
          ? point[0] - 1
          : x + point[0]) +
          // eslint-disable-next-line no-nested-ternary -- wrapping
          (y < -point[1]
            ? size[1] + point[1]
            : y >= size[1] - point[1]
            ? point[1] - 1
            : y + point[1]) *
            size[0]
      ]
  }

  return total
}
