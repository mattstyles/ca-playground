import {isEven} from '@ca/fn/comparators'

export type Point = [x: number, y: number]
export type WeightedOffset<T> = [number, T]

/**
 * The kernel refers to index offsets from the current 1D location
 */
export type Kernel = Array<number>

/**
 * Kernel offsets to apply from the current index
 */
export type KernelOffsets<T> = Array<T>

/**
 * A weighted kernel specifies offsets from the current index with a weight to apply to that offset value.
 */
export type WeightedOffsets<T> = Array<WeightedOffset<T>>

interface KernelParams {
  stride: number
}
export enum KernelPresets {
  Moore,
  Cardinal,
}

/**
 * Creates a kernel from a set of offsets
 * @param variant - list of preset kernel configurations @see KernelVariants enum
 * @param params - parameters required to create the kernel
 * @returns Kernel
 */
export function makePresetKernel(
  preset: KernelPresets,
  params: KernelParams,
): Kernel {
  switch (preset) {
    case KernelPresets.Moore:
      return makeMooreKernel(params)
    case KernelPresets.Cardinal:
      // return makeCardinalKernel(params)
      return createKernel(presets[KernelPresets.Cardinal], params.stride)
  }
}

function isKernelOffset<T>(k: unknown): k is KernelOffsets<T> {
  return Array.isArray(k)
}

function makeMooreKernel(params: KernelParams): Kernel {
  return [0 - params.stride - 1]
}

function makeCardinalKernel(params: KernelParams): Kernel {
  return [
    0 - params.stride, // top
    1, // right
    params.stride, // bottom
    -1, // left
  ]
}

const presets: Record<KernelPresets, KernelOffsets<Point>> = {
  [KernelPresets.Cardinal]: [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ],
  [KernelPresets.Moore]: [],
}

/**
 * Offset 2d array with respect to a certain index.
 * The offsets are always centered on a given index. Supply an odd number for width and height.
 *
 * @param w - width of kernel
 * @param h - height of kernel
 */
export function createKernel2dOffsets(
  w: number,
  h: number,
): KernelOffsets<Point> {
  if (isEven(w) || isEven(h)) {
    throw new Error(
      '[Kernel] Kernels must be centered on a single cell. Width and height parameters should be odd numbers.',
    )
  }

  // Calculate offsets
  const wo = (w - 1) * 0.5
  const ho = (h - 1) * 0.5
  const offsets: KernelOffsets<Point> = []
  // Populate 2d kernel offsets
  for (let j = 0 - ho; j < h - ho; j++) {
    for (let i = 0 - wo; i < w - wo; i++) {
      offsets.push([i, j])
    }
  }

  return offsets
}

/**
 * Apply 2d kernel offsets in 1d space
 *
 * @param offsets - 2d offsets
 * @param stride - stride to apply, this is typically the x size of a 2d grid
 */
export function createKernel(
  offsets: KernelOffsets<Point>,
  stride: number,
): Kernel {
  const kernel: Kernel = []
  for (const [x, y] of offsets) {
    kernel.push(x + y * stride)
  }
  return kernel
}

// @TODO use kernel to create a convolution
