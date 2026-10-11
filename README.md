# GestureLab AI

## Immersive laboratory update

The default view is a first-person 3D chemistry bench with physical reagent
shelves, carried bottles and solids, animated pours, and reaction effects.
The floating HUD exposes quantities, beaker contents, reset, and explanations.
Mouse and MediaPipe input both use the original interaction state machine.
The camera stays fixed so hand movement can reliably target the shelves.

Use **2D fallback** to open the original dashboard (`?mode=classic`). Use
**Open 3D lab** to return. Switching views reloads and starts a fresh experiment.
The 3D renderer loads separately, so classic mode avoids its graphics bundle.
A recovery screen offers the 2D view if 3D rendering fails.

Run `node qa/13-core.mjs` for independent geometry and reaction checks.
Run `npm test` with the development server on port 5190 for all browser suites
and core checks. See `DEVELOPMENT.md` for architecture and validation results.

A virtual chemistry bench you operate with your hands. Pinch to pick up solid
reagents, lift a bottle and hold it over the beaker to pour, and scroll the
shelves with an open palm — all from a plain webcam, entirely in the browser.

Hand tracking runs locally via MediaPipe Hand Landmarker. **Video never leaves
the machine**: there is no upload, no inference server, no account.

> Educational simulation. Animations are qualitative illustrations, not
> quantitative predictions.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Then press **Start Tracking** in the header and allow camera access.
**No webcam? Everything works with the mouse** — the camera is optional.

```bash
npm run build        # production bundle
npm run lint         # oxlint
```

## How to use it

| Action | Hand | Mouse |
|---|---|---|
| Pick up a solid | Pinch thumb + index over the sample | Press and drag |
| Add the solid | Release over the beaker | Release over the beaker |
| Lift a bottle | Pinch over the bottle | Press and drag |
| **Pour a liquid** | **Hold over the beaker ~1s** | **Hold over the beaker ~1s** |
| Scroll the shelves | Open palm over the library, move up/down | Mouse wheel |
| Reset | — | Reset in the analysis panel |

### Why bottles pour instead of drop

Solids are *dropped*; liquids are *poured*. Holding a bottle over the beaker
for about a second tilts it and pours exactly once.

Under **hand** control, letting go of a bottle early adds **nothing** — it goes
back on the shelf. MediaPipe loses a pinch for a frame whenever the hand
rotates, blurs or the lighting shifts, and treating that as "drop it in" would
silently empty a reagent into the beaker that the user never intended. Only the
completed hold commits. A **mouse** release is unambiguous, so it adds the
reagent normally. Solids are unaffected by this rule.

## Guided demo

The **Guided demo** button (bottom-right) walks through zinc + dilute
hydrochloric acid in about a minute. It is advisory only: it watches real
application state and advances when you genuinely perform each step, so it
can never desynchronise or trap you. Skip or exit at any time.

## What's inside

- **All 45 distinct pairs** from the available reagents have an explicit result,
  plus the water/water control (46 entries total). Outcomes distinguish reaction,
  no significant immediate reaction, and condition-dependent chemistry.
- Sodium (Na) replaces gold in both views. Sodium/water, sodium/dilute acid and
  sodium/aqueous alkali entries explain hydrogen evolution and solvent participation.
- Zinc/NaOH explains its condition-dependent pathway without inventing a rate for
  the dilute room-temperature stock. Metal/metal entries describe dry contact,
  not displacement from a dissolved metal salt.
- **10 reagents** on two shelves: 6 solid metals (including sodium) and 4 liquid bottles.
- Per-reagent quantity selection, a two-reagent beaker, and live canvas
  effects (bubbling, colour change, precipitate, heat).

## Tech

React 19 · Vite · Tailwind CSS · MediaPipe Tasks Vision · Canvas 2D

The WASM runtime and the hand-landmark model are **vendored into `public/`**
(~25 MB), so the app loads them from its own origin and runs with no CDN and
no network access after the first load.

## Testing

Browser checks across 12 Playwright suites, plus independent core and coverage checks drive the real app in a real
Chromium engine. See [`qa/README.md`](qa/README.md) for what each suite covers,
how to run them, and the **manual webcam checklist**.

```bash
npx vite --port 5190 --strictPort   # terminal 1
node qa/run-all.mjs                 # terminal 2
```

> The automated suites drive the same callback MediaPipe invokes, so they
> verify the *interaction logic*. They cannot verify *detection quality* —
> that still requires a human with a webcam.

## Privacy

Camera frames are processed in-page and discarded. Nothing is recorded,
stored or transmitted.

Chemistry coverage checks: `node qa/14-coverage.mjs`. See `CHEMISTRY-UPDATE.md` for assumptions and sources.

Visible gas, the sodium/water burst and reaction-specific DO NOT TRY THIS warnings are included in both views. See VISUAL-EFFECTS-UPDATE.md. Run node qa/15-reaction-visuals.mjs for effect and warning checks.
