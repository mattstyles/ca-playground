import {test, expect} from 'vitest'

import {type Point} from '@ca/struct'
import {
  KernelPresets,
  type Kernel2d,
  createPresetKernel,
  createKernel2d,
  presets,
  applyToroidalPermutedOffset,
  applyToroidalOffset,
  applyKernel2d,
  convolve2d,
} from './index.ts'

test('Create preset kernel', () => {
  const mooreOffsets = presets[KernelPresets.Moore]
  expect(mooreOffsets).toContainEqual([1, [-1, -1]])
  expect(mooreOffsets).toContainEqual([1, [0, -1]])
  expect(mooreOffsets).toContainEqual([1, [1, -1]])
  expect(mooreOffsets).toContainEqual([1, [-1, 0]])
  expect(mooreOffsets).toContainEqual([0, [0, 0]])
  expect(mooreOffsets).toContainEqual([1, [1, 0]])
  expect(mooreOffsets).toContainEqual([1, [-1, 1]])
  expect(mooreOffsets).toContainEqual([1, [0, 1]])
  expect(mooreOffsets).toContainEqual([1, [1, 1]])
  expect(mooreOffsets.length).toBe(3 * 3)
})

test('Create 2d kernel', () => {
  const kernel: Kernel2d = createKernel2d(3, 1, [1, 1, 0.5])
  expect(kernel).toContainEqual([1, [-1, 0]])
  expect(kernel).toContainEqual([1, [0, 0]])
  expect(kernel).toContainEqual([0.5, [1, 0]])
  expect(kernel.length).toBe(3)
})

test('Apply toroidal offset', () => {
  const size = {x: 5, y: 5}
  const kernel = presets[KernelPresets.Moore]

  const points = [
    [0, 0], // top left
    [4, 0], // top right
    [0, 4], // bottom left
    [4, 4], // bottom right
    [1, 1], // interior
  ]

  const tests = [
    {
      origin: points[0],
      expected: [
        [4, 4],
        [0, 4],
        [1, 4],
        [4, 0],
        [0, 0],
        [1, 0],
        [4, 1],
        [0, 1],
        [1, 1],
      ],
    },
    {
      origin: points[1],
      expected: [
        [3, 4],
        [4, 4],
        [0, 4],
        [3, 0],
        [4, 0],
        [0, 0],
        [3, 1],
        [4, 1],
        [0, 1],
      ],
    },
    {
      origin: points[2],
      expected: [
        [4, 3],
        [0, 3],
        [1, 3],
        [4, 4],
        [0, 4],
        [1, 4],
        [4, 0],
        [0, 0],
        [1, 0],
      ],
    },
    {
      origin: points[3],
      expected: [
        [3, 3],
        [4, 3],
        [0, 3],
        [3, 4],
        [4, 4],
        [0, 4],
        [3, 0],
        [4, 0],
        [0, 0],
      ],
    },
    {
      origin: points[4],
      expected: [
        [0, 0],
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
        [0, 2],
        [1, 2],
        [2, 2],
      ],
    },
  ]

  for (const {origin, expected} of tests) {
    const output = []
    for (const offset of kernel) {
      output.push(
        applyToroidalOffset(
          origin[0],
          origin[1],
          offset[1][0],
          offset[1][1],
          size.x,
          size.y,
        ),
      )
    }
    expect(output).toStrictEqual(expected)
  }
})

test('Apply permuted toroidal offset', () => {
  const size = {x: 5, y: 5}
  const kernel = presets[KernelPresets.Moore]

  const tests = [
    {origin: [0, 0], expected: [24, 20, 21, 4, 0, 1, 9, 5, 6]},
    {origin: [4, 0], expected: [23, 24, 20, 3, 4, 0, 8, 9, 5]},
    {origin: [0, 4], expected: [19, 15, 16, 24, 20, 21, 4, 0, 1]},
    {origin: [4, 4], expected: [18, 19, 15, 23, 24, 20, 3, 4, 0]},
    {origin: [1, 1], expected: [0, 1, 2, 5, 6, 7, 10, 11, 12]},
  ]

  for (const {origin, expected} of tests) {
    const output = []
    for (const offset of kernel) {
      output.push(
        applyToroidalPermutedOffset(
          origin[0],
          origin[1],
          offset[1][0],
          offset[1][1],
          size.x,
          size.y,
        ),
      )
    }
    expect(output).toStrictEqual(expected)
  }
})

test('Apply 2d kernel to world space indices', () => {
  const src = [
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [0, 0, 3, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 2, 0, 0, 0],
  ].flat()
  const size: Point = [5, 5]
  const kernel = presets[KernelPresets.Moore]

  expect(applyKernel2d(kernel, 6, size, src)).toStrictEqual(
    Array.from([0, 0, 0, 1, 0, 0, 0, 0, 3]),
  )
})

test('Convolution over 2d search space', () => {
  const src = [
    [0, 1, 0, 0, 0],
    [1, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0],
  ].flat()
  const size: Point = [5, 5]
  const kernel = createPresetKernel(KernelPresets.Moore)

  const sum = (nums: Array<number>): number => {
    let total = 0
    for (const value of nums) {
      total = total + value
    }
    return total
  }

  // idx = 6 [1, 1] => 4 alive neighbours
  expect(convolve2d(kernel, 6, size, src, sum)).toBe(4)

  // Origin cell should be weighted out of a Moore kernel
  expect(convolve2d(kernel, 7, size, src, sum)).toBe(2)
})
