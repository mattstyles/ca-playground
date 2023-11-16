import {Point} from 'mathutil/point'
import {Bench} from 'tinybench'

import {createBenchmarks} from '../src/struct.ts'

const size = Point.of(100, 100)
const bench = new Bench({time: 100})

const marks = createBenchmarks(size.x, size.y)
marks.forEach((mark) => {
  bench.add(mark.name, mark.bench.run)
})

// This is faster access for a typed array than working through a class object
// Note that arrays specified this way will be slightly faster too
// const buffer = new ArrayBuffer(size.x * size.y)
// const view = new Uint8ClampedArray(buffer)
// bench.add('Typed Array - sequential memory', () => {
//   for (let idx = 0; idx < view.length; idx++) {
//     view[idx] = view[idx] + 1
//     if (view[idx] >= 255) {
//       view[idx] = 0
//     }
//   }
// })

console.log('\nRunning benchmarks: ', marks.length)

await bench.run()

console.log('\nData size for each test', size.x * size.y)
console.table(bench.table())
