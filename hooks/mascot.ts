import { at, frames, grid, group, paint, type Rect } from './draw'

// The mascot is 16 x 15 scene pixels, always facing forward, tool in the right hand.
const BODY = grid(
  [
    '......yYYy......',
    '....yYYFFYYy....',
    '...yYYYYYYYYy...',
    '..KKKKKKKKKKKK..',
    '.KLLLLLLLLLLLLK.',
    '.KBBBBBBBBBBBBK.',
    '.KBBBBBBBBBBBBK.',
    '.KBBBBBBBBBBBBK.',
    '.KBBBBBBBBBBBBK.',
    '.KBBBBBBBBBBBBK.',
    '.KDDDDDDDDDDDDK.',
    '..KKKKKKKKKKKK..',
  ],
  { K: 'bakir-4', L: 'bakir-1', B: 'bakir-2', D: 'bakir-3', Y: 'baret-1', y: 'baret-2', F: 'alev-1' },
)

type Legs = 'stand' | 'a' | 'b' | 'none'

const LEGS: Readonly<Record<Exclude<Legs, 'none'>, readonly Rect[]>> = {
  stand: [[2, 12, 2, 3, 'bakir-4'], [5, 12, 2, 3, 'bakir-4'], [9, 12, 2, 3, 'bakir-4'], [12, 12, 2, 3, 'bakir-4']],
  a: [[2, 12, 2, 2, 'bakir-4'], [5, 12, 2, 3, 'bakir-4'], [9, 12, 2, 2, 'bakir-4'], [12, 12, 2, 3, 'bakir-4']],
  b: [[2, 12, 2, 3, 'bakir-4'], [5, 12, 2, 2, 'bakir-4'], [9, 12, 2, 3, 'bakir-4'], [12, 12, 2, 2, 'bakir-4']],
}

const ARM_DOWN_LEFT: readonly Rect[] = [[0, 5, 1, 4, 'bakir-4'], [1, 6, 1, 2, 'bakir-2']]
const ARM_UP_LEFT: readonly Rect[] = [[0, 2, 2, 1, 'bakir-4'], [0, 3, 1, 3, 'bakir-4'], [1, 3, 1, 3, 'bakir-2']]
const ARM_DOWN_RIGHT: readonly Rect[] = [[15, 5, 1, 4, 'bakir-4'], [14, 6, 1, 2, 'bakir-2']]
const ARM_UP_RIGHT: readonly Rect[] = [[14, 2, 2, 1, 'bakir-4'], [15, 3, 1, 3, 'bakir-4'], [14, 3, 1, 3, 'bakir-2']]

const EYES: Readonly<Record<'open' | 'wide' | 'closed', readonly Rect[]>> = {
  open: [[4, 6, 1, 2, 'murekkep'], [11, 6, 1, 2, 'murekkep']],
  wide: [[4, 6, 2, 2, 'murekkep'], [10, 6, 2, 2, 'murekkep']],
  closed: [[4, 7, 1, 1, 'murekkep'], [11, 7, 1, 1, 'murekkep']],
}
const LIDS: readonly Rect[] = [[4, 6, 1, 1, 'bakir-2'], [11, 6, 1, 1, 'bakir-2']]

export type Pose = {
  legs?: Legs
  eyes?: 'open' | 'wide' | 'closed'
  left?: 'up'
  right?: 'up'
}

export function mascot(x: number, y: number, pose: Pose = {}): string {
  const eyes = pose.eyes ?? 'open'
  const rects: Rect[] = [
    ...(pose.legs === 'none' ? [] : LEGS[pose.legs ?? 'stand']),
    ...BODY,
    ...(pose.left === 'up' ? ARM_UP_LEFT : ARM_DOWN_LEFT),
    ...(pose.right === 'up' ? ARM_UP_RIGHT : ARM_DOWN_RIGHT),
    ...EYES[eyes],
  ]

  return paint(at(rects, x, y)) + (eyes === 'open' ? group(paint(at(LIDS, x, y)), 'bl') : '')
}

