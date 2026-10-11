# Architecture and delivery notes

The uploaded project already included a partial React Three Fiber laboratory.
Its viewport had a missing return/opening div, preventing compilation. This
update repairs and integrates that work instead of replacing the application.

## Preserved systems

- `useHandTracking`: local MediaPipe inference, smoothing, pinch detection,
  camera acquisition and tracking-loss behavior.
- `App`: shared mouse/hand pointer primitives, two-reagent limit, quantities,
  exactly-once timed pours, cancellation, reset and the guided walkthrough.
- `data/reactions`: deterministic chemistry rules and educational explanations.
- Original 11 browser suites and original 2D components.

## 3D vertical slice

`Lab3D` publishes a camera-bound hit tester to App. The raycast adapter reads
the same shelf geometry as the scene, maps both input types to reagent picks,
and projects carried objects onto a stable plane. `LabScene` renders the room,
bench, shelves, glassware, carried objects and engine-driven effects. `LabHud`
shows quantities, results and controls without taking away the canvas area.

The repaired viewport includes its host ref (required for cursor coordinate
mapping). A lazy graphics import keeps 3D resources out of the classic startup
path. A React error boundary and visible renderer links provide recovery.
Camera loading states now use the actual tracking hook status constants.

## Validation on October 11, 2026

- Production build: passed; the graphics chunk still produces a size advisory.
- Lint of application, QA and configuration: passed; one existing unused
  variable warning remains in `qa/04-experiments.mjs`. Vendored MediaPipe WASM
  glue is excluded from source lint rather than altered.
- Independent core checks: 214 passed, covering all ten projected shelf picks,
  beaker targeting, zinc/acid resolution, pair symmetry and effect availability.
- Browser suites 01–12: attempted; Edge exits during launch before the tests
  can connect (Crashpad named-pipe error). A workspace-local temporary browser
  profile also failed. These suites are NOT verified as passing.
- In-app preview: local server connection timed out, so visual browser QA is
  also pending. Real webcam detection requires the existing manual checklist.

The new suite 12 drives actual projected shelf coordinates through mouse and
synthetic hand input, timed pour, reaction, reset and 2D fallback. Suite 13 is
the independently executable core check. Original suites remain intact.

## Start

Use Node.js 22.12 or newer, run `npm ci`, then `npm run dev`. Open the address
printed by Vite. The archive contains source, vendored tracking assets and the
production build; dependencies and Git metadata are omitted.

The earlier visual reference was unavailable in the retrieved conversation.
This delivery follows the existing project's first-person scene and the
requested hybrid interaction; matching an unseen reference is not verified.
