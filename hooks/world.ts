import { paint, use, type Rect } from './draw'
import type { Period } from './machine'
import { mini } from './mascot'

/** The window in scene pixels, and the grass line everything stands on. */
export const WIDTH = 320
export const HEIGHT = 200
export const GROUND = 152

// Blocks, 16 x 16. Texture is two tones plus single-pixel specks, never a fourth shade.
const GRASS_DEPTH = [4, 5, 4, 3, 4, 5, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5]
const DIRT_LOW: readonly Rect[] = [
  [2, 8, 2, 1, 'toprak-1'], [9, 7, 1, 1, 'toprak-1'], [13, 10, 2, 1, 'toprak-1'], [5, 12, 1, 1, 'toprak-1'], [10, 13, 2, 1, 'toprak-1'],
  [6, 9, 2, 1, 'toprak-3'], [12, 8, 1, 1, 'toprak-3'], [3, 11, 1, 1, 'toprak-3'], [8, 14, 2, 1, 'toprak-3'], [14, 13, 1, 1, 'toprak-3'],
]
const DIRT_TOP: readonly Rect[] = [
  [2, 2, 2, 1, 'toprak-1'], [9, 1, 1, 1, 'toprak-1'], [13, 4, 2, 1, 'toprak-1'], [6, 3, 2, 1, 'toprak-3'], [12, 2, 1, 1, 'toprak-3'], [3, 5, 1, 1, 'toprak-3'],
]
const GRASS: readonly Rect[] = [
  [0, 0, 16, 16, 'toprak-2'],
  ...DIRT_LOW,
  ...GRASS_DEPTH.map((depth, x): Rect => [x, 0, 1, depth - 1, 'cim-2']),
  ...GRASS_DEPTH.map((depth, x): Rect => [x, depth - 1, 1, 1, 'cim-3']),
  [0, 0, 16, 1, 'cim-1'], [3, 1, 1, 1, 'cim-1'], [10, 1, 2, 1, 'cim-1'], [14, 2, 1, 1, 'cim-1'],
]
const DIRT: readonly Rect[] = [[0, 0, 16, 16, 'toprak-2'], ...DIRT_LOW, ...DIRT_TOP]
const STONE: readonly Rect[] = [
  [0, 0, 16, 16, 'tas-2'],
  [1, 2, 4, 1, 'tas-1'], [8, 1, 3, 1, 'tas-1'], [12, 5, 3, 1, 'tas-1'], [3, 7, 3, 1, 'tas-1'], [9, 10, 4, 1, 'tas-1'], [2, 12, 2, 1, 'tas-1'],
  [0, 4, 5, 1, 'tas-3'], [6, 5, 5, 1, 'tas-3'], [11, 8, 5, 1, 'tas-3'], [0, 9, 4, 1, 'tas-3'], [5, 13, 6, 1, 'tas-3'], [13, 13, 3, 1, 'tas-3'],
  [5, 4, 1, 2, 'tas-3'], [10, 8, 1, 3, 'tas-3'], [4, 9, 1, 4, 'tas-3'],
]

export const PLANKS: readonly Rect[] = [
  [0, 0, 16, 16, 'kalas-2'],
  [0, 0, 16, 1, 'kalas-1'], [0, 4, 16, 1, 'kalas-1'], [0, 8, 16, 1, 'kalas-1'], [0, 12, 16, 1, 'kalas-1'],
  [0, 3, 16, 1, 'kalas-3'], [0, 7, 16, 1, 'kalas-3'], [0, 11, 16, 1, 'kalas-3'], [0, 15, 16, 1, 'kalas-3'],
  [5, 0, 1, 3, 'kalas-3'], [12, 4, 1, 3, 'kalas-3'], [3, 8, 1, 3, 'kalas-3'], [9, 12, 1, 3, 'kalas-3'],
]

/** Blocks drawn many times are defined once here and placed with `use`. */
export const defs = (): string => `<g id="gr">${paint(GRASS)}</g><g id="di">${paint(DIRT)}</g><g id="st">${paint(STONE)}</g>`

