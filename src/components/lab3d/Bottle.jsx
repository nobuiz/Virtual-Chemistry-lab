import { BOTTLE_SIZE } from '../../lib/lab3d/layout'
import {
  MAT,
  UNIT_BOX,
  UNIT_CYL_CAPPED,
  UNIT_PLANE,
  bottleGlassMaterial,
  bottleLiquidMaterial,
  capMaterial,
  labelMaterial,
} from '../../lib/lab3d/resources'

/**
 * A reagent bottle: translucent body, visible liquid inside, shoulder, neck,
 * screw cap and a printed front label.
 *
 * Draw order matters for correctly-blended glass. The liquid is drawn first
 * (it is opaque-ish and writes depth), then the glass shell on top with
 * `depthWrite: false` via its shared material, so you genuinely see the
 * liquid *through* the wall rather than the wall occluding it.
 *
 * The liquid column shrinks as the bottle is poured, which is the only
 * per-frame-variable part of this component.
 */
export default function Bottle({ chemical, fill, highlight = 0 }) {
  const spec = chemical.bottle ?? {}
  const glass = bottleGlassMaterial(chemical.id, spec.glass ?? '#c3d4dd')
  const liquid = bottleLiquidMaterial(chemical.id, chemical.liquidTint ?? chemical.color)
  const cap = capMaterial(chemical.id, spec.cap ?? '#2b3340')
  const label = labelMaterial(chemical.symbol, spec.hazard ?? chemical.category, {
    width: 256,
    height: 150,
    border: chemical.color,
  })

  const bodyH = BOTTLE_SIZE.hy * 1.45 // straight-walled section
  const r = BOTTLE_SIZE.hx
  const level = fill ?? spec.fill ?? 0.75
  const liquidH = Math.max(0.001, bodyH * 0.86 * Math.min(Math.max(level, 0), 1))

  return (
    <group>
      {/* ---- liquid (drawn before the glass so it shows through) ---- */}
      <mesh
        position={[0, 0.012 + liquidH / 2, 0]}
        scale={[r * 1.78, liquidH, r * 1.78]}
        geometry={UNIT_CYL_CAPPED}
        material={liquid}
        renderOrder={0}
      />

      {/* ---- glass body ---- */}
      <mesh
        position={[0, 0.008 + bodyH / 2, 0]}
        scale={[r * 1.9, bodyH, r * 1.9]}
        geometry={UNIT_CYL_CAPPED}
        material={glass}
        renderOrder={2}
        castShadow
      />
      {/* base puck — a touch wider, reads as a moulded foot */}
      <mesh
        position={[0, 0.006, 0]}
        scale={[r * 2.0, 0.012, r * 2.0]}
        geometry={UNIT_CYL_CAPPED}
        material={glass}
        renderOrder={2}
      />
      {/* shoulder taper */}
      <mesh
        position={[0, 0.008 + bodyH + 0.018, 0]}
        scale={[r * 1.55, 0.036, r * 1.55]}
        geometry={UNIT_CYL_CAPPED}
        material={glass}
        renderOrder={2}
      />
      {/* neck */}
      <mesh
        position={[0, 0.008 + bodyH + 0.05, 0]}
        scale={[r * 0.78, 0.03, r * 0.78]}
        geometry={UNIT_CYL_CAPPED}
        material={glass}
        renderOrder={2}
      />

      {/* ---- screw cap ---- */}
      <mesh
        position={[0, 0.008 + bodyH + 0.078, 0]}
        scale={[r * 0.98, 0.03, r * 0.98]}
        geometry={UNIT_CYL_CAPPED}
        material={cap}
        castShadow
      />
      {/* knurled ring under the cap crown */}
      <mesh
        position={[0, 0.008 + bodyH + 0.064, 0]}
        scale={[r * 1.04, 0.008, r * 1.04]}
        geometry={UNIT_CYL_CAPPED}
        material={MAT.rubber}
      />

      {/* ---- front label ---- */}
      <mesh
        position={[0, 0.012 + bodyH * 0.52, r * 0.96]}
        scale={[r * 1.5, bodyH * 0.6, 1]}
        geometry={UNIT_PLANE}
        material={label}
        renderOrder={3}
      />
      {/* hazard stripe along the bottom of the label area */}
      <mesh
        position={[0, 0.018, r * 0.97]}
        scale={[r * 1.6, 0.008, 1]}
        geometry={UNIT_PLANE}
      >
        <meshBasicMaterial color={chemical.color} toneMapped={false} />
      </mesh>

      {/* ---- hover / carry glow ---- */}
      {highlight > 0 && (
        <mesh
          position={[0, BOTTLE_SIZE.hy, 0]}
          scale={[r * 3.0, BOTTLE_SIZE.hy * 2.5, r * 3.0]}
          geometry={UNIT_BOX}
          renderOrder={4}
        >
          <meshBasicMaterial
            color="#22e3ff"
            transparent
            opacity={0.12 * highlight}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
