```
pnpm run dev
```

This convolution test is written in vanilla JS and is comparable (usually the same code) to `ca-perf/kernel/k7.ts`. It is to test if the build pipeline does anything to slow down running lots of calculations per frame.

This is slower than k7.ts :(

This is a little surprising but its 20% slower :(
