/**
 * GestureLab AI — chemical library.
 *
 * Everything in this file describes a DIGITAL SIMULATION used for education.
 * No real-world handling instructions are provided anywhere in this app.
 *
 * `state` / `form` describe the simulated stock form used by the reaction
 * engine (e.g. "dilute aqueous solution" vs "solid metal"), because the
 * outcome of a combination depends on it.
 */

export const CATEGORIES = {
  METAL: 'Metal',
  ACID: 'Acid',
  BASE: 'Base',
  SOLVENT: 'Solvent',
}

export const CATEGORY_STYLES = {
  [CATEGORIES.METAL]: {
    ring: 'rgba(251, 191, 36, 0.55)',
    tint: 'rgba(251, 191, 36, 0.10)',
    label: 'text-amber-300',
    chip: 'bg-amber-400/10 text-amber-200 border-amber-300/30',
  },
  [CATEGORIES.ACID]: {
    ring: 'rgba(244, 63, 94, 0.55)',
    tint: 'rgba(244, 63, 94, 0.10)',
    label: 'text-rose-300',
    chip: 'bg-rose-400/10 text-rose-200 border-rose-300/30',
  },
  [CATEGORIES.BASE]: {
    ring: 'rgba(168, 85, 247, 0.55)',
    tint: 'rgba(168, 85, 247, 0.10)',
    label: 'text-violet-300',
    chip: 'bg-violet-400/10 text-violet-200 border-violet-300/30',
  },
  [CATEGORIES.SOLVENT]: {
    ring: 'rgba(34, 227, 255, 0.55)',
    tint: 'rgba(34, 227, 255, 0.10)',
    label: 'text-cyan-300',
    chip: 'bg-cyan-400/10 text-cyan-200 border-cyan-300/30',
  },
}

/**
 * color      — swatch / solid chunk color in the UI
 * liquidTint — color contributed to the beaker liquid when added
 * form       — 'solid' renders as a chunk that sinks; 'liquid' fills the beaker
 *
 * shape      — which SVG sample is drawn on the shelf for a solid:
 *              'ingot' | 'block' | 'nugget' | 'shard' | 'granules' | 'ribbon'
 * bottle     — shelf-bottle styling for a liquid:
 *              glass  : tint of the simulated container glass
 *              cap    : cap colour, used to tell bottles apart at a glance
 *              fill   : 0..1 visible stock level in the bottle
 *              hazard : short, non-actionable classroom label (education only)
 */
