import type {Trace} from './trace.ts'

import {createContext, useContext} from 'react'
import {useSnapshot} from 'valtio'
import cx from 'clsx'
import * as styles from './tron.css.ts'

const TraceContext = createContext<Trace | null>(null)

export function TraceProvider(
  props: React.PropsWithChildren<{value: Trace}>,
): JSX.Element {
  return (
    <TraceContext.Provider value={props.value}>
      {props.children}
    </TraceContext.Provider>
  )
}

export function useTrace(): Trace {
  const trace = useContext(TraceContext)
  if (trace == null) {
    throw new Error('Can not find trace provider in the render tree')
  }
  return trace
}

export function Tron() {
  const trace = useTrace()
  const state = useSnapshot(trace.getProxy())

  return (
    <div className={cx(styles.root, styles.container)}>
      <div>
        <div className={styles.sectionTitle}>Timers</div>
        {[...state.timers.entries()].map(([title, timer]) => {
          return (
            <div key={title} className={styles.text}>
              <span>{title}: </span>
              <span>{timer.getDuration().toFixed(2)}ms</span>
            </div>
          )
        })}
      </div>
      <div>
        <div className={styles.sectionTitle}>Tracking</div>
        {[...state.trackers.entries()].map(([key, value]) => {
          return (
            <div key={key} className={styles.text}>
              <span>{key}: </span>
              <span>{String(value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
