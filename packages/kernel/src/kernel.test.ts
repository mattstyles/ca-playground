import {test, expect} from 'vitest'

import {
  createKernel2dOffsets,
  type KernelOffsets,
  type Point,
  createKernel,
} from './kernel.ts'

test('Create 2d kernel offsets', () => {
  const mooreOffsets = createKernel2dOffsets(3, 3)
  expect(mooreOffsets).toContainEqual([-1, -1])
  expect(mooreOffsets).toContainEqual([0, -1])
  expect(mooreOffsets).toContainEqual([1, -1])
  expect(mooreOffsets).toContainEqual([-1, 0])
  expect(mooreOffsets).toContainEqual([0, 0])
  expect(mooreOffsets).toContainEqual([1, 0])
  expect(mooreOffsets).toContainEqual([-1, 1])
  expect(mooreOffsets).toContainEqual([0, 1])
  expect(mooreOffsets).toContainEqual([1, 1])
  expect(mooreOffsets.length).toBe(3 * 3)
})

test('Create kernel from offsets', () => {
  const offsets: KernelOffsets<Point> = createKernel2dOffsets(3, 1)
  const kernel = createKernel(offsets, 7)
  expect(kernel).toContain(-1)
  expect(kernel).toContain(0)
  expect(kernel).toContain(1)
  expect(kernel.length).toBe(3)
})

test('Create kernel with stride', () => {
  const offsets: KernelOffsets<Point> = [
    [1, 1],
    [0, -1],
  ]
  const kernel = createKernel(offsets, 9)
  expect(kernel).toContain(10)
  expect(kernel).toContain(-9)
  expect(kernel.length).toBe(2)
})
