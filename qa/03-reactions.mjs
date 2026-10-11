import { launch, check, summary, BASE } from './harness.mjs'
import { ALL_REACTIONS, OUTCOME } from '../src/data/reactions.js'

const { browser, page, errors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const centerOf = async (sel) => {
  const b = await page.locator(sel).first().boundingBox()
  if (!b) throw new Error(`no box for ${sel}`)
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}

async function dragToBeaker(id) {
  // Card may be scrolled out of view in the library column.
  await page.locator(`[data-chemical-id="${id}"]`).scrollIntoViewIfNeeded()
  await page.waitForTimeout(60)
  const from = await centerOf(`[data-chemical-id="${id}"]`)
  const to = await centerOf('[data-dropzone="beaker"]')
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 5, from.y + ((to.y - from.y) * i) / 5)
    await page.waitForTimeout(16)
  }
  await page.mouse.up()
  await page.waitForTimeout(260)
}

async function reset() {
  const btn = page.locator('[data-testid="reset-beaker"]')
  if (await btn.count()) {
    await btn.click()
    await page.waitForTimeout(220)
  }
}

/** Read the canvas effect params the renderer is actually being driven with. */
const readEffects = () => page.evaluate(() => window.__gl_effects ?? null)

let okCount = 0
const failures = []

for (const rx of ALL_REACTIONS) {
  const [a, b] = rx.reactants
  // Same-reagent control cases (water + water) cannot be produced by dragging,
  // because adding a duplicate is intentionally blocked. Those are covered
  // through the Experiments "Load" path in 04-experiments.mjs.
  if (a === b) continue
  await reset()
  await dragToBeaker(a)
  await dragToBeaker(b)

  const panel = page.locator('[data-testid="results-panel"]')
  const outcome = await panel.getAttribute('data-outcome')
  const text = (await panel.innerText()).replace(/\s+/g, ' ')

  const problems = []
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim()
  if (outcome !== rx.outcome) problems.push(`outcome=${outcome} want=${rx.outcome}`)
  if (!text.includes(norm(rx.title))) problems.push('title missing')
  if (rx.equation && !text.includes(norm(rx.equation))) problems.push('equation missing')
  if (rx.observations?.length && !text.includes(norm(rx.observations[0]))) problems.push('obs missing')

  // Animation parameters must reach the canvas layer.
  const fx = await readEffects()
  if (!fx) problems.push('no effects published')
  else {
    if (Math.abs((fx.bubbleRate ?? 0) - (rx.effects.bubbleRate ?? 0)) > 0.001)
      problems.push(`bubbleRate=${fx.bubbleRate} want=${rx.effects.bubbleRate}`)
    if (Math.abs((fx.thermal ?? 0) - (rx.effects.thermal ?? 0)) > 0.001)
      problems.push(`thermal=${fx.thermal} want=${rx.effects.thermal}`)
    if (fx.fillLevel <= 0) problems.push('fillLevel not raised')
  }

  if (problems.length) failures.push(`${a}+${b}: ${problems.join('; ')}`)
  else okCount++
}

const dragPairs = ALL_REACTIONS.filter((r) => r.reactants[0] !== r.reactants[1])
check(`All ${dragPairs.length} drag-reachable reactions render correctly`, failures.length === 0,
  failures.length ? failures.slice(0, 6).join(' || ') : `${okCount} verified`)

// ---------- reversed reagent order ----------
const rev = ALL_REACTIONS[0]
await reset()
await dragToBeaker(rev.reactants[1])
await dragToBeaker(rev.reactants[0])
check('Reagent order does not matter',
  (await page.locator('[data-testid="results-panel"]').innerText()).includes(rev.title))

// Unknown IDs still use the honest unsupported fallback.
const unknown = (await import('../src/data/reactions.js')).evaluateExperiment([{ id: 'unknown' }, { id: 'h2o' }])
check('Unknown pair remains unsupported', unknown.outcome === OUTCOME.NOT_MODELLED)
check('Not-modelled differs from no reaction', /NOT the same/.test(unknown.message))

// ---------- single reagent ----------
await reset()
await dragToBeaker('h2o')
check('Single reagent = incomplete',
  (await page.locator('[data-testid="results-panel"]').getAttribute('data-outcome')) === OUTCOME.INCOMPLETE)

check('No console errors across all reactions', errors.length === 0, errors.slice(0, 4).join(' | '))

await browser.close()
process.exit(summary('03 reactions') ? 1 : 0)
