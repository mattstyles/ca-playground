// import {World} from '../src/world.ts'

interface Runner {
  name: string
  run: () => void
}

class Test1 implements Runner {
  data: Uint8ClampedArray
  name = 'Typed Array Iteration'
  constructor(size: number) {
    const buffer = new ArrayBuffer(size)
    this.data = new Uint8ClampedArray(buffer)
  }

  run(): void {
    for (let idx = 0; idx < this.data.length; idx++) {
      this.data[idx] = this.data[idx] + 1
      if (this.data[idx] >= 255) {
        this.data[idx] = 0
      }
    }
  }
}

class Test2 implements Runner {
  data: Map<number, number>
  name = 'Map Iteration'
  constructor(size: number) {
    this.data = new Map()
    for (let i = 0; i < size; i++) {
      this.data.set(i, 0)
    }
  }

  run(): void {
    this.data.forEach((v, k) => {
      this.data.set(k, v + 1)
      if (v >= 255) {
        this.data.set(k, 0)
      }
    })
  }
}

function run(test: Runner): void {
  const results = []
  for (let i = 0; i < numOfRuns; i++) {
    const start = performance.now()
    test.run()
    results.push(performance.now() - start)
  }

  console.log(test.name)
  const avg =
    results.reduce((total, duration) => total + duration) / results.length
  console.log('Average run duration', avg)

  console.log('')
}

const numOfRuns = 100
const dataSize = 1e6

run(new Test1(dataSize))
run(new Test2(dataSize))
