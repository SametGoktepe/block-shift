/** What the mascot is doing. Each name is one scene of the design system. */
export type Scene =
  | 'idle'
  | 'thinking'
  | 'explore'
  | 'build'
  | 'run'
  | 'fix'
  | 'commit'
  | 'push'
  | 'waiting'
  | 'helpers'
  | 'failure'
  | 'done'

/** The four skies of the day, by local hour. */
export type Period = 'sabah' | 'gunduz' | 'aksamustu' | 'aksam'

export const MIN_DWELL_MS = 1200
export const DONE_MS = 1600
export const MAX_HELPERS = 3

const MORNING_FROM = 6
const DAY_FROM = 10
const SUNSET_FROM = 16
const EVENING_FROM = 19

export function periodAt(hour: number): Period {
  if (hour >= MORNING_FROM && hour < DAY_FROM) return 'sabah'
  if (hour >= DAY_FROM && hour < SUNSET_FROM) return 'gunduz'
  if (hour >= SUNSET_FROM && hour < EVENING_FROM) return 'aksamustu'

  return 'aksam'
}

const EXPLORE_TOOLS = new Set(['Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch', 'LSP', 'ToolSearch'])
const BUILD_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit'])
const AGENT_TOOLS = new Set(['Agent', 'Task', 'Workflow'])
const QUESTION_TOOLS = new Set(['AskUserQuestion', 'ExitPlanMode'])

const GIT_FLAGS_WITH_VALUE = new Set(['-C', '-c'])

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/

// The git subcommand of each shell statement that runs git: the first word
// after `git` that is not a flag. `git` has to be the command itself (after
// any `VAR=value` prefixes), so neither `echo git push` nor a word inside a
// commit message counts.
function gitSubcommands(command: string): string[] {
  return command.split(/[;&|\n]+/).flatMap(statement => {
    const words = statement.trim().split(/\s+/)
    const start = words.findIndex(word => !ASSIGNMENT.test(word))

    if (start < 0 || words[start] !== 'git') return []

    for (let i = start + 1; i < words.length; i += 1) {
      const word = words[i] ?? ''

      if (GIT_FLAGS_WITH_VALUE.has(word)) {
        i += 1
        continue
      }
      if (!word.startsWith('-')) return [word]
    }

    return []
  })
}

/** The scene a tool call opens. `isBroken` is true from a failure until a command next succeeds. */
export function sceneForTool(tool: string, command: string | undefined, isBroken: boolean): Scene {
  if (QUESTION_TOOLS.has(tool)) return 'waiting'
  if (BUILD_TOOLS.has(tool)) return isBroken ? 'fix' : 'build'
  if (AGENT_TOOLS.has(tool)) return 'helpers'
  if (EXPLORE_TOOLS.has(tool)) return 'explore'
  if (tool !== 'Bash' || command === undefined) return 'run'

  const git = gitSubcommands(command)

  if (git.includes('push')) return 'push'
  if (git.includes('commit')) return 'commit'

  return 'run'
}

/** The scene a finished turn opens: a celebration only for a real answer. */
export function sceneForTurnEnd(reason: string): Scene {
  if (reason === 'answer') return 'done'
  if (reason === 'aborted') return 'idle'

  return 'failure'
}

// A question and a failure cut in at once; everything else waits out the dwell.
const isUrgent = (scene: Scene): boolean => scene === 'waiting' || scene === 'failure'

/** How long the current scene still has to stay before `next` may replace it. */
export const waitBeforeSwitch = (now: number, since: number, next: Scene): number =>
  isUrgent(next) ? 0 : Math.max(0, MIN_DWELL_MS - (now - since))

export const clampHelpers = (count: number): number => Math.max(0, Math.min(MAX_HELPERS, count))
