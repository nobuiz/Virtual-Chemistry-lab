import { useState } from 'react'
import { ChevronRight, Play, Sparkles, X } from 'lucide-react'

/**
 * Optional guided walkthrough: Zn + dilute HCl in about 60 seconds.
 *
 * Deliberately *advisory only* — it observes the real application state and
 * advances when the user genuinely performs each action. It never drives the
 * interaction itself, so it cannot desynchronise from the lab or block a
 * judge who would rather explore freely.
 */
const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to GestureLab AI',
    body: 'A virtual chemistry bench you control with your hands. We will run zinc + dilute hydrochloric acid together.',
    done: () => false,
  },
  {
    id: 'camera',
    title: 'Turn on the webcam',
    body: 'Press “Start Tracking” in the header. No camera? Every step below also works with the mouse.',
    done: ({ tracking }) => tracking,
  },
  {
    id: 'hand',
    title: 'Show your hand',
    body: 'Hold one open hand up to the camera. A glowing ring should follow it around the screen.',
    done: ({ handVisible, usingMouse }) => handVisible || usingMouse,
  },
  {
    id: 'grab-zn',
    title: 'Pick up the zinc',
    body: 'Move over the Zn sample on the Solid Reagents shelf and pinch your thumb and index finger together.',
    done: ({ carryingId, beakerIds }) => carryingId === 'zn' || beakerIds.includes('zn'),
  },
  {
    id: 'drop-zn',
    title: 'Drop it into the beaker',
    body: 'Carry the zinc over the beaker and open your fingers to release it.',
    done: ({ beakerIds }) => beakerIds.includes('zn'),
  },
  {
    id: 'grab-hcl',
    title: 'Lift the HCl bottle',
    body: 'Pinch over the HCl bottle on the Liquid Reagents shelf. Bottles are poured, not dropped.',
    done: ({ carryingId, beakerIds }) => carryingId === 'hcl' || beakerIds.includes('hcl'),
  },
  {
    id: 'pour',
    title: 'Hold it above the beaker',
    body: 'Keep the bottle over the beaker for about a second. It tilts and pours by itself.',
    done: ({ beakerIds }) => beakerIds.includes('hcl'),
  },
  {
    id: 'observe',
    title: 'Watch the reaction',
    body: 'Hydrogen bubbles stream off the zinc and the mixture warms — a single displacement reaction.',
    done: ({ hasReaction }) => hasReaction,
  },
  {
    id: 'read',
    title: 'Read the chemistry',
    body: 'The analysis panel shows the balanced equation, the net ionic equation, observations and an explanation. The deterministic reaction engine — not a language model — decides the outcome.',
    done: () => false,
  },
]

export default function DemoMode({ active, onStart, onExit, state }) {
  // `step` is the furthest step the user has *acknowledged*. The step actually
  // shown is derived during render from real application state, so the panel
  // can never cascade renders or drift out of sync with the lab.
  const [step, setStep] = useState(0)

  if (!active) {
    return (
      <button
        type="button"
        data-testid="demo-start"
        onClick={() => {
          setStep(0)
          onStart?.()
        }}
        className="btn fixed bottom-5 right-5 z-[55] border border-lab-violet/40 bg-lab-violet/10 text-[11px] text-violet-200 shadow-violet backdrop-blur-xl transition hover:border-lab-violet/70 hover:bg-lab-violet/20"
      >
        <Play className="h-3 w-3" />
        Guided demo
      </button>
    )
  }

  // Advance past every leading step the user has already completed.
  let shown = step
  while (shown < STEPS.length - 1 && STEPS[shown].done?.(state)) shown += 1

  const current = STEPS[shown]
  const last = shown === STEPS.length - 1

  return (
    <div
      data-testid="demo-panel"
      data-demo-step={current.id}
      className="animate-fade-up fixed bottom-5 right-5 z-[60] w-[310px] rounded-2xl border border-lab-violet/40 bg-lab-abyss/95 p-4 shadow-violet backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg border border-lab-violet/40 bg-lab-violet/15">
            <Sparkles className="h-3 w-3 text-lab-violet" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-300">
            Step {shown + 1} / {STEPS.length}
          </span>
        </div>
        <button
          type="button"
          aria-label="Exit guided demo"
          data-testid="demo-exit"
          onClick={onExit}
          className="grid h-6 w-6 place-items-center rounded-md border border-white/10 text-slate-400 transition hover:border-white/30 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <h3 className="mt-2.5 font-display text-sm font-semibold text-white">{current.title}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{current.body}</p>

      {/* progress rail */}
      <div className="mt-3 flex gap-1">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= shown ? 'bg-lab-violet' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          {current.done?.(state) ? 'Done — moving on…' : 'Waiting for you…'}
        </span>
        <button
          type="button"
          data-testid="demo-next"
          onClick={() => (last ? onExit() : setStep(shown + 1))}
          className="btn border border-lab-violet/40 bg-lab-violet/10 text-[11px] text-violet-200 transition hover:bg-lab-violet/25"
        >
          {last ? 'Finish' : 'Skip'}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

