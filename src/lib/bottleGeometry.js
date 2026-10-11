/**
 * Geometry of the laboratory bottle drawn by ReagentArt.
 *
 * Kept outside the component module so the pour stream can import it without
 * pulling a React component in (and so Fast Refresh stays happy).
 */

export const BOTTLE_GEOMETRY = {
  mouth: { x: 32, y: 6 }, // centre of the bottle opening, untilted
  pivot: { x: 32, y: 52 }, // base of the bottle — what the tilt rotates around
  viewBox: 64,
}

/**
 * Where the bottle opening ends up, in pixels relative to the centre of a
 * `size`-wide art box, after `tilt` degrees of rotation about the base.
 *
 * The pour stream uses this so the liquid always leaves the actual spout
 * instead of an arbitrary offset that drifts as the bottle rotates.
 */
export function bottleMouthOffset(tilt, size) {
  const { mouth, pivot, viewBox } = BOTTLE_GEOMETRY
  const rad = (tilt * Math.PI) / 180
  const dx = mouth.x - pivot.x
  const dy = mouth.y - pivot.y
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad) + pivot.x
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad) + pivot.y
  const scale = size / viewBox
  // convert from viewBox space to "offset from the centre of the art box"
  return { x: (rx - viewBox / 2) * scale, y: (ry - viewBox / 2) * scale }
}