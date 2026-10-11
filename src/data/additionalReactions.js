import { CHEMICALS } from './chemicals.js'

const stable = { type: 'stable', bubbleRate: 0, bubbleScale: 0, liquidColor: null, thermal: 0, precipitate: null }
const vigorous = { type: 'bubbles', bubbleRate: 42, bubbleScale: 1.3, liquidColor: '#b9e5f2', thermal: 0.9, precipitate: null }
const sodiumSource = 'https://edu.rsc.org/experiments/reactivity-trends-of-the-alkali-metals/731.article'
const acidSource = 'https://www.chemguide.co.uk/14to16/rs/mandacids.html'
const zincSource = 'https://www.olabs.edu.in/?brch=3&cnt=1&sim=269&sub=73'
const safety = 'Virtual experiment only. Sodium with aqueous liquids can react violently and release flammable hydrogen. This simulation gives no real-world handling instructions.'

const sodiumLiquids = [
  {
    reactants: ['na', 'h2o'], outcome: 'reaction',
    title: 'Sodium + water — hydrogen evolution',
    equation: '2Na (s) + 2H₂O (l) → 2NaOH (aq) + H₂ (g)',
    ionic: '2Na (s) + 2H₂O (l) → 2Na⁺ (aq) + 2OH⁻ (aq) + H₂ (g)',
    products: ['Sodium hydroxide solution', 'Hydrogen gas'],
    conditions: 'Water at room temperature. Qualitative virtual illustration; a stylized burst illustrates a possible hazard.',
    observations: ['Rapid hydrogen bubbling', 'Strong heat release', 'Sodium is consumed and the solution becomes alkaline'],
    explanation: 'Sodium transfers electrons to water, producing hydrogen and hydroxide ions. The dissolved sodium ions and hydroxide ions form sodium hydroxide solution. This is an exothermic redox reaction. The animation illustrates gas and heat without predicting a rate or whether ignition occurs.',
    concept: 'Alkali metals · redox · metal–water reactions',
    effects: vigorous, safety, sources: [sodiumSource],
  },
  {
    reactants: ['na', 'hcl'], outcome: 'reaction',
    title: 'Sodium + dilute acid — vigorous hydrogen evolution',
    equation: '2Na (s) + 2HCl (aq) → 2NaCl (aq) + H₂ (g)',
    ionic: '2Na (s) + 2H⁺ (aq) → 2Na⁺ (aq) + H₂ (g)',
    products: ['Sodium chloride solution', 'Hydrogen gas'],
    conditions: 'Dilute aqueous acid with excess acid assumed. Equation gives the overall result, not a single reaction pathway.',
    observations: ['Vigorous gas evolution', 'Strong heat release', 'The sodium is consumed'],
    explanation: 'Sodium reacts with the aqueous medium, including water. With sufficient hydrochloric acid, any hydroxide formed is neutralised. The overall products are sodium chloride and hydrogen. Sodium in dilute acid is not a suitable hands-on classroom experiment; this entry is virtual only.',
    concept: 'Overall equations · aqueous reactions · redox',
    effects: vigorous, safety, sources: [acidSource, sodiumSource],
  },
  {
    reactants: ['na', 'h2so4'], outcome: 'reaction',
    title: 'Sodium + dilute sulfuric acid — hydrogen evolution',
    equation: '2Na (s) + H₂SO₄ (aq) → Na₂SO₄ (aq) + H₂ (g)',
    ionic: '2Na (s) + 2H⁺ (aq) → 2Na⁺ (aq) + H₂ (g)',
    products: ['Sodium sulfate solution', 'Hydrogen gas'],
    conditions: 'Dilute aqueous sulfuric acid. Overall sulfate equation assumes sufficient sodium for both acid equivalents; quantities are not simulated.',
    observations: ['Vigorous gas evolution', 'Strong heat release', 'Sodium is consumed'],
    explanation: 'Sodium reacts with the water-containing acid and releases hydrogen. The displayed overall equation represents complete conversion to sodium sulfate. Other proportions can leave acid or hydrogen sulfate, which this qualitative model does not calculate. Concentrated sulfuric acid is outside these conditions.',
    concept: 'Alkali metals · overall equations · acid equivalents',
    effects: vigorous, safety, sources: [acidSource, sodiumSource],
  },
  {
    reactants: ['na', 'naoh'], outcome: 'reaction',
    title: 'Sodium + aqueous alkali — reaction with the water',
    equation: '2Na (s) + 2H₂O (l, solvent) → 2NaOH (aq) + H₂ (g)',
    ionic: '2Na (s) + 2H₂O (l) → 2Na⁺ (aq) + 2OH⁻ (aq) + H₂ (g)',
    products: ['Additional sodium hydroxide in solution', 'Hydrogen gas'],
    conditions: 'Dilute aqueous NaOH stock, with water present as solvent. Not anhydrous or molten NaOH.',
    observations: ['Hydrogen bubbles form', 'Heat is released', 'The solution contains additional sodium hydroxide'],
    explanation: 'The NaOH bottle contains an aqueous solution. Sodium can react with its solvent water, forming additional sodium hydroxide and hydrogen. This does not mean sodium displaces another metal from NaOH. The qualitative inference uses the sodium–water reaction and does not predict concentration-dependent kinetics.',
    concept: 'Solvent participation · aqueous vs anhydrous stock',
    effects: vigorous, safety, sources: [sodiumSource],
  },
]

