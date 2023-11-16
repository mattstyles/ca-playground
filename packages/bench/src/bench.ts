export interface BaseBenchmark {
  run: () => void
}

export interface BenchmarkConfig {
  name: string
  bench: BaseBenchmark
}
