import { ADDITIONAL_REACTIONS } from './additionalReactions.js'
/**
 * GestureLab AI — deterministic reaction engine.
 *
 * DESIGN RULES (do not break these):
 *  1. Nothing here is generated or guessed. Every entry is a hand-written,
 *     textbook-level case with its assumptions written down.
 *  2. A combination is only reported as "no significant reaction" when that
 *     outcome itself is verified. Everything else is "Reaction not modelled".
 *  3. Animations are qualitative illustrations, never quantitative predictions.
 *  4. Quantities are recorded and displayed but DO NOT change the chemistry.
 *     No stoichiometry is simulated in this MVP.
 *  5. This is an educational simulation. No practical/real-world procedures.
 */

export const OUTCOME = {
  REACTION: 'reaction',
  CONDITIONAL: 'condition-dependent',
  NO_REACTION: 'no-reaction',
  NOT_MODELLED: 'not-modelled',
  INCOMPLETE: 'incomplete',
}

export const EFFECT = {
  BUBBLES: 'bubbles',
  THERMAL: 'thermal',
  COLOR: 'color',
  PRECIPITATE: 'precipitate',
  STABLE: 'stable',
  NEUTRAL: 'neutral',
}

const key = (a, b) => [a, b].sort().join('+')

/**
 * effects.bubbleRate  — bubbles per second (visual only)
 * effects.liquidColor — resulting simulated liquid colour
 * effects.thermal     — 0..1 glow strength, qualitative "feels warm" cue only
 */
