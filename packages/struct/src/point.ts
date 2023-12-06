export type Point = [number, number]

/**
 * Permutes a 2d point ([x, y]) into a 1d index
 *
 * @param point - origin coordinate
 * @param w - x dimension width in 2d space
 * @returns index into 1d space
 */
export function permute2d(point: Point, w: number): number {
  return point[0] + point[1] * w
}

/**
 * Permutes a 1d index into a 2d coordinate
 *
 * @param idx - the index in 1d space
 * @param w - x dimension width in 2d space
 * @returns point coordinate in 2d space
 */
export function permute1d(idx: number, w: number): Point {
  return [idx % w, (idx / w) | 0]
}
