import {Point} from 'mathutil'
import {type World} from '@ca/world'

export const period = 5
// export const size = Point.of(period * 16, period * 9)
// export const cellSize = Point.of(30, 30)
export const size = Point.of(period * 160, period * 90)
export const cellSize = Point.of(3, 3)
export const initialSetup: InitialSetup = 'blinky'

type InitialSetup = 'blinky' | 'rnd' | 'glider'

export function setInitialState(
  world: World,
  state: InitialSetup = initialSetup,
): void {
  switch (state) {
    case 'blinky':
      applyBlinky(world)
      return
    case 'rnd':
      applyRandom(world)
      return
    case 'glider':
      applyGlider(world)
      return
    default:
      throw new Error('Can not identify initial state')
  }
}

function applyBlinky(world: World): void {
  for (let y = 2; y < world.size.y; y = y + period) {
    for (let x = 2; x < world.size.x; x = x + period) {
      world.setCell(x, y - 1, 1)
      world.setCell(x, y, 1)
      world.setCell(x, y + 1, 1)
    }
  }
}

// :rofl: this isn't very good. It'll happily set cells that are already set so the final distribution won't necessarily by 0.25-0.75 coverage
function applyRandom(world: World): void {
  const p = 0.25 + Math.random() * 0.5 // 0.25...0.75
  for (let i = 0; i < world.data.length * p; i++) {
    world.setCell(
      Math.floor(Math.random() * world.size.x),
      Math.floor(Math.random() * world.size.y),
      1,
    )
  }
}

function applyGlider(world: World): void {
  for (let y = 2; y < world.size.y - 2; y = y + period) {
    for (let x = 2; x < world.size.x - 2; x = x + period) {
      world.setCell(x + 1, y - 1, 1)
      world.setCell(x, y - 2, 1)
      world.setCell(x - 1, y, 1)
      world.setCell(x, y, 1)
      world.setCell(x + 1, y, 1)
    }
  }
}