const ORE_SPOTS: readonly (readonly (readonly [number, number])[])[] = [
  [[3, 2], [10, 3], [6, 8], [12, 11], [2, 12]],
  [[2, 4], [8, 2], [12, 6], [5, 10], [10, 12], [1, 9]],
  [[4, 1], [11, 2], [7, 6], [2, 8], [13, 9], [6, 12], [10, 13], [1, 4]],
]

function ore(x: number, y: number, colour: string, variant: number): string {
  const spots = ORE_SPOTS[variant] ?? []

  return (
    use('st', x, y) +
    paint([...spots.map(([sx, sy]): Rect => [x + sx, y + sy, 2, 2, colour]), ...spots.map(([sx, sy]): Rect => [x + sx, y + sy, 1, 1, 'isik'])])
  )
}

// The mine: two rows under the grass, twenty blocks wide, always full.
// Upper row: dirt, stone and the gallery (g). Lower row: stone with ore veins.
const MINE_UPPER = ['d', 'd', 's', 'g', 'g', 'g', 'g', 'g', 'd', 'd', 's', 'd', 'd', 'z1', 's', 'a1', 'd', 's', 'd', 'd']
const MINE_LOWER = ['s', 'l1', 'l2', 's', 'a1', 's', 'z2', 'z1', 's', 'k1', 's', 'm1', 'm2', 's', 'e1', 'a2', 's', 'z1', 'l2', 'e2']
const ORE_COLOUR: Readonly<Record<string, string>> = {
  l: 'cevher-lapis', z: 'cevher-zumrut', a: 'cevher-altin', k: 'cevher-kor', m: 'cevher-ametist', e: 'cevher-elmas',
}
// Under the mascot's camp, left of the text column.
const GALLERY_X = 48

function mineTile(code: string, x: number, y: number): string {
  if (code === 'g') return ''
  if (code === 'd') return use('di', x, y)
  if (code === 's') return use('st', x, y)

  return ore(x, y, ORE_COLOUR[code.charAt(0)] ?? 'cevher-elmas', Number(code.charAt(1)))
}

// The gallery under the mascot's camp: props, rail, torch, a loaded cart,
// a helper, and the ladder that reaches the surface.
function gallery(x: number, y: number): string {
  const ties: Rect[] = []
  const rungs: Rect[] = []

  for (let i = 2; i < 80; i += 8) ties.push([x + i, y + 15, 3, 1, 'kalas-3'])
  for (let i = -15; i < 13; i += 3) rungs.push([x + 3, y + i, 4, 1, 'kalas-2'])

  return (
    paint([
      [x, y, 80, 16, 'magara'], [x, y, 80, 1, 'tas-3'], ...ties, [x, y + 14, 80, 1, 'demir-1'],
      [x + 12, y, 2, 14, 'kalas-3'], [x + 10, y + 1, 6, 2, 'kalas-2'], [x + 58, y, 2, 14, 'kalas-3'], [x + 56, y + 1, 6, 2, 'kalas-2'],
      [x + 24, y + 6, 1, 3, 'kalas-3'], [x + 23, y + 4, 3, 2, 'alev-3'], [x + 24, y + 4, 1, 1, 'alev-1'],
      [x + 35, y + 7, 12, 1, 'demir-1'], [x + 36, y + 8, 10, 5, 'demir-2'], [x + 37, y + 13, 2, 1, 'demir-3'], [x + 43, y + 13, 2, 1, 'demir-3'],
      [x + 37, y + 5, 2, 2, 'cevher-altin'], [x + 40, y + 4, 2, 3, 'cevher-zumrut'], [x + 43, y + 5, 2, 2, 'cevher-lapis'],
    ]) +
    mini(x + 66, y + 6, 'cevher-lapis', 'cevher-altin', false) +
    paint([[x + 1, y - 14, 8, 14, 'magara'], [x + 2, y - 17, 1, 31, 'kalas-2'], [x + 7, y - 17, 1, 31, 'kalas-2'], ...rungs, [x, y - 17, 10, 1, 'kalas-3']])
  )
}

