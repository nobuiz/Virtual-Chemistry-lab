/**
 * 11 — demo readiness: guided walkthrough end-to-end, responsive layout at
 * both target resolutions, and first-time-user camera error copy.
 */
import { launch, check, summary, BASE } from './harness.mjs'

const { browser, page, errors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const centerOf = async (sel) => {
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
const stepId = () => page.locator('[data-testid="demo-panel"]').getAttribute('data-demo-step')

/* ==================== guided demo, start to finish ==================== */
check('Guided demo launcher is present', await page.locator('[data-testid="demo-start"]').isVisible())
check('Exactly one demo launcher', (await page.locator('[data-testid="demo-start"]').count()) === 1)

await page.locator('[data-testid="demo-start"]').click()
await page.waitForTimeout(250)
check('Demo panel opens on the welcome step', (await stepId()) === 'welcome')
check('Demo shows a 9-step rail', (await page.locator('[data-testid="demo-panel"]').innerText()).includes('/ 9'))

// Mouse user: skip the webcam steps the way a judge without a camera would.
await page.locator('[data-testid="demo-next"]').click()
await page.waitForTimeout(200)
const afterWelcome = await stepId()
check('Skip advances past welcome', afterWelcome !== 'welcome', `step=${afterWelcome}`)

// Walk to the zinc step.
for (let i = 0; i < 4 && (await stepId()) !== 'grab-zn'; i++) {
  await page.locator('[data-testid="demo-next"]').click()
  await page.waitForTimeout(200)
}
check('Demo reaches the "pick up the zinc" step', (await stepId()) === 'grab-zn', `step=${await stepId()}`)

// Perform the real action; the demo must notice by itself.
const beaker = await centerOf('[data-dropzone="beaker"]')
const zn = await centerOf('[data-chemical-id="zn"]')
await page.mouse.move(zn.x, zn.y)
await page.mouse.down()
await page.mouse.move(beaker.x, beaker.y)
await page.waitForTimeout(120)
await page.mouse.up()
await page.waitForTimeout(400)
check('Zn actually entered the beaker', (await contents()) === 1, `count=${await contents()}`)
check('Demo auto-advances after the real drop',
  ['grab-hcl', 'pour'].includes(await stepId()), `step=${await stepId()}`)

// Pour the HCl by holding — the demo's own instruction.
const hcl = await centerOf('[data-chemical-id="hcl"]')
await page.mouse.move(hcl.x, hcl.y)
await page.mouse.down()
await page.mouse.move(beaker.x, beaker.y)
await page.waitForTimeout(2400) // hold still through the 1s threshold + anim
await page.mouse.up()
await page.waitForTimeout(500)
check('HCl poured into the beaker', (await contents()) === 2, `count=${await contents()}`)
check('Demo advances to the reaction steps',
  ['observe', 'read'].includes(await stepId()), `step=${await stepId()}`)

const results = await page.locator('[data-testid="results-panel"]').innerText()
check('Zn + HCl produced the verified reaction',
  /ZnCl|Zn²⁺|single displacement/i.test(results), results.replace(/\s+/g, ' ').slice(0, 140))

// Finish the demo.
for (let i = 0; i < 4 && (await page.locator('[data-testid="demo-panel"]').count()); i++) {
  await page.locator('[data-testid="demo-next"]').click()
  await page.waitForTimeout(220)
}
check('Demo closes at the end', (await page.locator('[data-testid="demo-panel"]').count()) === 0)
check('Launcher returns after finishing', await page.locator('[data-testid="demo-start"]').isVisible())

/* ==================== responsive layout ==================== */
for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  await page.setViewportSize({ width: w, height: h })
  await page.waitForTimeout(450)
  const doc = await page.evaluate(() => ({
    sx: document.documentElement.scrollWidth,
    cx: document.documentElement.clientWidth,
    sy: document.documentElement.scrollHeight,
    cy: document.documentElement.clientHeight,
  }))
  check(`${w}x${h}: no horizontal overflow`, doc.sx <= doc.cx + 1, `${doc.sx} vs ${doc.cx}`)
  check(`${w}x${h}: no page-level vertical scroll`, doc.sy <= doc.cy + 1, `${doc.sy} vs ${doc.cy}`)
  check(`${w}x${h}: library visible`, await page.locator('[data-testid="library-scroll"]').isVisible())
  check(`${w}x${h}: beaker visible`, await page.locator('[data-dropzone="beaker"]').isVisible())
  check(`${w}x${h}: analysis panel visible`, await page.locator('[data-testid="results-panel"]').isVisible())

  // The beaker must sit fully on screen — it is the focus of the demo.
  const bb = await page.locator('[data-dropzone="beaker"]').boundingBox()
  check(`${w}x${h}: beaker fully on screen`,
    bb.y >= 0 && bb.y + bb.height <= h + 1 && bb.x >= 0 && bb.x + bb.width <= w + 1,
    JSON.stringify({ x: Math.round(bb.x), y: Math.round(bb.y), w: Math.round(bb.width), h: Math.round(bb.height) }))
}

check('No console errors across the demo + layout pass', errors.length === 0, errors.slice(0, 4).join(' | '))

await browser.close()

/* ============ camera denial: is the message usable by a newcomer? ============
 * A fresh context with NO camera permission granted, so getUserMedia really
 * rejects — this is the single most likely thing to go wrong on demo day.
 */
const denied = await launch({ fakeCam: false, permissions: [] })
await denied.page.goto(BASE, { waitUntil: 'networkidle' })
await denied.page.waitForTimeout(700)

// Block getUserMedia the way a denied prompt does.
await denied.page.evaluate(() => {
  navigator.mediaDevices.getUserMedia = () => {
    const e = new Error('Permission denied')
    e.name = 'NotAllowedError'
    return Promise.reject(e)
  }
})

const startBtn = denied.page.getByRole('button', { name: /start tracking/i })
check('Camera toggle is discoverable', await startBtn.isVisible())
await startBtn.click()
await denied.page.waitForTimeout(1800)

const panel = (await denied.page.locator('aside').last().innerText()).replace(/\s+/g, ' ')
check('Denial is reported, not swallowed', /denied|permission/i.test(panel), panel.slice(0, 150))
check('Message says how to fix it', /site settings|allow camera/i.test(panel), panel.slice(0, 150))
check('Message reassures that the mouse still works', /mouse/i.test(panel), panel.slice(0, 150))
check('A Retry affordance is offered',
  await denied.page.getByRole('button', { name: /retry camera/i }).isVisible())
check('No raw error jargon shown to the user',
  !/NotAllowedError|undefined|\[object/i.test(panel), panel.slice(0, 150))

// The lab must remain fully usable with the mouse after a camera failure.
const dBeaker = await denied.page.locator('[data-dropzone="beaker"]').boundingBox()
const dZn = await denied.page.locator('[data-chemical-id="zn"]').first().boundingBox()
await denied.page.mouse.move(dZn.x + dZn.width / 2, dZn.y + dZn.height / 2)
await denied.page.mouse.down()
await denied.page.mouse.move(dBeaker.x + dBeaker.width / 2, dBeaker.y + dBeaker.height / 2)
await denied.page.waitForTimeout(120)
await denied.page.mouse.up()
await denied.page.waitForTimeout(400)
const dCount = await denied.page
  .locator('[data-testid="beaker-contents"] [data-content-id]').count()
check('Mouse fallback still works after a camera failure', dCount === 1, `count=${dCount}`)

await denied.browser.close()
process.exit(summary('11 demo readiness') ? 1 : 0)
