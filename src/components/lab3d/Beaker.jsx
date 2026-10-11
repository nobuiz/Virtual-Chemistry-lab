import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color } from 'three'
import GasRelease from './GasRelease'
import { BEAKER } from '../../lib/lab3d/layout'
import {
  BUBBLE_GEO,
  CHUNK_GEO,
  MAT,
  UNIT_BOX,
  UNIT_CYL,
  UNIT_CYL_CAPPED,
  UNIT_PLANE,
  labelMaterial,
  metalMaterial,
} from '../../lib/lab3d/resources'

/**
 * The 3D beaker — the focal point of the lab.
 *
 * It is driven by exactly the same values the 2D BeakerCanvas consumes
 * (`fillLevel`, `liquidColor`, `effects.bubbleRate`, `effects.thermal`,
 * `effects.precipitate`), so the chemistry engine stays the single source of
 * truth and the two renderers can never disagree about an outcome.
 *
 * All animation happens inside `useFrame` by mutating object3D transforms and
 * material colours directly. Nothing here calls `setState`, so a vigorous
 * reaction costs zero React renders.
 */

const BUBBLE_COUNT = 26

/** Deterministic per-bubble constants: lane, size and phase offset. */
function makeBubbles() {
  return Array.from({ length: BUBBLE_COUNT }, (_, i) => {
    const a = (i / BUBBLE_COUNT) * Math.PI * 2 + i * 0.37
    const rr = 0.25 + ((i * 7) % 10) / 14 // 0.25..0.96 of the radius
    return {
      x: Math.cos(a) * BEAKER.radius * 0.78 * rr,
      z: Math.sin(a) * BEAKER.radius * 0.78 * rr,
      scale: 0.0035 + ((i * 13) % 7) * 0.0011,
      phase: (i * 0.618) % 1,
      speed: 0.55 + ((i * 11) % 9) * 0.045,
    }
  })
}

/** Settled solid chunks at the bottom of the beaker, arranged in a ring. */
function Sediment({ chemicals }) {
  return chemicals.map((c, ci) =>
    Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 + ci * 1.1
      const r = BEAKER.radius * (0.22 + (i % 3) * 0.17)
      return (
        <mesh
          key={`${c.slot ?? c.id}-${i}`}
          position={[Math.cos(a) * r, 0.009 + (i % 2) * 0.004, Math.sin(a) * r]}
          rotation={[a, a * 1.7, 0.3]}
          scale={0.0075 + (i % 3) * 0.0022}
          geometry={CHUNK_GEO}
          material={metalMaterial(c.id, c.color)}
          castShadow
        />
      )
    }),
  )
}