const RAW_REACTIONS = [
  /* ------------------------- METAL + DILUTE ACID ------------------------- */
  {
    reactants: ['zn', 'hcl'],
    outcome: OUTCOME.REACTION,
    title: 'Single displacement — hydrogen evolution',
    equation: 'Zn (s) + 2HCl (aq) → ZnCl₂ (aq) + H₂ (g)',
    ionic: 'Zn (s) + 2H⁺ (aq) → Zn²⁺ (aq) + H₂ (g)',
    products: ['Zinc chloride (aq)', 'Hydrogen gas'],
    conditions: 'Dilute hydrochloric acid, room temperature, excess acid assumed.',
    observations: [
      'Steady stream of colourless gas bubbles from the metal surface',
      'The zinc granules slowly get smaller',
      'The mixture warms noticeably (exothermic)',
      'Solution stays essentially colourless',
    ],
    explanation:
      'Zinc lies above hydrogen in the reactivity series, so it can displace hydrogen from a dilute strong acid. Each zinc atom gives up two electrons to become Zn²⁺, and those electrons reduce two H⁺ ions from the acid to form H₂ gas. The chloride ions are spectator ions — they stay dissolved and simply pair with the zinc ions as the product salt, zinc chloride.',
    concept: 'Reactivity series · redox · spectator ions',
    effects: {
      type: EFFECT.BUBBLES,
      bubbleRate: 18,
      bubbleScale: 1,
      liquidColor: '#8fd8e8',
      thermal: 0.35,
      precipitate: null,
    },
  },
  {
    reactants: ['fe', 'hcl'],
    outcome: OUTCOME.REACTION,
    title: 'Single displacement — hydrogen evolution',
    equation: 'Fe (s) + 2HCl (aq) → FeCl₂ (aq) + H₂ (g)',
    ionic: 'Fe (s) + 2H⁺ (aq) → Fe²⁺ (aq) + H₂ (g)',
    products: ['Iron(II) chloride (aq)', 'Hydrogen gas'],
    conditions:
      'Dilute hydrochloric acid, room temperature. Iron(II) is the product with a dilute non-oxidising acid.',
    observations: [
      'Gas bubbles form more slowly than with zinc or magnesium',
      'The solution gradually takes on a pale green tint from Fe²⁺',
      'The iron filings are consumed over time',
    ],
    explanation:
      'Iron is above hydrogen in the reactivity series, so it displaces hydrogen from dilute hydrochloric acid. Because HCl is a dilute, non-oxidising acid, iron is oxidised only to the +2 state, giving iron(II) chloride rather than iron(III) chloride. The pale green colour of the solution is characteristic of hydrated Fe²⁺ ions.',
    concept: 'Reactivity series · oxidation states · non-oxidising acid',
    effects: {
      type: EFFECT.BUBBLES,
      bubbleRate: 10,
      bubbleScale: 0.85,
      liquidColor: '#8fd6a8',
      thermal: 0.22,
      precipitate: null,
    },
  },
  {
    reactants: ['mg', 'hcl'],
    outcome: OUTCOME.REACTION,
    title: 'Vigorous single displacement',
    equation: 'Mg (s) + 2HCl (aq) → MgCl₂ (aq) + H₂ (g)',
    ionic: 'Mg (s) + 2H⁺ (aq) → Mg²⁺ (aq) + H₂ (g)',
    products: ['Magnesium chloride (aq)', 'Hydrogen gas'],
    conditions: 'Dilute hydrochloric acid, room temperature, excess acid assumed.',
    observations: [
      'Rapid, vigorous effervescence',
      'The magnesium ribbon disappears quickly',
      'Clearly exothermic — the mixture heats up fast',
      'Solution remains colourless',
    ],
    explanation:
      'Magnesium is much higher in the reactivity series than zinc or iron, so the same displacement reaction happens far faster. Magnesium is oxidised to Mg²⁺ and hydrogen ions are reduced to hydrogen gas. The high rate is why this pairing is the classic classroom demonstration of a metal–acid reaction.',
    concept: 'Reactivity series · reaction rate · exothermic redox',
    effects: {
      type: EFFECT.BUBBLES,
      bubbleRate: 34,
      bubbleScale: 1.25,
      liquidColor: '#a9e7f5',
      thermal: 0.6,
      precipitate: null,
    },
  },
  {
    reactants: ['zn', 'h2so4'],
    outcome: OUTCOME.REACTION,
    title: 'Single displacement — hydrogen evolution',
    equation: 'Zn (s) + H₂SO₄ (aq) → ZnSO₄ (aq) + H₂ (g)',
    ionic: 'Zn (s) + 2H⁺ (aq) → Zn²⁺ (aq) + H₂ (g)',
    products: ['Zinc sulfate (aq)', 'Hydrogen gas'],
    conditions:
      'DILUTE sulfuric acid, room temperature. Hot concentrated H₂SO₄ behaves as an oxidising acid and is NOT modelled here.',
    observations: [
      'Colourless gas bubbles rise from the zinc',
      'Zinc dissolves gradually',
      'Mixture warms',
    ],
    explanation:
      'Dilute sulfuric acid behaves as an ordinary strong acid, so the active species is H⁺. Zinc, being above hydrogen in the reactivity series, reduces those H⁺ ions to hydrogen gas while being oxidised to Zn²⁺. Sulfate is a spectator ion here. This is only true for the dilute acid — hot concentrated sulfuric acid is a different, oxidising system that this simulation deliberately does not model.',
    concept: 'Dilute vs concentrated acid behaviour',
    effects: {
      type: EFFECT.BUBBLES,
      bubbleRate: 16,
      bubbleScale: 1,
      liquidColor: '#9fd9e0',
      thermal: 0.33,
      precipitate: null,
    },
  },
  {
    reactants: ['mg', 'h2so4'],
    outcome: OUTCOME.REACTION,
    title: 'Vigorous single displacement',
    equation: 'Mg (s) + H₂SO₄ (aq) → MgSO₄ (aq) + H₂ (g)',
    ionic: 'Mg (s) + 2H⁺ (aq) → Mg²⁺ (aq) + H₂ (g)',
    products: ['Magnesium sulfate (aq)', 'Hydrogen gas'],
    conditions: 'DILUTE sulfuric acid, room temperature. Concentrated acid is not modelled.',
    observations: [
      'Fast effervescence of hydrogen',
      'Magnesium is consumed rapidly',
      'Strongly exothermic',
    ],
    explanation:
      'Magnesium displaces hydrogen from dilute sulfuric acid quickly because of its high position in the reactivity series. The products are the soluble salt magnesium sulfate and hydrogen gas.',
    concept: 'Reactivity series · reaction rate',
    effects: {
      type: EFFECT.BUBBLES,
      bubbleRate: 30,
      bubbleScale: 1.2,
      liquidColor: '#a9e2ef',
      thermal: 0.55,
      precipitate: null,
    },
  },
  {
    reactants: ['fe', 'h2so4'],
    outcome: OUTCOME.REACTION,
    title: 'Single displacement — hydrogen evolution',
    equation: 'Fe (s) + H₂SO₄ (aq) → FeSO₄ (aq) + H₂ (g)',
    ionic: 'Fe (s) + 2H⁺ (aq) → Fe²⁺ (aq) + H₂ (g)',
    products: ['Iron(II) sulfate (aq)', 'Hydrogen gas'],
    conditions: 'DILUTE sulfuric acid, room temperature. Concentrated acid is not modelled.',
    observations: ['Slow to moderate bubbling', 'Pale green Fe²⁺ colour develops'],
    explanation:
      'With dilute sulfuric acid, iron is oxidised only to iron(II), producing the pale green iron(II) sulfate solution together with hydrogen gas. As with hydrochloric acid, the dilute acid is non-oxidising, so Fe³⁺ is not formed.',
    concept: 'Oxidation states · non-oxidising acid',
    effects: {
      type: EFFECT.BUBBLES,
      bubbleRate: 9,
      bubbleScale: 0.85,
      liquidColor: '#93d7ab',
      thermal: 0.2,
      precipitate: null,
    },
  },
  /* ------------------------------ NEUTRALISATION ------------------------------ */
  {
    reactants: ['hcl', 'naoh'],
    outcome: OUTCOME.REACTION,
    title: 'Acid–base neutralisation',
    equation: 'HCl (aq) + NaOH (aq) → NaCl (aq) + H₂O (l)',
    ionic: 'H⁺ (aq) + OH⁻ (aq) → H₂O (l)',
    products: ['Sodium chloride (aq)', 'Water'],
    conditions: 'Both dilute aqueous solutions, room temperature.',
    observations: [
      'No gas is produced — nothing dramatic to see',
      'The mixture warms up (exothermic)',
      'Solution stays colourless; pH moves toward neutral',
      'An indicator would be needed to actually see the endpoint',
    ],
    explanation:
      'A strong acid and a strong alkali neutralise each other. The only real chemical change is hydrogen ions from the acid combining with hydroxide ions from the alkali to form water — that is why the net ionic equation is just H⁺ + OH⁻ → H₂O. Sodium and chloride are spectator ions that remain dissolved as sodium chloride. The reaction releases heat: the standard enthalpy of neutralisation for a strong acid with a strong alkali is close to −57 kJ per mole of water formed.',
    concept: 'Neutralisation · spectator ions · enthalpy of neutralisation',
    effects: {
      type: EFFECT.THERMAL,
      bubbleRate: 0,
      bubbleScale: 0,
      liquidColor: '#9fd2ef',
      thermal: 0.85,
      precipitate: null,
    },
  },
  {
    reactants: ['h2so4', 'naoh'],
    outcome: OUTCOME.REACTION,
    title: 'Acid–base neutralisation (diprotic acid)',
    equation: 'H₂SO₄ (aq) + 2NaOH (aq) → Na₂SO₄ (aq) + 2H₂O (l)',
    ionic: 'H⁺ (aq) + OH⁻ (aq) → H₂O (l)',
    products: ['Sodium sulfate (aq)', 'Water'],
    conditions:
      'Both dilute aqueous solutions, room temperature. The balanced equation assumes complete neutralisation (2 mol NaOH per 1 mol H₂SO₄).',
    observations: ['No gas evolved', 'Noticeable warming — exothermic', 'Solution stays colourless'],
    explanation:
      'Sulfuric acid is diprotic, so each molecule can supply two hydrogen ions and therefore needs two formula units of sodium hydroxide for complete neutralisation. The underlying chemistry is identical to any strong acid–strong alkali pair: H⁺ and OH⁻ combine to form water, leaving Na⁺ and SO₄²⁻ as spectator ions in solution as sodium sulfate.',
    concept: 'Diprotic acids · mole ratios · neutralisation',
    effects: {
      type: EFFECT.THERMAL,
      bubbleRate: 0,
      bubbleScale: 0,
      liquidColor: '#a7cdf0',
      thermal: 0.9,
      precipitate: null,
    },
  },

  /* ------------------------- VERIFIED "NO REACTION" ------------------------- */
  {
    reactants: ['cu', 'hcl'],
    outcome: OUTCOME.NO_REACTION,
    title: 'No significant reaction',
    equation: 'Cu (s) + HCl (aq) → no significant reaction',
    ionic: null,
    products: [],
    conditions: 'Dilute hydrochloric acid, room temperature, no oxidising agent present.',
    observations: [
      'No bubbles',
      'Copper keeps its reddish metallic surface',
      'Solution stays colourless — no blue Cu²⁺ appears',
    ],
    explanation:
      'Copper sits BELOW hydrogen in the reactivity series, so it cannot donate electrons to H⁺ ions. In electrode-potential terms the Cu²⁺/Cu couple is about +0.34 V while the H⁺/H₂ couple is 0.00 V, which makes the displacement non-spontaneous. Copper therefore needs an oxidising agent (nitric acid, or hot concentrated sulfuric acid, for example) before it will dissolve — a plain dilute non-oxidising acid will not do it.',
    concept: 'Reactivity series · standard electrode potentials',
    effects: {
      type: EFFECT.STABLE,
      bubbleRate: 0,
      bubbleScale: 0,
      liquidColor: null,
      thermal: 0,
      precipitate: null,
    },
  },
  {
    reactants: ['cu', 'h2so4'],
    outcome: OUTCOME.NO_REACTION,
    title: 'No significant reaction',
    equation: 'Cu (s) + H₂SO₄ (dilute, aq) → no significant reaction',
    ionic: null,
    products: [],
    conditions:
      'DILUTE sulfuric acid, room temperature. Hot concentrated H₂SO₄ is an oxidising acid and behaves differently — that case is deliberately not modelled.',
    observations: ['No effervescence', 'No blue colour develops', 'Copper is unchanged'],
    explanation:
      'Dilute sulfuric acid only supplies H⁺, and copper is below hydrogen in the reactivity series, so no displacement occurs. The distinction matters: hot concentrated sulfuric acid attacks copper through a completely different oxidising pathway, which is why this simulation is explicit that the acid here is dilute and at room temperature.',
    concept: 'Dilute vs concentrated acid behaviour',
    effects: {
      type: EFFECT.STABLE,
      bubbleRate: 0,
      bubbleScale: 0,
      liquidColor: null,
      thermal: 0,
      precipitate: null,
    },
  },
  {
    reactants: ['ag', 'hcl'],
    outcome: OUTCOME.NO_REACTION,
    title: 'No significant reaction (no hydrogen evolved)',
    equation: 'Ag (s) + HCl (aq) → no significant reaction',
    ionic: null,
    products: [],
    conditions: 'Dilute hydrochloric acid, room temperature, no oxidising agent present.',
    observations: [
      'No gas is evolved',
      'The silver does not dissolve',
      'At most a very thin dull surface film over long periods',
    ],
    explanation:
      'Silver is below hydrogen in the reactivity series, so hydrochloric acid cannot oxidise it and no hydrogen gas is produced. Worth knowing for completeness: silver chloride is highly insoluble, so any silver ions that did form would immediately be locked up as an insoluble white solid — but with no oxidising agent present there is no meaningful source of those ions, so the practical outcome is simply that nothing happens.',
    concept: 'Reactivity series · solubility of silver halides',
    effects: {
      type: EFFECT.STABLE,
      bubbleRate: 0,
      bubbleScale: 0,
      liquidColor: null,
      thermal: 0,
      precipitate: null,
    },
  },
  {
    reactants: ['ag', 'h2so4'],
    outcome: OUTCOME.NO_REACTION,
    title: 'No significant reaction',
    equation: 'Ag (s) + H₂SO₄ (dilute, aq) → no significant reaction',
    ionic: null,
    products: [],
    conditions: 'DILUTE sulfuric acid, room temperature. Hot concentrated acid is not modelled.',
    observations: ['No hydrogen bubbles', 'Silver remains metallic'],
    explanation:
      'Silver is below hydrogen in the reactivity series (Ag⁺/Ag is about +0.80 V), so it cannot displace hydrogen from a dilute non-oxidising acid. No hydrogen gas is produced and the silver surface is unchanged.',
    concept: 'Reactivity series · electrode potentials',
    effects: {
      type: EFFECT.STABLE,
      bubbleRate: 0,
      bubbleScale: 0,
      liquidColor: null,
      thermal: 0,
      precipitate: null,
    },
  },
  /* ----------------------------- METAL + WATER ----------------------------- */
  {
    reactants: ['cu', 'h2o'],
    outcome: OUTCOME.NO_REACTION,
    title: 'No significant reaction',
    equation: 'Cu (s) + H₂O (l) → no significant reaction',
    ionic: null,
    products: [],
    conditions: 'Cold pure water, room temperature, ordinary observation time.',
    observations: ['No bubbles', 'No colour change', 'Copper surface unchanged'],
    explanation:
      'Copper is far too low in the reactivity series to displace hydrogen from water. Only highly reactive metals such as sodium, potassium or calcium react with cold water, so the copper simply sits in the beaker unchanged.',
    concept: 'Reactivity series · metal–water reactions',
    effects: { type: EFFECT.STABLE, bubbleRate: 0, bubbleScale: 0, liquidColor: null, thermal: 0, precipitate: null },
  },
  {
    reactants: ['ag', 'h2o'],
    outcome: OUTCOME.NO_REACTION,
    title: 'No significant reaction',
    equation: 'Ag (s) + H₂O (l) → no significant reaction',
    ionic: null,
    products: [],
    conditions: 'Cold pure water, room temperature.',
    observations: ['No gas', 'Silver surface unchanged'],
    explanation:
      'Silver does not displace hydrogen from water. The familiar blackening of silverware is a separate process caused by sulfur-containing compounds in the air, not by water.',
    concept: 'Reactivity series · tarnishing vs corrosion',
    effects: { type: EFFECT.STABLE, bubbleRate: 0, bubbleScale: 0, liquidColor: null, thermal: 0, precipitate: null },
  },
  {
    reactants: ['zn', 'h2o'],
    outcome: OUTCOME.NO_REACTION,
    title: 'No significant reaction under these conditions',
    equation: 'Zn (s) + H₂O (l) → no significant reaction (cold water)',
    ionic: null,
    products: [],
    conditions: 'COLD water, room temperature. Zinc with steam is a different case and is not modelled.',
    observations: ['No visible bubbling', 'Zinc appears unchanged'],
    explanation:
      'Zinc does not react appreciably with cold water. It will react with steam at high temperature to give zinc oxide and hydrogen, but that requires heating far beyond the conditions of this simulation, so the room-temperature outcome is correctly reported as no significant reaction.',
    concept: 'Condition dependence · metal + steam vs metal + cold water',
    effects: { type: EFFECT.STABLE, bubbleRate: 0, bubbleScale: 0, liquidColor: null, thermal: 0, precipitate: null },
  },
  {
    reactants: ['mg', 'h2o'],
    outcome: OUTCOME.NO_REACTION,
    title: 'Extremely slow — nothing significant on this timescale',
    equation: 'Mg (s) + 2H₂O (l) → Mg(OH)₂ (s) + H₂ (g)   [very slow in cold water]',
    ionic: null,
    products: [],
    conditions: 'COLD water, room temperature, short observation time.',
    observations: [
      'Perhaps a few tiny bubbles after a very long time',
      'Essentially nothing happens while you watch',
    ],
    explanation:
      'Magnesium does react with cold water in principle, but only extremely slowly, because the magnesium hydroxide produced is barely soluble and coats the metal surface. On a classroom timescale you see essentially nothing. With steam instead of cold water the reaction is fast and gives magnesium oxide and hydrogen — different conditions that this simulation does not model.',
    concept: 'Kinetics vs thermodynamics · surface passivation',
    effects: { type: EFFECT.STABLE, bubbleRate: 0.6, bubbleScale: 0.45, liquidColor: null, thermal: 0.04, precipitate: null },
  },
  {
    reactants: ['fe', 'h2o'],
    outcome: OUTCOME.NO_REACTION,
    title: 'No significant reaction on this timescale',
    equation: 'Fe (s) + H₂O (l) → no significant reaction (short timescale)',
    ionic: null,
    products: [],
    conditions:
      'Cold water, room temperature, short observation time. Rusting needs both water and oxygen over days to weeks.',
    observations: ['No bubbling', 'No immediate visible change'],
    explanation:
      'Iron does not displace hydrogen from cold water. Iron does corrode in the presence of water, but rusting is a slow electrochemical process that also requires dissolved oxygen and takes days or weeks — far outside the window of this experiment, so nothing significant is observed here.',
    concept: 'Corrosion · rate vs feasibility',
    effects: { type: EFFECT.STABLE, bubbleRate: 0, bubbleScale: 0, liquidColor: null, thermal: 0, precipitate: null },
  },
  /* ------------------------ DILUTION / DISSOLUTION ------------------------ */
  {
    reactants: ['naoh', 'h2o'],
    outcome: OUTCOME.REACTION,
    title: 'Dilution (physical process, exothermic)',
    equation: 'NaOH (aq) + H₂O (l) → more dilute NaOH (aq)',
    ionic: 'NaOH (aq) → Na⁺ (aq) + OH⁻ (aq)',
    products: ['Dilute sodium hydroxide solution'],
    conditions: 'Dilute stock solution mixed with water, room temperature.',
    observations: [
      'No gas, no colour change',
      'The mixture warms',
      'The solution becomes more dilute but stays alkaline',
    ],
    explanation:
      'This is a physical change rather than a new chemical reaction. Sodium hydroxide is already fully dissociated into Na⁺ and OH⁻ ions, and adding water simply spreads those ions through a larger volume. The warming comes from hydration of the ions releasing energy. It is included here because a clear temperature change with no chemical reaction is a very common source of confusion.',
    concept: 'Dissolution vs reaction · enthalpy of solution',
    effects: { type: EFFECT.THERMAL, bubbleRate: 0, bubbleScale: 0, liquidColor: '#9bb9f7', thermal: 0.4, precipitate: null },
  },
  {
    reactants: ['hcl', 'h2o'],
    outcome: OUTCOME.REACTION,
    title: 'Dilution (physical process, mildly exothermic)',
    equation: 'HCl (aq) + H₂O (l) → more dilute HCl (aq)',
    ionic: 'HCl (aq) → H⁺ (aq) + Cl⁻ (aq)',
    products: ['More dilute hydrochloric acid'],
    conditions: 'Already-dilute acid mixed with water, room temperature.',
    observations: ['No gas', 'No colour change', 'Very slight warming'],
    explanation:
      'No new substance is formed — this is dilution, a physical process. Hydrochloric acid is already fully dissociated into H⁺ and Cl⁻ ions, and adding water just spreads those ions through a larger volume, raising the pH toward neutral without ever actually reaching it. A small amount of heat is released on mixing.',
    concept: 'Dilution · pH · physical vs chemical change',
    effects: { type: EFFECT.THERMAL, bubbleRate: 0, bubbleScale: 0, liquidColor: '#6fd4e8', thermal: 0.14, precipitate: null },
  },
  {
    reactants: ['h2so4', 'h2o'],
    outcome: OUTCOME.REACTION,
    title: 'Dilution (physical process, strongly exothermic)',
    equation: 'H₂SO₄ (aq) + H₂O (l) → more dilute H₂SO₄ (aq)',
    ionic: 'H₂SO₄ (aq) → 2H⁺ (aq) + SO₄²⁻ (aq)',
    products: ['More dilute sulfuric acid'],
    conditions: 'Already-dilute acid mixed with water, room temperature. Simulation only.',
    observations: ['No gas', 'No colour change', 'Clear warming of the mixture'],
    explanation:
      'Dilution is a physical process — no new compound is formed, the existing ions are simply spread through more water. Sulfuric acid has an unusually large enthalpy of dilution, so mixing releases a significant amount of heat. That energy release is why diluting concentrated sulfuric acid is treated as a hazardous operation with a strictly defined procedure in real laboratories. GestureLab AI intentionally does not provide or imply any real-world procedure.',
    concept: 'Enthalpy of dilution · why real labs care about order of mixing',
    effects: { type: EFFECT.THERMAL, bubbleRate: 0, bubbleScale: 0, liquidColor: '#8fb6e8', thermal: 0.75, precipitate: null },
    safety:
      'Educational simulation only. GestureLab AI does not give instructions for handling or diluting real acids.',
  },
  {
    reactants: ['h2o', 'h2o'],
    outcome: OUTCOME.NO_REACTION,
    title: 'No reaction — just more water',
    equation: 'H₂O (l) + H₂O (l) → H₂O (l)',
    ionic: null,
    products: ['Water'],
    conditions: 'Room temperature.',
    observations: ['Nothing happens', 'The volume simply increases'],
    explanation:
      'Adding water to water is not a chemical change at all. It is included as a useful control case: a trustworthy experiment needs a baseline where the expected result is genuinely "nothing".',
    concept: 'Experimental controls',
    effects: { type: EFFECT.STABLE, bubbleRate: 0, bubbleScale: 0, liquidColor: null, thermal: 0, precipitate: null },
  },
]

