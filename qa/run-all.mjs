/**
 * Runs every GestureLab QA suite in sequence against a dev server.
 *   node qa/run-all.mjs      (expects `npx vite --port 5190` already running)
 */
import { spawn } from 'node:child_process'

const SUITES = [
  '01-smoke.mjs',
  '02-mouse.mjs',
  '03-reactions.mjs',
  '04-experiments.mjs',
  '05-webcam.mjs',
  '06-simulated-hand.mjs',
  '07-performance.mjs',
  // Physical-laboratory upgrade: shelves, solids, bottles, gesture scrolling.
  '08-shelf-solids.mjs',
  '09-liquids.mjs',
  '10-gesture-scroll.mjs',
  // Demo-day readiness: guided walkthrough, both target resolutions, camera
  // failure messaging and the mouse fallback that has to survive it.
  '11-demo-readiness.mjs',
  '12-immersive.mjs',
  '13-core.mjs',
  '14-coverage.mjs',
  '15-reaction-visuals.mjs',
]

const run = (f) =>
  new Promise((resolve) => {
    const p = spawn(process.execPath, [`qa/${f}`], { stdio: 'inherit', shell: false })
    p.on('exit', (code) => resolve({ f, code }))
  })

const results = []
for (const f of SUITES) {
  console.log(`\n────────── ${f} ──────────`)
  results.push(await run(f))
}

console.log('\n══════════ OVERALL ══════════')
for (const r of results) console.log(`${r.code === 0 ? 'PASS' : 'FAIL'}  ${r.f}`)
const failed = results.filter((r) => r.code !== 0)
console.log(failed.length ? `\n${failed.length} suite(s) failed.` : '\nAll suites passed.')
console.log('\nMANUAL CHECK STILL REQUIRED: real-webcam hand tracking (see qa/README.md).')
process.exit(failed.length ? 1 : 0)