/** A helper: 8 x 8, an ore cube on its head. `isStep` is the second walking frame. */
export function mini(x: number, y: number, helmet: string, cube: string, isStep: boolean): string {
  const legs: readonly Rect[] = isStep
    ? [[2, 6, 1, 2, 'bakir-4'], [5, 6, 1, 2, 'bakir-4']]
    : [[1, 6, 1, 2, 'bakir-4'], [6, 6, 1, 2, 'bakir-4'], [3, 6, 1, 1, 'bakir-4']]

  return paint(
    at(
      [
        [2, -4, 4, 4, cube], [2, -4, 1, 1, 'isik'], [2, 0, 4, 1, helmet], [1, 1, 6, 1, 'bakir-4'], [0, 2, 1, 3, 'bakir-4'], [7, 2, 1, 3, 'bakir-4'],
        [1, 2, 6, 3, 'bakir-2'], [2, 3, 1, 1, 'murekkep'], [5, 3, 1, 1, 'murekkep'], [1, 5, 6, 1, 'bakir-4'], ...legs,
      ],
      x,
      y,
    ),
  )
}

// Tools, placed relative to the mascot's own origin.
const TOOLS = {
  pickUp: [[16, 6, 1, 1, 'kalas-3'], [17, 5, 1, 1, 'kalas-3'], [18, 4, 1, 1, 'kalas-3'], [19, 3, 1, 1, 'kalas-3'], [16, 1, 3, 1, 'demir-1'], [19, 2, 2, 1, 'demir-1'], [21, 3, 1, 2, 'demir-1'], [22, 5, 1, 1, 'demir-2']],
  hammerUp: [[16, 2, 1, 6, 'kalas-3'], [14, 0, 5, 1, 'demir-1'], [14, 1, 5, 1, 'demir-2']],
  hammerDown: [[16, 6, 1, 1, 'kalas-3'], [17, 5, 1, 1, 'kalas-3'], [18, 4, 1, 1, 'kalas-3'], [19, 3, 2, 1, 'kalas-3'], [21, 1, 2, 4, 'demir-1'], [22, 1, 1, 4, 'demir-2']],
  torch: [[16, 4, 1, 4, 'kalas-3']],
  flame1: [[15, 1, 3, 3, 'alev-3'], [16, 0, 1, 1, 'alev-3'], [16, 2, 1, 2, 'alev-1']],
  flame2: [[15, 2, 3, 2, 'alev-3'], [15, 0, 1, 2, 'alev-3'], [16, 1, 1, 1, 'alev-2'], [16, 2, 1, 2, 'alev-1']],
  block: [[13, -4, 6, 6, 'kalas-2'], [13, -4, 6, 1, 'kalas-1'], [13, 1, 6, 1, 'kalas-3']],
  cube: [[16, 1, 5, 5, 'cevher-zumrut'], [16, 1, 5, 1, 'isik']],
} as const satisfies Record<string, readonly Rect[]>

export const tool = (name: keyof typeof TOOLS, x: number, y: number): string => paint(at(TOOLS[name], x, y))

// Stations. Each is drawn from its top-left corner and stands on the ground line.
const FIRE: readonly (readonly Rect[])[] = [
  [[6, 7, 4, 5, 'alev-3'], [7, 5, 2, 2, 'alev-3'], [7, 8, 2, 4, 'alev-2'], [7, 10, 2, 2, 'alev-1']],
  [[5, 8, 5, 4, 'alev-3'], [6, 6, 2, 2, 'alev-3'], [9, 7, 1, 1, 'alev-3'], [6, 9, 3, 3, 'alev-2'], [7, 10, 2, 2, 'alev-1']],
  [[6, 8, 5, 4, 'alev-3'], [8, 5, 2, 3, 'alev-3'], [5, 7, 1, 1, 'alev-3'], [7, 9, 3, 3, 'alev-2'], [8, 10, 2, 2, 'alev-1']],
]
const FIRE_BASE: readonly Rect[] = [[2, 13, 12, 2, 'kalas-3'], [3, 12, 4, 1, 'kalas-2'], [9, 12, 4, 1, 'kalas-2'], [1, 14, 2, 2, 'tas-2'], [13, 14, 2, 2, 'tas-2'], [0, 15, 1, 1, 'tas-3'], [15, 15, 1, 1, 'tas-3']]

export const campfire = (x: number, y: number): string =>
  frames(FIRE.map(flame => paint(at(flame, x, y))), 240) +
  paint(at(FIRE_BASE, x, y)) +
  group(paint([[x + 8, y + 3, 1, 1, 'alev-2']]), 'em') +
  group(paint([[x + 5, y + 4, 1, 1, 'alev-3']]), 'em em2')

