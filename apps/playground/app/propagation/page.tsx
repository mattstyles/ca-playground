'use client'

import {useState} from 'react'
import type {Props, InteractionAction} from 'sketch-react-loop'
import {SketchLoop} from 'sketch-react-loop'
import {proxy} from 'valtio'
import {useSnapshot} from 'valtio/react'
import {Point} from 'mathutil'
import {Screen} from 'ui'
import {Simulation} from './simulation'

interface Particle {
  origin: Point
}
interface Main {
  particles: Particle[]
}
const main = proxy<Main>({
  particles: [],
})

export default function Page(): JSX.Element {
  const [sim, setSim] = useState<Simulation>(new Simulation())
  // const simulation = new Simulation()

  // Small chance of spawn
  let p = 0.0001 + Math.random() * 0.002
  for (let i = 0; i < sim.dim.x * sim.dim.y * p; i++) {
    sim.setSeed(
      Math.floor(Math.random() * sim.dim.x),
      Math.floor(Math.random() * sim.dim.y),
      255,
    )
  }

  return (
    <Screen>
      <SketchLoop
        onTick={sim.createTickHandler()}
        onInteraction={({type, point}: Parameters<InteractionAction>[0]) => {
          if (type === 'pointerdown') {
            // sim.setSeed(
            //   Math.floor(point.x / sim.cellSize.x),
            //   Math.floor(point.y / sim.cellSize.y),
            //   255,
            // )

            // random % chance of a spawn
            p = 0.0005 + Math.random() * 0.002
            for (let i = 0; i < sim.dim.x * sim.dim.y * p; i++) {
              // sim.toggleCell(
              //   Math.floor(Math.random() * sim.dim.x),
              //   Math.floor(Math.random() * sim.dim.y),
              //   true
              // )
              sim.setSeed(
                Math.floor(Math.random() * sim.dim.x),
                Math.floor(Math.random() * sim.dim.y),
                255,
              )
            }
          }
        }}
      />
    </Screen>
  )
}

let time = 0
function render({app, dt}: Parameters<Props['onTick']>[0]): void {
  time = time + dt / 500

  app.ctx.fillStyle = '#232527'
  app.ctx.fillRect(0, 0, app.canvas.width, app.canvas.height)

  for (const particle of main.particles) {
    app.ctx.beginPath()
    app.ctx.fillStyle = '#ff7034'
    app.ctx.fillRect(particle.origin.x * 20, particle.origin.y * 20, 20, 20)
  }
}
