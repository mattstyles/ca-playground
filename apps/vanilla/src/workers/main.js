const renderRate = document.querySelector('.js-render-rate')
const updateRate = document.querySelector('.js-update-rate')
const headingEl = document.querySelector('.js-heading')

export function setRender(n) {
  renderRate.innerHTML = n.toFixed(2)
}

export function setUpdate(n) {
  updateRate.innerHTML = n.toFixed(2)
}

export function setHeading(str) {
  headingEl.innerHTML = str
}

class Thread {
  constructor(url) {
    this.worker = new Worker(url)
    this.resolve = null
    this.isWorking = false
    this.worker.addEventListener('message', this.onComplete)
  }

  onComplete = (event) => {
    // this.worker.removeEventListener('message', this.onComplete)
    this.isWorking = false
    if (this.resolve == null) {
      throw new Error('This should never happen')
    }

    this.resolve(event.data)
  }

  work(x1, y1, x2, y2) {
    this.isWorking = true
    return new Promise((res) => {
      this.resolve = res
      // this.worker.addEventListener('message', this.onComplete)

      const msg = {buffer: data.buffer, w, h, x1, y1, x2, y2, id: 123}
      this.worker.postMessage(msg)
    })
  }
}

class ThreadPool {
  constructor(length) {
    this.threads = Array.from({length}).map(
      (_) => new Thread('./convolve2d.js'),
    )
  }

  task(x1, y1, x2, y2) {
    const thread = this.threads.find((thread) => thread.isWorking === false)

    if (thread == null) {
      console.error('Can not find thread')
      return
    }

    return thread.work(x1, y1, x2, y2)
  }
}

const canvas = document.querySelector('.js-canvas')
const ctx = canvas.getContext('2d')
const dpr = window.devicePixelRatio
canvas.width = window.innerWidth * dpr
canvas.height = window.innerHeight * dpr
canvas.style.width = window.innerWidth + 'px'
canvas.style.height = window.innerHeight + 'px'
canvas.style.display = 'block'

const period = 5
// const w = period * 160 // 800
// const h = period * 90 // 450
const w = period * 200 // 800
const h = period * 200 // 450
const cellSizeX = 3
const cellSizeY = 3
const ups = 1000
// This requires hacking hench to serve the relevant headers
const buffer = new SharedArrayBuffer(w * h)
// const buffer = new ArrayBuffer(w * h)
let data = new Uint8Array(buffer)
const actions = new Set()

setHeading(`Parallel convolution test ${w * h}`)

function applyBlinky() {
  for (let y = 2; y < h; y = y + period) {
    for (let x = 2; x < w; x = x + period) {
      data[y * w + x - 1] = 1
      data[y * w + x] = 1
      data[y * w + x + 1] = 1
    }
  }
}

function applyGlider() {
  for (let y = 2; y < h - 2; y = y + period) {
    for (let x = 2; x < w - 2; x = x + period) {
      data[(y - 1) * w + x + 1] = 1
      data[(y - 2) * w + x] = 1
      data[y * w + x - 1] = 1
      data[y * w + x] = 1
      data[y * w + x + 1] = 1
    }
  }
}

function applyRandom() {
  const p = 0.25 + Math.random() * 0.5 // 0.25...0.75
  for (let i = 0; i < data.length * p; i++) {
    data[Math.floor(Math.random() * w) + Math.floor(Math.random() * h) * w] = 1
  }
}

// applyBlinky()
// applyGlider()
applyRandom()

function render() {
  const start = performance.now()

  ctx.fillStyle = '#f6f6f8'
  ctx.fillRect(0, 0, w * cellSizeX, h * cellSizeY)

  const padding = 1
  // for (let idx = 0; idx < data.length; idx++) {
  //   if (data[idx] === 1) {
  //     ctx.fillStyle = '#2d3032'
  //     ctx.fillRect(
  //       (idx % w) * cellSizeX + padding,
  //       Math.floor(idx / w) * cellSizeY + padding,
  //       cellSizeX - padding,
  //       cellSizeY - padding,
  //     )
  //   }
  // }
  for (let y = 0; y < 600; y++) {
    for (let x = 0; x < 800; x++) {
      const idx = x + y * w
      if (data[idx] === 1) {
        ctx.fillStyle = '#2d3032'
        ctx.fillRect(
          x * cellSizeX + padding,
          y * cellSizeY + padding,
          cellSizeX - padding,
          cellSizeY - padding,
        )
      }
    }
  }

  setRender(performance.now() - start)
  window.requestAnimationFrame(render)
}

const disjoint = []
const divisions = 4
const wx = w / divisions
const hy = h / divisions
for (let y = 0; y < divisions; y++) {
  for (let x = 0; x < divisions; x++) {
    disjoint.push([x * wx, y * hy, (x + 1) * wx, (y + 1) * hy])
  }
}

console.log(disjoint)

// const pool = new ThreadPool(navigator.hardwareConcurrency)
const pool = new ThreadPool(disjoint.length)

async function update() {
  let start = performance.now()

  const mutations = await Promise.all(
    disjoint.map((bounds) => {
      return pool.task(bounds[0], bounds[1], bounds[2], bounds[3])
    }),
  )

  for (let mut of mutations) {
    // apply(mut.actions)
    apply(mut)
  }

  setTimeout(update, 1000 / ups)
  setUpdate(performance.now() - start)
}

function apply(set) {
  for (let action of set) {
    data[action[0]] = action[1]
  }
  set.clear()
}

window.requestAnimationFrame(render)
// window.requestAnimationFrame(update)
setTimeout(update)

const kernel = [
  [1, [-1, -1]],
  [1, [0, -1]],
  [1, [1, -1]],
  [1, [-1, 0]],
  // [0, [0, 0]],
  [1, [1, 0]],
  [1, [-1, 1]],
  [1, [0, 1]],
  [1, [1, 1]],
]

// Inline sum, assumed weights
function convolve2d(idx, kernel, w, h, src) {
  let total = 0
  const x = idx % w
  const y = (idx / w) | 0
  for (let i = 0; i < kernel.length; i++) {
    const point = kernel[i][1]
    const target =
      // eslint-disable-next-line no-nested-ternary -- wrapping
      (x < -point[0]
        ? w + point[0]
        : x >= w - point[0]
        ? point[0] - 1
        : x + point[0]) +
      // eslint-disable-next-line no-nested-ternary -- wrapping
      (y < -point[1]
        ? h + point[1]
        : y >= h - point[1]
        ? point[1] - 1
        : y + point[1]) *
        w
    total = src[target] + total
  }
  return total
}

// const thread = new Thread('./convolve2d.js')
// const d = await thread.work(0, 0, 100, 100)
// console.log(d)
