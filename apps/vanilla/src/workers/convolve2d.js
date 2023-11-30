let actions = new Set()

onmessage = (e) => {
  const {w, h, x1, y1, x2, y2, id} = e.data
  const data = new Uint8Array(e.data.buffer)

  // const actions = new Set()
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const idx = x + y * w
      const value = data[idx]
      const n = convolve2d(idx, kernel, w, h, data)
      if (value === 0) {
        if (n === 3) {
          actions.add([idx, 1])
        }
        continue
      }

      // Dead cell
      if (n < 2 || n > 3) {
        actions.add([idx, 0])
      }
    }
  }

  // for (let idx = 0; idx < data.length; idx++) {
  //   const value = data[idx]
  //   const n = convolve2d(idx, kernel, 300, 300, data)
  //   if (value === 0) {
  //     if (n === 3) {
  //       actions.add([idx, 1])
  //     }
  //     continue
  //   }

  //   // Dead cell
  //   if (n < 2 || n > 3) {
  //     actions.add([idx, 0])
  //   }
  // }

  // postMessage({id, actions})
  postMessage(actions)
  actions.clear()
}

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
