# GestureLab AI — browser QA suite

Automated end-to-end checks that drive the **real app in a real Chromium
engine** (the installed Microsoft Edge binary, headless) via `playwright-core`.
No browser download is required.

## Running

```bash
npx vite --port 5190 --strictPort      # terminal 1
node qa/run-all.mjs                    # terminal 2
```

Individual suites: `node qa/01-smoke.mjs`, etc.

| Suite | Covers |
|---|---|
| `01-smoke.mjs` | Shell mount, panels, 10 reagents, navigation |
| `02-mouse.mjs` | Mouse drag/drop, carry preview, max-2 rule, remove/reset |
| `03-reactions.mjs` | All 23 drag-reachable verified pairs + not-modelled + incomplete |
| `04-experiments.mjs` | Experiments search/Load, water+water control case, quantity selector |
| `05-webcam.mjs` | getUserMedia, vendored WASM/model, MediaPipe graph start, stop/teardown |
| `06-simulated-hand.mjs` | Gesture math unit tests + synthetic pinch→grab→drop→track-loss |
| `07-performance.mjs` | Animation fps, hand-frame cost, memory, layout, console hygiene |
| `08-shelf-solids.mjs` | Shelf sections, SVG reagent art, solid pickup/drop/cancel (mouse + hand), track-loss safety |
| `09-liquids.mjs` | Bottle lift, hold-to-pour progress, cancel, exactly-once atomic pour, reset-during-pour |
| `10-gesture-scroll.mjs` | Open-palm arming, direction, dead zone, clamping, pinch/carry conflicts, wheel preservation |
| `11-demo-readiness.mjs` | Guided demo start→finish, 1366×768 + 1920×1080 layout, camera-denial copy, mouse fallback after failure |

## Pour semantics (important)

A bottle is committed to the beaker by **completing the ~1s hold**, never by
letting go early. Release behaviour differs by input on purpose:

| Input | Release over the beaker before the hold finishes |
|---|---|
| Mouse | Adds the reagent — a click-release is unambiguous and deliberate |
| Hand  | Adds **nothing**, shows "Hold the bottle over the beaker to pour." |

MediaPipe drops a pinch for a frame whenever the hand rotates, blurs or the
lighting shifts. Treating that as "drop it in" would silently empty a bottle
into the beaker mid-demo, so under hand control only the timed hold commits.
Solids are unaffected — they are still added on release by either input.

Hold progress is **wall-clock based and driven by a rAF ticker**, so a bottle
held perfectly still still pours; it does not require pointer movement.


Helper (not part of the pass/fail run):
`node qa/shots.mjs` writes layout screenshots at 1366×768 and 1920×1080 into
`qa/shots/` for visual inspection.

## ⚠️ Manual test still required

Chromium's `--use-fake-device-for-media-stream` provides a genuine
`MediaStream`, so camera acquisition, WASM/model loading and detector startup
are all really exercised. **It cannot provide a real human hand.**

Everything gesture-related above is driven through `window.__gl_handFrame`,
which is the *same* callback MediaPipe invokes — so the interaction logic is
genuinely tested, but **the quality of real hand detection is not**.

These must be verified by a human with a webcam before the demo:

1. A hand is detected and the skeleton overlay tracks it.
2. Pinching grabs a reagent; the cursor follows smoothly without jitter.
3. Releasing a **solid** over the beaker adds it.
4. Holding a **bottle** over the beaker for ~1s tilts it and pours once.
5. Releasing a bottle early over the beaker adds **nothing** and shows the
   "Hold the bottle over the beaker to pour." hint.
6. A bottle held as still as you can manage still pours (no jiggling needed).
7. An **open palm** over the Chemical Library scrolls the shelves up/down,
   and a stationary palm does not creep.
8. Pinching while scrolling immediately exits scroll mode.
9. Moving the hand out of frame auto-releases without adding anything.
10. The fps readout shows a sensible live value (it counts hand-detected frames,
    so it intentionally stays blank until a hand appears).
11. The cursor ring sits on your fingertips, not offset from them.
12. Denying the camera prompt shows a readable explanation and Retry, and the
    mouse still works afterwards.

## Test hooks in `src/`

The app contains a few additions that exist purely for this suite:

- `data-testid` / `data-*` attributes — inert, no styling or behaviour.
- `window.__gl_effects` (`BeakerCanvas.jsx`) — exposes canvas effect params.
- `window.__gl_handFrame` (`App.jsx`) — lets tests drive the hand→pointer bridge.

Both `window.*` hooks are guarded by `import.meta.env.DEV` and are verified
absent from the production bundle.
