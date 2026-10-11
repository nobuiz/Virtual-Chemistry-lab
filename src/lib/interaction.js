/**
 * Shared interaction vocabulary for GestureLab AI.
 *
 * Lives in its own module so that App.jsx (which owns the state machine) and
 * the presentational components that merely *read* the phase do not import
 * each other in a cycle.
 */

export const PHASE = {
  IDLE: 'IDLE',
  HOVERING: 'HOVERING',
  CARRYING_SOLID: 'CARRYING_SOLID',
  CARRYING_LIQUID: 'CARRYING_LIQUID',
  POUR_READY: 'POUR_READY',
  POURING: 'POURING',
  SCROLLING: 'SCROLLING',
}

/** How long a bottle must hover over the beaker before it pours (ms). */
export const POUR_HOLD_MS = 1000

/** How long the tilt + stream animation runs before the bottle returns (ms). */
export const POUR_ANIM_MS = 900

/** Open-palm must be stable this long before scroll mode engages (ms). */
export const SCROLL_ARM_MS = 200

/** Vertical hand movement below this (px/frame) is treated as hand tremor. */
export const SCROLL_DEADZONE_PX = 1.5

/** Screen px of hand travel -> list px scrolled. */
export const SCROLL_SENSITIVITY = 2.4