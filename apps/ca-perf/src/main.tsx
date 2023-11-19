import {createRoot} from 'react-dom/client'
import {loop} from 'sketch-loop'
import {Simulation} from './simulation.ts'
import {Simulation as Simulation2} from './simulation2.ts'
import {Simulation as Simulation3} from './simulation3.ts'
import {Simulation as Simulation4} from './simulation4.ts'

const app = loop({
  container: document.body,
})

/**
 * Standardised from packages -\> slower, 2x on sim2
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
 * Raw simulation - fastest
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
 * Raw sim with \@ca/world
 */
console.log('simulation 4')
const sim = new Simulation4()
const events = sim.getEvents()
app.on({
  type: 'tick',
  action: events.render,
})
app.on({
  type: 'tick',
  action: events.update,
})

app.start()

// console.log('World size:', `[${sim.world.size.x}, ${sim.world.size.y}]`)
// console.log('Cells:', sim.world.data.length)
