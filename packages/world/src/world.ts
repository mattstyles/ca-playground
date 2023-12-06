import {Point} from 'mathutil'

// Temporary until we have an action system to apply changes
type Action = [idx: number, value: number]

export interface BaseWorld<T = Uint8Array> {
  size: Point
  data: T

  setCell: (x: number, y: number, value?: number) => void
  getCell: (x: number, y?: number) => number
}

// export class World implements BaseWorld<Uint8ClampedArray> {
export class World implements BaseWorld {
  size: Point
  // data: Uint8ClampedArray
  data: Uint8Array
  // temp
  actions: Set<Action>

  constructor(x: number, y: number) {
    this.size = Point.of(x, y)
    // this.data = new Uint8ClampedArray(x * y)
    // const buffer = new ArrayBuffer(x * y)
    this.data = new Uint8Array(x * y)
    this.actions = new Set()
  }

  setCell(x: number, y: number, value: number): void
  setCell(idx: number, value: number): void
  setCell(x: number, y: number, value?: number): void {
    if (value == null) {
      this.data[x] = y
      return
    }

    this.data[y * this.size.x + x] = value
  }

  getCell(x: number, y: number): number
  getCell(idx: number): number
  getCell(x: number, y?: number): number {
    if (y == null) {
      return this.data[x]
    }

    return this.data[y * this.size.x + x]
  }

  /** ------------ */
  // Non-toroidal (i.e. no wrapping)
  // For speed we're going to avoid allocate and do things manually
  getNumNeighbours(idx: number): number {
    // Top-left corner
    if (idx === 0) {
      return (
        this.data[idx + 1] +
        this.data[idx + this.size.x] +
        this.data[idx + this.size.x + 1]
      )
    }

    // Top-right corner
    if (idx === this.size.x - 1) {
      return (
        this.data[idx - 1] +
        this.data[idx + this.size.x - 1] +
        this.data[idx + this.size.x]
      )
    }

    // Bottom-left corner
    if (idx === this.data.length - this.size.x) {
      return (
        this.data[idx - this.size.x] +
        this.data[idx - this.size.x + 1] +
        this.data[idx + 1]
      )
    }

    // Bottom-right corner
    if (idx === this.data.length - 1) {
      return (
        this.data[idx - this.size.x - 1] +
        this.data[idx - this.size.x] +
        this.data[idx - 1]
      )
    }

    // Top edge
    if (idx < this.size.x) {
      return (
        this.data[idx - 1] +
        this.data[idx + 1] +
        this.data[idx + this.size.x - 1] +
        this.data[idx + this.size.x] +
        this.data[idx + this.size.x + 1]
      )
    }

    // Bottom edge
    if (idx > this.data.length - this.size.x) {
      return (
        this.data[idx - this.size.x - 1] +
        this.data[idx - this.size.x] +
        this.data[idx - this.size.x + 1] +
        this.data[idx - 1] +
        this.data[idx + 1]
      )
    }

    // Left edge
    if (idx % this.size.x === 0) {
      return (
        this.data[idx - this.size.x] +
        this.data[idx - this.size.x + 1] +
        this.data[idx + 1] +
        this.data[idx + this.size.x] +
        this.data[idx + this.size.x + 1]
      )
    }

    // Right edge
    if ((idx - (this.size.x - 1)) % this.size.x === 0) {
      return (
        this.data[idx - this.size.x - 1] +
        this.data[idx - this.size.x] +
        this.data[idx - 1] +
        this.data[idx + this.size.x - 1] +
        this.data[idx + this.size.x]
      )
    }

    // Fall through, i.e all 8 neighbours
    return (
      this.data[idx - this.size.x - 1] +
      this.data[idx - this.size.x] +
      this.data[idx - this.size.x + 1] +
      this.data[idx - 1] +
      this.data[idx + 1] +
      this.data[idx + this.size.x - 1] +
      this.data[idx + this.size.x] +
      this.data[idx + this.size.x + 1]
    )
  }