RAW_REACTIONS.push(...ADDITIONAL_REACTIONS)

// Shared qualitative visual metadata and reaction-specific hazards.
for (const entry of RAW_REACTIONS) {
  const gas = entry.effects.bubbleRate > 0 && entry.equation?.includes('H₂ (g)')
  const sodiumWater = entry.reactants.includes('na') && entry.reactants.includes('h2o')
  entry.effects = { ...entry.effects, gas: gas ? 'H₂' : null, explosion: sodiumWater }
  const hazards = []
  if (entry.reactants.includes('na')) hazards.push('Sodium metal is highly reactive. Contact with water or aqueous liquids can cause fire or an explosion.')
  if (entry.reactants.some(id => ['hcl', 'h2so4', 'naoh'].includes(id))) hazards.push('The acid or alkali can cause chemical burns. Mixing can release heat.')
  if (entry.equation?.includes('H₂ (g)')) hazards.push('Hydrogen gas is flammable and can form explosive mixtures with air.')
  if (hazards.length) entry.hazard = hazards.join(' ')
  if (sodiumWater) {
    entry.conditions = 'Water at room temperature. The explosion is a stylized illustration of a possible hazard, not a prediction that every sodium–water reaction explodes.'
    entry.observations = [...entry.observations, 'A brief simulated burst illustrates the possible fire/explosion hazard']
  }
}

