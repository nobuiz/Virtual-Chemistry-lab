import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transform } from 'sucrase'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { evaluateExperiment, ALL_REACTIONS } from '../src/data/reactions.js'
import { getChemical } from '../src/data/chemicals.js'
import { burstState, gasParticle } from '../src/lib/reactionVisuals.js'

const pair = (a, b) => evaluateExperiment([getChemical(a), getChemical(b)])
const zinc = pair('zn', 'hcl'), sodium = pair('na', 'h2o'), stable = pair('cu', 'h2o')
assert.equal(zinc.effects.gas, 'H₂')
assert.equal(zinc.effects.explosion, false)
assert.match(zinc.hazard, /Hydrogen gas is flammable/)
assert.equal(sodium.effects.explosion, true)
assert.match(sodium.conditions, /not a prediction/)
assert.equal(stable.effects.gas, null)
assert.equal(stable.hazard, undefined)
assert.equal(ALL_REACTIONS.filter(r => r.effects.explosion).length, 1)
for (const r of ALL_REACTIONS) {
  if (r.reactants.some(id => ['na', 'hcl', 'h2so4', 'naoh'].includes(id))) assert.ok(r.hazard)
}
assert.equal(burstState(0).active, false)
assert.equal(burstState(1).active, true)
assert.ok(burstState(1).opacity > 0)
assert.equal(burstState(2.7).active, false)
assert.equal(burstState(50).active, false)
for (let i = 0; i < 24; i++) for (const t of [0, 1, 10]) {
  const particle = gasParticle(t, i)
  assert.ok(particle.rise >= 0 && particle.rise < 1)
  assert.ok(particle.opacity >= 0 && particle.opacity <= 0.8)
}

const component = async path => {
  const source = await readFile(path, 'utf8')
  const code = transform(source, { transforms: ['jsx'], production: true, jsxRuntime: 'classic' }).code
  return new Function('React', code.replace('export default function', 'return function'))(React)
}
const Warning = await component('src/components/ReactionWarning.jsx')
const Plume = await component('src/components/ReactionPlume.jsx')
assert.match(renderToStaticMarkup(createElement(Warning, { result: zinc })), /DO NOT TRY THIS/)
assert.equal(renderToStaticMarkup(createElement(Warning, { result: stable })), '')
const sodiumHtml = renderToStaticMarkup(createElement(Plume, { effects: sodium.effects }))
assert.match(sodiumHtml, /reaction-explosion/)
assert.match(sodiumHtml, /escaping-gas/)
assert.doesNotMatch(renderToStaticMarkup(createElement(Plume, { effects: zinc.effects })), /reaction-explosion/)
assert.equal(renderToStaticMarkup(createElement(Plume, { effects: stable.effects })), '')
console.log('PASS: gas identity, hazardous-pair warnings, sodium-only burst, finite burst timing, particle ranges and rendered warning/plume markup')
