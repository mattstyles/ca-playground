Testing reproduction of a cell.

This a CA where each cell has a state ranging from 0...255.

This is not a classic CA as each cell can apply changes to neighbouring cells. This _could_ be tweaked fairly easily though.

The rules:

```
For each cell:
  For each neighbour, if it has cell strength then apply some percentage of this cell strength
  Decay cell strength
```

There are some inaccuracies that will not be addressed in this test:

1. There are no edge checks, the algorithm will either return undefined (which it will ignore) or the wrong cell i.e. a cell at the horizontal edge will not have the correct horizontal neighbour, vertical cells will overflow and return undefined (which is fine for edge restriction behaviour).
2. Multiple cells could influence a dead cell, however, due to how the changeset is applied, only one of them defines the next cell behaviour.
