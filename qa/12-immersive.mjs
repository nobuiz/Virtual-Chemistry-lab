import { launch, BASE_3D, check, summary } from './harness.mjs'

const { browser, page, errors } = await launch({ fakeCam: false })
try {
  await page.goto(BASE_3D)
  await page.waitForFunction(() => window.__gl_lab3d?.slot('zn'))
  check('3D canvas mounted', await page.locator('[data-testid="lab3d-viewport"] canvas').count() === 1)
  const point = (id) => page.evaluate(id => id === 'beaker' ? window.__gl_lab3d.beaker() : window.__gl_lab3d.slot(id), id)
  const drop = async (id, hold = false) => {
    const from = await point(id), to = await point('beaker')
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 12 })
    if (hold) await page.waitForTimeout(1800)
    await page.mouse.up()
  }
  await drop('zn')
  check('3D solid release reaches shared beaker', await page.locator('[data-remove-id="zn"]').count() === 1)
  await drop('hcl', true)
  await page.waitForTimeout(500)
  check('3D held bottle pours exactly once', await page.locator('[data-remove-id="hcl"]').count() === 1)
  check('Shared engine resolves zinc + acid', await page.locator('[data-testid="results-panel"]').getAttribute('data-outcome') === 'reaction')
  await page.getByRole('button', { name: /reset/i }).click()
  check('Reset clears 3D ingredients', await page.locator('[data-remove-id]').count() === 0)
  const zinc = await point('zn'), beaker = await point('beaker')
  await page.evaluate(({ zinc, beaker }) => {
    const frame = window.__gl_handFrame
    frame({ handPresent: true, pinching: true, point: zinc, landmarks: [] })
    frame({ handPresent: true, pinching: true, point: beaker, landmarks: [] })
    frame({ handPresent: true, pinching: false, point: beaker, landmarks: [] })
  }, { zinc, beaker })
  check('MediaPipe bridge works with 3D hit testing', await page.locator('[data-remove-id="zn"]').count() === 1)
  await page.getByRole('link', { name: '2D fallback' }).click()
  await page.waitForSelector('[data-testid="library-scroll"]')
  check('Visible fallback opens classic lab', page.url().includes('mode=classic'))
  check('No browser errors', errors.length === 0, errors.join('\n'))
} finally {
  await browser.close()
}
process.exitCode = summary('Immersive laboratory') ? 1 : 0

