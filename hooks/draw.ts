import { PALETTE } from './palette'

/** One filled rectangle in scene pixels: x, y, width, height, colour token. */
export type Rect = readonly [number, number, number, number, string]

const TOKENS = Object.keys(PALETTE)

function classOf(token: string): string {
  const index = TOKENS.indexOf(token)

  if (index < 0) {
    throw new Error(`blok-vardiyasi: unknown colour token "${token}"`)
  }

  return `c${index.toString(36)}`
}

export const at = (rects: readonly Rect[], ox: number, oy: number): Rect[] =>
  rects.map(([x, y, w, h, c]): Rect => [x + ox, y + oy, w, h, c])

/** Rows of letters to rectangles; a horizontal run of one letter is one rectangle. */
export function grid(rows: readonly string[], colours: Readonly<Record<string, string>>): Rect[] {
  const out: Rect[] = []

  rows.forEach((row, y) => {
    let x = 0

    while (x < row.length) {
      const letter = row.charAt(x)
      const colour = colours[letter]

      if (colour === undefined) {
        x += 1
        continue
      }
      let end = x

      while (end < row.length && row.charAt(end) === letter) {
        end += 1
      }
      out.push([x, y, end - x, 1, colour])
      x = end
    }
  })

  return out
}

// Consecutive rectangles of one colour share a path: paint order is kept and
// the markup stays a quarter the size of one <rect> each (the app caps an SVG).
export function paint(rects: readonly Rect[]): string {
  let out = ''
  let run = ''
  let colour = ''

  for (const [x, y, w, h, c] of rects) {
    if (c !== colour && run !== '') {
      out += `<path class="${classOf(colour)}" d="${run}"/>`
      run = ''
    }
    colour = c
    run += `M${x} ${y}h${w}v${h}h${-w}z`
  }

  return run === '' ? out : `${out}<path class="${classOf(colour)}" d="${run}"/>`
}

export const group = (inner: string, className: string): string => `<g class="${className}">${inner}</g>`

export const use = (id: string, x: number, y: number): string => `<use href="#${id}" x="${x}" y="${y}"/>`

// Every frame count and frame time the scenes play. A class per frame, because
// the app may strip inline style attributes from an SVG it draws.
const FRAME_SETS: readonly (readonly [number, number])[] = [
  [2, 160], [2, 240], [2, 320], [2, 400], [2, 600], [3, 240], [4, 160], [4, 240], [4, 320], [6, 200], [6, 240], [6, 400],
]

/** Plays `list` one frame at a time, `ms` each. The first frame is the still pose. */
export function frames(list: readonly string[], ms: number): string {
  const count = list.length

  if (!FRAME_SETS.some(([n, each]) => n === count && each === ms)) {
    throw new Error(`blok-vardiyasi: no frame set for ${count} frames of ${ms} ms`)
  }

  return list.map((inner, i) => `<g class="f${i === 0 ? ' f0' : ''} a${count}_${ms}_${i}">${inner}</g>`).join('')
}

// The hide point sits a hair before the exact fraction, so two frames never show at once.
const HIDE_AT: Readonly<Record<number, string>> = { 2: '50%', 3: '33.333%', 4: '25%', 6: '16.666%' }

const MOTION = [
  '.f{opacity:0}.f0{opacity:1}',
  ...Object.entries(HIDE_AT).map(([n, pct]) => `@keyframes k${n}{0%{opacity:1}${pct},to{opacity:0}}`),
  ...FRAME_SETS.flatMap(([n, ms]) =>
    Array.from({ length: n }, (_, i) => `.a${n}_${ms}_${i}{animation:k${n} ${n * ms}ms steps(1,end) ${i === 0 ? 0 : (i - n) * ms}ms infinite}`),
  ),
  '@keyframes up{0%,to{transform:translateY(0)}50%{transform:translateY(-1px)}}',
  '.br{animation:up 960ms steps(1,end) infinite}.nd{animation:up 1280ms steps(1,end) infinite}.wk{animation:up 320ms steps(1,end) infinite}',
  '@keyframes bl{0%,96%{opacity:0}97%,to{opacity:1}}.bl{opacity:0;animation:bl 4800ms steps(1,end) infinite}',
  '@keyframes em{0%{transform:translateY(0);opacity:1}to{transform:translateY(-12px);opacity:0}}',
  '.em{animation:em 1440ms steps(6,end) infinite}.em2{animation-delay:-700ms}',
  '@keyframes sc{to{transform:translateX(-48px)}}.sc{animation:sc 1920ms steps(48,end) infinite}',
  '@keyframes ct{from{transform:translateX(-224px)}to{transform:translateX(136px)}}.ct{animation:ct 7200ms steps(180,end) infinite}',
  '@keyframes ln{from{transform:translateX(-270px)}to{transform:translateX(150px)}}.ln{animation:ln 8400ms steps(210,end) infinite}',
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}',
].join('')

const LIGHT = TOKENS.map((token, i) => `.c${i.toString(36)}{fill:${PALETTE[token]?.[0]}}`).join('')

const DARK = TOKENS.filter(token => PALETTE[token]?.[0] !== PALETTE[token]?.[1])
  .map(token => `.${classOf(token)}{fill:${PALETTE[token]?.[1]}}`)
  .join('')

/** The scene's whole stylesheet. `isStill` holds every animation on its first frame. */
export const styleSheet = (isStill: boolean): string =>
  `${LIGHT}@media (prefers-color-scheme:dark){${DARK}}${MOTION}${isStill ? '*{animation:none!important}' : ''}`
