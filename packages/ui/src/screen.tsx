import * as css from './screen.css.ts'

export function Screen({children}: React.PropsWithChildren): JSX.Element {
  return <div className={css.screen}>{children}</div>
}
