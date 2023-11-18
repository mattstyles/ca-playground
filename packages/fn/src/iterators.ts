type IteratorCallback<T, R> = (x: T, i: number) => R
type Fn<T, R> = (arg: T) => R

export function each<T>(fn: IteratorCallback<T, void>): Fn<Iterable<T>, void>
export function each<T>(fn: IteratorCallback<T, void>, xs: Iterable<T>): void
export function each<T>(
  fn: IteratorCallback<T, void>,
  xs?: Iterable<T>,
): void | Fn<Iterable<T>, void> {
  if (xs == null) {
    return function _each(_xs: Iterable<T>) {
      each(fn, _xs as unknown as Iterable<T>)
    }
  }
  let i = 0
  for (const x of xs) {
    fn(x, i++)
  }
}
