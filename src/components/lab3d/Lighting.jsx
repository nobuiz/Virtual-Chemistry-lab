import { BENCH, BENCH_CENTER_Z, ROOM, SHELF } from '../../lib/lab3d/layout'
import { MAT, UNIT_BOX } from '../../lib/lab3d/resources'

/**
 * Lighting rig.
 *
 * Deliberately conservative: ONE shadow-casting light, a small 1024² map, and
 * a tight shadow camera around the bench. Shadow rendering is the single most
 * expensive thing in a scene like this, and every extra caster re-renders the
 * whole depth pass. Fill and rim lights are shadow-free, which costs almost
 * nothing and does most of the visual work anyway.
 */
export default function Lighting() {
  return (
    <group>
      {/* overall ambient so nothing is ever pure black */}
      <ambientLight intensity={0.55} color="#c8d8ea" />

      {/* soft sky/floor bounce — gives the room its cool-lab feel for free */}
      <hemisphereLight args={['#dceaff', '#2a2f3b', 0.65]} />

      {/* KEY: the ceiling fluorescent above the bench. The only caster. */}
      <directionalLight
        position={[1.6, 3.4, 1.5]}
        intensity={1.35}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0012}
        shadow-normalBias={0.02}
        shadow-camera-left={-2.2}
        shadow-camera-right={2.2}
        shadow-camera-top={2.4}
        shadow-camera-bottom={-0.6}
        shadow-camera-near={0.5}
        shadow-camera-far={8}
      />

      {/* FILL from the left, shadow-free: lifts the shadow side of the glass */}
      <directionalLight position={[-2.4, 2.2, 1.2]} intensity={0.4} color="#9fc6ff" />

      {/* RIM from behind the shelves: separates bottles from the back wall */}
      <directionalLight position={[0, 2.0, -2.6]} intensity={0.3} color="#7fd8ff" />

      {/* practical: a warm pool right on the beaker so the focal point reads */}
      <pointLight position={[0, 1.55, 0.1]} intensity={0.6} distance={1.9} decay={2} color="#cfe8ff" />

      {/* ------------- visible ceiling fittings that justify the key ------------- */}
      {[-1.1, 1.1].map((x) => (
        <group key={x} position={[x, ROOM.height - 0.1, BENCH_CENTER_Z + 0.3]}>
          <mesh scale={[1.5, 0.06, 0.18]} geometry={UNIT_BOX} material={MAT.darkSteel} />
          {/* emissive tube — unlit material, so it glows without extra cost */}
          <mesh position={[0, -0.034, 0]} scale={[1.42, 0.012, 0.13]} geometry={UNIT_BOX}>
            <meshBasicMaterial color="#eaf6ff" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* under-shelf strip light, explaining the glow on the bottles */}
      <mesh
        position={[0, SHELF.z === 0 ? 1.18 : 1.175, SHELF.z + 0.1]}
        scale={[2.3, 0.01, 0.06]}
        geometry={UNIT_BOX}
      >
        <meshBasicMaterial color="#bfe9ff" toneMapped={false} />
      </mesh>
      <pointLight
        position={[0, 1.13, SHELF.z + 0.22]}
        intensity={0.35}
        distance={1.3}
        decay={2}
        color="#bfe9ff"
      />

      {/* bench-edge bounce — keeps the front lip of the worktop from going flat */}
      <pointLight
        position={[0, BENCH.top + 0.35, BENCH.frontZ + 0.4]}
        intensity={0.25}
        distance={1.6}
        decay={2}
        color="#ffffff"
      />
    </group>
  )
}
