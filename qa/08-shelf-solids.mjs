/**
 * 08 — physical shelf layout + solid reagent interactions.
 *
 * Covers the Phase 1/2 work: the two shelf sections, the SVG reagent art, and
 * picking up / dropping / cancelling a solid with BOTH the mouse and a
 * synthetic hand driven through the real onFrame bridge.
 */
import { launch, check, summary, BASE } from './harness.mjs'

const { browser, page, errors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const centerOf = async (sel) => {
  const b = await page.locator(sel).first().boundingBox()
  if (!b) throw new Error(`no box for ${sel}`)
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}
const contents = () =>
  page.locator('[data-testid="beaker-contents"] [data-content-id]').count()
const reset = async () => {
  const btn = page.locator('[data-testid="reset-beaker"]')
  if (await btn.count()) {
    await btn.click()
    await page.waitForTimeout(200)
  }
}

/* ===================== shelf layout ===================== */
check('Solid shelf section exists', (await page.locator('[data-testid="shelf-solid"]').count()) === 1)
check('Liquid shelf section exists', (await page.locator('[data-testid="shelf-liquid"]').count()) === 1)

const solidIds = await page
  .locator('[data-testid="shelf-solid"] [data-chemical-id]')
  .evaluateAll((els) => els.map((e) => e.getAttribute('data-chemical-id')))
check('Six metals on the solid shelf', solidIds.join(',') === 'na,ag,cu,fe,zn,mg', solidIds.join(','))

const liquidIds = await page
  .locator('[data-testid="shelf-liquid"] [data-chemical-id]')
  .evaluateAll((els) => els.map((e) => e.getAttribute('data-chemical-id')))
check('Four bottles on the liquid shelf', liquidIds.join(',') === 'hcl,h2so4,naoh,h2o', liquidIds.join(','))

check(
  'Every reagent draws SVG artwork',
  (await page.locator('[data-chemical-id] [data-testid="shelf-art"] svg').count()) === 10,
)
check(
  'Reagents are tagged solid/liquid for the pointer layer',
  (await page.locator('[data-chemical-id][data-form="liquid"]').count()) === 4,
)
check('All reagents remain grabbable', (await page.locator('[data-chemical-id][data-grabbable="true"]').count()) === 10)

// The library must scroll on its own, not drag the dashboard with it.
const scrollable = await page.locator('[data-testid="library-scroll"]').evaluate((el) => ({
  canScroll: el.scrollHeight > el.clientHeight,
  overflow: getComputedStyle(el).overflowY,
}))
check('Library has its own scroll viewport', scrollable.overflow === 'auto' || scrollable.overflow === 'scroll',
  JSON.stringify(scrollable))

/* ===================== mouse: pick up + drop a solid ===================== */
await reset()
const znFrom = await centerOf('[data-chemical-id="zn"]')
const beaker = await centerOf('[data-dropzone="beaker"]')

await page.mouse.move(znFrom.x, znFrom.y)
await page.mouse.down()
await page.mouse.move((znFrom.x + beaker.x) / 2, (znFrom.y + beaker.y) / 2)
await page.waitForTimeout(60)
check('Mouse picks up a solid', (await page.locator('[data-testid="carry-preview"]').count()) === 1)
check(
  'Carry preview reports the solid form',
  (await page.locator('[data-testid="carry-preview"]').getAttribute('data-carry-form')) === 'solid',
)
check('Hint tells the user to release over the beaker',
  (await page.locator('[data-testid="context-hint"]').getAttribute('data-phase')) === 'CARRYING_SOLID')

await page.mouse.move(beaker.x, beaker.y)
await page.waitForTimeout(80)
// A solid must NOT show the pour affordance.
check('Solids never offer "Hold to Pour"', (await page.locator('[data-testid="pour-badge"]').count()) === 0)

await page.mouse.up()
await page.waitForTimeout(250)
check('Mouse drops the solid into the beaker', (await contents()) === 1, `count=${await contents()}`)

/* ===================== mouse: invalid release cancels ===================== */
await reset()
const mgFrom = await centerOf('[data-chemical-id="mg"]')
await page.mouse.move(mgFrom.x, mgFrom.y)
await page.mouse.down()
await page.mouse.move(mgFrom.x + 40, mgFrom.y + 30)
await page.mouse.up() // released over the library, not the beaker
await page.waitForTimeout(220)
check('Release outside the beaker adds nothing', (await contents()) === 0, `count=${await contents()}`)
check('Carry state cleared after an invalid release',
  (await page.locator('[data-testid="carry-preview"]').count()) === 0)

/* ===================== hand: pinch, carry, release ===================== */
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

await reset()
const cuBox = await centerOf('[data-chemical-id="cu"]')
await frame(openHand(cuBox.x, cuBox.y))
check('Hand hover marks the reagent as hovered',
  (await page.locator('[data-testid="context-hint"]').getAttribute('data-phase')) === 'HOVERING')

await frame(pinchHand(cuBox.x, cuBox.y))
check('Pinch picks up a solid',
  (await page.locator('[data-testid="carry-preview"]').getAttribute('data-carry-id')) === 'cu')

await frame(pinchHand(beaker.x, beaker.y))
await frame(openHand(beaker.x, beaker.y)) // release the pinch
await page.waitForTimeout(220)
check('Pinch release over the beaker adds the solid', (await contents()) === 1, `count=${await contents()}`)

/* ===================== hand: tracking loss cancels safely ===================== */
await reset()
const feBox = await centerOf('[data-chemical-id="fe"]')
await frame(openHand(feBox.x, feBox.y))
await frame(pinchHand(feBox.x, feBox.y))
check('Pinch grabbed Fe before the dropout',
  (await page.locator('[data-testid="carry-preview"]').count()) === 1)

// Hand disappears while the reagent is directly over the beaker — the most
// dangerous case, because a naive implementation would "drop" it in.
await frame(pinchHand(beaker.x, beaker.y))
await frame({ handPresent: false, pinching: false, point: null, landmarks: null })
await page.waitForTimeout(220)
check('Tracking loss clears the carry', (await page.locator('[data-testid="carry-preview"]').count()) === 0)
check('Tracking loss does NOT add the reagent', (await contents()) === 0, `count=${await contents()}`)

check('No console errors in the solid interaction flow', errors.length === 0, errors.slice(0, 4).join(' | '))

await browser.close()
process.exit(summary('08 shelf + solids') ? 1 : 0)

