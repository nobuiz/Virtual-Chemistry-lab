/**
 * Gesture logic WITHOUT a real hand.
 *
 * Part A unit-tests the pure gesture math in the real browser engine.
 * Part B synthesises landmark frames and pushes them through the app's actual
 * pointer bridge to prove pinch -> grab -> move -> release works end to end.
 *
 * This does NOT replace manual webcam testing of MediaPipe's own detection
 * quality, but it fully covers the code GestureLab owns.
 */
import { launch, check, summary, BASE } from './harness.mjs'

const { browser, page, errors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

/* ===================== A. gesture math unit tests ===================== */
const math = await page.evaluate(async () => {
  const m = await import('/src/lib/handMath.js')

  /** Build a plausible 21-landmark hand; `gap` controls thumb/index spread. */
  const hand = (gap, ox = 0.5, oy = 0.5) => {
    const L = Array.from({ length: 21 }, () => ({ x: ox, y: oy, z: 0 }))
    L[0] = { x: ox, y: oy + 0.18 }
    L[5] = { x: ox - 0.07, y: oy }
    L[9] = { x: ox, y: oy - 0.01 }
    L[17] = { x: ox + 0.07, y: oy }
    L[4] = { x: ox - gap / 2, y: oy - 0.06 }
    L[8] = { x: ox + gap / 2, y: oy - 0.06 }
    L[12] = { x: ox, y: oy - 0.30 }
    L[16] = { x: ox + 0.03, y: oy - 0.28 }
    L[20] = { x: ox + 0.06, y: oy - 0.24 }
    return L
  }

  const out = {}
  out.openRatio = m.pinchRatio(hand(0.26))
  out.closedRatio = m.pinchRatio(hand(0.01))

  // Scale invariance: same pose, different apparent distance from camera.
  const scaled = hand(0.26).map((p) => ({ x: 0.5 + (p.x - 0.5) * 0.4, y: 0.5 + (p.y - 0.5) * 0.4 }))
  out.scaledRatio = m.pinchRatio(scaled)

  // Hysteresis: must not flicker at the boundary.
  const gate = new m.PinchGate({ closeAt: 0.4, openAt: 0.55, holdFrames: 2 })
  const seq = []
  for (const r of [0.9, 0.9, 0.3, 0.3, 0.45, 0.45, 0.5, 0.52, 0.9, 0.9]) {
    seq.push(gate.update(r).pinching)
  }
  out.gateSeq = seq

  const vp = { width: 1000, height: 500, margin: 0.1 }
  out.left = m.cameraToViewport({ x: 0.1, y: 0.5 }, vp)
  out.right = m.cameraToViewport({ x: 0.9, y: 0.5 }, vp)
  out.clamped = m.cameraToViewport({ x: 5, y: -5 }, vp)

  out.fingersOpen = m.extendedFingerCount(hand(0.26))
  out.pinchMid = m.pinchPoint(hand(0.2, 0.3, 0.4))

  // A genuinely open palm: every fingertip extended well away from the wrist.
  const openPalm = hand(0.26)
  openPalm[8] = { x: 0.43, y: 0.18 }   // index tip
  openPalm[12] = { x: 0.50, y: 0.15 }  // middle tip
  openPalm[16] = { x: 0.57, y: 0.17 }  // ring tip
  openPalm[20] = { x: 0.63, y: 0.22 }  // pinky tip
  out.fingersOpenPalm = m.extendedFingerCount(openPalm)

  // A closed fist: all fingertips curled back toward the wrist.
  const fist = hand(0.05)
  for (const i of [8, 12, 16, 20]) fist[i] = { x: 0.5, y: 0.58 }
  out.fingersFist = m.extendedFingerCount(fist)
  return out
})

check('Open hand yields high pinch ratio', math.openRatio > 0.6, `${math.openRatio.toFixed(3)}`)
check('Closed pinch yields low ratio', math.closedRatio < 0.3, `${math.closedRatio.toFixed(3)}`)
check('Pinch ratio is distance-invariant',
  Math.abs(math.openRatio - math.scaledRatio) < 0.02,
  `${math.openRatio.toFixed(3)} vs ${math.scaledRatio.toFixed(3)}`)
check('Pinch gate debounces + holds through boundary',
  JSON.stringify(math.gateSeq) === JSON.stringify([false,false,false,true,true,true,true,true,true,false]),
  JSON.stringify(math.gateSeq))
check('Camera X is mirrored', math.left.x > math.right.x, `left=${math.left.x} right=${math.right.x}`)
check('Viewport mapping clamps out-of-range', math.clamped.x === 0 && math.clamped.y === 0, JSON.stringify(math.clamped))
check('Open palm counts 4 extended fingers', math.fingersOpenPalm === 4, `${math.fingersOpenPalm}`)
check('Closed fist counts 0 extended fingers', math.fingersFist === 0, `${math.fingersFist}`)
check('Pinch point is midpoint of thumb+index', Math.abs(math.pinchMid.x - 0.3) < 1e-9, JSON.stringify(math.pinchMid))

/* ============ B. simulated pinch-grab-drop via the real UI ============ */
const box = await page.locator('[data-chemical-id="mg"]').boundingBox()
const beaker = await page.locator('[data-dropzone="beaker"]').boundingBox()
const src = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
const dst = { x: beaker.x + beaker.width / 2, y: beaker.y + beaker.height / 2 }

/** Drive App's pointer bridge exactly like a tracked hand would. */
const feed = (x, y, pinching) =>
  page.evaluate(({ x, y, pinching }) => window.__gl_handFrame({
    handPresent: true, pinching, point: { x, y }, landmarks: null,
  }), { x, y, pinching })

check('Hand bridge exposed in dev', await page.evaluate(() => typeof window.__gl_handFrame === 'function'))

await feed(src.x, src.y, false)
await page.waitForTimeout(140)

await feed(src.x, src.y, true)
await page.waitForTimeout(180)
check('Pinch grabs the chemical',
  (await page.locator('[data-testid="carry-preview"]').getAttribute('data-carry-id')) === 'mg')

for (let i = 1; i <= 6; i++) {
  await feed(src.x + ((dst.x - src.x) * i) / 6, src.y + ((dst.y - src.y) * i) / 6, true)
  await page.waitForTimeout(40)
}
check('Drop zone highlights while carrying', await page.getByText('Release to add').isVisible())

await feed(dst.x, dst.y, false)
await page.waitForTimeout(420)
const n1 = await page.locator('[data-testid="beaker-contents"] [data-content-id]').count()
check('Releasing over beaker adds the reagent', n1 === 1, `count=${n1}`)

// Tracking loss must auto-release rather than strand the chemical.
await feed(src.x, src.y, false)
await page.waitForTimeout(120)
await feed(src.x, src.y, true)
await page.waitForTimeout(180)
check('Second pinch grabs again', (await page.locator('[data-testid="carry-preview"]').count()) === 1)

await page.evaluate(() => window.__gl_handFrame({
  handPresent: false, pinching: false, point: null, landmarks: null,
}))
await page.waitForTimeout(350)
check('Losing tracking releases the held chemical',
  (await page.locator('[data-testid="carry-preview"]').count()) === 0)
const n2 = await page.locator('[data-testid="beaker-contents"] [data-content-id]').count()
check('Lost-tracking release does not silently add a reagent', n2 === 1, `count=${n2}`)

check('No console errors in simulated hand flow', errors.length === 0, errors.slice(0, 4).join(' | '))

await browser.close()
process.exit(summary('06 simulated hand') ? 1 : 0)