export const table = (x: number, y: number): string =>
  paint(at([[0, 6, 20, 2, 'kalas-1'], [0, 8, 20, 1, 'kalas-3'], [1, 9, 2, 7, 'kalas-2'], [17, 9, 2, 7, 'kalas-2'], [3, 12, 14, 1, 'kalas-3'], [4, 3, 13, 3, 'kagit'], [3, 3, 1, 3, 'plan'], [6, 4, 4, 1, 'plan'], [11, 4, 5, 1, 'plan']], x, y))

const FURNACE: readonly Rect[] = [[0, 0, 16, 16, 'tas-2'], [0, 0, 16, 2, 'tas-1'], [0, 2, 1, 14, 'tas-3'], [15, 2, 1, 14, 'tas-3'], [0, 15, 16, 1, 'tas-3'], [4, 3, 8, 2, 'tas-3'], [2, 6, 12, 1, 'tas-1'], [3, 7, 10, 7, 'murekkep'], [11, -4, 3, 4, 'tas-3'], [11, -4, 3, 1, 'tas-2']]
const FURNACE_FIRE: readonly (readonly Rect[])[] = [
  [[5, 10, 6, 4, 'alev-3'], [6, 9, 2, 1, 'alev-3'], [6, 11, 4, 3, 'alev-2'], [7, 12, 2, 2, 'alev-1']],
  [[4, 11, 8, 3, 'alev-3'], [8, 9, 2, 2, 'alev-3'], [6, 11, 4, 3, 'alev-2'], [8, 12, 2, 2, 'alev-1']],
]
const SMOKE: readonly (readonly Rect[])[] = [
  [[12, -11, 3, 3, 'duman'], [11, -6, 2, 2, 'duman']],
  [[13, -14, 2, 2, 'duman'], [12, -9, 3, 3, 'duman']],
  [[12, -12, 2, 2, 'duman'], [14, -16, 1, 1, 'duman']],
  [[11, -8, 3, 3, 'duman']],
]

export const furnace = (x: number, y: number): string =>
  paint(at(FURNACE, x, y)) + frames(FURNACE_FIRE.map(f => paint(at(f, x, y))), 160) + frames(SMOKE.map(s => paint(at(s, x, y))), 240)

export const anvil = (x: number, y: number): string =>
  paint(at([[1, 6, 14, 3, 'demir-2'], [1, 6, 14, 1, 'demir-1'], [0, 7, 1, 1, 'demir-2'], [5, 9, 6, 3, 'demir-3'], [3, 12, 10, 2, 'demir-2'], [2, 14, 12, 2, 'demir-3']], x, y))

/** The piece on the anvil: cracked, or whole with a glint. */
export const piece = (x: number, y: number, isFixed: boolean): string =>
  paint(at([[9, 2, 5, 4, 'tas-1'], [9, 5, 5, 1, 'tas-3'], ...(isFixed ? ([[9, 2, 1, 1, 'isik']] as const) : ([[11, 2, 1, 2, 'catlak'], [12, 4, 1, 2, 'catlak']] as const))], x, y))

export const sparks = (x: number, y: number): string =>
  paint(at([[2, 1, 1, 1, 'alev-1'], [5, -1, 1, 1, 'alev-1'], [8, 0, 1, 1, 'alev-2'], [1, 4, 1, 1, 'alev-2'], [7, 3, 1, 1, 'alev-3'], [3, -2, 1, 1, 'alev-3']], x, y))

const CHEST_BODY: readonly Rect[] = [[1, 9, 14, 7, 'kalas-2'], [1, 14, 14, 2, 'kalas-3']]
const CHEST_BANDS: readonly Rect[] = [[1, 4, 1, 12, 'demir-3'], [14, 4, 1, 12, 'demir-3']]

