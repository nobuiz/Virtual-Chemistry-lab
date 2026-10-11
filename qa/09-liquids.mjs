/**
 * 09 — liquid bottle lifting and hold-to-pour.
 *
 * The pour is a TIMED auto-pour: a bottle held inside the beaker zone for
 * ~1s while the pinch is maintained commits a single atomic addition. These
 * checks pin down the parts that are easy to get wrong — progress
 * cancellation, exactly-once addition, and reset/track-loss safety.
 */
import { launch, check, summary, BASE } from './harness.mjs'

const HOLD_MS = 1000
const ANIM_MS = 900

const { browser, page, errors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const centerOf = async (sel) => {
  // Shelf items can sit below the library's fold; the hand bridge hit-tests
  // with elementFromPoint, which only sees what is actually on screen.
  if (sel.includes('data-chemical-id')) {
    await page.locator(sel).first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(80)
  }
  const b = await page.locator(sel).first().boundingBox()
  if (!b) throw new Error(`no box for ${sel}`)
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}
const contents = () =>
  page.locator('[data-testid="beaker-contents"] [data-content-id]').count()
const beakerText = async () =>
  (await page.locator('[data-testid="beaker-contents"]').count())
    ? (await page.locator('[data-testid="beaker-contents"]').innerText()).replace(/\s+/g, ' ')
    : ''
const reset = async () => {
  const btn = page.locator('[data-testid="reset-beaker"]')
  if (await btn.count()) {
    await btn.click()
    await page.waitForTimeout(220)
  }
}
const phase = () => page.locator('[data-testid="context-hint"]').getAttribute('data-phase')

const beaker = await centerOf('[data-dropzone="beaker"]')

/* ============ mouse: lift a bottle, hold over beaker, pour ============ */
await reset()
const hcl = await centerOf('[data-chemical-id="hcl"]')
await page.mouse.move(hcl.x, hcl.y)
await page.mouse.down()
await page.mouse.move((hcl.x + beaker.x) / 2, (hcl.y + beaker.y) / 2)
await page.waitForTimeout(60)
check('Mouse lifts a bottle', (await page.locator('[data-testid="carry-preview"]').count()) === 1)
check('Carry preview reports the liquid form',
  (await page.locator('[data-testid="carry-preview"]').getAttribute('data-carry-form')) === 'liquid')
check('Carrying a bottle prompts "move above the beaker"', (await phase()) === 'CARRYING_LIQUID')

// Enter the pour zone. Progress needs pointer movement to tick, mirroring a
// real hand, which never holds perfectly still.
await page.mouse.move(beaker.x, beaker.y)
await page.mouse.move(beaker.x + 1, beaker.y)
await page.waitForTimeout(120)
check('Entering the zone arms the pour', (await phase()) === 'POUR_READY')
check('"Hold to Pour" affordance appears',
  (await page.locator('[data-testid="pour-badge"]').innerText()).includes('Hold to Pour'))
check('Nothing has been added during the hold', (await contents()) === 0, `count=${await contents()}`)

/* ============ leaving the zone cancels the progress ============ */
await page.mouse.move(hcl.x, hcl.y)
await page.mouse.move(hcl.x + 1, hcl.y)
await page.waitForTimeout(80)
check('Leaving the zone cancels the pour progress', (await phase()) === 'CARRYING_LIQUID')
check('Cancelled hold added nothing', (await contents()) === 0, `count=${await contents()}`)

/* ============ a full hold pours exactly once ============ */
await page.mouse.move(beaker.x, beaker.y)
const t0 = Date.now()
// Jiggle inside the zone for longer than the hold threshold.
for (let i = 0; i < 26; i++) {
  await page.mouse.move(beaker.x + (i % 2), beaker.y)
  await page.waitForTimeout(50)
}
const held = Date.now() - t0
check('Hold lasted past the 1s threshold', held >= HOLD_MS, `${held}ms`)
check('Pour animation state reached', ['POURING', 'IDLE'].includes(await phase()), `phase=${await phase()}`)

await page.mouse.up()
await page.waitForTimeout(ANIM_MS + 400)
check('Pour adds exactly one reagent', (await contents()) === 1, `count=${await contents()}`)
check('Poured reagent is HCl with its selected quantity',
  (await beakerText()).includes('HCl') && (await beakerText()).includes('25 vu'), await beakerText())
check('Bottle returns to the shelf after pouring',
  (await page.locator('[data-testid="carry-preview"]').count()) === 0)

/* ============ the same pinch cannot pour twice ============ */
// The bottle was returned to the shelf, so the pointer is still "down" over
// the beaker. Keep jiggling: nothing more may be added.
for (let i = 0; i < 24; i++) {
  await page.mouse.move(beaker.x + (i % 2), beaker.y + 1)
  await page.waitForTimeout(50)
}
check('A single pinch cannot pour twice', (await contents()) === 1, `count=${await contents()}`)

/* ============ gesture: lift + pour through the hand bridge ============ */
const frame = async (payload) => {
  await page.evaluate((p) => window.__gl_handFrame?.(p), payload)
  await page.waitForTimeout(40)
}
const openHand = (x, y) => ({
  handPresent: true,
  pinching: false,
  point: { x, y },
  landmarks: null,
  openPalm: false,
  timestamp: Date.now(),
})
const pinchHand = (x, y) => ({ ...openHand(x, y), pinching: true })
const lost = { handPresent: false, pinching: false, point: null, landmarks: null }

await reset()
const naoh = await centerOf('[data-chemical-id="naoh"]')
await frame(openHand(naoh.x, naoh.y))
await frame(pinchHand(naoh.x, naoh.y))
check('Gesture lifts a bottle',
  (await page.locator('[data-testid="carry-preview"]').getAttribute('data-carry-id')) === 'naoh')

// Hold the pinch over the beaker for longer than the threshold.
for (let i = 0; i < 26; i++) await frame(pinchHand(beaker.x + (i % 2), beaker.y))
await page.waitForTimeout(ANIM_MS + 400)
check('Gesture hold-to-pour adds exactly one reagent', (await contents()) === 1, `count=${await contents()}`)
check('Gesture pour recorded NaOH', (await beakerText()).includes('NaOH'), await beakerText())
await frame(openHand(beaker.x, beaker.y)) // release the (now empty) pinch

/* ============ track loss before the threshold cancels safely ============ */
await reset()
const h2so4 = await centerOf('[data-chemical-id="h2so4"]')
await frame(openHand(h2so4.x, h2so4.y))
await frame(pinchHand(h2so4.x, h2so4.y))
// Only a few frames in the zone — nowhere near 1s.
for (let i = 0; i < 4; i++) await frame(pinchHand(beaker.x + (i % 2), beaker.y))
await frame(lost)
await page.waitForTimeout(ANIM_MS + 300)
check('Tracking loss mid-hold pours nothing', (await contents()) === 0, `count=${await contents()}`)
check('Tracking loss mid-hold clears the carry',
  (await page.locator('[data-testid="carry-preview"]').count()) === 0)

/* ============ reset during a pour cancels the pending addition ============ */
await reset()
const h2o = await centerOf('[data-chemical-id="h2o"]')
await frame(openHand(h2o.x, h2o.y))
await frame(pinchHand(h2o.x, h2o.y))
for (let i = 0; i < 26; i++) await frame(pinchHand(beaker.x + (i % 2), beaker.y))
// The pour has committed and is animating; reset before it lands.
await page.locator('[data-testid="reset-beaker"]').click().catch(() => {})
await page.waitForTimeout(ANIM_MS + 500)
check('Reset during a pour leaves the beaker empty', (await contents()) === 0, `count=${await contents()}`)
await frame(lost)

/* ============ WEBCAM SAFETY: an early pinch release must not add ============
 * MediaPipe drops a pinch for a frame whenever the hand rotates or blurs. If
 * that counted as "drop it in", a bottle would silently empty into the beaker
 * mid-demo. Under hand control a liquid may ONLY be committed by the timed
 * hold, so an early release has to leave the beaker untouched.
 */
await reset()
const acid2 = await centerOf('[data-chemical-id="h2so4"]')
await frame(openHand(acid2.x, acid2.y))
await frame(pinchHand(acid2.x, acid2.y))
// A few frames over the beaker — far short of the 1s threshold.
for (let i = 0; i < 3; i++) await frame(pinchHand(beaker.x + (i % 2), beaker.y))
await frame(openHand(beaker.x, beaker.y))
await page.waitForTimeout(500)
check('Early pinch release over the beaker adds NO liquid',
  (await contents()) === 0, `count=${await contents()}`)
check('Early pinch release returns the bottle to the shelf',
  (await page.locator('[data-testid="carry-preview"]').count()) === 0)
check('Early pinch release explains how to pour',
  await page.getByText('Hold the bottle over the beaker to pour.').isVisible())

/* A hand-released SOLID over the beaker must still be added, though. */
await reset()
const znSolid = await centerOf('[data-chemical-id="zn"]')
await frame(openHand(znSolid.x, znSolid.y))
await frame(pinchHand(znSolid.x, znSolid.y))
for (let i = 0; i < 3; i++) await frame(pinchHand(beaker.x + (i % 2), beaker.y))
await frame(openHand(beaker.x, beaker.y))
await page.waitForTimeout(500)
check('A released SOLID is still added on release',
  (await contents()) === 1, `count=${await contents()}`)

/* ============ a motionless hold must still pour ============
 * Progress is wall-clock based and driven by a rAF ticker. A user holding the
 * bottle perfectly still — the most natural thing to do — must still pour.
 */
await reset()
const base2 = await centerOf('[data-chemical-id="naoh"]')
await page.mouse.move(base2.x, base2.y)
await page.mouse.down()
await page.mouse.move(beaker.x, beaker.y) // one move in, then hold still
await page.waitForTimeout(HOLD_MS + ANIM_MS + 600)
check('A perfectly motionless hold still pours',
  (await contents()) === 1, `count=${await contents()}`)
await page.mouse.up()
await page.waitForTimeout(300)
check('Motionless pour added exactly one reagent',
  (await contents()) === 1, `count=${await contents()}`)

check('No console errors in the liquid flow', errors.length === 0, errors.slice(0, 4).join(' | '))

await browser.close()
process.exit(summary('09 liquids + pouring') ? 1 : 0)

