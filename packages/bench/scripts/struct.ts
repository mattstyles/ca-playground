import {Point} from 'mathutil/point'
import {Bench} from 'tinybench'

import {createStructureSuite} from '../src/struct.ts'

const size = Point.of(1000, 1000)
const bench = new Bench({time: 100})

const marks = createStructureSuite(size.x, size.y)
marks.forEach((mark) => {
  bench.add(mark.name, mark.bench.run)
})

// This is faster access for a typed array than working through a class object
// Note that arrays specified this way will be slightly faster too
// Update: removed strategy use and this is about the same
// const buffer = new ArrayBuffer(size.x * size.y)
// const view = new Uint8ClampedArray(buffer)
// bench.add('Typed Array - no class', () => {
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
