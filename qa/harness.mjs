import { chromium } from 'playwright-core'

export const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

/** Origin the dev/preview server is serving on. */
export const ORIGIN = process.env.QA_ORIGIN || 'http://localhost:5190'

/**
 * Default target for the suites.
 *
 * Suites 01-11 assert against the CLASSIC 2D dashboard, so they request it
 * explicitly with `?mode=classic`. That is not a workaround: the 2D view is a
 * shipped, supported fallback (low-GPU machines, reduced motion, screen
 * readers), so it genuinely needs this coverage. Pinning it here means the
 * renderer swap cost the regression suite nothing.
 *
 * `QA_BASE` still overrides everything, so a one-off run can point anywhere.
 */
export const BASE = process.env.QA_BASE || `${ORIGIN}/?mode=classic`

/** The immersive 3D lab — the default experience, covered by suite 12. */
export const BASE_3D = process.env.QA_BASE_3D || ORIGIN

/** Chromium flags that provide a *real* MediaStream from a synthetic device. */
export const FAKE_CAM_ARGS = [
  '--use-fake-device-for-media-stream',
  '--use-fake-ui-for-media-stream',
  '--autoplay-policy=no-user-gesture-required',
]

export async function launch({ fakeCam = true, permissions = ['camera'] } = {}) {
  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true,
    args: fakeCam ? FAKE_CAM_ARGS : ['--autoplay-policy=no-user-gesture-required'],
  })
  const context = await browser.newContext({
    viewport: { width: 1600, height: 950 },
    permissions,
  })
  const page = await context.newPage()

  const errors = []
  const warnings = []
  page.on('console', (m) => {
    const t = m.type()
    if (t === 'error') errors.push(m.text())
    else if (t === 'warning') warnings.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText || ''
    // Aborted media/range requests are normal; record everything else.
    if (!/ERR_ABORTED/.test(f)) errors.push(`REQFAIL ${r.url()} ${f}`)
  })

  return { browser, context, page, errors, warnings }
}

const results = []
export function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} :: ${name}${detail ? ` :: ${detail}` : ''}`)
  return pass
}
export function summary(label) {
  const failed = results.filter((r) => !r.pass)
  console.log(`\n==== ${label}: ${results.length - failed.length}/${results.length} passed ====`)
  if (failed.length) {
    console.log('FAILURES:')
    failed.forEach((f) => console.log(`  - ${f.name} :: ${f.detail}`))
  }
  return failed.length
}
