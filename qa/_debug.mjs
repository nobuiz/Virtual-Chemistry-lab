import { launch, BASE } from './harness.mjs'

const { browser, page, errors } = await launch()
console.log('BASE =', BASE)
const resp = await page.goto(BASE, { waitUntil: 'networkidle' })
console.log('HTTP', resp?.status())
await page.waitForTimeout(2500)
console.log('TITLE:', await page.title())
const html = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 600) ?? 'NO ROOT')
console.log('ROOT HTML:', html)
console.log('BODY TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 600))
console.log('ERRORS:', errors.slice(0, 10))
await browser.close()
