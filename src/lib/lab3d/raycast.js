/**
 * Screen-space -> 3D hit testing for the laboratory.
 *
 * This is the ONLY place that turns a 2D cursor (mouse OR MediaPipe fingertip)
 * into a 3D intent. App.jsx's interaction state machine is unchanged: it still
 * asks "what is under the cursor?" and "is the cursor over the beaker?" — this
 * module simply answers those questions with a Raycaster instead of
 * `document.elementFromPoint`.
 *
 * Ray-vs-AABB is used rather than ray-vs-mesh because:
 *   - the pick volumes are authored in `layout.js` and are intentionally
 *     larger than the art, which no mesh test can give us;
 *   - it costs ~10 float comparisons per reagent with zero allocation, so it
 *     is safe to run on every MediaPipe frame.
 */
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { CARRY_Z, DROP_BOX, PICK_BOXES, clampCarry, clientToNdc } from './layout'

/** Scratch objects — reused so a 60 Hz hit-test allocates nothing. */
const _ndc = new Vector2()
const _ray = new Raycaster()
const _hit = new Vector3()

/** The invisible plane carried objects slide along. Normal faces the camera. */
const CARRY_PLANE = new Plane(new Vector3(0, 0, 1), -CARRY_Z)

/**
 * A hit-tester bound to one canvas + camera.
 *
 * Created once by the 3D scene and published to App.jsx through a ref, so the
 * state machine never imports three.js and the 2D fallback keeps working with
 * no three.js in the bundle path it uses.
 */
export function createHitTester(getCamera, getRect) {
  /** Aim the shared raycaster at a client-space pixel. @returns {boolean} ok */
  const aim = (x, y) => {
    const camera = getCamera()
    const rect = getRect()
    if (!camera || !rect || rect.width === 0) return false
    clientToNdc(x, y, rect, _ndc)
    _ray.setFromCamera(_ndc, camera)
    return true
  }

  return {
    /**
     * Which reagent is under the cursor?
     *
     * When pick volumes overlap on screen (they do at the shelf edges) the
     * NEAREST one along the ray wins, which is what the user expects.
     *
     * @returns {string|null} chemical id
     */
    chemicalAt(x, y) {
      if (!aim(x, y)) return null
      let best = null
      let bestDist = Infinity
      for (const { id, box } of PICK_BOXES) {
        const point = _ray.ray.intersectBox(box, _hit)
        if (!point) continue
        const d = point.distanceToSquared(_ray.ray.origin)
        if (d < bestDist) {
          bestDist = d
          best = id
        }
      }
      return best
    },

    /** Is the cursor pointing into the volume above the beaker? */
    overDropZone(x, y) {
      if (!aim(x, y)) return false
      // Two tests, either of which counts:
      //  1. the ray passes through the drop volume (looking at the beaker);
      //  2. the carried object itself — which lives on the carry plane — is
      //     inside the volume's x/y footprint. (2) is what actually matters
      //     when an object is held, because that is the thing being dropped.
      if (_ray.ray.intersectBox(DROP_BOX, _hit)) return true
      const onPlane = _ray.ray.intersectPlane(CARRY_PLANE, _hit)
      if (!onPlane) return false
      return (
        onPlane.x >= DROP_BOX.min.x &&
        onPlane.x <= DROP_BOX.max.x &&
        onPlane.y >= DROP_BOX.min.y &&
        onPlane.y <= DROP_BOX.max.y
      )
    },

    /**
     * World position for a carried reagent: the cursor ray projected onto the
     * fixed carry plane, then clamped to the reachable volume.
     *
     * @param {Vector3} out  written in place to avoid per-frame allocation
     * @returns {Vector3|null}
     */
    carryPoint(x, y, out) {
      if (!aim(x, y)) return null
      const p = _ray.ray.intersectPlane(CARRY_PLANE, out ?? _hit)
      return p ? clampCarry(p) : null
    },
  }
}

/**
 * The hit-tester used when the 3D canvas is not mounted or not ready.
 * Returning "nothing is here" is always safe: the state machine simply
 * reports an empty hover and refuses to grab.
 */
export const NULL_HIT_TESTER = {
  chemicalAt: () => null,
  overDropZone: () => false,
  carryPoint: () => null,
}
