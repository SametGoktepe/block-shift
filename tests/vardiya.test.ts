import { expect, mock, test } from 'claude-code/testing'

import { unpainted } from '../hooks/colors'
import { MIN_DWELL_MS, periodAt, sceneForTool, sceneForTurnEnd, waitBeforeSwitch, type Period, type Scene } from '../hooks/machine'
import { SVG_LIMIT, sceneAlt, sceneSvg } from '../hooks/scene'

const SCENES: readonly Scene[] = ['idle', 'thinking', 'explore', 'build', 'run', 'fix', 'commit', 'push', 'waiting', 'helpers', 'failure', 'done']
const PERIODS: readonly Period[] = ['sabah', 'gunduz', 'aksamustu', 'aksam']

const PUSH = { tool: 'Bash', command: 'git push origin main' } as const

const BACKDROP = {
  plugin: 'block-shift',
  component: 'Backdrop',
  surface: 'desktop',
  props: { scene: 'block-shift', plugin: 'block-shift', glass: false },
} as const

test('a tool call opens its scene', async () => {
  expect(sceneForTool('Read', undefined, false)).toBe('explore')
  expect(sceneForTool('Edit', undefined, false)).toBe('build')
  expect(sceneForTool('Edit', undefined, true)).toBe('fix')
  expect(sceneForTool('Agent', undefined, false)).toBe('helpers')
  expect(sceneForTool('AskUserQuestion', undefined, false)).toBe('waiting')
  expect(sceneForTool('mcp__server__tool', undefined, false)).toBe('run')
  expect(sceneForTool('Bash', 'npm test', false)).toBe('run')
  expect(sceneForTool('Bash', 'git log --oneline', false)).toBe('run')
  expect(sceneForTool('Bash', 'git -C repo commit -m "x"', false)).toBe('commit')
  expect(sceneForTool('Bash', 'R=/a; git -C $R push origin main', false)).toBe('push')
})

test('a word in a commit message is not a subcommand', async () => {
  expect(sceneForTool('Bash', 'git commit -m "fix push order"', false)).toBe('commit')
  expect(sceneForTool('Bash', 'echo git push', false)).toBe('run')
})

test('a turn ends in a celebration only for an answer', async () => {
  expect(sceneForTurnEnd('answer')).toBe('done')
  expect(sceneForTurnEnd('aborted')).toBe('idle')
  expect(sceneForTurnEnd('error')).toBe('failure')
  expect(sceneForTurnEnd('refusal')).toBe('failure')
})

test('the sky changes at 06, 10, 16 and 19', async () => {
  expect([5, 6, 9, 10, 15, 16, 18, 19, 23, 0].map(periodAt)).toEqual([
    'aksam', 'sabah', 'sabah', 'gunduz', 'gunduz', 'aksamustu', 'aksamustu', 'aksam', 'aksam', 'aksam',
  ])
})

test('a scene waits out its dwell, a question and a failure cut in', async () => {
  expect(waitBeforeSwitch(1000, 500, 'explore')).toBe(MIN_DWELL_MS - 500)
  expect(waitBeforeSwitch(5000, 500, 'explore')).toBe(0)
  expect(waitBeforeSwitch(1000, 500, 'waiting')).toBe(0)
  expect(waitBeforeSwitch(1000, 500, 'failure')).toBe(0)
})

test('every scene fits the app\'s SVG limit and draws whole', async () => {
  let longest = 0

  for (const scene of SCENES) {
    for (const period of PERIODS) {
      for (const helpers of [0, 3]) {
        const svg = sceneSvg({ scene, period, helpers, isStill: false })

        longest = Math.max(longest, svg.length)
        expect(svg.includes('undefined') || svg.includes('NaN')).toBe(false)
      }
    }
    expect(sceneAlt(scene).length).toBeGreaterThan(10)
  }
  expect(longest).toBeLessThan(SVG_LIMIT)
})

test('the camp stands left of the text column', async () => {
  const svg = sceneSvg({ scene: 'idle', period: 'gunduz', helpers: 0, isStill: true })
  const stageX = Number(/<svg x="(-?\d+)"/.exec(svg)?.[1])

  // The stage is 128 wide; the scene's centre, where the text column sits, is 160.
  expect(stageX + 128).toBeLessThan(160)
})

test('the ground stays still: no colour shares a name with a motion', async () => {
  const svg = sceneSvg({ scene: 'push', period: 'gunduz', helpers: 3, isStill: false })

  expect(/\.c[0-9a-z]+\{animation/.test(svg)).toBe(false)
  // The push cart still rolls.
  expect(svg.includes('<g class="mc">') && svg.includes('.mc{animation')).toBe(true)
})

test('the desktop app paints the colours', async () => {
  expect(unpainted).toBe(undefined)
})

test('the backdrop follows the agent', async ($, on) => {
  const clock = mock.clock(on)

  mock.store(on)
  on('command.register', () => ({ value: { command: 'shift' } }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'test' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const alt = async (): Promise<unknown> => {
    const ui = await $.ui.mount(BACKDROP)
    const found = await ui.find({ type: 'Svg' })

    await ui.unmount()

    return found?.props.alt
  }

  expect(await alt()).toBe(sceneAlt('idle'))

  await clock.advance(MIN_DWELL_MS)
  await $.tool.call(PUSH)
  expect(await alt()).toBe(sceneAlt('push'))

  // The scene stays until the next tool call or the end of the turn.
  await clock.advance(MIN_DWELL_MS)
  expect(await alt()).toBe(sceneAlt('push'))
})
