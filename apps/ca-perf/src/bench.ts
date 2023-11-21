import {Bench} from 'tinybench'
import {Point} from 'mathutil'
import {World} from '@ca/world'

const bench = new Bench({time: 1000})
const size = Point.of(500, 500)

const world1 = new World(...size.pos)
const world2 = new World(...size.pos)
const world3 = new World(...size.pos)
const world4 = new World(...size.pos)

const actions1 = new Set()
const actions2 = new Set()
const actions3 = new Set()
const actions4 = new Set()
function sink(idx: number, actions: Set<number>) {
  actions.add(idx)
}

// Set initial state - blinky
const stride = 3
for (let y = stride; y < world1.size.y; y = y + 3 + stride) {
  for (let x = stride; x < world1.size.x; x = x + 3 + stride) {
    world1.setCell(x, y - 1, 1)
    world1.setCell(x, y, 1)
    world1.setCell(x, y + 1, 1)

    world2.setCell(x, y - 1, 1)
    world2.setCell(x, y, 1)
    world2.setCell(x, y + 1, 1)

    world3.setCell(x, y - 1, 1)
    world3.setCell(x, y, 1)
    world3.setCell(x, y + 1, 1)

    world4.setCell(x, y - 1, 1)
    world4.setCell(x, y, 1)
    world4.setCell(x, y + 1, 1)
  }
}

// Fire in to the updates
bench
  // .add('Nested if', () => {
  //   world1.iterate()
  // })
  // .add('&&', () => {
  //   world2.iterateSlow()
  // })
  .add('Off first nested', () => {
    for (let idx = 0; idx < world3.data.length; idx++) {
      const value = world3.data[idx]
      const neighbours = world3.getNumNeighbours(idx)
      if (value === 0) {
        if (neighbours === 3) {
          actions1.add(idx)
        }
        continue
      }

      if (neighbours < 2 || neighbours > 3) {
        actions1.add(idx)
      }
    }
    actions1.clear()
  })
  .add('Off first &&', () => {
    for (let idx = 0; idx < world3.data.length; idx++) {
      const value = world3.data[idx]
      const neighbours = world3.getNumNeighbours(idx)
      if (value === 0 && neighbours === 3) {
        actions2.add(idx)
        continue
      }

      if (neighbours < 2 || neighbours > 3) {
        actions2.add(idx)
      }
    }
    actions2.clear()
  })
  .add('On first nested', () => {
    for (let idx = 0; idx < world4.data.length; idx++) {
      const value = world4.data[idx]
      const neighbours = world4.getNumNeighbours(idx)
      if (value === 1) {
        if (neighbours < 2 || neighbours > 3) {
          actions3.add(idx)
        }
        continue
      }

      if (neighbours === 3) {
        actions3.add(idx)
      }
    }
    actions3.clear()
  })
  .add('On first &&', () => {
    for (let idx = 0; idx < world4.data.length; idx++) {
      const value = world4.data[idx]
      const neighbours = world4.getNumNeighbours(idx)
      if (value === 1 && (neighbours < 2 || neighbours > 3)) {
        actions4.add(idx)
        continue
      }
      if (neighbours === 3) {
        actions4.add(idx)
      }
    }
    actions4.clear()
  })

export async function run() {
  await bench.run()
  console.table(bench.table())
}