/** Lookup table keyed by the sorted ingredient-id pair. */
const REACTION_TABLE = RAW_REACTIONS.reduce((table, entry) => {
  table[key(entry.reactants[0], entry.reactants[1])] = entry
  return table
}, {})

export const MODELLED_PAIR_COUNT = Object.keys(REACTION_TABLE).length

/** Used by the UI to hint which pairs the engine can actually evaluate. */
export const isPairModelled = (idA, idB) => Boolean(REACTION_TABLE[key(idA, idB)])

export const modelledPartnersFor = (id) =>
  RAW_REACTIONS.filter((r) => r.reactants.includes(id)).map((r) =>
    r.reactants[0] === id ? r.reactants[1] : r.reactants[0],
  )

const NEUTRAL_EFFECTS = {
  type: EFFECT.NEUTRAL,
  bubbleRate: 0,
  bubbleScale: 0,
  liquidColor: null,
  thermal: 0,
  precipitate: null,
}

/**
 * Evaluate the current experiment.
 * @param {Array<{id: string, quantity: number}>} ingredients  max 2 in this MVP
 */
export function evaluateExperiment(ingredients) {
  if (!ingredients || ingredients.length === 0) {
    return {
      outcome: OUTCOME.INCOMPLETE,
      title: 'Empty beaker',
      message: 'Add two chemicals to the beaker to run an experiment.',
      equation: null,
      effects: NEUTRAL_EFFECTS,
      ingredients: [],
    }
  }

  if (ingredients.length === 1) {
    return {
      outcome: OUTCOME.INCOMPLETE,
      title: 'Waiting for a second reagent',
      message: 'One chemical is in the beaker. Add one more to evaluate the combination.',
      equation: null,
      effects: NEUTRAL_EFFECTS,
      ingredients,
    }
  }

  const [a, b] = ingredients
  const match = REACTION_TABLE[key(a.id, b.id)]

  if (!match) {
    return {
      outcome: OUTCOME.NOT_MODELLED,
      title: 'Reaction not modelled',
      message:
        'This combination is not in the verified reaction database, so GestureLab AI will not predict an outcome. "Not modelled" is NOT the same as "no reaction" — the real chemistry could be interesting, hazardous, or strongly dependent on conditions.',
      equation: null,
      conditions: null,
      effects: NEUTRAL_EFFECTS,
      ingredients,
    }
  }

  return {
    ...match,
    message: match.explanation,
    ingredients,
    /** Quantities are logged for the notebook only — they do not drive the chemistry. */
    quantitiesNote:
      'Quantities are recorded in virtual units for the lab notebook. This MVP does not simulate stoichiometry, concentration or limiting reagents, so the animation is qualitative only.',
  }
}

export const ALL_REACTIONS = RAW_REACTIONS
