'use client'

import {useState} from 'react'
import type {InteractionAction} from 'sketch-react-loop'
import {SketchLoop} from 'sketch-react-loop'
import {Screen} from 'ui'
import {Simulation, trace} from './simulation'
import {TraceProvider, Tron} from '@ca/trace'

const sim = new Simulation()

export default function Page(): JSX.Element {
  // const [sim, setSim] = useState<Simulation>(new Simulation())
  // const simulation = new Simulation()

  // Small chance of spawn - ignore, simulation creates its initial state
  // let p = 0.0001 + Math.random() * 0.002
  // for (let i = 0; i < sim.world.size.x * sim.world.size.y * p; i++) {
  //   sim.setCell(
  //     Math.floor(Math.random() * sim.world.size.x),
  //     Math.floor(Math.random() * sim.world.size.y),
  //     255,
  //   )
  // }

  return (
    <Screen>
      <TraceProvider value={trace}>
        <SketchLoop
          onTick={sim.createTickHandler()}
          // onTick={() => {
          //   // use step for now
          // }}
          onInteraction={({
            type,
            point,
            app,
          }: Parameters<InteractionAction>[0]) => {
            if (type === 'pointerdown') {
              // sim.setSeed(
              //   Math.floor(point.x / sim.cellSize.x),
              //   Math.floor(point.y / sim.cellSize.y),
              //   1,
              // )
              // random % chance of a spawn
              // p = 0.0005 + Math.random() * 0.002
              // const p = 0.0005
              // for (
              //   let i = 0;
              //   i < sim.world.size.x * sim.world.size.y * p;
              //   i++
              // ) {
              //   sim.setCell(
              //     Math.floor(Math.random() * sim.world.size.x),
              //     Math.floor(Math.random() * sim.world.size.y),
              //     1,
              //   )
              // }

              sim.step(app)
            }

            return false
          }}
        />
        <Tron />
      </TraceProvider>
    </Screen>
  )
}
