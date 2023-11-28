import {type Kernel, type Point} from '@ca/kernel'

// Toroidal
// Not fully tested though, think there are some mistakes, but, for the sake of benchmarks it will be the right amount of calculations.
// length is added to investigate why this is so much slower than the non-toroidal version, incase accessing src.length made any difference in array optimisations. no difference.
function getNeighbours(
  idx: number,
  src: ArrayLike<number>,
  w: number,
  l: number,
): number {
  // Top-left
  if (idx === 0) {
    return (
      src[l - 1] +
      src[l - w] +
      src[l - w + 1] +
      src[idx + w - 1] +
      src[idx + 1] +
      src[idx + w + w - 1] +
      src[idx + w] +
      src[idx + w + 1]
    )
  }

  // Top-right corner
  if (idx === w - 1) {
    return (
      src[l - 2] +
      src[l - 1] +
      src[l - w] +
      src[idx - 1] +
      src[0] +
      src[idx + w - 1] +
      src[idx + w] +
      src[idx + 1]
    )
  }

  // Bottom-left corner
  if (idx === l - w) {
    return (
      src[idx - 1] +
      src[idx - w] +
      src[idx - w + 1] +
      src[l - 1] +
      src[idx + 1] +
      src[w - 1] +
      src[0] +
      src[1]
    )
  }

  // Bottom-right corner
  if (idx === l - 1) {
    return (
      src[idx - w - 1] +
      src[idx - w] +
      src[idx - w - w + 1] +
      src[idx - 1] +
      src[idx - w + 1] +
      src[w - 2] +
      src[w - 1] +
      src[0]
    )
  }

  // Top edge
  if (idx < w) {
    return (
      src[l - w + idx - 1] +
      src[l - w + idx] +
      src[l - w + idx - 1 + 1] +
      src[idx - 1] +
      src[idx + 1] +
      src[idx + w - 1] +
      src[idx + w] +
      src[idx + w + 1]
    )
  }

  // Bottom edge
  if (idx > src.length - w) {
    return (
      src[idx - w - 1] +
      src[idx - w] +
      src[idx - w + 1] +
      src[idx - 1] +
      src[idx + 1] +
      src[0 + l - idx - 1] +
      src[0 + l - idx] +
      src[0 + l - idx + 1]
    )
  }

  // Left edge
  if (idx % w === 0) {
    return (
      src[idx - 1] +
      src[idx - w] +
      src[idx - w + 1] +
      src[idx + w - 1] +
      src[idx + 1] +
      src[idx + w + w - 1] +
      src[idx + w] +
      src[idx + w + 1]
    )
  }

  // Right edge
  if ((idx - (w - 1)) % w === 0) {
    return (
      src[idx - w - 1] +
      src[idx - w] +
      src[idx - w - w + 1] +
      src[idx - 1] +
      src[idx - w + 1] +
      src[idx + w - 1] +
      src[idx + w] +
      src[idx + 1]
    )
  }

  // Fall through, i.e all 8 neighbours
  return (
    src[idx - w - 1] +
    src[idx - w] +
    src[idx - w + 1] +
    src[idx - 1] +
    src[idx + 1] +
    src[idx + w - 1] +
    src[idx + w] +
    src[idx + w + 1]
  )
}

export function convolve2d(
  idx: number,
  w: number,
  src: ArrayLike<number>,
  l: number,
): number {
  // Doing this inline and avoiding the extra function call is _usually_ ever so slightly faster

  // Top-left
  if (idx === 0) {
    return (
      src[l - 1] +
      src[l - w] +
      src[l - w + 1] +
      src[idx + w - 1] +
      src[idx + 1] +
      src[idx + w + w - 1] +
      src[idx + w] +
      src[idx + w + 1]
    )
  }

  // Top-right corner
  if (idx === w - 1) {
    return (
      src[l - 2] +
      src[l - 1] +
      src[l - w] +
      src[idx - 1] +
      src[0] +
      src[idx + w - 1] +
      src[idx + w] +
      src[idx + 1]
    )
  }

  // Bottom-left corner
  if (idx === l - w) {
    return (
      src[idx - 1] +
      src[idx - w] +
      src[idx - w + 1] +
      src[l - 1] +
      src[idx + 1] +
      src[w - 1] +
      src[0] +
      src[1]
    )
  }

  // Bottom-right corner
  if (idx === l - 1) {
    return (
      src[idx - w - 1] +
      src[idx - w] +
      src[idx - w - w + 1] +
      src[idx - 1] +
      src[idx - w + 1] +
      src[w - 2] +
      src[w - 1] +
      src[0]
    )
  }

  // Top edge
  if (idx < w) {
    return (
      src[l - w + idx - 1] +
      src[l - w + idx] +
      src[l - w + idx - 1 + 1] +
      src[idx - 1] +
      src[idx + 1] +
      src[idx + w - 1] +
      src[idx + w] +
      src[idx + w + 1]
    )
  }

  // Bottom edge
  if (idx > src.length - w) {
    return (
      src[idx - w - 1] +
      src[idx - w] +
      src[idx - w + 1] +
      src[idx - 1] +
      src[idx + 1] +
      src[0 + l - idx - 1] +
      src[0 + l - idx] +
      src[0 + l - idx + 1]
    )
  }

  // Left edge
  if (idx % w === 0) {
    return (
      src[idx - 1] +
      src[idx - w] +
      src[idx - w + 1] +
      src[idx + w - 1] +
      src[idx + 1] +
      src[idx + w + w - 1] +
      src[idx + w] +
      src[idx + w + 1]
    )
  }

  // Right edge
  if ((idx - (w - 1)) % w === 0) {
    return (
      src[idx - w - 1] +
      src[idx - w] +
      src[idx - w - w + 1] +
      src[idx - 1] +
      src[idx - w + 1] +
      src[idx + w - 1] +
      src[idx + w] +
      src[idx + 1]
    )
  }

  // Fall through, i.e all 8 neighbours
  return (
    src[idx - w - 1] +
    src[idx - w] +
    src[idx - w + 1] +
    src[idx - 1] +
    src[idx + 1] +
    src[idx + w - 1] +
    src[idx + w] +
    src[idx + w + 1]
  )
}
