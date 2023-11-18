import {type Point, wrap} from 'mathutil'

interface KernelParams {
  stride: number
}
export enum KernelVariants {
  Moore,
  Cardinal,
}

/**
 * The kernel refers to index offsets from the current 1D location
 */
export type Kernel = Array<number>

export function makeKernel(
  variant: KernelVariants,
  params: KernelParams,
): Kernel {
  switch (variant) {
    case KernelVariants.Moore:
      return makeMooreKernel(params)
    case KernelVariants.Cardinal:
      return makeCardinalKernel(params)
  }
}

function makeMooreKernel(params: KernelParams): Kernel {
  return [
    // @TODO
  ]
}

function makeCardinalKernel(params: KernelParams): Kernel {
  return [
    0 - params.stride, // top
    1, // right
    params.stride, // bottom
    -1, // left
  ]
}
