import { styleSheet } from './draw'
import type { Period, Scene } from './machine'
import { ALT, STAGE, overlay, stage } from './states'
import { GROUND, HEIGHT, WIDTH, defs, sky, terrain } from './world'

/** The app refuses an SVG source of this many characters or more. */
export const SVG_LIMIT = 131072

export type View = {
  scene: Scene
  period: Period
  /** Holds every animation on its first frame. */
  isStill: boolean
  /** How many helpers walk the ground: 0 to 3. */
  helpers: number
}

// The app draws the scene across the whole window, scales it to the window's
// height, centres it and crops the sides; panels cover it. The mascot's camp
// stands in the gap between the left sidebar and the centred text column.
const CAMP_X = 0

/** The whole backdrop as one SVG: sky, terrain and mine, then the mascot's corner. */
export function sceneSvg(view: View): string {
  const stageX = CAMP_X
  const stageY = GROUND - STAGE.ground

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">` +
    `<style>${styleSheet(view.isStill)}</style><defs>${defs()}</defs>` +
    sky(view.period) +
    terrain() +
    overlay(view.scene, view.helpers) +
    `<svg x="${stageX}" y="${stageY}" width="${STAGE.width}" height="${STAGE.height}" viewBox="0 0 ${STAGE.width} ${STAGE.height}">${stage(view.scene)}</svg>` +
    '</svg>'
  )
}

export const sceneAlt = (scene: Scene): string => ALT[scene]
