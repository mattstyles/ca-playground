import {type Kernel2d, createKernel2d} from './kernel.ts'

export enum KernelPresets {
  Moore,
  Cardinal,
}

/**
 * Creates a 2d kernel from a predefined template
 *
 * @param preset - list of preset kernel configurations @see KernelVariants enum
 * @returns Kernel2d
 */
export function createPresetKernel(preset: KernelPresets): Kernel2d {
  switch (preset) {
    case KernelPresets.Moore:
      return presets[KernelPresets.Moore]
    case KernelPresets.Cardinal:
      return presets[KernelPresets.Cardinal]
  }
}

/**
 * Presets always inscribe the origin cell.
 */
export const presets: Record<KernelPresets, Kernel2d> = {
  [KernelPresets.Cardinal]: [
    [1, [0, -1]],
    [1, [1, 0]],
    [0, [0, 0]],
    [1, [0, 1]],
    [1, [-1, 0]],
  ],
  [KernelPresets.Moore]: createKernel2d(3, 3, [1, 1, 1, 1, 0, 1, 1, 1, 1]),
}