export const chest = (x: number, y: number, isOpen: boolean): string =>
  paint(
    at(
      isOpen
        ? [[1, 0, 14, 3, 'kalas-2'], [1, 0, 14, 1, 'kalas-1'], [1, 3, 14, 1, 'kalas-3'], [7, 1, 2, 2, 'baret-1'], [2, 4, 12, 5, 'murekkep'], ...CHEST_BODY, ...CHEST_BANDS]
        : [[1, 4, 14, 5, 'kalas-2'], [1, 4, 14, 1, 'kalas-1'], [1, 8, 14, 1, 'kalas-3'], ...CHEST_BODY, ...CHEST_BANDS, [7, 7, 2, 4, 'baret-1'], [7, 10, 2, 1, 'baret-2']],
      x,
      y,
    ),
  )

/** A loaded cart; its wheels end 12 pixels below `y`. */
export const cart = (x: number, y: number): string =>
  paint(at([[4, -3, 8, 4, 'kalas-2'], [4, -3, 8, 1, 'kalas-1'], [4, -1, 8, 1, 'kalas-3'], [7, -2, 2, 2, 'baret-1'], [0, 1, 16, 2, 'demir-1'], [1, 3, 14, 5, 'demir-2'], [2, 3, 12, 1, 'demir-3'], [2, 8, 12, 1, 'demir-3'], [3, 9, 3, 3, 'demir-3'], [10, 9, 3, 3, 'demir-3'], [4, 10, 1, 1, 'demir-1'], [11, 10, 1, 1, 'demir-1']], x, y))

export function rail(from: number, to: number, ground: number): string {
  const ties: Rect[] = []

  for (let x = from + 2; x < to; x += 8) {
    ties.push([x, ground - 1, 3, 2, 'kalas-3'])
  }

  return paint([...ties, [from, ground - 2, to - from, 1, 'demir-1'], [from, ground - 1, to - from, 1, 'demir-3']])
}

const GLYPHS = {
  q: ['###', '..#', '.##', '...', '.#.'],
  up: ['..#..', '.###.', '#.#.#', '..#..', '..#..'],
  ok: ['.....#', '....#.', '#..#..', '.##...'],
} as const

export const glyph = (name: keyof typeof GLYPHS, x: number, y: number, colour: string): string => paint(at(grid(GLYPHS[name], { '#': colour }), x, y))

export const sign = (x: number, y: number, name: 'q' | 'up'): string =>
  paint(at([[5, 9, 2, 7, 'kalas-3'], [0, 0, 12, 9, 'kalas-1'], [0, 0, 12, 1, 'kalas-2'], [0, 0, 1, 9, 'kalas-2'], [11, 0, 1, 9, 'kalas-3'], [0, 8, 12, 1, 'kalas-3']], x, y)) +
  glyph(name, x + (name === 'q' ? 5 : 4), y + 2, 'murekkep')

/** A file sheet on a post; `ground` is the line it stands on. */
export const board = (x: number, ground: number): string =>
  paint(at([[3, -10, 2, 10, 'kalas-3'], [0, -22, 8, 12, 'kagit'], [0, -22, 8, 1, 'tas-1'], [0, -11, 8, 1, 'tas-3'], [7, -22, 1, 12, 'tas-3'], [1, -20, 5, 1, 'plan'], [1, -18, 6, 1, 'tas-3'], [1, -16, 4, 1, 'tas-3'], [1, -14, 5, 1, 'tas-3']], x, ground))

export const bubble = (x: number, y: number): string =>
  paint(at([[1, 0, 14, 10, 'tas-2'], [0, 1, 16, 8, 'tas-2'], [1, 1, 14, 8, 'kagit'], [-1, 12, 3, 3, 'tas-2'], [0, 13, 1, 1, 'kagit'], [-4, 17, 2, 2, 'tas-2']], x, y))

export const flag = (x: number, ground: number, isWaving: boolean): string =>
  paint(at(isWaving ? [[0, 0, 1, 30, 'tas-3'], [1, 0, 5, 6, 'zumrut'], [6, 1, 5, 6, 'zumrut']] : [[0, 0, 1, 30, 'tas-3'], [1, 0, 10, 6, 'zumrut']], x, ground - 30))

export const rubble = (x: number, y: number): string =>
  paint(at([[1, 12, 6, 4, 'tas-2'], [6, 10, 5, 6, 'tas-2'], [10, 13, 5, 3, 'tas-3'], [2, 12, 3, 1, 'tas-1'], [7, 10, 3, 1, 'tas-1'], [0, 15, 16, 1, 'tas-3']], x, y))
