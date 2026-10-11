/**
 * 10 — open-palm shelf scrolling.
 *
 * Scrolling is driven entirely through the real onFrame bridge, so these
 * checks exercise the same code path MediaPipe feeds at runtime. The gesture
 * must arm only after ~200ms of a stable open palm inside the library, and it
 * must never fight with carrying, pouring or the mouse wheel.
 */
import { launch, check, summary, BASE } from './harness.mjs'

const { browser, page, errors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const lib = page.locator('[data-testid="library-scroll"]')
const box = await lib.boundingBox()
const mid = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

const scrollTop = () => lib.evaluate((el) => el.scrollTop)
const setScrollTop = (v) => lib.evaluate((el, n) => { el.scrollTop = n }, v)
const isScrolling = async () => (await lib.getAttribute('data-scrolling')) === 'true'

/**
 * Feed one synthetic frame. `t` is an explicit timestamp so the 200ms arming
 * window can be driven deterministically instead of by wall-clock sleeps.
 */
let clock = 10_000
const frame = async (over) => {
  clock += 60
  await page.evaluate((p) => window.__gl_handFrame?.(p), { ...over, timestamp: clock })
  await page.waitForTimeout(25)
}
const palm = (x, y) => ({ handPresent: true, pinching: false, point: { x, y }, landmarks: null, openPalm: true })
const fist = (x, y) => ({ handPresent: true, pinching: false, point: { x, y }, landmarks: null, openPalm: false })
const pinch = (x, y) => ({ handPresent: true, pinching: true, point: { x, y }, landmarks: null, openPalm: false })
const lost = { handPresent: false, pinching: false, point: null, landmarks: null, openPalm: false }

check('Library can actually scroll', (await lib.evaluate((el) => el.scrollHeight > el.clientHeight)))

/* ============ arming ============ */
await frame(fist(mid.x, mid.y))
check('A non-palm hand does not arm scrolling', !(await isScrolling()))

// A single palm frame is not enough — the gesture must be held.
await frame(palm(mid.x, mid.y))
check('One palm frame is below the hold threshold', !(await isScrolling()))

// Keep the palm steady past 200ms.
for (let i = 0; i < 6; i++) await frame(palm(mid.x, mid.y))
check('Steady open palm activates scroll mode', await isScrolling())
check('Scroll-mode banner is shown', (await page.locator('[data-testid="scroll-mode"]').count()) === 1)
check('Hint reports scroll mode',
  (await page.locator('[data-testid="context-hint"]').getAttribute('data-phase')) === 'SCROLLING')

/* ============ a stationary hand must not drift ============ */
await setScrollTop(120)
const before = await scrollTop()
for (let i = 0; i < 8; i++) await frame(palm(mid.x, mid.y))
check('Stationary palm does not scroll', (await scrollTop()) === before, `${before} -> ${await scrollTop()}`)

// Sub-deadzone tremor must also be ignored.
for (let i = 0; i < 8; i++) await frame(palm(mid.x, mid.y + (i % 2 ? 1 : -1)))
check('Hand tremor inside the dead zone does not scroll',
  Math.abs((await scrollTop()) - before) < 2, `${before} -> ${await scrollTop()}`)

/* ============ direction ============ */
await setScrollTop(200)
const downStart = await scrollTop()
for (let i = 1; i <= 8; i++) await frame(palm(mid.x, mid.y + i * 10))
const afterDown = await scrollTop()
check('Moving the palm down scrolls down', afterDown > downStart, `${downStart} -> ${afterDown}`)

const upStart = await scrollTop()
for (let i = 1; i <= 8; i++) await frame(palm(mid.x, mid.y - i * 10))
const afterUp = await scrollTop()
check('Moving the palm up scrolls up', afterUp < upStart, `${upStart} -> ${afterUp}`)

/* ============ clamping ============ */
for (let i = 1; i <= 25; i++) await frame(palm(mid.x, mid.y - i * 20))
check('Scrolling clamps at the top', (await scrollTop()) >= 0, `top=${await scrollTop()}`)
for (let i = 1; i <= 40; i++) await frame(palm(mid.x, mid.y + i * 20))
const maxed = await lib.evaluate((el) => ({ top: el.scrollTop, max: el.scrollHeight - el.clientHeight }))
check('Scrolling clamps at the bottom', maxed.top <= maxed.max + 1, JSON.stringify(maxed))

/* ============ pinch wins over scrolling ============ */
await frame(palm(mid.x, mid.y))
for (let i = 0; i < 6; i++) await frame(palm(mid.x, mid.y))
check('Scroll mode re-armed before the pinch test', await isScrolling())

await frame(pinch(mid.x, mid.y))
check('Pinching immediately disables scroll mode', !(await isScrolling()))

// Even a palm flag arriving alongside a pinch must not re-arm it.
for (let i = 0; i < 6; i++) {
  await frame({ handPresent: true, pinching: true, point: mid, landmarks: null, openPalm: true })
}
check('Palm + pinch together never scroll', !(await isScrolling()))
await frame(fist(mid.x, mid.y)) // release

/* ============ scrolling cannot run while carrying ============ */
const znBox = await (async () => {
  await page.locator('[data-chemical-id="zn"]').scrollIntoViewIfNeeded()
  await page.waitForTimeout(80)
  const b = await page.locator('[data-chemical-id="zn"]').boundingBox()
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
})()

await frame(fist(znBox.x, znBox.y))
await frame(pinch(znBox.x, znBox.y))
check('Reagent grabbed for the carry/scroll conflict test',
  (await page.locator('[data-testid="carry-preview"]').count()) === 1)

const carryTop = await scrollTop()
// Open-palm flags while a reagent is held must be ignored outright.
for (let i = 0; i < 10; i++) {
  await frame({ handPresent: true, pinching: true, point: { x: znBox.x, y: znBox.y + i * 12 },
    landmarks: null, openPalm: true })
}
check('Carrying suppresses scroll mode', !(await isScrolling()))
check('Carrying suppresses scroll movement', (await scrollTop()) === carryTop,
  `${carryTop} -> ${await scrollTop()}`)
check('The reagent is still being carried',
  (await page.locator('[data-testid="carry-preview"]').count()) === 1)

/* ============ tracking loss resets the gesture ============ */
await frame(lost)
await page.waitForTimeout(80)
await frame(palm(mid.x, mid.y))
for (let i = 0; i < 6; i++) await frame(palm(mid.x, mid.y))
check('Scroll mode can re-arm after a dropout', await isScrolling())

await frame(lost)
check('Tracking loss resets scroll state', !(await isScrolling()))
check('Scroll-mode banner removed on track loss',
  (await page.locator('[data-testid="scroll-mode"]').count()) === 0)

/* ============ the mouse wheel still works ============ */
await setScrollTop(0)
await page.mouse.move(mid.x, mid.y)
await page.mouse.wheel(0, 240)
await page.waitForTimeout(160)
check('Mouse wheel scrolling is preserved', (await scrollTop()) > 0, `top=${await scrollTop()}`)

check('No console errors in the scrolling flow', errors.length === 0, errors.slice(0, 4).join(' | '))

await browser.close()
process.exit(summary('10 gesture scrolling') ? 1 : 0)

check('Scrolling clamps at the bottom', maxed.top <= maxed.max + 1, JSON.stringify(maxed))
