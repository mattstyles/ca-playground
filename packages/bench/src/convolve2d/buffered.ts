import {type Kernel, type Point} from '@ca/kernel'

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

export function convolve2d<T>(
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
