/**
 * Webcam + MediaPipe pipeline.
 *
 * Chromium's --use-fake-device-for-media-stream supplies a REAL MediaStream
 * (a moving synthetic pattern), so camera acquisition, WASM/model loading and
 * the detection loop are all genuinely exercised. What it cannot supply is a
 * real human hand, so landmark-dependent behaviour is covered separately in
 * 06-simulated-hand.mjs.
 */
import { launch, check, summary, BASE, ORIGIN } from './harness.mjs'

const { browser, page, errors } = await launch({ fakeCam: true })
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

// ---------- asset availability (offline-first vendored files) ----------
// Assets are fetched from the ORIGIN, not BASE: BASE carries a query string
// (the renderer selector) which must not be appended to an asset path.
for (const p of ['/models/hand_landmarker.task', '/wasm/vision_wasm_internal.js', '/wasm/vision_wasm_internal.wasm']) {
  const r = await page.request.get(ORIGIN + p)
  check(`Asset served: ${p}`, r.ok(), `status ${r.status()}`)
}

// ---------- start tracking ----------
await page.getByRole('button', { name: /Start Tracking/i }).click()

// Model + camera init can take a while on a cold WASM compile.
let status = ''
for (let i = 0; i < 100; i++) {
  await page.waitForTimeout(600)
  status = (await page.locator('header').innerText()).replace(/\s+/g, ' ')
  if (/Camera connected|Camera error/i.test(status)) break
}
check('Tracker reaches RUNNING state', /Camera connected/i.test(status), `header="${status.slice(-70)}"`)

// Give the video element a moment to latch the stream after status flips.
await page.waitForTimeout(1500)

// ---------- video element actually receives frames ----------
const video = await page.evaluate(() => {
  const v = document.querySelector('video')
  if (!v) return null
  return { w: v.videoWidth, h: v.videoHeight, paused: v.paused, hasStream: !!v.srcObject, readyState: v.readyState }
})
check('Video element present', video !== null)
check('Camera stream attached', video?.hasStream === true)
check('Video has real dimensions', video?.w > 0 && video?.h > 0, JSON.stringify(video))
check('Video is playing', video?.paused === false, `paused=${video?.paused}`)

// ---------- MediaPipe actually initialised and looping ----------
// NOTE: the fps readout counts *hand-detected* frames by design, so with a
// synthetic (handless) stream it correctly stays blank. Live fps therefore
// remains a MANUAL check with a real webcam. What we can prove here is that
// the detector loop is running: it keeps reporting "No hand" via the
// track-loss path, which only executes inside the rAF predict loop.
const fpsCell = await page.evaluate(() => {
  const m = document.body.innerText.match(/([\d.—–-]+)\s*fps/i)
  return m ? m[1] : null
})
check('FPS readout present (blank until a hand is seen)', fpsCell !== null, `fps cell="${fpsCell}"`)
check('No MediaPipe/WASM load errors',
  !errors.some((e) => /wasm|mediapipe|landmarker|Aborted/i.test(e)),
  errors.filter((e) => /wasm|mediapipe|landmarker/i.test(e)).slice(0, 3).join(' | '))

// Synthetic video contains no hand, so the UI must say so rather than hang.
check('Reports "no hand" honestly with a handless stream',
  /No hand/i.test(status), `header="${status.slice(-70)}"`)

// ---------- stop ----------
await page.getByRole('button', { name: /Stop Tracking/i }).click()
await page.waitForTimeout(900)
const stopped = await page.evaluate(() => {
  const v = document.querySelector('video')
  const s = v?.srcObject
  return { hasStream: !!s, live: s ? s.getTracks().some((t) => t.readyState === 'live') : false }
})
check('Camera tracks released on stop', stopped.live === false, JSON.stringify(stopped))
check('Status returns to Camera off', (await page.locator('header').innerText()).includes('Camera off'))

check('No console errors in webcam flow', errors.length === 0, errors.slice(0, 5).join(' | '))

await browser.close()
process.exit(summary('05 webcam/mediapipe') ? 1 : 0)
