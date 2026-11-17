import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { theme, unpainted } from './colors'
import { clampHelpers, DONE_MS, periodAt, sceneForTool, sceneForTurnEnd, waitBeforeSwitch, type Period, type Scene } from './machine'
import { sceneAlt, sceneSvg } from './scene'

const SCENE = 'block-shift'
const COMMAND = 'shift'
const STORE_KEY = 'mode'
const PERIOD_CHECK_MS = 60_000

type Mode = 'play' | 'pause' | 'off'

const MODES: readonly Mode[] = ['play', 'pause', 'off']
const isMode = (value: unknown): value is Mode => MODES.some(mode => mode === value)

const LOOK: ThemeSetArgs = { colors: theme, backdrop: { scene: SCENE, glass: { blur: 12, opacity: 0.55 } } }

type Live = {
  scene: Scene
  /** When the scene last changed, in epoch milliseconds. */
  since: number
  period: Period
  /** Subagent loops running now; drawn as at most three helpers. */
  agents: number
  /** True from a failed tool until a command next succeeds. */
  isBroken: boolean
  mode: Mode
}

// Module state is lost on a reload, and that is right here: the backdrop has
// to be set again at session.start anyway, and the mascot starts over idle.
let live: Live = { scene: 'idle', since: 0, period: 'gunduz', agents: 0, isBroken: false, mode: 'play' }
let pending: { cancel: () => void } | undefined

function redraw($: EngineInterface, change: Partial<Live>): void {
  live = { ...live, ...change }
  $.ui.invalidate('ui.render')
}

function dropPending(): void {
  pending?.cancel()
  pending = undefined
}

function settle($: EngineInterface, scene: Scene, now: number): void {
  dropPending()
  redraw($, { scene, since: now })

  if (scene === 'done') {
    pending = $.clock.after(DONE_MS, () => {
      pending = undefined
      void show($, 'idle')
    })
  }
}

// A scene stays for a minimum time, so quick tool calls don't make the corner flicker.
async function show($: EngineInterface, scene: Scene): Promise<void> {
  if (scene === live.scene) {
    if (scene !== 'done') dropPending()

    return
  }
  const now = await $.clock.now()
  const wait = waitBeforeSwitch(now, live.since, scene)

  if (wait === 0) {
    settle($, scene, now)

    return
  }
  dropPending()
  pending = $.clock.after(wait, () => {
    pending = undefined
    void $.clock.now().then(at => settle($, scene, at))
  })
}

async function applyLook($: EngineInterface): Promise<string> {
  if (unpainted !== undefined) $.ui.toast(unpainted)
  const set = await $.theme.set(LOOK)

  return set.isDrawn ? '' : ` Not drawn here: ${set.reason}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // The look goes first: everything else can wait until the backdrop is on its way.
    const [stored, now] = await Promise.all([$.store.get(STORE_KEY), $.clock.now()])

    live = { ...live, mode: isMode(stored) ? stored : 'play', period: periodAt(new Date(now).getHours()), since: now }
    if (live.mode !== 'off') await applyLook($)
    await $.command.register({ name: COMMAND, description: 'Block Shift: /shift play | pause | off' })

    $.clock.every(PERIOD_CHECK_MS, () => {
      void $.clock.now().then(at => {
        const period = periodAt(new Date(at).getHours())

        if (period !== live.period) redraw($, { period })
      })
    })

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await show($, 'thinking')
    else redraw($, { agents: live.agents + 1 })

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await show($, sceneForTurnEnd(e.reason))
    else redraw($, { agents: Math.max(0, live.agents - 1) })

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)

    await show($, sceneForTool(e.tool, e.tool === 'Bash' ? e.command : undefined, live.isBroken))
    const ran = await next(e)
    const hasFailed = ran.deny === undefined && ran.isError === true

    // The scene stays until the next tool call or the turn's end: every scene
    // change sends the whole drawing again, so a busy turn must not double them.
    if (hasFailed) {
      live = { ...live, isBroken: true }
      await show($, 'failure')
    } else if (e.tool === 'Bash' && ran.deny === undefined) {
      live = { ...live, isBroken: false }
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    if (e.props.plugin !== $.plugin.name || e.props.scene !== SCENE) return next(e)

    const { Svg } = $.ui.resolve(e)
    const source = sceneSvg({ scene: live.scene, period: live.period, isStill: live.mode === 'pause', helpers: clampHelpers(live.agents) })

    // An image, not an interactive frame: it shows sooner and a redraw doesn't
    // rebuild a sandboxed frame. CSS animation runs in an SVG image too.
    return <Svg source={source} alt={sceneAlt(live.scene)} />
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim().toLowerCase()

    if (!isMode(word)) return { text: `Usage: /${COMMAND} play | pause | off (now: ${live.mode})` }

    const wasOff = live.mode === 'off'

    await $.store.set(STORE_KEY, word)
    if (word === 'off') {
      live = { ...live, mode: word }
      await $.theme.clear()

      return { text: `Block Shift is off. /${COMMAND} play brings it back.` }
    }
    redraw($, { mode: word })
    const note = wasOff ? await applyLook($) : ''

    return { text: (word === 'pause' ? 'Block Shift paused: the scene stands still.' : 'Block Shift is playing.') + note }
  }).catch(() => ({ text: `Block Shift: /${COMMAND} failed.` }))
}