export default function Beaker({
  fillLevel = 0,
  liquidColor = '#2a4a7a',
  effects = null,
  solids = [],
  dropActive = false,
}) {
  const liquidRef = useRef(null)
  const surfaceRef = useRef(null)
  const bubblesRef = useRef(null)
  const glowRef = useRef(null)
  const haloRef = useRef(null)

  const bubbles = useMemo(() => makeBubbles(), [])
  const target = useMemo(() => new Color(liquidColor), [liquidColor])

  /** Smoothed fill so a pour raises the level instead of snapping. */
  const shown = useRef(0)

  const bubbleRate = effects?.bubbleRate ?? 0
  const thermal = effects?.thermal ?? 0
  const precipitate = effects?.precipitate ?? null

  const inner = BEAKER.radius * 0.93
  const maxLiquid = BEAKER.height * 0.9

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    // clamp dt: a backgrounded tab returns a huge delta that would snap things
    const k = 1 - Math.exp(-6 * Math.min(dt, 0.1))

    /* ---- liquid level + colour ---- */
    shown.current += (fillLevel - shown.current) * k
    const h = Math.max(0.0008, shown.current * maxLiquid)

    const liquid = liquidRef.current
    if (liquid) {
      liquid.scale.set(inner * 2, h, inner * 2)
      liquid.position.y = h / 2
      liquid.visible = shown.current > 0.004
      liquid.material.color.lerp(target, k)
    }
    // the meniscus disc tracks the top of the column
    const surface = surfaceRef.current
    if (surface) {
      surface.position.y = h + 0.0006
      surface.visible = shown.current > 0.004
      // a gentle ripple while bubbling, so the surface is never dead-still
      const wobble = bubbleRate > 0 ? 1 + Math.sin(t * 7) * 0.012 : 1
      surface.scale.set(inner * 1.94 * wobble, inner * 1.94 * wobble, 1)
      surface.material.color.lerp(target, k)
    }

    /* ---- bubbles ---- */
    const group = bubblesRef.current
    if (group) {
      const active = bubbleRate > 0 && shown.current > 0.02
      group.visible = active
      if (active) {
        // How many of the pool are in play scales with the reaction vigour,
        // so Mg + acid visibly fizzes harder than Fe + acid.
        const live = Math.min(BUBBLE_COUNT, Math.ceil((bubbleRate / 24) * BUBBLE_COUNT))
        const scale = effects?.bubbleScale ?? 1
        for (let i = 0; i < BUBBLE_COUNT; i += 1) {
          const m = group.children[i]
          if (!m) continue
          if (i >= live) {
            m.visible = false
            continue
          }
          const b = bubbles[i]
          // rise fraction 0..1, wrapping — a cheap stateless particle system
          const u = (t * b.speed * (0.4 + bubbleRate / 30) + b.phase) % 1
          m.visible = true
          m.position.set(
            b.x + Math.sin(t * 3 + i) * 0.0025,
            0.004 + u * Math.max(h - 0.006, 0.001),
            b.z + Math.cos(t * 2.6 + i) * 0.0025,
          )
          // grow as they rise (decompression) and fade out at the surface
          m.scale.setScalar(b.scale * scale * (0.6 + u * 0.7))
          m.material.opacity = 0.75 * (1 - u * 0.35)
        }
      }
    }

    /* ---- thermal glow ---- */
    const glow = glowRef.current
    if (glow) {
      glow.visible = thermal > 0.01
      if (glow.visible) {
        const pulse = 0.55 + Math.sin(t * 2.4) * 0.18
        glow.material.opacity = thermal * 0.3 * pulse
        glow.scale.setScalar(BEAKER.radius * (1.6 + thermal * 0.5) + Math.sin(t * 2.4) * 0.004)
      }
    }

    /* ---- drop-zone halo ---- */
    const halo = haloRef.current
    if (halo) {
      const want = dropActive ? 0.5 : 0
      halo.material.opacity += (want - halo.material.opacity) * k
      halo.visible = halo.material.opacity > 0.01
    }
  })

  return (
    <group position={[BEAKER.x, BEAKER.y, BEAKER.z]}>
      <GasRelease effects={effects} />
      {/* --------------------------- the liquid --------------------------- */}
      <mesh ref={liquidRef} geometry={UNIT_CYL_CAPPED} renderOrder={0}>
        <meshStandardMaterial
          color={liquidColor}
          transparent
          opacity={0.84}
          roughness={0.18}
          metalness={0.05}
        />
      </mesh>
      {/* meniscus / surface disc — brighter than the body, sells the liquid */}
      <mesh ref={surfaceRef} rotation={[-Math.PI / 2, 0, 0]} geometry={UNIT_PLANE} renderOrder={1}>
        <meshStandardMaterial
          color={liquidColor}
          transparent
          opacity={0.95}
          roughness={0.08}
          metalness={0.25}
        />
      </mesh>

      {/* ---------------------------- bubbles ----------------------------- */}
      <group ref={bubblesRef} renderOrder={2}>
        {bubbles.map((b, i) => (
          <mesh key={i} geometry={BUBBLE_GEO}>
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.4}
              roughness={0.1}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* ------------------------- settled solids ------------------------- */}
      <Sediment chemicals={solids} />

      {/* ------------------------- precipitate ---------------------------- */}
      {precipitate && (
        <mesh
          position={[0, 0.013, 0]}
          scale={[inner * 1.7, 0.016, inner * 1.7]}
          geometry={UNIT_CYL_CAPPED}
        >
          <meshStandardMaterial
            color={precipitate}
            roughness={0.95}
            metalness={0}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* --------------------------- thermal glow -------------------------- */}
      <mesh
        ref={glowRef}
        position={[0, BEAKER.height * 0.4, 0]}
        geometry={BUBBLE_GEO}
        renderOrder={5}
      >
        <meshBasicMaterial
          color="#ff8a3d"
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ------------------------- the glass vessel ------------------------ */}
      {/* open-ended wall so you can see in through the top */}
      <mesh
        position={[0, BEAKER.height / 2, 0]}
        scale={[BEAKER.radius * 2, BEAKER.height, BEAKER.radius * 2]}
        geometry={UNIT_CYL}
        material={MAT.glass}
        renderOrder={6}
        castShadow
      />
      {/* thick base */}
      <mesh
        position={[0, 0.004, 0]}
        scale={[BEAKER.radius * 2, 0.008, BEAKER.radius * 2]}
        geometry={UNIT_CYL_CAPPED}
        material={MAT.glass}
        renderOrder={6}
        receiveShadow
      />
      {/* rim */}
      <mesh
        position={[0, BEAKER.height, 0]}
        scale={[BEAKER.radius * 2.08, 0.006, BEAKER.radius * 2.08]}
        geometry={UNIT_CYL_CAPPED}
        material={MAT.glassThin}
        renderOrder={6}
      />
      {/* graduation marks — four ticks up the front face */}
      {[0.25, 0.45, 0.65, 0.85].map((f) => (
        <mesh
          key={f}
          position={[BEAKER.radius * 0.45, BEAKER.height * f, BEAKER.radius * 0.95]}
          scale={[0.018, 0.0016, 1]}
          geometry={UNIT_PLANE}
          renderOrder={7}
        >
          <meshBasicMaterial color="#e8f6ff" transparent opacity={0.5} toneMapped={false} />
        </mesh>
      ))}
      {/* etched capacity label */}
      <mesh
        position={[-BEAKER.radius * 0.3, BEAKER.height * 0.22, BEAKER.radius * 0.95]}
        scale={[0.05, 0.022, 1]}
        geometry={UNIT_PLANE}
        material={labelMaterial('250 mL', '', { width: 192, height: 84, bg: '#dff0fa' })}
        renderOrder={7}
      />

      {/* --------------------- drop-zone halo (feedback) -------------------- */}
      <mesh
        ref={haloRef}
        position={[0, 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[BEAKER.radius * 3.4, BEAKER.radius * 3.4, 1]}
        geometry={UNIT_PLANE}
        renderOrder={8}
      >
        <meshBasicMaterial
          color="#22e3ff"
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* a mat under the beaker, so it is not floating on bare steel */}
      <mesh
        position={[0, -0.002, 0]}
        scale={[BEAKER.radius * 3.6, 0.004, BEAKER.radius * 3.6]}
        geometry={UNIT_BOX}
        material={MAT.paperTray}
        receiveShadow
      />
    </group>
  )
}
