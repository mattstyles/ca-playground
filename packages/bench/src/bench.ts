export interface BaseBenchmark {
  run: () => void
}

export type Strategy<T = Array<number>> = (data: T) => void

export interface BenchmarkConfig {
  name: string
  bench: BaseBenchmark
}
