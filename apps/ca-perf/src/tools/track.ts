const renderRate = document.querySelector('.js-render-rate') as HTMLSpanElement
const updateRate = document.querySelector('.js-update-rate') as HTMLSpanElement
const headingEl = document.querySelector('.js-heading') as HTMLDivElement

export function setRender(n: number): void {
  renderRate.innerHTML = n.toFixed(2)
}

export function setUpdate(n: number): void {
  updateRate.innerHTML = n.toFixed(2)
}

export function setHeading(str: string): void {
  headingEl.innerHTML = str
}