  // iterate() {
  //   let value = 0
  //   let neighbours = 0
  //   for (let idx = 0; idx < this.data.length; idx++) {
  //     // value = this.getCell(idx)
  //     value = this.data[idx]

  //     // neighbours = 0

  //     // Iterate over the kernel
  //     // for (const im of kernel) {
  //     //   // Ignore central cell from kernel
  //     //   if (im === 0) {
  //     //     continue
  //     //   }

  //     //   if (this.world.getCell(idx + im) > 0) {
  //     //     neighbours = neighbours + 1
  //     //   }
  //     // }

  //     // This is about 4-5ms faster
  //     neighbours = this.getNumNeighbours(idx)

  //     /** Fast -------------------------------------------------- */
  //     // Faster because less cells are typically alive so less checks are made.
  //     if (value === 1) {
  //       if (neighbours < 2 || neighbours > 3) {
  //         // Kill cell
  //         this.actions.add([idx, 0])
  //       }
  //       continue
  //     }

  //     // Dead cell
  //     if (neighbours === 3) {
  //       // Birth cell
  //       this.actions.add([idx, 1])
  //     }

  //     /** -------------------------------------------------- */

  //     /** Slow -------------------------------------------------- */
  //     // Slower due to the && check, try nesting them and it is faster
  //     // Dead cell
  //     // if (value === 0 && neighbours === 3) {
  //     //   this.actions.add([idx, 1])
  //     //   continue
  //     // }

  //     // // Alive cell
  //     // if (neighbours < 2 || neighbours > 3) {
  //     //   this.actions.add([idx, 0])
  //     // }

  //     /** -------------------------------------------------- */

  //     /** Also fast -------------------------------------------------- */
  //     // Dead cell
  //     // if (value === 0) {
  //     //   if (neighbours === 3) {
  //     //     this.actions.add([idx, 1])
  //     //   }
  //     //   continue
  //     // }

  //     // // Alive cell
  //     // if (neighbours < 2) {
  //     //   this.actions.add([idx, 0])
  //     //   continue
  //     // }
  //     // if (neighbours > 3) {
  //     //   this.actions.add([idx, 0])
  //     // }
  //     /** -------------------------------------------------- */
  //   }

  iterate() {
    let value = 0
    let neighbours = 0
    for (let idx = 0; idx < this.data.length; idx++) {
      value = this.data[idx]

      neighbours = this.getNumNeighbours(idx)

      //   if (value === 1) {
      //     if (neighbours < 2 || neighbours > 3) {
      //       // Kill cell
      //       this.actions.add([idx, 0])
      //     }
      //     continue
      //   }

      //   // Dead cell
      //   if (neighbours === 3) {
      //     // Birth cell
      //     this.actions.add([idx, 1])
      //   }
      // }

      if (value === 0) {
        if (neighbours === 3) {
          this.actions.add([idx, 1])
        }
        continue
      }

      // Dead cell
      if (neighbours < 2 || neighbours > 3) {
        this.actions.add([idx, 0])
      }
    }

    // Update board state
    for (const action of this.actions) {
      this.data[action[0]] = action[1]
    }
    this.actions.clear()
  }

  iterateSlow() {
    let value = 0
    let neighbours = 0
    for (let idx = 0; idx < this.data.length; idx++) {
      value = this.data[idx]

      neighbours = this.getNumNeighbours(idx)

      /** -------------------------------------------------- */
      /** Slow -------------------------------------------------- */
      // Slower due to the && check, try nesting them and it is faster
      // Dead cell
      if (value === 0 && neighbours === 3) {
        this.actions.add([idx, 1])
        continue
      }

      // Alive cell
      if (neighbours < 2 || neighbours > 3) {
        this.actions.add([idx, 0])
      }

      // if (value === 0) {
      //   if (neighbours === 3) {
      //     this.actions.add([idx, 1])
      //   }
      //   continue
      // }

      // // Alive cell
      // if (neighbours < 2 || neighbours > 3) {
      //   this.actions.add([idx, 0])
      // }
    }

    // Update board state
    for (const action of this.actions) {
      this.data[action[0]] = action[1]
    }
    this.actions.clear()
  }
}
