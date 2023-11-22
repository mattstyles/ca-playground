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
  offsets2d: Kernel<Point>,
  stride: number,
  buffer: Array<number> = [],
): Kernel<number> {
  const kernel: Kernel<number> = buffer
  for (const [x, y] of offsets2d) {
    kernel.push(x + y * stride)
  }
  return kernel
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
export function translateKernel(
  kernel: Kernel<Point>,
  idx: number,
  size: Point,
  buffer?: Kernel<number>,
): Kernel<number> {
  const b = buffer || Array.from({length: kernel.length})
  const x = idx % size[0]
  const y = (idx / size[1]) | 0
  for (let i = 0; i < kernel.length; i++) {
    b[i] = applyToroidalPermutedOffset(
      x,
      y,
      kernel[i][0],
      kernel[i][1],
      size[0],
      size[1],
    )
  }
  return b
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
 * @returns
 */
export function apply2dKernel<T>(
  kernel: Kernel<Point>,
  idx: number,
  size: Point,
  src: ArrayLike<T>,
  buffer?: Array<T>,
): Array<T> {
  const b = buffer || Array.from({length: kernel.length})
  for (let i = 0; i < kernel.length; i++) {
    const x = idx % size[0]
    const y = (idx / size[1]) | 0
    const target = applyToroidalPermutedOffset(
      x,
      y,
      kernel[i][0],
      kernel[i][1],
      size[0],
      size[1],
    )
    b[i] = src[target]
  }
  return b
}

/**
 * Returns a buffer that contains the contents of each cell described by a kernel of discrete indices.
 * Toroidal.
 *
 * @param kernel - the 2d kernel to use as a transform
 * @param idx - the origin index
 * @param size - 2d dimensions of the search space
 * @param src - the full search space to index against
 * @param buffer - the storage buffer for the output
 * @returns
 */
export function applyKernel<T>(
  kernel: Kernel<number>,
  src: ArrayLike<T>,
  buffer?: Array<T>,
): Array<T> {
  const b = buffer || Array.from({length: kernel.length})
  for (let i = 0; i < kernel.length; i++) {
    b[i] = src[kernel[i]]
  }
  return b
}

// Convolution rule application
// export function convolve(
//   kernel: Kernel<Point>,
//   buffer: Uint8ClampedArray,
//   rules: Uint8ClampedArray
// )

/**
 * Calculates a given offset from an origin coordinate in 2d space.
 * Returns a coordinate in 2d space.
 *
 * @param x - origin x coord
 * @param y - origin y coord
 * @param ox - offset in the x dimension
 * @param oy - offset in the y dimension
 * @param w - size of search space in x dimension
 * @param h - size of search space in y dimension
 * @returns
 */
export function applyToroidalOffset(
  x: number,
  y: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
): [number, number] {
  return [
    // eslint-disable-next-line no-nested-ternary -- wrapping
    x < -ox ? w + ox : x >= w - ox ? ox - 1 : x + ox,
    // eslint-disable-next-line no-nested-ternary -- wrapping
    y < -oy ? h + oy : y >= h - oy ? oy - 1 : y + oy,
  ]
}

/**
 * Calculates a given offset from an origin coordinate in 2d space.
 * Returns an index in 1d space.
 *
 * @param x - origin x coord
 * @param y - origin y coord
 * @param ox - offset in the x dimension
 * @param oy - offset in the y dimension
 * @param w - size of search space in x dimension
 * @param h - size of search space in y dimension
 * @returns
 */
export function applyToroidalPermutedOffset(
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
    (y < -oy ? h + oy : y >= h - oy ? oy - 1 : y + oy) * h
  )
}
