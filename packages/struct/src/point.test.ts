import {test, expect} from 'vitest'

import type {Point} from './point.ts'
import {permute1d, permute2d} from './point.ts'

test('Permute1d', () => {
  const tests = [
    {origin: 0, width: 3, expected: [0, 0]},
    {origin: 2, width: 3, expected: [2, 0]},
    {origin: 3, width: 3, expected: [0, 1]},
    {origin: 4, width: 3, expected: [1, 1]},
    {origin: 5, width: 5, expected: [0, 1]},
    {origin: 11, width: 5, expected: [1, 2]},
    {origin: 24, width: 5, expected: [4, 4]},
  ]

  for (const t of tests) {
    expect(permute1d(t.origin, t.width)).toStrictEqual(t.expected)
  }
})

test('Permute2d', () => {
  const tests: Array<{origin: Point; width: number; expected: number}> = [
    {origin: [0, 0], width: 3, expected: 0},
    {origin: [2, 0], width: 3, expected: 2},
    {origin: [0, 1], width: 3, expected: 3},
    {origin: [2, 1], width: 3, expected: 5},
    {origin: [0, 1], width: 5, expected: 5},
    {origin: [4, 4], width: 5, expected: 24},
  ]

  for (const t of tests) {
    expect(permute2d(t.origin, t.width)).toStrictEqual(t.expected)
  }
})
