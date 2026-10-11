import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { PerspectiveCamera, Vector3 } from 'three'

const server = await createServer({ server: { middlewareMode: true } })
let checks = 0
const verify = (condition) => { assert.ok(condition); checks++ }
try {
  const layout = await server.ssrLoadModule('/src/lib/lab3d/layout.js')
  const { createHitTester } = await server.ssrLoadModule('/src/lib/lab3d/raycast.js')
  const { evaluateExperiment, ALL_REACTIONS, OUTCOME } = await server.ssrLoadModule('/src/data/reactions.js')
  const { CHEMICALS, getChemical } = await server.ssrLoadModule('/src/data/chemicals.js')
  const camera = new PerspectiveCamera(layout.CAMERA.fov, 1600 / 800, 0.1, 30)
  camera.position.set(...layout.CAMERA.position)
  camera.lookAt(...layout.CAMERA.target)
  camera.updateMatrixWorld()
  const rect = { left: 0, top: 0, width: 1600, height: 800 }
  const hit = createHitTester(() => camera, () => rect)
  const screen = (v) => { const p = v.clone().project(camera); return [(p.x + 1) * 800, (1 - p.y) * 400] }
  for (const slot of layout.SLOT_LIST) {
    const size = slot.kind === 'liquid' ? layout.BOTTLE_SIZE : layout.SOLID_SIZE
    verify(hit.chemicalAt(...screen(new Vector3(slot.x, slot.y + size.hy, slot.z))) === slot.id)
  }
  verify(hit.overDropZone(...screen(layout.BEAKER_MOUTH)))
  verify(hit.chemicalAt(-1000, -1000) === null)
  verify(evaluateExperiment([getChemical('zn'), getChemical('hcl')]).outcome === OUTCOME.REACTION)
  for (const a of CHEMICALS) for (const b of CHEMICALS) {
    const forward = evaluateExperiment([a, b]), reverse = evaluateExperiment([b, a])
    verify(forward.outcome === reverse.outcome)
    verify(Boolean(forward.effects))
  }
  verify(ALL_REACTIONS.length > 0)
  console.log(`PASS: ${checks} core checks (all shelf targets, beaker raycast, reaction symmetry and effects)`)
} finally { await server.close() }
