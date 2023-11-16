# Benchmarks

Benchmarks can be notoriously hard to use accurately. We use them hear to test for any clear strategies that can be used and compare against those different strategies rather than worrying about the raw numbers which come out.

## Some notes about benchmarks

We started off being smart about sharing stratgies, like iterating with a for...loop _across_ different data structures, but it created problems. For example:

```
┌─────────┬──────────────────────────────────┬─────────┐
│ (index) │            Task Name             │ ops/sec │
├─────────┼──────────────────────────────────┼─────────┤
│    0    │ 'Array pre allocated - for loop' │  '926'  │
│    1    │    'Array dynamic - for loop'    │  '941'  │
│    2    │     'Typed Array - for loop'     │  '312'  │
└─────────┴──────────────────────────────────┴─────────┘
```

These all use the same strategy functions, it is passed in to their `run` functions.

However, this result is misleading.

Create separate classes implementations for each test and the results look different:

```
┌─────────┬──────────────────────────────────┬─────────┐
│ (index) │            Task Name             │ ops/sec │
├─────────┼──────────────────────────────────┼─────────┤
│    0    │ 'Array pre allocated - for loop' │  '992'  │
│    1    │    'Array dynamic - for loop'    │  '998'  │
│    2    │     'Typed Array - for loop'     │ '1,096' │
└─────────┴──────────────────────────────────┴─────────┘
```

I _think_ what happens is that the function gets optimised for the data it works with, which is why (see first table) the 2nd test is slightly more performant than the first (swap the test order and same thing happens) and the 3rd test, which utilises typed arrays and _should_ be a little quicker, is slow as molasses. Perhaps whatever optimisation within that hot path function severely limits typed arrays, I do not know.

The other thing to note about this comparison, and why there seems to be little difference between arrays and typed arrays (even at 1M items) is that arrays like this will be optimised down to the same typed array under the hood. We're only doing sequential integer operations, JS engine optimisation is very good (even if you add properties to an array, it'll still do the optimisation, amazing).

Compare the difference when you start to add a chaos into the mix and randomly access list items:

```
┌─────────┬───────────────────────────────┬─────────┐
│ (index) │           Task Name           │ ops/sec │
├─────────┼───────────────────────────────┼─────────┤
│    0    │   'Array - random access'     │  '131'  │
│    1    │ 'Typed array - random access' │  '161'  │
└─────────┴───────────────────────────────┴─────────┘
```

19% faster vs 9% faster, not a massive difference, but enough to be worth it.
