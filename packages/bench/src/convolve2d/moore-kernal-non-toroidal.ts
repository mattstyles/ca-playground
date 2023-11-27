import {type Kernel, type Point} from '@ca/kernel'

// Non-toroidal
// Suprisingly much faster than toroidal
function getNeighbours(idx: number, src: ArrayLike<number>, w: number): number {
  // Top-left
  if (idx === 0) {
    return src[idx + 1] + src[idx + w] + src[idx + w + 1]
  }

  // Top-right corner
  if (idx === w - 1) {
    return src[idx + w - 1] + src[idx - 1] + src[idx + w]
  }

  // Bottom-left corner
  if (idx === src.length - w) {
    return src[idx - w] + src[idx - w + 1] + src[idx + 1]
  }

  // Bottom-right corner
  if (idx === src.length - 1) {
    return src[idx - w - 1] + src[idx - w] + src[idx - 1]
  }

  // Top edge
  if (idx < w) {
    return (
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
      src[idx + 1]
    )
  }

  // Left edge
  if (idx % w === 0) {
    return (
      src[idx - w] +
      src[idx - w + 1] +
      src[idx + 1] +
      src[idx + w] +
      src[idx + w + 1]
    )
  }

  // Right edge
  if ((idx - (w - 1)) % w === 0) {
    return (
      src[idx - w - 1] +
      src[idx - w] +
      src[idx - 1] +
      src[idx + w - 1] +
      src[idx + w]
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
): number {
  return getNeighbours(idx, src, w)
}
