import { useMemo } from 'react'
import { SOLID_SIZE } from '../../lib/lab3d/layout'
import {
  CHUNK_GEO,
  MAT,
  UNIT_BOX,
  UNIT_CYL_CAPPED,
  UNIT_CYL_LOW,
  UNIT_PLANE,
  labelMaterial,
  metalMaterial,
} from '../../lib/lab3d/resources'

/**
 * A solid metal sample sitting on its labelled plinth.
 *
 * Each metal gets a recognisably DIFFERENT physical form, driven by the
 * `shape` field the chemical library already carries, so the shelf can be
 * read at a glance without relying on the text label:
 *
 *   ingot    Au — a cast bar
 *   block    Ag — a plain machined cube
 *   nugget   Cu — rounded, irregular lump
 *   shard    Fe — angular broken piece
 *   granules Zn — a small heap of pellets
 *   ribbon   Mg — a coiled strip
 */

/** Deterministic pseudo-random so the granule heap never shuffles on re-render. */
function rand(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function Sample({ shape, material }) {
  const granules = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: (rand(i + 1) - 0.5) * 0.085,
        z: (rand(i + 11) - 0.5) * 0.07,
        y: rand(i + 21) * 0.012,
        s: 0.014 + rand(i + 31) * 0.011,
        r: rand(i + 41) * Math.PI,
      })),
    [],
  )

  switch (shape) {
    case 'ingot':
      return (
        <mesh
          position={[0, 0.026, 0]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[0.15, 0.05, 0.1]}
          geometry={UNIT_CYL_CAPPED}
          material={material}
          castShadow
        />
      )
    case 'block':
      return (
        <mesh
          position={[0, 0.03, 0]}
          rotation={[0, 0.18, 0]}
          scale={[0.082, 0.06, 0.082]}
          geometry={UNIT_BOX}
          material={material}
          castShadow
        />
      )
    case 'nugget':
      return (
        <group position={[0, 0.03, 0]}>
          <mesh scale={[0.055, 0.042, 0.05]} geometry={CHUNK_GEO} material={material} castShadow />
          <mesh
            position={[0.04, -0.008, 0.018]}
            scale={[0.026, 0.022, 0.024]}
            geometry={CHUNK_GEO}
            material={material}
            castShadow
          />
        </group>
      )
    case 'shard':
      return (
        <group position={[0, 0.028, 0]}>
          <mesh
            rotation={[0.3, 0.6, 0.22]}
            scale={[0.075, 0.03, 0.05]}
            geometry={UNIT_BOX}
            material={material}
            castShadow
          />
          <mesh
            position={[-0.03, 0.016, -0.012]}
            rotation={[-0.2, 0.2, 0.5]}
            scale={[0.042, 0.026, 0.038]}
            geometry={UNIT_BOX}
            material={material}
            castShadow
          />
        </group>
      )
    case 'granules':
      return (
        <group position={[0, 0.012, 0]}>
          {granules.map((g, i) => (
            <mesh
              key={i}
              position={[g.x, g.y + g.s, g.z]}
              rotation={[g.r, g.r * 1.7, 0]}
              scale={g.s}
              geometry={CHUNK_GEO}
              material={material}
              castShadow
            />
          ))}
        </group>
      )
    case 'ribbon':
    default:
      return (
        <group position={[0, 0.024, 0]}>
          {/* a coil of thin strip */}
          <mesh
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.075, 0.016, 0.075]}
            geometry={UNIT_CYL_LOW}
            material={material}
            castShadow
          />
          <mesh
            position={[0.052, 0.004, 0.03]}
            rotation={[0, 0.5, 0.12]}
            scale={[0.07, 0.004, 0.014]}
            geometry={UNIT_BOX}
            material={material}
            castShadow
          />
        </group>
      )
  }
}

/**
 * The labelled metal block a sample stands on.
 * Shared geometry, per-chemical material only where the colour differs.
 */
export default function SolidSample({ chemical, highlight = 0 }) {
  const material = metalMaterial(chemical.id, chemical.color)
  const label = labelMaterial(chemical.symbol, chemical.name, { width: 256, height: 110 })

  return (
    <group>
      {/* plinth */}
      <mesh
        position={[0, 0.009, 0]}
        scale={[SOLID_SIZE.hx * 2, 0.018, SOLID_SIZE.hz * 2]}
        geometry={UNIT_BOX}
        material={MAT.darkSteel}
        receiveShadow
        castShadow
      />
      {/* label plate on the front face of the plinth */}
      <mesh
        position={[0, 0.011, SOLID_SIZE.hz + 0.002]}
        scale={[SOLID_SIZE.hx * 1.8, 0.017, 1]}
        geometry={UNIT_PLANE}
        material={label}
      />

      <group position={[0, 0.018, 0]}>
        <Sample shape={chemical.shape} material={material} />
      </group>

      {/* hover / carry glow — opacity is driven, the mesh is never remounted */}
      {highlight > 0 && (
        <mesh
          position={[0, SOLID_SIZE.hy, 0]}
          scale={[SOLID_SIZE.hx * 2.5, SOLID_SIZE.hy * 2.8, SOLID_SIZE.hz * 2.5]}
          geometry={UNIT_BOX}
        >
          <meshBasicMaterial
            color="#22e3ff"
            transparent
            opacity={0.1 * highlight}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
