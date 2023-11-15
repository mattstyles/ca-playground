import {Point} from 'mathutil'
import {Bench} from 'tinybench'

import {createBenchmarks} from '../src/struct.ts'

const size = Point.of(400, 400)
const bench = new Bench({time: 100})

const marks = createBenchmarks(1000, 1000)
marks.forEach((mark) => {
  bench.add(mark.name, mark.bench.run)
})

console.log('\nRunning benchmarks: ', marks.length)

await bench.run()

console.log('\nData size for each test', 400 * 400)
console.table(bench.table())
