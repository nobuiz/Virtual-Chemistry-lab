/**
 * Geometry of the GestureLab 3D laboratory.
 *
 * Everything in this module is PURE DATA + PURE MATH in metres, with the
 * camera at human eye level looking slightly down at the bench. It is kept
 * free of React and of any scene graph so that:
 *
 *   - the scene components and the raycasting hit-tests agree by construction
 *     (they read the same slot table rather than measuring the rendered mesh),
 *   - automated tests can import it directly and assert the layout.
 *
 * Axis convention: +x right, +y up, +z toward the viewer. The floor is y = 0.
 */
import { Box3, Vector3 } from 'three'

/* ------------------------------- the room ------------------------------- */
export const ROOM = {
  width: 7.4,
  depth: 7.2,
  height: 3.05,
  /** z of the wall the shelving is mounted on. */
  backZ: -1.66,
}

/* ----------------------------- the workbench ---------------------------- */
export const BENCH = {
  /** y of the working surface — everything on the bench rests here. */
  top: 0.95,
  width: 3.0,
  depth: 0.8,
  /** z of the front edge, i.e. the edge nearest the camera. */
  frontZ: 0.08,
  thickness: 0.07,
}

export const BENCH_CENTER_Z = BENCH.frontZ - BENCH.depth / 2

/* ------------------------------ the beaker ------------------------------ */
export const BEAKER = {
  x: 0,
  /** y of the beaker's base (it stands on the bench). */
  y: BENCH.top,
  z: -0.3,
  radius: 0.085,
  height: 0.2,
}

/** World point the pour stream aims at — just inside the beaker mouth. */
export const BEAKER_MOUTH = new Vector3(BEAKER.x, BEAKER.y + BEAKER.height * 0.92, BEAKER.z)

/* ------------------------------ the shelves ----------------------------- */
export const SHELF = { width: 2.62, depth: 0.32, plank: 0.04, z: -1.2 }

/** y of each shelf's *top surface* (what the reagents stand on). */
export const SHELF_Y = { liquids: 1.2, solids: 1.63 }

/* --------------------------- carrying behaviour -------------------------- */
/**
 * Carried reagents ride on a single vertical plane at this depth.
 *
 * A monocular webcam cannot recover hand depth, so inventing one would be a
 * lie that makes the drag feel unstable. A fixed, well-chosen carry plane —
 * between the bench front and the shelves — keeps the object the same size
 * the whole way across, which reads as "holding it up in front of you".
 */
export const CARRY_Z = -0.44

/** Sanity clamp so a cursor flung at the screen edge cannot throw the object into the wall. */
export const CARRY_BOUNDS = { minX: -1.35, maxX: 1.35, minY: 1.0, maxY: 1.95 }

/* ------------------------------- the camera ------------------------------ */
export const CAMERA = {
  position: [0, 1.64, 1.4],
  target: [0, 1.04, -0.34],
  fov: 48,
  near: 0.1,
  far: 30,
}

/* ------------------------------- the stock ------------------------------- */
/** Left-to-right order on the upper shelf. Most reactive first. */
export const SOLID_IDS = ['na', 'mg', 'zn', 'fe', 'cu', 'ag']
/** Left-to-right order on the lower shelf. */
export const LIQUID_IDS = ['hcl', 'h2so4', 'naoh', 'h2o']

/** Evenly spaced x positions for `n` items across `span` metres. */
export function spread(n, span) {
  if (n <= 1) return [0]
  return Array.from({ length: n }, (_, i) => -span / 2 + (span * i) / (n - 1))
}

const SOLID_X = spread(SOLID_IDS.length, 1.95)
const LIQUID_X = spread(LIQUID_IDS.length, 1.52)

/**
 * Where each reagent lives.
 *   x, y, z — y is the SURFACE the object stands on, not its centre.
 *   kind    — 'solid' | 'liquid'
 */
export const SLOTS = Object.fromEntries([
  ...SOLID_IDS.map((id, i) => [
    id,
    { id, kind: 'solid', x: SOLID_X[i], y: SHELF_Y.solids, z: SHELF.z },
  ]),
  ...LIQUID_IDS.map((id, i) => [
    id,
    { id, kind: 'liquid', x: LIQUID_X[i], y: SHELF_Y.liquids, z: SHELF.z },
  ]),
])

export const SLOT_LIST = Object.values(SLOTS)

/* --------------------------- object dimensions --------------------------- */
/** Half-extents of a solid sample and of a bottle, used for both art and hit-tests. */
export const SOLID_SIZE = { hx: 0.072, hy: 0.052, hz: 0.062 }
export const BOTTLE_SIZE = { hx: 0.058, hy: 0.115, hz: 0.058 }

/**
 * Pick targets are deliberately LARGER than the artwork.
 *
 * A hand cursor is never pixel-precise, so a tight mesh-accurate hit-test
 * would make the lab feel broken even when tracking is perfect. The padding
 * below is the 3D equivalent of the generous `pad` the 2D bench already uses.
 */
const PICK_PAD = 0.035

/** @returns {Box3} world-space axis-aligned pick volume for a reagent. */
export function pickBox(id) {
  const slot = SLOTS[id]
  if (!slot) return null
  const s = slot.kind === 'liquid' ? BOTTLE_SIZE : SOLID_SIZE
  const centre = new Vector3(slot.x, slot.y + s.hy, slot.z)
  const half = new Vector3(s.hx + PICK_PAD, s.hy + PICK_PAD, s.hz + PICK_PAD)
  return new Box3(centre.clone().sub(half), centre.clone().add(half))
}

/** Pre-built pick volumes — the ray test allocates nothing per frame. */
export const PICK_BOXES = SLOT_LIST.map((slot) => ({ id: slot.id, box: pickBox(slot.id) }))

/**
 * The beaker drop volume.
 *
 * A tall column above the beaker rather than the beaker itself: the user
 * holds a reagent *above* the vessel before letting go, exactly as they would
 * in a real lab, and the carried object sits on the carry plane in front of it.
 */
export const DROP_BOX = new Box3(
  new Vector3(BEAKER.x - 0.21, BEAKER.y - 0.06, BEAKER.z - 0.24),
  new Vector3(BEAKER.x + 0.21, BEAKER.y + 0.52, BEAKER.z + 0.22),
)

/** Centre of the drop volume — used to aim the pour stream and place hints. */
export const DROP_CENTRE = DROP_BOX.getCenter(new Vector3())

/* ------------------------------- utilities ------------------------------- */

/**
 * Convert a viewport (client) pixel position to normalised device coords for
 * a canvas occupying `rect`.
 *
 * The hand cursor is already mirrored upstream by `cameraToViewport`, so the
 * webcam mirror is handled exactly once, in one place, for both input paths.
 */
export function clientToNdc(x, y, rect, out = { x: 0, y: 0 }) {
  out.x = ((x - rect.left) / Math.max(rect.width, 1)) * 2 - 1
  out.y = -((y - rect.top) / Math.max(rect.height, 1)) * 2 + 1
  return out
}

/** Clamp a carried position into the reachable working volume. */
export function clampCarry(v) {
  v.x = Math.min(Math.max(v.x, CARRY_BOUNDS.minX), CARRY_BOUNDS.maxX)
  v.y = Math.min(Math.max(v.y, CARRY_BOUNDS.minY), CARRY_BOUNDS.maxY)
  v.z = CARRY_Z
  return v
}
