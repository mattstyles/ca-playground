import {Point} from 'mathutil/point'
import {Bench} from 'tinybench'

import {createIterationSuite} from '../src/kernel-iteration.ts'

const size = Point.of(500, 500)
const bench = new Bench({time: 2000})

const marks = createIterationSuite(size.x, size.y)
marks.forEach((mark) => {
  bench.add(mark.name, mark.bench.run)
})

console.log('\nRunning benchmarks: ', marks.length)
console.log('\nData size for each test', size.x * size.y)

await bench.run()

console.table(bench.table())
