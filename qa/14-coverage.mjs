import assert from 'node:assert/strict'
import { CHEMICALS, getChemical } from '../src/data/chemicals.js'
import { ALL_REACTIONS, MODELLED_PAIR_COUNT, OUTCOME, evaluateExperiment, modelledPartnersFor } from '../src/data/reactions.js'

assert.equal(getChemical('au'), null)
assert.equal(getChemical('na').symbol, 'Na')
assert.equal(CHEMICALS.length, 10)
const seen = new Set()
for (const entry of ALL_REACTIONS) {
  const key = [...entry.reactants].sort().join('+')
  assert.ok(!seen.has(key), `Duplicate ${key}`)
  seen.add(key)
  assert.ok(entry.reactants.every(id => getChemical(id)), `Missing reagent ${key}`)
  assert.ok(entry.conditions && entry.explanation && entry.observations.length && entry.effects)
}
let count = 0
for (let i = 0; i < CHEMICALS.length; i++) for (let j = i + 1; j < CHEMICALS.length; j++) {
  const a = CHEMICALS[i], b = CHEMICALS[j]
  const result = evaluateExperiment([a, b])
  assert.notEqual(result.outcome, OUTCOME.NOT_MODELLED, `${a.id}+${b.id}`)
  assert.deepEqual(result.effects, evaluateExperiment([b, a]).effects)
  assert.ok(modelledPartnersFor(a.id).includes(b.id))
  count++
}
assert.equal(count, 45)
assert.equal(MODELLED_PAIR_COUNT, 46)
for (const id of ['h2o', 'hcl', 'h2so4', 'naoh']) {
  const result = evaluateExperiment([getChemical('na'), getChemical(id)])
  assert.equal(result.outcome, OUTCOME.REACTION)
  assert.ok(result.effects.bubbleRate > 0 && result.effects.thermal > 0)
  assert.ok(result.safety && result.sources.length)
  assert.ok(result.products.includes('Hydrogen gas'))
}
const zinc = evaluateExperiment([getChemical('zn'), getChemical('naoh')])
assert.equal(zinc.outcome, OUTCOME.CONDITIONAL)
assert.equal(zinc.effects.bubbleRate, 0)
assert.equal(evaluateExperiment([{ id: 'unknown' }, getChemical('h2o')]).outcome, OUTCOME.NOT_MODELLED)
assert.equal(evaluateExperiment([]).outcome, OUTCOME.INCOMPLETE)
console.log(`PASS: all ${count} distinct available pairs covered; ${MODELLED_PAIR_COUNT} entries including water control. Sodium outcomes, condition-dependent zinc, unknown fallback and duplicates verified.`)
