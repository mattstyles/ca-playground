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

const canvas = document.querySelector('.js-canvas')
const ctx = canvas.getContext('2d')
const dpr = window.devicePixelRatio
canvas.width = window.innerWidth * dpr
canvas.height = window.innerHeight * dpr
canvas.style.width = window.innerWidth + 'px'
canvas.style.height = window.innerHeight + 'px'
canvas.style.display = 'block'

setHeading('Vanilla convolution test')

const period = 5
const w = period * 160
const h = period * 90
const cellSizeX = 4
const cellSizeY = 4
const ups = 20
let data = new Uint8Array(w * h)
const actions = new Set()
let swap = new Uint8Array(w * h)

function applyBlinky() {
  for (let y = 2; y < h; y = y + period) {
    for (let x = 2; x < w; x = x + period) {
      data[y * w + x - 1] = 1
      data[y * w + x] = 1
      data[y * w + x + 1] = 1
    }
  }
}
applyBlinky()

for (const i in data) {
  swap[i] = data[i]
}

function render() {
  const start = performance.now()

  ctx.fillStyle = '#f6f6f8'
  ctx.fillRect(0, 0, w * cellSizeX, h * cellSizeY)

  const padding = 1
  for (let idx = 0; idx < data.length; idx++) {
    if (data[idx] === 1) {
      ctx.fillStyle = '#2d3032'
      ctx.fillRect(
        (idx % w) * cellSizeX + padding,
        Math.floor(idx / w) * cellSizeY + padding,
        cellSizeX - padding,
        cellSizeY - padding,
      )
    }
  }

  setRender(performance.now() - start)
  window.requestAnimationFrame(render)
}

let last = performance.now()
function update() {
  const delta = performance.now() - last

  if (delta < 1000 / ups) {
    window.requestAnimationFrame(update)
    return
  }
  last = performance.now()
  const start = performance.now()

  for (let idx = 0; idx < data.length; idx++) {
    const value = data[idx]
    const n = convolve2d(idx, kernel, w, h, data)

    if (value === 0) {
      if (n === 3) {
        // actions.add([idx, 1])
        swap[idx] = 1
      }
      continue
    }

    // Dead cell
    if (n < 2 || n > 3) {
      // actions.add([idx, 0])
      swap[idx] = 0
    }
  }

  // apply(actions)
  data = Uint8Array.from(swap)

  setUpdate(performance.now() - start)
  window.requestAnimationFrame(update)
}

function apply(set) {
  // for (let action of set) {
  //   data[action[0]] = action[1]
  // }
  // set.clear()

  // let swap = new Uint8Array(w * h)
  data = Uint8Array.from(swap)
}

window.requestAnimationFrame(render)
window.requestAnimationFrame(update)

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
