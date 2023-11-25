import {Bench} from 'tinybench'

import {createConvolutionSuite} from '../src/convolve2d.ts'

const size = [500, 500]
const bench = new Bench({time: 2000})

const marks = createConvolutionSuite(size[0], size[1])
marks.forEach((mark) => {
  bench.add(mark.name, mark.bench.run)
})

console.log('\nRunning benchmarks: ', marks.length)
console.log('\nData size for each test', size[0] * size[1])

await bench.run()

console.table(bench.table())