/** Grass along the ground line, the mine beneath it. */
export function terrain(): string {
  let out = ''

  for (let column = 0; column < WIDTH / 16; column += 1) {
    const x = column * 16

    out += use('gr', x, GROUND) + mineTile(MINE_UPPER[column] ?? 'd', x, GROUND + 16) + mineTile(MINE_LOWER[column] ?? 's', x, GROUND + 32)
  }

  return out + gallery(GALLERY_X, GROUND + 16)
}

// The sky: four bands from the top to the horizon, a two-row checker between
// them. Sun, moon, clouds and stars stay clear of the text column.
const BANDS: readonly (readonly [number, number, number])[] = [[1, 0, 40], [2, 40, 44], [3, 84, 40], [4, 124, 28]]

function bands(period: Period): string {
  const fills = paint(BANDS.map(([band, y, height]): Rect => [0, y, WIDTH, height, `gok-${period}-${band}`]))
  const checkers = BANDS.slice(1)
    .map(([band, y]) => {
      const colour = `gok-${period}-${band}`

      return `<pattern id="d${band}" width="2" height="2" patternUnits="userSpaceOnUse">${paint([[0, 0, 1, 1, colour], [1, 1, 1, 1, colour]])}</pattern><rect x="0" y="${y - 2}" width="${WIDTH}" height="2" fill="url(#d${band})"/>`
    })
    .join('')

  return fills + checkers
}

function disc(cx: number, cy: number, radius: number, colour: string): Rect[] {
  const rows: Rect[] = []

  for (let dy = -radius; dy < radius; dy += 1) {
    const half = Math.round(Math.sqrt(radius * radius - (dy + 0.5) * (dy + 0.5)))

    if (half > 0) rows.push([cx - half, cy + dy, half * 2, 1, colour])
  }

  return rows
}

const sun = (cx: number, cy: number, radius: number): Rect[] => [
  ...disc(cx, cy, radius, 'alev-3'),
  ...disc(cx, cy, Math.round(radius * 0.72), 'alev-2'),
  ...disc(cx, cy, Math.round(radius * 0.4), 'alev-1'),
]

const moon = (cx: number, cy: number, radius: number, behind: string): Rect[] => [
  ...disc(cx, cy, radius, 'ay'),
  ...disc(cx + Math.round(radius * 0.45), cy - Math.round(radius * 0.25), Math.round(radius * 0.8), behind),
]

const cloud = (x: number, y: number, colour: string, isBig = false): Rect[] =>
  isBig
    ? [[x, y + 4, 28, 5, colour], [x + 6, y, 16, 4, colour], [x - 3, y + 7, 10, 2, colour]]
    : [[x, y + 2, 14, 3, colour], [x + 3, y, 8, 2, colour], [x - 2, y + 4, 6, 1, colour]]

const STARS: readonly (readonly [number, number])[] = [
  [262, 10], [304, 52], [256, 40], [276, 62], [310, 18], [268, 90], [70, 14], [96, 36], [78, 70], [112, 96], [300, 110], [88, 120],
]

const SKIES: Readonly<Record<Period, (cloudColour: string) => Rect[]>> = {
  sabah: c => [...sun(236, GROUND - 1, 13), ...cloud(256, 14, c, true), ...cloud(284, 46, c), ...cloud(70, 30, c)],
  gunduz: c => [...sun(290, 28, 9), ...cloud(252, 46, c, true), ...cloud(74, 22, c), ...cloud(84, 60, c)],
  aksamustu: c => [...sun(80, GROUND, 26), ...cloud(254, 20, c, true), ...cloud(70, 40, c), ...cloud(290, 66, c)],
  aksam: () => [...moon(288, 28, 9, 'gok-aksam-1'), ...STARS.map(([x, y]): Rect => [x, y, 1, 1, 'yildiz'])],
}

export const sky = (period: Period): string => bands(period) + paint(SKIES[period](`gok-${period}-4`))
