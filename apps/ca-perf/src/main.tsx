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
console.log('simulation 5')
const sim = new Simulation5()
const handler = sim.createTickHandler()
app.on({
  type: 'tick',
  action: handler,
})

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

// @TODO benchmark using tinybench just the && and nested if change because it seems unbelievable that Chrome is doing something here.

// app.start()

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
