import { at, frames, group, paint, type Rect } from './draw'
import type { Scene } from './machine'
import { anvil, board, bubble, campfire, cart, chest, flag, furnace, glyph, mascot, mini, piece, rail, rubble, sign, sparks, table, tool } from './mascot'
import { GROUND, PLANKS, WIDTH } from './world'

/** The mascot's corner: 128 x 72 scene pixels at the window's bottom right, clipped. */
export const STAGE = { width: 128, height: 72, ground: 56 } as const

const GY = STAGE.ground
const MY = GY - 15 // top of a standing mascot
const DX = 28 // keeps the mascot right of the ladder hatch

const CUBES: readonly Rect[] = [[2, 3, 3, 3, 'cevher-lapis'], [6, 3, 3, 3, 'cevher-zumrut'], [10, 3, 3, 3, 'cevher-altin']]
const RAYS: readonly Rect[] = [[7, -3, 2, 2, 'alev-2'], [4, -1, 1, 1, 'alev-2'], [11, -1, 1, 1, 'alev-2'], [2, 1, 1, 1, 'alev-2'], [13, 1, 1, 1, 'alev-2']]
const BANG: readonly Rect[] = [[7, -13, 2, 6, 'kor'], [7, -5, 2, 2, 'kor']]
const CONFETTI: readonly Rect[] = [[-6, -6, 3, 3, 'cevher-altin'], [7, -10, 3, 3, 'cevher-lapis'], [20, -5, 3, 3, 'cevher-ametist']]
const CRACK: readonly Rect[] = [[7, 0, 1, 3, 'catlak'], [8, 3, 1, 3, 'catlak'], [7, 6, 1, 3, 'catlak'], [8, 9, 1, 4, 'catlak'], [7, 13, 1, 3, 'catlak']]
const STONE_BLOCK: readonly Rect[] = [[0, 0, 16, 16, 'tas-2'], [1, 2, 4, 1, 'tas-1'], [8, 1, 3, 1, 'tas-1'], [0, 4, 5, 1, 'tas-3'], [11, 8, 5, 1, 'tas-3'], [5, 13, 6, 1, 'tas-3']]
const SPLIT: readonly Rect[] = [[-1, 0, 8, 16, 'tas-2'], [-1, 0, 8, 1, 'tas-1'], [9, 0, 8, 16, 'tas-2'], [9, 0, 8, 1, 'tas-1'], [7, 0, 2, 16, 'catlak']]
const CHUNKS: readonly Rect[] = [[-2, 6, 6, 6, 'tas-2'], [5, 3, 6, 6, 'tas-2'], [11, 8, 6, 6, 'tas-2'], [4, 10, 6, 6, 'tas-3'], [-2, 6, 6, 1, 'tas-1'], [5, 3, 6, 1, 'tas-1']]

function idle(): string {
  return group(mascot(44 + DX, GY - 12, { legs: 'none' }), 'br') + campfire(66 + DX, GY - 16)
}

function thinking(): string {
  const bx = 56 + DX
  const by = 12
  const cubes = (count: number): string => paint(at(CUBES.slice(0, count), bx, by))

  return table(64 + DX, GY - 16) + group(mascot(40 + DX, MY), 'nd') + bubble(bx, by) + frames([cubes(3), '', cubes(1), cubes(2)], 320)
}

function explore(): string {
  const mx = 64
  const boards = [8, 56, 104, 152].map(x => board(x, GY)).join('')

  return (
    group(boards, 'sc') +
    group(
      frames([mascot(mx, MY, { legs: 'a' }), mascot(mx, MY, { legs: 'b' })], 160) + tool('torch', mx, MY) + frames([tool('flame1', mx, MY), tool('flame2', mx, MY)], 160),
      'wk',
    )
  )
}

function build(): string {
  const mx = 68
  const slots: readonly (readonly [number, number])[] = [[96, 40], [112, 40], [96, 24], [112, 24]]
  const wall = (count: number, isShining: boolean): string => {
    const top = slots[count - 1]

    return paint([
      ...slots.slice(0, count).flatMap(([x, y]) => at(PLANKS, x, y)),
      ...(isShining && top !== undefined ? ([[top[0], top[1], 16, 1, 'isik']] as const) : []),
    ])
  }

  return (
    frames([wall(2, true), wall(3, true), wall(4, true), wall(4, false), '', wall(1, true)], 400) +
    frames([mascot(mx, MY, { right: 'up' }) + tool('block', mx, MY), mascot(mx, MY)], 400)
  )
}

function run(): string {
  return furnace(66 + DX, GY - 16) + group(mascot(40 + DX, MY), 'wk')
}

function fix(): string {
  const ax = 64 + DX
  const ay = GY - 16
  const mx = 44 + DX
  const up = mascot(mx, MY, { right: 'up' }) + tool('hammerUp', mx, MY)
  const down = mascot(mx, MY) + tool('hammerDown', mx, MY) + sparks(ax, ay)
  const cracked = piece(ax, ay, false)
  const whole = piece(ax, ay, true)

  return anvil(ax, ay) + frames([cracked, cracked, cracked, cracked, whole, whole], 200) + frames([down, up, down, up, up, up], 200)
}

