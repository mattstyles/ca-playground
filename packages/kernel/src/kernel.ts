export type Point = [x: number, y: number]
export type WeightedOffset<T> = [number, T]

/**
 * The kernel refers to index offsets from the current 1D location
 */
export type Kernel<T> = Array<T>

/**
 * Kernel offsets to apply from the current index
 */
// export type KernelOffsets<T> = Array<T>

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
 * Creates a 1d kernel from a set of offsets
 *
 * @param variant - list of preset kernel configurations @see KernelVariants enum
 * @param params - parameters required to create the kernel
 * @returns Kernel
 */
export function createPresetKernel(
  preset: KernelPresets,
  params: KernelParams,
): Kernel<number> {
  switch (preset) {
    case KernelPresets.Moore:
      return createKernel1d(presets[KernelPresets.Moore], params.stride)
    case KernelPresets.Cardinal:
      return createKernel1d(presets[KernelPresets.Cardinal], params.stride)
  }
}

/**
 * Presets always inscribe the origin cell.
 */
export const presets: Record<KernelPresets, Kernel<Point>> = {
  [KernelPresets.Cardinal]: [
    [0, -1],
    [1, 0],
    [0, 0],
    [0, 1],
    [-1, 0],
  ],
  [KernelPresets.Moore]: createKernel2d(3, 3),
}

/**
 * Offset 2d array with respect to a certain index.
 * The offsets are always centered on a given index.
 *
 * @param w - width of kernel
 * @param h - height of kernel
 */
export function createKernel2d(
  w: number,
  h: number,
  buffer: Kernel<Point> = [],
): Kernel<Point> {
  // Calculate offsets
  const ow = w >> 1
  const oh = h >> 1
  const offsets: Kernel<Point> = buffer
  // Populate 2d kernel offsets
  for (let j = 0 - oh; j < h - oh; j++) {
    for (let i = 0 - ow; i < w - ow; i++) {
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
export function createKernel1d(
  offsets: Kernel<Point>,
  stride: number,
  buffer: Array<number> = [],
): Kernel<number> {
  const kernel: Kernel<number> = buffer
  for (const [x, y] of offsets) {
    kernel.push(x + y * stride)
  }
  return kernel
}

/**
 * Translates a kernel into indices based on an origin index
 *
 * @param kernel - the kernel to use as a transform
 * @param idx - the origin index
 * @param src - source/search space
 * @param size - 2d dimensions of the search space
 * @param outputBuffer - the storage buffer for the output
 */
export function translateKernel(
  kernel: Kernel<Point>,
  idx: number,
  src: ArrayLike<number>,
  size: Point,
  outputBuffer: Uint8ClampedArray,
): void {
  // let index = 0
  // for (const translation of kernel) {
  //   // Does this need to pull from the world array data?
  //   // i.e. do we need a buffer describing the full data set, and another describing the translated kernel, if so, we need to understand the dimensions for edge case resolution
  //   buffer[index++] = buffer[idx + translation]
  // }
}
// @TODO use kernel to create a convolution with edge wrapping

// function translatePoint(idx: number, p: Point, size: Point): number {}
