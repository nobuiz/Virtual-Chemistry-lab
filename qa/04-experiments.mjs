import { launch, check, summary, BASE } from './harness.mjs'
import { ALL_REACTIONS, OUTCOME } from '../src/data/reactions.js'

const { browser, page, errors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const contents = () => page.locator('[data-testid="beaker-contents"] [data-content-id]').count()
const panel = () => page.locator('[data-testid="results-panel"]')

// =================== Experiments view: search + load ===================
await page.getByRole('button', { name: /Experiments/i }).click()
await page.waitForTimeout(350)

const allRows = await page.locator('article').count()
check('All reactions listed', allRows === ALL_REACTIONS.length, `${allRows}/${ALL_REACTIONS.length}`)

await page.locator('input[placeholder*="Search"]').fill('zinc')
await page.waitForTimeout(300)
const zincRows = await page.locator('article').count()
check('Search filters rows', zincRows > 0 && zincRows < allRows, `zinc -> ${zincRows}`)

await page.locator('input[placeholder*="Search"]').fill('zzzznotreal')
await page.waitForTimeout(300)
check('Empty search state', await page.getByText(/No modelled pair matches/).isVisible())

await page.locator('input[placeholder*="Search"]').fill('')
await page.waitForTimeout(300)

// Load the first reaction into the lab.
const target = ALL_REACTIONS[0]
await page.locator('article').first().getByRole('button', { name: /Load/i }).click()
// Assert the toast first — it self-dismisses after ~2.6s.
check('Toast confirms load', await page.getByText(/Experiment loaded/i).isVisible({ timeout: 2000 }))
await page.waitForTimeout(500)
check('Load switches to Laboratory', await page.getByText('Virtual Laboratory').isVisible())
check('Load fills beaker with 2 reagents', (await contents()) === 2, `count=${await contents()}`)
check('Loaded experiment evaluated', (await panel().innerText()).includes(target.title))

// =================== Duplicate-reagent control case (water + water) ===================
const waterPair = ALL_REACTIONS.find((r) => r.reactants[0] === r.reactants[1])
if (waterPair) {
  await page.getByRole('button', { name: /Experiments/i }).click()
  await page.waitForTimeout(300)
  await page.locator('input[placeholder*="Search"]').fill(waterPair.equation.slice(0, 6))
  await page.waitForTimeout(300)
  const row = page.locator('article').filter({ hasText: waterPair.title }).first()
  await row.getByRole('button', { name: /Load/i }).click()
  await page.waitForTimeout(600)

  check('Water+water loads both slots', (await contents()) === 2, `count=${await contents()}`)
  check('Water+water evaluates as NO_REACTION',
    (await panel().getAttribute('data-outcome')) === OUTCOME.NO_REACTION,
    `got ${await panel().getAttribute('data-outcome')}`)
  check('No duplicate-key React warning', !errors.some((e) => /same key|duplicate key/i.test(e)))

  // Removing one slot must leave exactly one behind.
  await page.locator('[data-testid="remove-ingredient"]').first().click()
  await page.waitForTimeout(350)
  check('Removing one duplicate leaves one', (await contents()) === 1, `count=${await contents()}`)
  await page.locator('[data-testid="reset-beaker"]').click()
  await page.waitForTimeout(250)
}

// =================== Quantity selector ===================
await page.getByRole('button', { name: /^Laboratory$/i }).click()
await page.waitForTimeout(350)

const card = page.locator('[data-chemical-id="zn"]')
await card.scrollIntoViewIfNeeded()
const qtyText = () => card.locator('input, [class*="tabular"]').first()

const before = await card.innerText()
const incBtn = card.locator('button').last()
await incBtn.click()
await incBtn.click()
await page.waitForTimeout(250)
const after = await card.innerText()
check('Quantity selector changes value', before !== after, `"${before.replace(/\s+/g,' ')}" -> "${after.replace(/\s+/g,' ')}"`)

// Quantity buttons must NOT start a drag (they are data-grabbable="false").
check('Quantity buttons do not grab the chemical',
  (await page.locator('[data-testid="carry-preview"]').count()) === 0)

check('No console errors in experiments/quantity flow', errors.length === 0, errors.slice(0, 4).join(' | '))

await browser.close()
process.exit(summary('04 experiments+quantity') ? 1 : 0)
