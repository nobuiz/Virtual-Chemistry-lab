import { launch, check, summary, BASE } from './harness.mjs'

const { browser, page, errors } = await launch()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

const centerOf = async (sel) => {
  const b = await page.locator(sel).first().boundingBox()
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}

/** Drag a chemical card into the beaker using real mouse events. */
async function dragToBeaker(id) {
  const from = await centerOf(`[data-chemical-id="${id}"]`)
  const to = await centerOf('[data-dropzone="beaker"]')
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  // Several intermediate moves so hover/drop-zone transitions actually fire.
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 6, from.y + ((to.y - from.y) * i) / 6)
    await page.waitForTimeout(30)
  }
  await page.waitForTimeout(80)
  await page.mouse.up()
  await page.waitForTimeout(450)
}

const contents = () =>
  page.locator('[data-testid="beaker-contents"] [data-content-id]').count()

// ---------- grab feedback ----------
const from = await centerOf('[data-chemical-id="zn"]')
await page.mouse.move(from.x, from.y)
await page.waitForTimeout(150)
await page.mouse.down()
await page.mouse.move(from.x + 40, from.y + 40)
await page.waitForTimeout(150)
check('Cursor overlay appears while dragging', await page.locator('[data-testid="cursor-overlay"]').isVisible())
const carryEl = page.locator('[data-testid="carry-preview"]')
const carryId = await carryEl.getAttribute('data-carry-id')
const carryText = (await carryEl.innerText()).replace(/\s+/g, ' ').trim()
check('Carried preview shows grabbed chemical', carryId === 'zn', `id=${carryId} text="${carryText}"`)
check('Carried preview shows symbol + quantity', /Zn/.test(carryText) && /\d+\s*vu/.test(carryText), `text="${carryText}"`)
check('Cursor marked pinching while held', (await page.locator('[data-testid="cursor-overlay"]').getAttribute('data-pinching')) === 'true')

const to = await centerOf('[data-dropzone="beaker"]')
await page.mouse.move(to.x, to.y)
await page.waitForTimeout(200)
check('Drop halo activates over beaker', await page.getByText('Release to add').isVisible())
await page.mouse.up()
await page.waitForTimeout(500)

check('Zn added to beaker', (await contents()) === 1, `count=${await contents()}`)
check('Beaker no longer empty', !(await page.getByText('Empty — pinch a reagent').isVisible()))

// ---------- second reagent triggers a reaction ----------
await dragToBeaker('hcl')
check('HCl added (2 ingredients)', (await contents()) === 2, `count=${await contents()}`)

const resultText = await page.locator('[data-testid="results-panel"]').innerText()
check('Reaction evaluated: Zn + HCl', /Single Displacement|Zn.*HCl|hydrogen/i.test(resultText))
check('Equation rendered', /Zn/.test(resultText) && /H₂|H2/.test(resultText))
check('Observations listed', /Observ/i.test(resultText))

// ---------- max 2 reagents ----------
await dragToBeaker('cu')
check('Third reagent blocked at 2', (await contents()) === 2, `count=${await contents()}`)
check('Max-capacity warning shown', await page.getByText(/holds two reagents|Beaker is full|max/i).first().isVisible())

// ---------- remove one ----------
await page.locator('[data-testid="remove-ingredient"]').first().click()
await page.waitForTimeout(350)
check('Remove button works', (await contents()) === 1, `count=${await contents()}`)

// ---------- reset ----------
await page.locator('[data-testid="reset-beaker"]').click()
await page.waitForTimeout(400)
check('Reset empties beaker', (await contents()) === 0)
check('Empty message returns', await page.getByText('Empty — pinch a reagent').isVisible())

check('No console errors during drag flow', errors.length === 0, errors.slice(0, 5).join(' | '))

await browser.close()
process.exit(summary('02 mouse drag') ? 1 : 0)
