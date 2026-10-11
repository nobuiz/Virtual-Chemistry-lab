import { Hand, MoveVertical, Pointer, Sparkles, Timer, Droplets } from 'lucide-react'
import { PHASE } from '../lib/interaction'

/**
 * Context-sensitive coaching line.
 *
 * Every entry is driven by the real interaction phase, so the guidance can
 * never advertise an action that is not currently possible — showing
 * "Hold to pour" while a solid is carried would teach the wrong control.
 */
const HINTS = {
  [PHASE.IDLE]: { icon: Hand, text: 'Move your hand to explore', tone: 'calm' },
  [PHASE.HOVERING]: { icon: Pointer, text: 'Pinch to pick up', tone: 'active' },
  [PHASE.CARRYING_SOLID]: { icon: Sparkles, text: 'Release over the beaker', tone: 'active' },
  [PHASE.CARRYING_LIQUID]: {
    icon: Droplets,
    text: 'Move the bottle above the beaker',
    tone: 'active',
  },
  [PHASE.POUR_READY]: { icon: Timer, text: 'Hold to pour…', tone: 'active' },
  [PHASE.POURING]: { icon: Droplets, text: 'Pouring…', tone: 'active' },
  [PHASE.SCROLLING]: { icon: MoveVertical, text: 'Scroll mode active', tone: 'active' },
}

export default function ContextHint({ phase, reactionReady }) {
  // A finished reaction is the most useful thing to say, but only while the
  // user is not in the middle of another interaction.
  const showResult = reactionReady && (phase === PHASE.IDLE || phase === PHASE.HOVERING)
  const hint = showResult
    ? { icon: Sparkles, text: 'Reaction complete — see the analysis', tone: 'done' }
    : HINTS[phase]

  if (!hint) return null
  const Icon = hint.icon

  const tone =
    hint.tone === 'done'
      ? 'border-emerald-300/45 bg-emerald-300/10 text-emerald-100'
      : hint.tone === 'active'
        ? 'border-lab-cyan/45 bg-lab-cyan/10 text-cyan-100'
        : 'border-white/10 bg-white/[0.04] text-slate-300'

  return (
    <div
      data-testid="context-hint"
      data-phase={phase}
      className={`pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium backdrop-blur-xl transition-all duration-200 ${tone}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {hint.text}
    </div>
  )
}