function commit(): string {
  const cx = 66 + DX
  const cy = GY - 16
  const mx = 40 + DX
  const closed = chest(cx, cy, false) + glyph('ok', cx + 5, cy - 6, 'zumrut') + mascot(mx, MY)

  return frames(
    [
      chest(cx, cy, true) + mascot(mx, MY, { right: 'up' }) + tool('cube', mx, MY - 6),
      chest(cx, cy, true) + mascot(mx, MY, { right: 'up' }) + tool('cube', mx + 6, MY - 14),
      chest(cx, cy, true) + mascot(mx, MY) + tool('cube', mx + 12, MY - 6),
      closed,
      closed,
      closed,
    ],
    240,
  )
}

function push(): string {
  const mx = 72

  return sign(104, GY - 18, 'up') + frames([mascot(mx, MY, { left: 'up' }), mascot(mx, MY)], 320)
}

function waiting(): string {
  const mx = 44 + DX

  return sign(68 + DX, GY - 16, 'q') + mascot(mx, MY) + frames([paint(at(RAYS, mx, MY)), ''], 600)
}

function helpers(): string {
  return mascot(72, MY, { right: 'up' })
}

function failure(): string {
  const mx = 40 + DX
  const bx = 72 + DX
  const by = GY - 16
  const startled = (y: number): string => mascot(mx, y, { eyes: 'wide', left: 'up', right: 'up' }) + paint(at(BANG, mx, y))
  const dust = (rects: readonly Rect[]): string => rubble(bx, by) + paint(at(rects, bx, by))

  return frames(
    [
      paint(at([...STONE_BLOCK, ...CRACK], bx, by)) + startled(MY - 2),
      paint(at(SPLIT, bx, by)) + startled(MY),
      paint(at(CHUNKS, bx, by)) + startled(MY),
      dust([[3, 4, 4, 4, 'duman'], [9, 6, 3, 3, 'duman']]) + startled(MY),
      dust([[4, -1, 3, 3, 'duman'], [10, 2, 2, 2, 'duman']]) + startled(MY),
      rubble(bx, by) + startled(MY),
    ],
    240,
  )
}

function done(): string {
  const mx = 44 + DX
  const cheer = (y: number, lift: number): string =>
    mascot(mx, y, { left: 'up', right: 'up' }) + tool('pickUp', mx, y) + paint(at(CONFETTI, mx, MY + lift))

  return (
    frames([flag(76 + DX, GY, false), flag(76 + DX, GY, true)], 240) +
    frames([cheer(MY - 2, -2), cheer(MY, 0), cheer(MY - 2, -4), cheer(MY, 2)], 160)
  )
}

const STAGES: Readonly<Record<Scene, () => string>> = { idle, thinking, explore, build, run, fix, commit, push, waiting, helpers, failure, done }

/** The mascot and its station, in stage coordinates. */
export const stage = (scene: Scene): string => STAGES[scene]()

const HELPER_LOOKS: readonly (readonly [number, string, string])[] = [
  [180, 'cevher-lapis', 'cevher-altin'],
  [208, 'cevher-zumrut', 'cevher-lapis'],
  [236, 'cevher-ametist', 'cevher-elmas'],
]

/** What crosses the whole window: the push cart on its rail, and the helpers' line. */
export function overlay(scene: Scene, helperCount: number): string {
  const line = (isStep: boolean): string =>
    HELPER_LOOKS.slice(0, helperCount)
      .map(([x, helmet, cube], i) => mini(x, GROUND - 8, helmet, cube, isStep !== (i % 2 === 1)))
      .join('')

  return (
    (scene === 'push' ? rail(0, WIDTH, GROUND) + group(cart(200, GROUND - 14), 'ct') : '') +
    (helperCount > 0 ? group(frames([line(false), line(true)], 160), 'ln') : '')
  )
}

/** One sentence per scene, for the drawing's text alternative. */
export const ALT: Readonly<Record<Scene, string>> = {
  idle: 'The mascot sits by the campfire.',
  thinking: 'The mascot stands at the drafting table; the blocks of a plan appear one by one in a thought bubble.',
  explore: 'The mascot walks past file boards, holding a torch.',
  build: 'The mascot stacks plank blocks into a wall.',
  run: 'The mascot waits by a lit furnace; smoke rises from the chimney.',
  fix: 'The mascot hammers a cracked piece on the anvil until it is whole.',
  commit: 'The mascot drops an emerald cube into a chest; the chest closes.',
  push: 'A loaded minecart rolls along the rail toward the surface; the mascot waves.',
  waiting: 'The mascot waits for you beside a question-mark sign.',
  helpers: 'The mascot guides small helpers carrying ore.',
  failure: 'A stone block has collapsed; the mascot is startled, an exclamation mark above its head.',
  done: 'The mascot raises its pickaxe and jumps; a flag waves.',
}
