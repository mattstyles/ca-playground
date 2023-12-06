/**
 *
 */

import type {Point} from './types.ts'

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
): Point {
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
