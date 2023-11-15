import {Bench} from 'tinybench'

const bench = new Bench({time: 100})

const sizeX = 1000
const sizeY = 1000
const dataSize = sizeX * sizeY

const map = new Map()
const arrV: Array<number> = [] // Variable size array, forEach
const arrVF: Array<number> = [] // Variable size, for use with for..loop
const arrP = Array.from<number>({length: dataSize}) // pre-allocated array, forEach
const arrPF = Array.from<number>({length: dataSize}) // pre-allocated array, for...loop
const arrPR = Array.from<number>({length: dataSize}) // pre-allocated, random access
const arr2D = Array.from<number>({length: sizeY}).map((_) => {
  return Array.from<number>({length: sizeX}).map((__) => 0)
})
for (let i = 0; i < dataSize; i++) {
  map.set(i, 0)
  arrV.push(0)
  arrVF.push(0)
  arrP[i] = 0
  arrPF[i] = 0
  arrPR[0] = 0
}

const buffer = new ArrayBuffer(dataSize)
const view = new Uint8ClampedArray(buffer)
const buf2 = new ArrayBuffer(dataSize)
const view2 = new Uint8ClampedArray(buf2)
const buf3 = new ArrayBuffer(dataSize)
const view3 = new Uint8ClampedArray(buf3)

bench
  /**
   * Typed arrays
   */
  .add('Typed Array', () => {
    for (let idx = 0; idx < view.length; idx++) {
      view[idx] = view[idx] + 1
      if (view[idx] >= 255) {
        view[idx] = 0
      }
    }
  })
  .add('Typed Array intermediate objects GC', () => {
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const idx = y * sizeX + x
        view2[idx] = view2[idx] + 1
        if (view2[idx] >= 255) {
          view2[idx] = 0
        }
      }
    }
  })
  /**
   * Map and array
   */
  .add('Map - forEach iterator', () => {
    map.forEach((v, k) => {
      map.set(k, v + 1)
      if (v >= 255) {
        map.set(k, 0)
      }
    })
  })
  .add('Array - dynamic size allocation - for each', () => {
    arrV.forEach((v, i) => {
      arrV[i] = v + 1
      if (arrV[i] >= 255) {
        arrV[i] = 0
      }
    })
  })
  .add('Array - dynamic size allocation - for...loop', () => {
    for (let idx = 0; idx < arrVF.length; idx++) {
      arrVF[idx] = arrVF[idx] + 1
      if (arrVF[idx] >= 255) {
        arrVF[idx] = 0
      }
    }
  })
  .add('Array - pre-allocated - for each', () => {
    arrP.forEach((v, i) => {
      arrP[i] = v + 1
      if (arrP[i] >= 255) {
        arrP[i] = 0
      }
    })
  })
  .add('Array - pre-allocated - for...loop', () => {
    for (let idx = 0; idx < arrPF.length; idx++) {
      arrPF[idx] = arrPF[idx] + 1
      if (arrPF[idx] >= 255) {
        arrPF[idx] = 0
      }
    }
  })
  .add('Array 2D', () => {
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        arr2D[y][x] = arr2D[y][x] + 1
        if (arr2D[y][x] >= 255) {
          arr2D[y][x] = 0
        }
      }
    }
  })
  /**
   * Random access comparisons
   */
  .add('Typed Array - random access with GC', () => {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of -- want to keep tests with consistent iteration method
    for (let idx = 0; idx < view3.length; idx++) {
      const i = (Math.random() * view3.length) | 0
      view3[i] = view3[i] + 1
      if (view3[i] >= 255) {
        view3[i] = 0
      }
    }
  })
  .add('Array - pre-allocated - random access', () => {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of -- want to keep tests with consistent iteration method
    for (let idx = 0; idx < arrPR.length; idx++) {
      const i = (Math.random() * view3.length) | 0
      arrPR[i] = arrPR[i] + 1
      if (arrPR[i] >= 255) {
        arrPR[i] = 0
      }
    }
  })

await bench.run()

console.log('\n')
console.log('Data size for each test:', dataSize)
console.table(bench.table())
