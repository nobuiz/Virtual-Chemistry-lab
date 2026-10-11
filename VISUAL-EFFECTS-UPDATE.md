# Visible gas, sodium burst and hazard warnings

## Changes

- The 3D beaker now shows brighter submerged bubbles and a separate pool of
  bright gas markers rising above the mouth. The classic view lets bubbles rise
  beyond the liquid surface and adds an unclipped plume above the rim.
- Both result views label H2 gas explicitly. The white markers are an illustration:
  hydrogen itself is colourless, not smoke.
- Sodium/water alone triggers a brief orange/yellow particle burst. It plays once
  when that reaction becomes active, ends after 2.65 seconds, and rearms after
  reset or changing away from the reaction. Quantity changes do not replay it.
- A visible DO NOT TRY THIS — VIRTUAL EXPERIMENT ONLY warning accompanies
  combinations involving sodium, corrosive acid/alkali, or potential hydrogen
  evolution. The warning includes the applicable hazards even for slow or
  condition-dependent entries. It does not depend on expanding the explanation.
- Reduced-motion mode suppresses the burst. No sound, camera shake, repeated
  strobe or full-screen flash is added. The explanatory warning stays visible.

## Interpretation

The sodium/water burst illustrates a possible fire/explosion hazard. It does not
claim that every sodium/water reaction explodes or predict a physical mechanism,
rate, ignition threshold or explosive force. The chemistry equation remains the
balanced sodium/water equation. Sources:

- RSC sodium element information:
  https://periodic-table.rsc.org/element/11
- RSC discussion of alkali-metal explosion mechanisms:
  https://edu.rsc.org/feature/exploding-some-myths/2000082.article

## Validation

Build and lint pass (the existing suite-04 unused-variable warning and graphics
chunk-size advisory remain). All 45 distinct-pair coverage checks and the
214 core checks pass. Suite 15 checks gas identity, hazardous-pair coverage,
sodium-only explosion metadata, burst start/end, particle bounds, and actual
warning/plume component markup rendered without a browser.

Browser visual verification and real webcam testing are still pending because
of the previously documented Edge launch failure. Animation appearance is not
claimed to have been verified in a browser in this environment.
