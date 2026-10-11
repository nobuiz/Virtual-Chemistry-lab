import { BENCH, BENCH_CENTER_Z, ROOM, SHELF, SHELF_Y } from '../../lib/lab3d/layout'
import { MAT, UNIT_BOX, UNIT_CYL_CAPPED } from '../../lib/lab3d/resources'

/**
 * Static architecture: floor, walls, ceiling, workbench and wall shelving.
 *
 * Every mesh here reuses the shared unit geometries and shared materials and
 * is positioned/scaled rather than re-authored, so the whole room costs a
 * handful of draw calls and zero per-frame work. Nothing in this file
 * animates or re-renders after mount.
 */

/** Convenience: a shared-geometry box placed by centre + size. */
function Box({ position, size, material, rotation, castShadow, receiveShadow }) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={size}
      geometry={UNIT_BOX}
      material={material}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  )
}

function Shelf({ y }) {
  const bracketY = y - 0.09
  return (
    <group>
      {/* plank */}
      <Box
        position={[0, y - SHELF.plank / 2, SHELF.z]}
        size={[SHELF.width, SHELF.plank, SHELF.depth]}
        material={MAT.shelfPlank}
        receiveShadow
        castShadow
      />
      {/* front lip — stops samples looking like they float off the edge */}
      <Box
        position={[0, y + 0.012, SHELF.z + SHELF.depth / 2 - 0.012]}
        size={[SHELF.width, 0.024, 0.016]}
        material={MAT.shelfBracket}
      />
      {/* support brackets */}
      {[-1, 0, 1].map((s) => (
        <Box
          key={s}
          position={[s * (SHELF.width / 2 - 0.16), bracketY, SHELF.z - SHELF.depth / 2 + 0.06]}
          size={[0.035, 0.14, 0.2]}
          material={MAT.shelfBracket}
        />
      ))}
    </group>
  )
}

export default function LabRoom() {
  return (
    <group>
      {/* ------------------------------ shell ------------------------------ */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        scale={[ROOM.width, ROOM.depth, 1]}
        geometry={UNIT_BOX}
        material={MAT.floor}
        receiveShadow
      />
      {/* back wall */}
      <Box
        position={[0, ROOM.height / 2, ROOM.backZ - 0.05]}
        size={[ROOM.width, ROOM.height, 0.1]}
        material={MAT.wall}
        receiveShadow
      />
      {/* tiled dado on the back wall — a cheap way to read as "laboratory" */}
      <Box
        position={[0, 1.02, ROOM.backZ + 0.015]}
        size={[ROOM.width, 2.0, 0.02]}
        material={MAT.wallTile}
      />
      {/* side walls, kept thin and shadow-free: they only frame the view */}
      <Box
        position={[-ROOM.width / 2, ROOM.height / 2, ROOM.backZ + ROOM.depth / 2]}
        size={[0.08, ROOM.height, ROOM.depth]}
        material={MAT.wall}
      />
      <Box
        position={[ROOM.width / 2, ROOM.height / 2, ROOM.backZ + ROOM.depth / 2]}
        size={[0.08, ROOM.height, ROOM.depth]}
        material={MAT.wall}
      />
      <Box
        position={[0, ROOM.height, ROOM.backZ + ROOM.depth / 2]}
        size={[ROOM.width, 0.08, ROOM.depth]}
        material={MAT.ceiling}
      />

      {/* --------------------------- the workbench -------------------------- */}
      {/* worktop */}
      <Box
        position={[0, BENCH.top - BENCH.thickness / 2, BENCH_CENTER_Z]}
        size={[BENCH.width, BENCH.thickness, BENCH.depth]}
        material={MAT.benchTop}
        receiveShadow
        castShadow
      />
      {/* bright front edge strip — catches the key light and defines the bench */}
      <Box
        position={[0, BENCH.top - BENCH.thickness / 2, BENCH.frontZ + 0.008]}
        size={[BENCH.width, BENCH.thickness + 0.012, 0.016]}
        material={MAT.benchEdge}
      />
      {/* cabinet carcass under the top */}
      <Box
        position={[0, (BENCH.top - BENCH.thickness) / 2, BENCH_CENTER_Z - 0.03]}
        size={[BENCH.width - 0.12, BENCH.top - BENCH.thickness, BENCH.depth - 0.1]}
        material={MAT.cabinet}
      />
      {/* drawer fronts */}
      {[0.3, 0.56, 0.82].map((y) => (
        <Box
          key={y}
          position={[-0.82, y, BENCH.frontZ - 0.055]}
          size={[1.1, 0.2, 0.03]}
          material={MAT.darkSteel}
        />
      ))}
      {[0.3, 0.56, 0.82].map((y) => (
        <Box
          key={`h${y}`}
          position={[-0.82, y, BENCH.frontZ - 0.03]}
          size={[0.34, 0.016, 0.02]}
          material={MAT.steel}
        />
      ))}
      {/* cupboard doors on the right half */}
      <Box
        position={[0.82, 0.52, BENCH.frontZ - 0.055]}
        size={[1.1, 0.78, 0.03]}
        material={MAT.darkSteel}
      />
      <Box
        position={[0.82, 0.52, BENCH.frontZ - 0.03]}
        size={[0.016, 0.22, 0.02]}
        material={MAT.steel}
      />

      {/* ---------------------------- wall shelving -------------------------- */}
      <Shelf y={SHELF_Y.liquids} />
      <Shelf y={SHELF_Y.solids} />
      {/* vertical uprights tying the two shelves to the wall */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (SHELF.width / 2 + 0.03), 1.42, SHELF.z - 0.1]}
          scale={[0.03, 0.78, 0.03]}
          geometry={UNIT_CYL_CAPPED}
          material={MAT.shelfBracket}
        />
      ))}
    </group>
  )
}
