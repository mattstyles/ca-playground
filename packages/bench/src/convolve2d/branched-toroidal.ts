import {type Kernel, type Point} from '@ca/kernel'

function getXOffset(x: number, ox: number, w: number): number {
  if (x < -ox) {
    return w + ox
  }
  if (x >= w - ox) {
    return ox - 1
  }
  return x + ox
}

function getYOffset(y: number, oy: number, h: number): number {
  if (y < -oy) {
    return h + oy
  }

  if (y >= h - oy) {
    return oy - 1
  }

  return y + oy
}

function applyToroidalPermutedBranchedOffset(
  x: number,
  y: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
): number {
  return getXOffset(x, ox, w) + getYOffset(y, oy, h) * w
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
    const target = applyToroidalPermutedBranchedOffset(
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
