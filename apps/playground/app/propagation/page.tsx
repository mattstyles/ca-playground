'use client'

import type {Props, InteractionAction} from 'sketch-react-loop'
import {SketchLoop} from 'sketch-react-loop'
import type {TickEvent} from 'sketch-application'
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
  const simulation = new Simulation()

  return (
    <Screen>
      <SketchLoop
        onTick={simulation.createTickHandler()}
        onInteraction={({type, point}: Parameters<InteractionAction>[0]) => {
          if (type === 'pointerdown') {
            simulation.setSeed(
              Math.floor(point.x / simulation.cellSize.x),
              Math.floor(point.y / simulation.cellSize.y),
              255,
            )
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
