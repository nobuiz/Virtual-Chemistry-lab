import { launch, check, summary, BASE } from './harness.mjs'

const { browser, page, errors } = await launch()

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// --- shell renders ---
check('App shell mounts', (await page.locator('#root > div').count()) > 0)
check('Header brand visible', await page.getByText('GestureLab').first().isVisible())
check('Chemical Library panel', await page.getByText('Chemical Library').isVisible())
check('Virtual Laboratory panel', await page.getByText('Virtual Laboratory').isVisible())
check('Vision & Analysis panel', await page.getByText('Vision & Analysis').isVisible())

// --- library contents ---
const cards = page.locator('[data-chemical-id]')
const n = await cards.count()
check('All 10 chemicals rendered', n === 10, `found ${n}`)

const ids = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-chemical-id')))
const expected = ['na', 'ag', 'cu', 'fe', 'zn', 'mg', 'hcl', 'h2so4', 'naoh', 'h2o']
check('Chemical ids correct', expected.every((e) => ids.includes(e)), ids.join(','))
check('Cards are grabbable', (await page.locator('[data-chemical-id][data-grabbable="true"]').count()) === 10)

// --- beaker / dropzone ---
check('Drop zone present', (await page.locator('[data-dropzone="beaker"]').count()) === 1)
const canvasCount = await page.locator('canvas').count()
check('Canvases mounted (liquid + overlay)', canvasCount === 2, `found ${canvasCount}`)
check('Empty beaker message', await page.getByText('Empty — pinch a reagent').isVisible())

// --- camera idle state ---
check('Camera off chip', await page.getByText('Camera off').first().isVisible())
check('Start Tracking button', await page.getByRole('button', { name: /Start Tracking/i }).isVisible())
check('Camera idle overlay copy', await page.getByText(/Camera is off\./).isVisible())

// --- nav ---
await page.getByRole('button', { name: /Experiments/i }).click()
await page.waitForTimeout(400)
check('Experiments view', await page.getByText('Verified reaction database').isVisible())
const rowCount = await page.locator('article').count()
check('Reaction rows listed', rowCount >= 20, `rows=${rowCount}`)

await page.getByRole('button', { name: /Gesture Guide/i }).click()
await page.waitForTimeout(400)
check('Guide view', await page.getByText('How to use GestureLab AI').isVisible())

await page.getByRole('button', { name: /Laboratory/i }).click()
await page.waitForTimeout(400)
check('Back to lab', await page.getByText('Virtual Laboratory').isVisible())

check('No console errors on load', errors.length === 0, errors.slice(0, 5).join(' | '))

await browser.close()
process.exit(summary('01 smoke') ? 1 : 0)
