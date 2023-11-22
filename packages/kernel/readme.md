# @ca/kernel

A kernel describes the weighting function to apply for as part of a convolution.

We can simplify a little on the mathematical description and define our kernel using fixed-size arrays that describe _locations_ as offsets from some origin and weights for each offset. This describes a region around a the origin, frequently called the local neighbourhood.

## Convolution

For our purposes we will optimise to avoid creating too many objects during the iteration step for a given search space (we normally call this a world).

We store the world data in a 1d array and we must handle the permutational from the 2 dimensional realm to the 1 dimensional one.

Once we have specified a kernel we can start to iterate our world:

1. Translate the kernel based on the origin
2. For each kernel offset get the value at the destination cell from the world
3. For each destination cell apply the corresponding weight
4. Process the resultant array

We combine steps 1, 2, and 3 during our convolution function, which produces a set of values which we then pass to a function to process.

For the case of a cellular automaton our rule (step 4) might be to sum the resultant array of values, additionally applying a final rule (or rules) to determine the next state of a given origin cell.
