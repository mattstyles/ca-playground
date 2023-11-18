'use client'

import {useState} from 'react'
import type {InteractionAction} from 'sketch-react-loop'
import {SketchLoop} from 'sketch-react-loop'
import {proxy} from 'valtio'
import {useSnapshot} from 'valtio/react'
import {Point} from 'mathutil'
import {Screen} from 'ui'
import {Simulation, trace} from './simulation'
import {TraceProvider, Tron} from '@ca/trace'

export default function Page(): JSX.Element {
  const [sim, setSim] = useState<Simulation>(new Simulation())
  // const simulation = new Simulation()

  // Small chance of spawn
  let p = 0.0001 + Math.random() * 0.002
  for (let i = 0; i < sim.world.size.x * sim.world.size.y * p; i++) {
    sim.setCell(
      Math.floor(Math.random() * sim.world.size.x),
      Math.floor(Math.random() * sim.world.size.y),
      255,
    )
  }

  return (
    <Screen>
      <TraceProvider value={trace}>
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
              // p = 0.0005 + Math.random() * 0.002
              p = 0.0005
              for (
                let i = 0;
                i < sim.world.size.x * sim.world.size.y * p;
                i++
              ) {
                sim.setCell(
                  Math.floor(Math.random() * sim.world.size.x),
                  Math.floor(Math.random() * sim.world.size.y),
                  255,
                )
              }
            }

            return false
          }}
        />
        <Tron />
      </TraceProvider>
    </Screen>
  )
}
