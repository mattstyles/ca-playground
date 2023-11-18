import {test, expect} from 'vitest'

import {each} from './iterators.ts'

const square = (x: number): number => x ** 2

test('each', () => {
  const output: Array<number> = []
  each((i) => output.push(i), [0, 1, 2])
  expect(output).toStrictEqual([0, 1, 2])
})

test('each::curried', () => {
  const output: Array<number> = []
  const push = each<number>((i) => output.push(i))
  push([1, 2, 3])
  expect(output).toStrictEqual([1, 2, 3])
})
