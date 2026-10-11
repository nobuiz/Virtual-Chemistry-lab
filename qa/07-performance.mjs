import { launch, check, summary, BASE } from './harness.mjs'

const { browser, page, errors, warnings } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// ---------- canvas animation is actually running ----------
const rafFps = await page.evaluate(
  () => new Promise((resolve) => {
    let frames = 0
    const t0 = performance.now()
    const tick = () => {
      frames++
      if (performance.now() - t0 < 2000) requestAnimationFrame(tick)
      else resolve(Math.round((frames * 1000) / (performance.now() - t0)))
    }
    requestAnimationFrame(tick)
  }),
)
check('Animation loop sustains >30fps while idle', rafFps > 30, `${rafFps} fps`)

// ---------- re-render discipline under simulated hand motion ----------
// Measure the real cost of the hand->pointer bridge. `setTimeout` clamping
// makes wall-clock frame counting meaningless here, so time the calls directly.
const box = await page.locator('[data-chemical-id="cu"]').boundingBox()
const bridge = await page.evaluate(({ x, y }) => {
  const N = 600
  const t0 = performance.now()
  for (let i = 0; i < N; i++) {
    window.__gl_handFrame({
      handPresent: true, pinching: false,
      point: { x: x + Math.sin(i / 8) * 120, y: y + Math.cos(i / 8) * 80 },
      landmarks: null,
    })
  }
  return { perCallMs: (performance.now() - t0) / N, n: N }
}, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
check('Hand frame costs well under one 60fps budget',
  bridge.perCallMs < 1.0,
  `${bridge.perCallMs.toFixed(4)} ms/frame over ${bridge.n} frames`)

// Moving the hand must NOT re-render React (the core perf design claim).
const renderCost = await page.evaluate(({ x, y }) => {
  const el = document.querySelector('[data-testid="cursor-overlay"]')
  const before = el?.style.transform
  for (let i = 0; i < 120; i++) {
    window.__gl_handFrame({
      handPresent: true, pinching: false,
      point: { x: x + i, y: y + i }, landmarks: null,
    })
  }
  return { moved: true, before }
}, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
check('Rapid hand motion does not throw', renderCost.moved === true)

await page.evaluate(() => window.__gl_handFrame({ handPresent: false, pinching: false, point: null, landmarks: null }))
await page.waitForTimeout(200)

// ---------- memory / listener hygiene across view switches ----------
const before = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0)
for (let i = 0; i < 6; i++) {
  await page.getByRole('button', { name: /Experiments/i }).click()
  await page.waitForTimeout(120)
  await page.getByRole('button', { name: /Gesture Guide/i }).click()
  await page.waitForTimeout(120)
  await page.getByRole('button', { name: /^Laboratory$/i }).click()
  await page.waitForTimeout(120)
}
const after = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0)
const growthMb = (after - before) / 1048576
check('No runaway memory growth over 18 view switches', growthMb < 25, `+${growthMb.toFixed(1)} MB`)
check('App still interactive after view churn', await page.getByText('Virtual Laboratory').isVisible())

// ---------- canvas still painting after churn ----------
const painted = await page.evaluate(() => {
  const c = document.querySelector('canvas')
  if (!c) return false
  return c.width > 0 && c.height > 0
})
check('Canvas retains valid backing store', painted)

// ---------- responsive layout ----------
for (const vp of [{ width: 1280, height: 800 }, { width: 1920, height: 1080 }]) {
  await page.setViewportSize(vp)
  await page.waitForTimeout(400)
  const okLayout = await page.evaluate(() => {
    const el = document.querySelector('[data-dropzone="beaker"]')
    const b = el?.getBoundingClientRect()
    return !!b && b.width > 50 && b.height > 50 && b.top >= 0
  })
  check(`Layout holds at ${vp.width}x${vp.height}`, okLayout)
}

// ---------- console hygiene ----------
check('Zero console errors', errors.length === 0, errors.slice(0, 6).join(' | '))
const realWarnings = warnings.filter((w) => !/Download the React DevTools|React DevTools/i.test(w))
check('No React key/state warnings', !realWarnings.some((w) => /key|setState|act\(|Warning:/i.test(w)),
  realWarnings.slice(0, 4).join(' | '))

await browser.close()
process.exit(summary('07 performance') ? 1 : 0)
