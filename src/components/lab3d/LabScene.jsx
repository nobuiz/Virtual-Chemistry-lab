import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import Beaker from './Beaker'
import Bottle from './Bottle'
import CarriedReagent from './CarriedReagent'
import LabRoom from './LabRoom'
import Lighting from './Lighting'
import SolidSample from './SolidSample'
import { CHEMICALS_BY_ID } from '../../data/chemicals'
import { BENCH, BENCH_CENTER_Z, CAMERA, SLOT_LIST } from '../../lib/lab3d/layout'
import { MAT, UNIT_BOX, UNIT_CYL_CAPPED, UNIT_PLANE, labelMaterial } from '../../lib/lab3d/resources'

/**
 * Everything inside the <Canvas>.
 *
 * Split out from Lab3D so that it can use the r3f hooks (`useThree`,
 * `useFrame`), which are only valid inside the Canvas subtree.
 */

/** A reagent standing in its shelf slot. Hidden while it is being carried. */
function ShelfItem({ slot, hovered, carried }) {
  const chemical = CHEMICALS_BY_ID[slot.id]
  const ref = useRef(null)
  const lift = useRef(0)

  // Hovering nudges the item forward and up a few millimetres. It is a very
  // small motion, but it is the thing that makes the shelf feel touchable.
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const k = 1 - Math.exp(-14 * Math.min(dt, 0.1))
    lift.current += ((hovered ? 1 : 0) - lift.current) * k
    g.position.y = slot.y + lift.current * 0.014
    g.position.z = slot.z + lift.current * 0.018
  })

  if (!chemical) return null

  return (
    <group ref={ref} position={[slot.x, slot.y, slot.z]} visible={!carried}>
      {slot.kind === 'liquid' ? (
        <Bottle chemical={chemical} highlight={hovered ? 1 : 0} />
      ) : (
        <SolidSample chemical={chemical} highlight={hovered ? 1 : 0} />
      )}
    </group>
  )
}

/**
 * Publishes the live camera + canvas to the parent via a ref, so the
 * hit-tester (which lives outside the Canvas, next to the state machine) can
 * raycast without the parent needing r3f hooks.
 *
 * Written in an effect rather than during render: the parent only reads it
 * from event handlers and useFrame, both of which run after commit.
 */
function CameraBridge({ viewRef }) {
  const { camera, gl } = useThree()
  useEffect(() => {
    viewRef.current = { camera, canvas: gl.domElement }
    return () => {
      viewRef.current = null
    }
  }, [camera, gl, viewRef])
  return null
}

/** Static dressing on the bench. Pure decoration — nothing is interactive. */
function BenchProps() {
  return (
    <group>
      {/* notebook, open, to the left of the beaker */}
      <group position={[-0.72, BENCH.top, BENCH_CENTER_Z + 0.08]} rotation={[0, 0.3, 0]}>
        <mesh
          position={[0, 0.006, 0]}
          scale={[0.3, 0.012, 0.21]}
          geometry={UNIT_BOX}
          material={MAT.label}
          receiveShadow
          castShadow
        />
        <mesh
          position={[0, 0.013, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.27, 0.18, 1]}
          geometry={UNIT_PLANE}
          material={labelMaterial('LAB NOTEBOOK', 'observations', {
            width: 320,
            height: 200,
            bg: '#f4f7fa',
          })}
        />
      </group>

      {/* a spare test-tube rack on the right */}
      <group position={[0.78, BENCH.top, BENCH_CENTER_Z + 0.02]} rotation={[0, -0.22, 0]}>
        <mesh
          position={[0, 0.012, 0]}
          scale={[0.26, 0.024, 0.09]}
          geometry={UNIT_BOX}
          material={MAT.shelfPlank}
          receiveShadow
          castShadow
        />
        {[-0.085, -0.028, 0.028, 0.085].map((x) => (
          <mesh
            key={x}
            position={[x, 0.07, 0]}
            scale={[0.022, 0.1, 0.022]}
            geometry={UNIT_CYL_CAPPED}
            material={MAT.glassThin}
            castShadow
          />
        ))}
      </group>

      {/* a stirring rod resting across the bench */}
      <mesh
        position={[0.3, BENCH.top + 0.004, BENCH_CENTER_Z + 0.2]}
        rotation={[0, 0.5, Math.PI / 2]}
        scale={[0.007, 0.22, 0.007]}
        geometry={UNIT_CYL_CAPPED}
        material={MAT.glassThin}
        castShadow
      />

      {/* wall-mounted readout above the shelves, pure set dressing */}
      <group position={[0, 2.1, -1.6]}>
        <mesh scale={[0.78, 0.3, 0.04]} geometry={UNIT_BOX} material={MAT.darkSteel} />
        <mesh position={[0, 0, 0.025]} scale={[0.7, 0.24, 1]} geometry={UNIT_PLANE} material={MAT.screen} />
        <mesh
          position={[0, 0, 0.027]}
          scale={[0.66, 0.2, 1]}
          geometry={UNIT_PLANE}
          material={labelMaterial('GESTURELAB', 'simulation · educational', {
            width: 384,
            height: 128,
            bg: '#0d2a33',
            fg: '#8ff0ff',
            accent: '#4fb7c9',
          })}
        />
      </group>
    </group>
  )
}

export default function LabScene({
  viewRef,
  carryRef,
  pourRef,
  hoveredId,
  carriedId,
  fillLevel,
  liquidColor,
  effects,
  solids,
  dropActive,
}) {
  const carried = carriedId ? CHEMICALS_BY_ID[carriedId] : null

  return (
    <>
      <CameraBridge viewRef={viewRef} />
      <Lighting />
      <fog attach="fog" args={['#262b35', 4.5, 11]} />

      <LabRoom />
      <BenchProps />

      {SLOT_LIST.map((slot) => (
        <ShelfItem
          key={slot.id}
          slot={slot}
          hovered={hoveredId === slot.id}
          carried={carriedId === slot.id}
        />
      ))}

      <Beaker
        fillLevel={fillLevel}
        liquidColor={liquidColor}
        effects={effects}
        solids={solids}
        dropActive={dropActive}
      />

      {carried && (
        <CarriedReagent
          key={carried.id}
          chemical={carried}
          carryRef={carryRef}
          pourRef={pourRef}
        />
      )}
    </>
  )
}

export { CAMERA }
