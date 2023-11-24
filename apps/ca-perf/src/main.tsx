/* eslint-disable no-console -- debug file */
import {createRoot} from 'react-dom/client'
import {loop} from 'sketch-loop'
import {run} from './bench.ts'
import {Simulation} from './simulation.ts'
import {Simulation as Simulation2} from './simulation2.ts'
import {Simulation as Simulation3} from './simulation3.ts'
import {Simulation as Simulation4} from './simulation4.ts'
import {Simulation as Simulation5} from './simulation5.ts'
import {Simulation as Simulation2d} from './simulation-2d.ts'
import {Simulation as SimulationK1} from './kernel/k1.ts'
import {Simulation as SimulationK2} from './kernel/k2.ts'
import {Simulation as SimulationK3} from './kernel/k3-2d.ts'
import {Simulation as SimulationK4} from './kernel/k4.ts'

const app = loop({
  container: document.body,
})

/**
 * Standardised from packages - slower, see update function
 */
// console.log('simulation 1')
// const sim = new Simulation()
// const handler = sim.createTickHandler()
// app.on({
//   type: 'tick',
//   action: handler,
// })

/**
 * Iterate _within_ a class, i.e. world does the iteration rather than Simulation iterating over world data
 */
// console.log('simulation 2')
// const sim = new Simulation2()
// const handler = sim.createTickHandler()
// app.on({
//   type: 'tick',
//   action: handler,
// })

/**
 * Raw simulation - but uses .entries so slower
 */
// console.log('simulation 3')
// const sim = new Simulation3()
// const events = sim.getEvents()
// app.on({
//   type: 'tick',
//   action: events.render,
// })
// app.on({
//   type: 'tick',
//   action: events.update,
// })

/**
 * Raw sim with \@ca/world - uses .entries though :(
 */
// console.log('simulation 4')
// const sim = new Simulation4()
// const events = sim.getEvents()
// app.on({
//   type: 'tick',
//   action: events.render,
// })
// app.on({
//   type: 'tick',
//   action: events.update,
// })

/**
 * Using kernel
 */
// console.log('simulation 5')
// const sim = new Simulation5()
// const handler = sim.createTickHandler()
// app.on({
//   type: 'tick',
//   action: handler,
// })

/**
 * 2d data structure approach - surprisingly fast
 */
// console.log('simulation 2d')
// const sim = new Simulation2d()
// const handler = sim.createTickHandler()
// app.on({
//   type: 'tick',
//   action: handler,
// })

/**
 * Kernel one
 * Initial attempt, not optimised and deffo not fast
 */
// console.log('simulation kernel 1')
// const sim = new SimulationK1()
// const handler = sim.createTickHandler()
// app.on({
//   type: 'tick',
//   action: handler,
// })

/**
 * Kernel two
 * Same approach, but some optimisations
 */
// console.log('simulation kernel 2')
// const sim = new SimulationK2()
// const handler = sim.createTickHandler()
// app.on({
//   type: 'tick',
//   action: handler,
// })

/**
 * Kernel three
 * Fully 2d approach, without translating the kernel to 1d
 */
// console.log('simulation kernel 3 - 2d')
// const sim = new SimulationK3()
// const handler = sim.createTickHandler()
// app.on({
//   type: 'tick',
//   action: handler,
// })

/**
 * Kernel four
 * Same 1d as kernel 2, but using a swap buffer instead of the actions mutation array
 */
console.log('simulation kernel 4')
const sim = new SimulationK4()
const handler = sim.createTickHandler()
app.on({
  type: 'tick',
  action: handler,
})

// @TODO benchmark using tinybench just the && and nested if change because it seems unbelievable that Chrome is doing something here.

app.start()

// console.log('World size:', `[${sim.world.size.x}, ${sim.world.size.y}]`)
// console.log('Cells:', sim.world.data.length)

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case ' ':
      sim.step(app)
  }
})

/**
 * Bench marks for iteration order
 */
// await new Promise((res) => {
//   setTimeout(res, 1000)
// })
// await run()
