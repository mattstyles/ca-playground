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

export function convolve2d(
  kernel: Kernel<Point>,
  idx: number,
  w: number,
  h: number,
  src: ArrayLike<number>,
): number {
  let total = 0
  // for (const k of kernel) {
  //   const point = k[1]
  //   const target = applyToroidalPermutedOffset(
  //     idx % w,
  //     (idx / w) | 0,
  //     point[0],
  //     point[1],
  //     w,
  //     h,
  //   )
  //   total = src[target] + total
  // }
  // eslint-disable-next-line @typescript-eslint/prefer-for-of -- faster as a for loop (although its marginal)
  for (let i = 0; i < kernel.length; i++) {
    const point = kernel[i][1]
    const target = applyToroidalPermutedOffset(
      idx % w,
      (idx / w) | 0,
      point[0],
      point[1],
      w,
      h,
    )
    total = src[target] + total
  }
  return total
}