const metals = CHEMICALS.filter(c => c.form === 'solid')
const metalPairs = metals.flatMap((a, i) => metals.slice(i + 1).map(b => ({
  reactants: [a.id, b.id], outcome: 'no-reaction',
  title: 'Two solid metals — no immediate reaction',
  equation: `${a.symbol} (s) + ${b.symbol} (s) → no significant reaction (dry, room temperature)`,
  ionic: null, products: [],
  conditions: 'Dry solid samples at room temperature. No electrolyte, dissolved metal ions, heating or melting.',
  observations: ['Both metal samples remain visible', 'No gas or solution colour change'],
  explanation: `${a.name} and ${b.name} are solid metals here, not solutions of their salts. A reactivity-series displacement needs a source of dissolved metal ions. Placing these dry samples together produces no immediate classroom-scale reaction. Alloy formation and galvanic corrosion in an electrolyte require different conditions.`,
  concept: 'Metal vs metal ion · reaction conditions', effects: stable,
})))

const metalAlkali = ['mg', 'fe', 'cu', 'ag'].map(id => {
  const c = CHEMICALS.find(c => c.id === id)
  return {
    reactants: [id, 'naoh'], outcome: 'no-reaction',
    title: 'No significant reaction with dilute alkali on this timescale',
    equation: `${c.symbol} (s) + NaOH (aq, dilute) → no significant immediate reaction`,
    ionic: null, products: [],
    conditions: 'Dilute aqueous NaOH, room temperature, short observation time; no oxidant or applied voltage.',
    observations: ['No significant hydrogen bubbling', 'The metal remains visibly unchanged during the simulation'],
    explanation: `${c.name} does not show an appreciable immediate reaction with this dilute alkali on the short observation timescale. Unlike acid, NaOH does not supply hydrogen ions for the usual metal–acid displacement. Long-term corrosion, different concentrations, heated systems and electrochemical conditions are outside this result.`,
    concept: 'Acids vs alkalis · kinetics · stated conditions', effects: stable,
  }
})

const zincAlkali = {
  reactants: ['zn', 'naoh'], outcome: 'condition-dependent',
  title: 'Zinc in alkali — rate depends on conditions',
  equation: 'Zn (s) + 2OH⁻ (aq) + 2H₂O (l) → [Zn(OH)₄]²⁻ (aq) + H₂ (g)',
  ionic: 'Zn (s) + 2OH⁻ (aq) + 2H₂O (l) → [Zn(OH)₄]²⁻ (aq) + H₂ (g)',
  products: ['Dissolved zincate complex (if reaction proceeds)', 'Hydrogen gas (if reaction proceeds)'],
  conditions: 'The stock is dilute NaOH at room temperature. No visible rate is predicted; concentration, temperature and surface condition matter.',
  observations: ['Rapid bubbling is not assumed for this dilute stock', 'Zinc can dissolve in suitable alkaline conditions with hydrogen evolution'],
  explanation: 'Zinc can react in aqueous alkali, producing dissolved zincate species and hydrogen. The displayed balanced equation uses tetrahydroxozincate. A classroom demonstration under different conditions cannot establish the rate for this dilute, unheated stock, so the simulation explains the pathway without inventing a fast animation or declaring that zinc never reacts with NaOH.',
  concept: 'Amphoteric chemistry · complexes · kinetics', effects: stable, sources: [zincSource],
}

const acidMix = {
  reactants: ['hcl', 'h2so4'], outcome: 'no-reaction',
  title: 'Two dilute acids — mixing without neutralisation',
  equation: 'HCl (aq, dilute) + H₂SO₄ (aq, dilute) → mixed acidic solution',
  ionic: null, products: ['Mixed acidic solution'],
  conditions: 'Both stocks are already dilute aqueous acids at room temperature. No concentrated-acid chemistry is represented.',
  observations: ['No hydrogen bubbles', 'No precipitate', 'The mixture remains acidic'],
  explanation: 'Both solutions are acidic. Mixing them supplies no alkali for neutralisation and no metal for hydrogen evolution. The ions redistribute and equilibrate in the mixed solution. This is not the concentrated-acid system; its heat and speciation are not calculated.',
  concept: 'Mixing vs neutralisation · aqueous conditions', effects: stable,
}

export const ADDITIONAL_REACTIONS = [...sodiumLiquids, ...metalPairs, ...metalAlkali, zincAlkali, acidMix]
