export type Point = [x: number, y: number]

/**
 * The kernel refers describes a weighting function.
 * In our case this describes the weight for a given offset.
 * We can then apply those offsets to generate indices into our source data and apply weights to handle the convolution.
 */
export type Kernel<T> = Array<[number, T]>

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
export function createPresetKernel(preset: KernelPresets): Kernel<Point> {
  switch (preset) {
    case KernelPresets.Moore:
      return presets[KernelPresets.Moore]
    case KernelPresets.Cardinal:
      return presets[KernelPresets.Cardinal]
  }
}

/**
 * Presets always inscribe the origin cell.
 */
export const presets: Record<KernelPresets, Kernel<Point>> = {
  [KernelPresets.Cardinal]: [
    [1, [0, -1]],
    [1, [1, 0]],
    [0, [0, 0]],
    [1, [0, 1]],
    [1, [-1, 0]],
  ],
  [KernelPresets.Moore]: createKernel2d(3, 3, [1, 1, 1, 1, 0, 1, 1, 1, 1]),
}

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
): Kernel<Point> {
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
  const offsets: Kernel<Point> = []
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
 * Apply 2d kernel offsets in 1d space
 *
 * @param offsets - 2d offsets
 * @param stride - stride to apply, this is typically the x size of a 2d grid
 */
export function createKernel1d(
  kernel2d: Kernel<Point>,
  stride: number,
): Kernel<number> {
  const kernel: Kernel<number> = []
  for (const [w, [x, y]] of kernel2d) {
    kernel.push([w, x + y * stride])
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
): Kernel<number> {
  const buffer: Kernel<number> = []
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
  kernel: Kernel<Point>,
  idx: number,
  size: Point,
  src: ArrayLike<number>,
): Array<number> {
  const buffer: Array<number> = []
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
 * Returns a buffer that contains the contents of each cell described by a kernel of discrete indices.
 * Toroidal.
 *
 * @param kernel - the 2d kernel to use as a transform
 * @param src - the full search space to index against
 * @param buffer - the storage buffer for the output
 * @returns buffer containing values from the source array
 */
export function applyKernel(
  kernel: Kernel<number>,
  src: ArrayLike<number>,
  buffer?: Array<number>,
): Array<number> {
  const b = buffer || Array.from({length: kernel.length})
  for (let i = 0; i < kernel.length; i++) {
    b[i] = src[kernel[i][1]] * kernel[i][0]
  }
  return b
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
  kernel: Kernel<Point>,
  idx: number,
  size: Point,
  src: ArrayLike<number>,
  reducer: (src: Array<number>) => T,
): T {
  return reducer(applyKernel2d(kernel, idx, size, src))
}

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
    (y < -oy ? h + oy : y >= h - oy ? oy - 1 : y + oy) * w
  )
}
