import { makeColors } from './make-colors.js'

// The app's surfaces take the dirt block's own tones. These anchors are the
// darkest light-mode and the lightest dark-mode values the desktop app still paints.
const LIGHT_ANCHORS = {
  'surface-0': '#c49667',
  'surface-1': '#cda174',
  'surface-2': '#d5ae83',
  'surface-3': '#d5ae83',
  'text-primary': '#1c1007',
  'text-secondary': '#321e11',
  'text-muted': '#452e1c',
}
const DARK_ANCHORS = {
  'surface-0': '#4b3024',
  'surface-1': '#533528',
  'surface-2': '#5b3b2b',
  'surface-3': '#63412f',
  'text-primary': '#fdf3e1',
  'text-secondary': '#ecdcc0',
  'text-muted': '#d8c3a2',
}

// One ore per role. On mid-tone dirt the design system's own role text falls
// under contrast, so the stop that carries role text is set by hand: 600 in
// light mode, 300 in dark mode (400 for success).
const SEEDS = { accent: '#3f7fe0', danger: '#e2543a', success: '#36c26b', warning: '#f2c230', pro: '#9a6fe0' }

const { theme, problems } = makeColors({
  id: 'block-shift',
  label: 'Block Shift',
  light: {
    gray: { anchors: LIGHT_ANCHORS },
    roles: {
      accent: { seed: SEEDS.accent, stops: { 600: '#19335a' } },
      danger: { seed: SEEDS.danger, stops: { 600: '#5a2217' } },
      success: { seed: SEEDS.success, stops: { 600: '#103a20' } },
      warning: { seed: SEEDS.warning, stops: { 600: '#3f320c' } },
      pro: { seed: SEEDS.pro, stops: { 600: '#3b2a55' } },
    },
    git: { added: '#103a20', removed: '#5a2217', modified: '#3f320c', merged: '#3b2a55', closed: '#452e1c', conflicting: '#4f2609', draft: '#452e1c' },
  },
  dark: {
    gray: { anchors: DARK_ANCHORS },
    roles: {
      accent: { seed: SEEDS.accent, stops: { 300: '#9fbff0' } },
      danger: { seed: SEEDS.danger, stops: { 300: '#f1aa9d' } },
      success: { seed: SEEDS.success, stops: { 400: '#66d18f' } },
      warning: { seed: SEEDS.warning, stops: { 300: '#f2c230' } },
      pro: { seed: SEEDS.pro, stops: { 300: '#c8b1ee' } },
    },
    git: { added: '#66d18f', removed: '#f1aa9d', modified: '#f2c230', merged: '#c8b1ee', closed: '#d8c3a2', conflicting: '#f5b98a', draft: '#d8c3a2' },
  },
})

export { theme }

/** The first reason the desktop app would ignore the whole theme, if there is one. */
export const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
