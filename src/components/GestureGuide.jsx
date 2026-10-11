import { Camera, Hand, MousePointer2, RotateCcw, TriangleAlert } from 'lucide-react'
import HandPose from './HandPose'

/**
 * The six gestures that make up the whole control scheme, in the order a
 * first-time user meets them. Each one pairs an accurate hand-pose drawing
 * with a single-sentence instruction, so the guide can be skimmed in well
 * under 30 seconds.
 */
const GESTURES = [
  {
    pose: 'open',
    name: 'Move cursor',
    body: 'Hold an open hand up to the webcam. The glowing ring follows your hand around the screen.',
    anim: 'animate-sway',
  },
  {
    pose: 'pinch',
    name: 'Pick up a solid',
    body: 'Put the cursor over a metal sample, then touch your thumb and index finger together.',
    anim: 'animate-pinch',
  },
  {
    pose: 'carry-solid',
    name: 'Drop it in',
    body: 'Carry the sample over the beaker and open your fingers to release it.',
    anim: 'animate-drop',
  },
  {
    pose: 'carry-bottle',
    name: 'Lift a bottle',
    body: 'Pinch over a liquid bottle to lift it. Bottles pour instead of dropping.',
    anim: 'animate-sway',
  },
  {
    pose: 'pour',
    name: 'Pour the liquid',
    body: 'Hold the bottle above the beaker for about a second — it tilts and pours by itself.',
    anim: 'animate-pour',
  },
  {
    pose: 'scroll',
    name: 'Scroll the shelves',
    body: 'Open your palm over the Chemical Library, then move your hand up or down.',
    anim: 'animate-scroll',
  },
]

const EXTRAS = [
  {
    icon: RotateCcw,
    name: 'Reset the experiment',
    body: 'Press Reset in the analysis panel to empty the beaker and start a new pair.',
  },
  {
    icon: MousePointer2,
    name: 'Mouse fallback',
    body: 'No webcam? Drag reagents with the mouse. Hold a bottle over the beaker for a second to pour, exactly like the hand gesture.',
  },
]

const CAMERA_TIPS = [
  'Use one hand at a time.',
  'Keep your whole hand inside the camera frame.',
  'Face even, front-on lighting — avoid a bright window behind you.',
  'Keep a plain background if you can; clutter confuses the detector.',
  'Sit roughly 40–70 cm from the webcam.',
  'If grabbing feels twitchy, lower Pinch sensitivity in the calibration panel.',
  'If you cannot reach the screen edges, raise Cursor reach.',
  'Tracking still unreliable? Everything works with the mouse instead.',
]

export default function GestureGuide() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <header className="text-center">
          <h2 className="font-display text-xl font-bold text-white">How to use GestureLab AI</h2>
          <p className="mt-1 text-xs text-slate-400">
            Six gestures run the whole laboratory. Hand tracking happens entirely in your browser —
            no video ever leaves this device.
          </p>
        </header>

        {/* ---------- the gesture vocabulary ---------- */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GESTURES.map(({ pose, name, body, anim }, i) => (
            <article key={name} className="glass glass-hover flex gap-3 p-3.5">
              <div className="grid h-[84px] w-[84px] shrink-0 place-items-center overflow-hidden rounded-xl border border-lab-cyan/20 bg-lab-cyan/[0.06]">
                <HandPose pose={pose} size={64} className={anim} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[10px] text-lab-violet">{i + 1}</span>
                  <h3 className="font-display text-sm font-semibold text-white">{name}</h3>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{body}</p>
              </div>
            </article>
          ))}
        </div>

        {/* ---------- non-gesture controls ---------- */}
        <div className="grid gap-3 sm:grid-cols-2">
          {EXTRAS.map(({ icon: Icon, name, body }) => (
            <article key={name} className="glass glass-hover flex gap-3 p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-lab-violet/30 bg-lab-violet/10">
                <Icon className="h-4 w-4 text-lab-violet" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-sm font-semibold text-white">{name}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{body}</p>
              </div>
            </article>
          ))}
        </div>

        {/* ---------- camera tips ---------- */}
        <section className="glass p-4">
          <div className="mb-2 flex items-center gap-2">
            <Camera className="h-4 w-4 text-lab-cyan" />
            <h3 className="panel-title">Camera &amp; tracking tips</h3>
          </div>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {CAMERA_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-lab-violet" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- on-screen coaching ---------- */}
        <section className="glass p-4">
          <div className="mb-2 flex items-center gap-2">
            <Hand className="h-4 w-4 text-lab-cyan" />
            <h3 className="panel-title">The lab tells you what to do next</h3>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            A hint under the beaker always reflects what is actually possible right now — “Pinch to
            pick up”, “Release over beaker”, “Hold to pour”, “Scroll mode active”. If a hint is not
            showing, that action is not currently available.
          </p>
        </section>

        {/* ---------- honesty box (unchanged policy) ---------- */}
        <section className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-300" />
            <h3 className="font-display text-sm font-semibold text-amber-200">
              What this simulation is — and is not
            </h3>
          </div>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-amber-100/85">
            <li>
              Educational simulation only. It never provides real-world procedures, quantities or
              handling instructions.
            </li>
            <li>
              Animations are qualitative illustrations of textbook outcomes, not quantitative
              predictions.
            </li>
            <li>
              Quantities are recorded for the notebook but do not drive the chemistry — no
              stoichiometry, concentration or limiting-reagent modelling.
            </li>
            <li>
              “Reaction not modelled” means the engine refuses to guess. It is not a claim that
              nothing would happen.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
