# Sodium and reaction coverage update

Gold has been removed. Sodium (Na), a silver-coloured virtual solid sample,
appears in both the classic library and 3D shelf. Tracking, pointer semantics,
reaction timing and renderer fallback are preserved.

## Coverage

All 45 unordered distinct pairs from the ten available reagents have explicit
entries. The water/water control brings the database total to 46. An unknown
reagent still returns NOT_MODELLED rather than guessing. Same-reagent pairs
other than water remain outside the database and duplicate drops are blocked.

Sodium has hydrogen-evolution entries with water, dilute HCl, dilute H2SO4 and
aqueous NaOH. The alkali case explicitly reacts with solvent water. Sodium/acid
equations are overall balances with stated assumptions, not mechanism or rate
predictions. The sulfate entry does not calculate acid equivalents from virtual
quantities. The current visual update adds a stylized possible-hazard burst for sodium/water. See VISUAL-EFFECTS-UPDATE.md; no ignition threshold or explosive force is calculated.

Dry metal/metal pairs explain why contact is not the same as displacement from
metal salt solutions. Metal/dilute alkali results refer to short room-temperature
observation, excluding long-term corrosion and heated/concentrated systems.
Zinc/NaOH uses a separate condition-dependent outcome, states the alkaline
zincate pathway, and avoids assuming a fast rate for the dilute stock.
Mixing the two dilute acid stocks has its own explanation without neutralisation.

Both result views expose stated conditions. The classic beaker badge and the
experiment index distinguish condition-dependent chemistry from no reaction.

## Chemistry references and inference

- RSC Education, alkali-metal reactivity demonstrations:
  https://edu.rsc.org/experiments/reactivity-trends-of-the-alkali-metals/731.article
- Jim Clark, reactions of metals with dilute acids:
  https://www.chemguide.co.uk/14to16/rs/mandacids.html
- OLabs educational material, metals with aqueous bases:
  https://www.olabs.edu.in/?brch=3&cnt=1&sim=269&sub=73

The sodium/aqueous NaOH entry is a qualitative inference from sodium reacting
with water present in the labelled stock. It is not a measured kinetic model.
Dry-contact and dilute-acid mixing entries use the stated absence of electrolyte,
metal ions, base, heating and oxidant to explain the short-timescale result.

## Validation

- `node qa/14-coverage.mjs`: passed, covering all 45 distinct pairs, unique
  entries, valid reagent IDs, sodium effects, zinc conditional outcome, order
  independence, unknown fallback and complete metadata.
- `node qa/13-core.mjs`: 214 checks passed, including all 3D shelf picks.
- `npm run lint`: passed, with the existing unused-variable warning in suite 04.
- `npm run build`: passed, with the existing graphics chunk size advisory.
- Full browser and real-webcam validation remain pending due to the previously
  observed Edge launch failure in this environment. These are not claimed to pass.

Regression expectations now use sodium instead of gold. The reaction browser
suite iterates the expanded database and retains a separate unknown-ID check.