export const CHEMICALS = [
  {
    id: 'na',
    symbol: 'Na',
    name: 'Sodium',
    category: CATEGORIES.METAL,
    form: 'solid',
    state: 'Solid alkali metal (virtual sample)',
    color: '#cbd5e1',
    accent: '#f8fafc',
    liquidTint: null,
    defaultQuantity: 5,
    unit: 'vu',
    shape: 'block',
    blurb: 'A highly reactive alkali metal. Reacts with water to form sodium hydroxide and hydrogen. Virtual sample only.',
  },
  {
    id: 'ag',
    symbol: 'Ag',
    name: 'Silver',
    category: CATEGORIES.METAL,
    form: 'solid',
    state: 'Solid metal (granules)',
    color: '#d7dde6',
    accent: '#ffffff',
    liquidTint: null,
    defaultQuantity: 5,
    unit: 'vu',
    shape: 'block',
    blurb: 'A low-reactivity metal that sits below hydrogen in the reactivity series.',
  },
  {
    id: 'cu',
    symbol: 'Cu',
    name: 'Copper',
    category: CATEGORIES.METAL,
    form: 'solid',
    state: 'Solid metal (turnings)',
    color: '#c87533',
    accent: '#f3a86b',
    liquidTint: null,
    defaultQuantity: 5,
    unit: 'vu',
    shape: 'nugget',
    blurb: 'Reddish transition metal. Below hydrogen in the reactivity series.',
  },
  {
    id: 'fe',
    symbol: 'Fe',
    name: 'Iron',
    category: CATEGORIES.METAL,
    form: 'solid',
    state: 'Solid metal (filings)',
    color: '#8d99ae',
    accent: '#c4ccd8',
    liquidTint: null,
    defaultQuantity: 5,
    unit: 'vu',
    shape: 'shard',
    blurb: 'Moderately reactive metal. Displaces hydrogen from dilute strong acids.',
  },
  {
    id: 'zn',
    symbol: 'Zn',
    name: 'Zinc',
    category: CATEGORIES.METAL,
    form: 'solid',
    state: 'Solid metal (granules)',
    color: '#9fb3c8',
    accent: '#dbe7f3',
    liquidTint: null,
    defaultQuantity: 5,
    unit: 'vu',
    shape: 'granules',
    blurb: 'Reactive metal above hydrogen in the reactivity series.',
  },
  {
    id: 'mg',
    symbol: 'Mg',
    name: 'Magnesium',
    category: CATEGORIES.METAL,
    form: 'solid',
    state: 'Solid metal (ribbon)',
    color: '#e6e9ef',
    accent: '#ffffff',
    liquidTint: null,
    defaultQuantity: 5,
    unit: 'vu',
    shape: 'ribbon',
    blurb: 'Highly reactive light metal. Vigorous with dilute strong acids.',
  },
  {
    id: 'hcl',
    symbol: 'HCl',
    name: 'Hydrochloric Acid',
    category: CATEGORIES.ACID,
    form: 'liquid',
    state: 'Dilute aqueous solution (~1 mol/dm³, simulated)',
    color: '#5eead4',
    accent: '#a7f3e4',
    liquidTint: '#2bd4c0',
    defaultQuantity: 25,
    unit: 'vu',
    bottle: { glass: '#b8d8cf', cap: '#f05454', fill: 0.72, hazard: 'Dilute acid' },
    blurb: 'A dilute strong monoprotic acid. Colourless in the simulation stock.',
  },
  {
    id: 'h2so4',
    symbol: 'H₂SO₄',
    name: 'Sulfuric Acid',
    category: CATEGORIES.ACID,
    form: 'liquid',
    state: 'Dilute aqueous solution (~1 mol/dm³, simulated)',
    color: '#fda4af',
    accent: '#ffd9df',
    liquidTint: '#f26d85',
    defaultQuantity: 25,
    unit: 'vu',
    bottle: { glass: '#d8c3c8', cap: '#f59e0b', fill: 0.66, hazard: 'Dilute acid' },
    blurb: 'A dilute strong diprotic acid. Only the DILUTE case is modelled here.',
  },
  {
    id: 'naoh',
    symbol: 'NaOH',
    name: 'Sodium Hydroxide',
    category: CATEGORIES.BASE,
    form: 'liquid',
    state: 'Dilute aqueous solution (~1 mol/dm³, simulated)',
    color: '#c4b5fd',
    accent: '#e4dcff',
    liquidTint: '#8b5cf6',
    defaultQuantity: 25,
    unit: 'vu',
    bottle: { glass: '#cbc3e8', cap: '#8b5cf6', fill: 0.7, hazard: 'Dilute alkali' },
    blurb: 'A soluble strong base (alkali) in dilute aqueous solution.',
  },
  {
    id: 'h2o',
    symbol: 'H₂O',
    name: 'Water',
    category: CATEGORIES.SOLVENT,
    form: 'liquid',
    state: 'Pure liquid (room temperature, simulated)',
    color: '#67e8f9',
    accent: '#bdf3ff',
    liquidTint: '#38bdf8',
    defaultQuantity: 30,
    unit: 'vu',
    bottle: { glass: '#bcd9e8', cap: '#38bdf8', fill: 0.85, hazard: 'Solvent' },
    blurb: 'The universal solvent. Used for dilution and dissolution demos.',
  },
]

export const CHEMICALS_BY_ID = Object.fromEntries(CHEMICALS.map((c) => [c.id, c]))

export const getChemical = (id) => CHEMICALS_BY_ID[id] ?? null

/** Virtual-unit range used by the quantity sliders. */
export const QUANTITY = { min: 1, max: 50, step: 1, label: 'vu', longLabel: 'virtual units' }
