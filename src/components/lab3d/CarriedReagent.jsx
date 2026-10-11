import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import Bottle from './Bottle'
import SolidSample from './SolidSample'
import { BEAKER, BEAKER_MOUTH, BOTTLE_SIZE } from '../../lib/lab3d/layout'
import { UNIT_CYL_CAPPED } from '../../lib/lab3d/resources'

/**
 * The reagent currently in the user's hand.
 *
 * Position comes from a REF (`carryRef`), written by the interaction bridge on
 * every pointer/hand frame, and is consumed here inside `useFrame`. React is
 * never re-rendered while dragging — only when the identity of the held item
 * changes — which is what keeps the drag at display framerate even while
 * MediaPipe is saturating the main thread.
 *
 * Bottles additionally run the pour choreography:
 *   1. rise and translate toward the beaker mouth,
 *   2. tilt about the lip until the neck points into the vessel,
 *   3. emit a liquid stream while the tilt is held.
 * `pourRef.tiltProgress` is the same 0..1 clock the 2D renderer uses, so the
 * two views stay in lockstep with App.jsx's atomic pour transaction.
 */

const _goal = new Vector3()

export default function CarriedReagent({ chemical, carryRef, pourRef }) {
  const group = useRef(null)
  const inner = useRef(null)
  const stream = useRef(null)
  const smoothed = useRef(new Vector3(0, 1.4, -0.44))
  const started = useRef(false)

  const isLiquid = chemical.form === 'liquid'

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const k = 1 - Math.exp(-18 * Math.min(dt, 0.1))
    const t = state.clock.elapsedTime
    const pour = pourRef?.current
    const tilt = isLiquid ? (pour?.tiltProgress ?? 0) : 0

    /* ---- where should the object be? ---- */
    const c = carryRef.current
    _goal.set(c.x, c.y, c.z)

    // While pouring, the bottle leaves the cursor and commits to the beaker:
    // a real pour is a two-handed, deliberate act, and letting it keep
    // following a jittery hand would make the stream miss the vessel.
    if (tilt > 0) {
      _goal.lerp(
        { x: BEAKER_MOUTH.x - 0.1, y: BEAKER_MOUTH.y + 0.21, z: BEAKER_MOUTH.z + 0.04 },
        tilt,
      )
    }

    // On the first frame after a pick-up, snap rather than fly in from
    // wherever the previous object was released.
    if (!started.current) {
      smoothed.current.copy(_goal)
      started.current = true
    } else {
      smoothed.current.lerp(_goal, k)
    }
    g.position.copy(smoothed.current)

    /* ---- orientation ---- */
    const i = inner.current
    if (i) {
      if (isLiquid) {
        // tilt the bottle up to ~115 deg about z so the neck points down-right
        i.rotation.z = MathUtils.lerp(0.06, -2.0, tilt)
        i.rotation.y = 0.2
        // pivot about the bottle's shoulder, not its base, so it rotates
        // around the lip the way a hand-held bottle actually does
        i.position.y = -BOTTLE_SIZE.hy * tilt * 0.6
      } else {
        // a carried solid bobs and turns gently — reads as "held", not "stuck"
        i.rotation.y = t * 0.6
        i.rotation.x = Math.sin(t * 1.6) * 0.07
        i.position.y = Math.sin(t * 2.2) * 0.004
      }
    }

    /* ---- the pour stream ---- */
    const s = stream.current
    if (s) {
      // Only flow once the bottle is properly tipped; fade out as it rights.
      const flow = Math.min(1, Math.max(0, (tilt - 0.45) / 0.3)) * (1 - Math.max(0, tilt - 0.92) / 0.08)
      s.visible = flow > 0.02
      if (s.visible) {
        // stretch from the neck down to the liquid surface in the beaker
        const from = g.position.y - 0.02
        const len = Math.max(0.02, from - (BEAKER.y + BEAKER.height * 0.55))
        s.scale.set(0.012 * flow, len, 0.012 * flow)
        s.position.set(-0.03, -0.02 - len / 2, 0.01)
        s.material.opacity = 0.8 * flow
      }
    }
  })

  return (
    <group ref={group}>
      <group ref={inner}>
        {isLiquid ? (
          <Bottle chemical={chemical} highlight={1} />
        ) : (
          <SolidSample chemical={chemical} highlight={1} />
        )}
      </group>

      {/* liquid stream — a simple stretched cylinder reads perfectly at this
          scale and costs one draw call, where a particle system would cost
          hundreds for no legibility gain. */}
      {isLiquid && (
        <mesh ref={stream} geometry={UNIT_CYL_CAPPED} visible={false} renderOrder={9}>
          <meshStandardMaterial
            color={chemical.liquidTint ?? chemical.color}
            transparent
            opacity={0.8}
            roughness={0.15}
            emissive={chemical.liquidTint ?? chemical.color}
            emissiveIntensity={0.25}
          />
        </mesh>
      )}
    </group>
  )
}
