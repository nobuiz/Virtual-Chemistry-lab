/**
 * Visual confirmation screenshots for the physical-laboratory upgrade.
 * Writes PNGs into qa/shots/ for manual inspection.
 */
import { mkdirSync } from 'node:fs'
import { launch, BASE } from './harness.mjs'

mkdirSync('qa/shots', { recursive: true })

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const { browser, page } = await launch()
  await page.setViewportSize({ width: w, height: h })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `qa/shots/lab-${w}x${h}.png` })

  // library column on its own
  const lib = page.locator('[data-testid="library-scroll"]')
  await lib.screenshot({ path: `qa/shots/library-${w}x${h}.png` })

  // guide
  await page.getByRole('button', { name: /gesture guide/i }).click().catch(() => {})
  await page.waitForTimeout(600)
  await page.screenshot({ path: `qa/shots/guide-${w}x${h}.png` })

  console.log(`captured ${w}x${h}`)
  await browser.close()
}