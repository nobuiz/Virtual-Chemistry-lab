import { forwardRef } from 'react'
import { Droplets, FlaskConical, Sparkles, Thermometer } from 'lucide-react'
import { OUTCOME } from '../data/reactions'
import { QUANTITY } from '../data/chemicals'
import { PHASE } from '../lib/interaction'
import ReactionPlume from './ReactionPlume'
import BeakerCanvas from './BeakerCanvas'
import ContextHint from './ContextHint'

/** Beaker geometry, in the SVG's own coordinate space. */
const BEAKER = { x: 46, y: 36, w: 208, h: 236, r: 14 }

const OUTCOME_BADGE = {
  [OUTCOME.CONDITIONAL]: {
    text: 'Condition-dependent',
    cls: 'border-amber-300/40 bg-amber-300/10 text-amber-200',
    icon: Thermometer,
  },
  [OUTCOME.REACTION]: {
    text: 'Reaction detected',
    cls: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200',
    icon: Sparkles,
  },
  [OUTCOME.NO_REACTION]: {
    text: 'No significant reaction',
    cls: 'border-slate-300/25 bg-white/5 text-slate-300',
    icon: Droplets,
  },
  [OUTCOME.NOT_MODELLED]: {
    text: 'Reaction not modelled',
    cls: 'border-amber-300/40 bg-amber-300/10 text-amber-200',
    icon: Thermometer,
  },
  [OUTCOME.INCOMPLETE]: {
    text: 'Awaiting reagents',
    cls: 'border-white/12 bg-white/[0.04] text-slate-400',
    icon: FlaskConical,
  },
}

/**
 * The virtual laboratory bench.
 *
 * The forwarded ref points at the beaker drop zone; App.jsx hit-tests against
 * its bounding box so hand-release and mouse-release use identical logic.
 */
const Laboratory = forwardRef(function Laboratory(
  { ingredients, result, fillLevel, liquidColor, dropActive, pouring, phase },
  dropZoneRef,
) {
  const effects = result?.effects ?? {}
  const badge = OUTCOME_BADGE[result?.outcome] ?? OUTCOME_BADGE[OUTCOME.INCOMPLETE]
  const BadgeIcon = badge.icon
  const solids = ingredients.filter((i) => i.form === 'solid')
  const pourReady = phase === PHASE.POUR_READY || phase === PHASE.POURING
  const reactionReady = result?.outcome === OUTCOME.REACTION

  return (
    <section className="glass edge-glow relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-lab-cyan" />
          <h2 className="panel-title">Virtual Laboratory</h2>
        </div>
        <div className={`chip ${badge.cls}`}>
          <BadgeIcon className="h-3 w-3" />
          {badge.text}
        </div>
      </div>
      <div className="hair" />

      {/* bench */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {/* ambient lighting */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[340px] w-[520px] -translate-x-1/2 rounded-full bg-lab-cyan/[0.07] blur-3xl" />
          <div
            className="absolute bottom-24 left-1/2 h-40 w-[440px] -translate-x-1/2 rounded-full blur-3xl transition-all duration-700"
            style={{
              background: `${liquidColor}1f`,
              opacity: fillLevel > 0.02 ? 1 : 0,
            }}
          />
        </div>

        {/* drop zone */}
        <div
          ref={dropZoneRef}
          data-dropzone="beaker"
          className={`relative z-10 transition-transform duration-300 ${
            dropActive ? 'scale-[1.045]' : 'scale-100'
          }`}
        >
          {/* halo while something is held over the beaker */}
          <div
            className={`pointer-events-none absolute -inset-7 rounded-[2.2rem] border-2 border-dashed transition-all duration-300 ${
              dropActive
                ? 'border-lab-cyan/70 bg-lab-cyan/[0.07] opacity-100 shadow-glow-lg'
                : 'border-transparent opacity-0'
            }`}
          />

          {/* pour-zone affordance — only while a bottle is actually held here */}
          {pourReady && (
            <div
              data-testid="pour-badge"
              className="animate-fade-up pointer-events-none absolute -top-14 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-lab-cyan/60 bg-lab-cyan/15 px-3 py-1 text-[11px] font-semibold text-cyan-100 backdrop-blur-md shadow-glow"
            >
              <Droplets className="h-3.5 w-3.5" />
              {phase === PHASE.POURING ? 'Pouring…' : 'Hold to Pour'}
            </div>
          )}
          {dropActive && !pourReady && (
            <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-lab-cyan/50 bg-lab-abyss/90 px-3 py-1 font-display text-[11px] font-semibold text-lab-cyan shadow-glow">
              Release to add to beaker
            </span>
          )}

          <BeakerShell
            fillLevel={fillLevel}
            liquidColor={liquidColor}
            effects={effects}
            solids={solids}
            pouring={pouring}
          />
        </div>

        {/* bench surface */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lab-cyan/35 to-transparent" />
          <div className="h-full bg-gradient-to-b from-lab-cyan/[0.055] to-transparent" />
        </div>

        {/* state-driven coaching line */}
        <ContextHint phase={phase} reactionReady={reactionReady} />
      </div>

      {/* contents strip */}
      <div className="hair" />
      <div className="flex min-h-[58px] items-center gap-2 px-4 py-3">
        <span className="panel-title shrink-0">Beaker</span>
        {ingredients.length === 0 ? (
          <span className="text-[11px] text-slate-500">
            Empty — pinch a reagent from the library and drop it here.
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2" data-testid="beaker-contents">
            {ingredients.map((ing, idx) => (
              <span key={ing.slot ?? ing.id} className="flex items-center gap-2" data-content-id={ing.id}>
                {idx > 0 && <span className="font-display text-sm text-slate-500">+</span>}
                <span
                  className="chip animate-fade-up border-white/15 bg-white/[0.05] text-slate-200"
                  style={{ boxShadow: `0 0 18px -8px ${ing.color}` }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: ing.color, boxShadow: `0 0 8px ${ing.color}` }}
                  />
                  <span className="font-display font-semibold">{ing.symbol}</span>
                  <span className="font-mono tabular-nums text-slate-400">
                    {ing.quantity} {QUANTITY.label}
                  </span>
                </span>
              </span>
            ))}
            {ingredients.length === 1 && (
              <span className="text-[11px] text-slate-500">· add one more reagent</span>
            )}
          </div>
        )}
      </div>
    </section>
  )
})

/** The glass vessel itself: SVG shell + canvas liquid layered inside. */
function BeakerShell({ fillLevel, liquidColor, effects, solids, pouring }) {
  return (
    <div className="relative h-[330px] w-[300px]">
      <ReactionPlume effects={effects} />
      {/* liquid lives behind the glass highlights */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${(BEAKER.x / 300) * 100}%`,
          top: `${(BEAKER.y / 330) * 100}%`,
          width: `${(BEAKER.w / 300) * 100}%`,
          height: `${(BEAKER.h / 330) * 100}%`,
          borderRadius: `6px 6px ${BEAKER.r}px ${BEAKER.r}px`,
        }}
      >
        <BeakerCanvas
          className="h-full w-full"
          fillLevel={fillLevel}
          liquidColor={liquidColor}
          bubbleRate={effects.bubbleRate ?? 0}
          bubbleScale={effects.bubbleScale ?? 1}
          thermal={effects.thermal ?? 0}
          solids={solids}
        />
      </div>

      <svg
        viewBox="0 0 300 330"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-label="Virtual beaker"
      >
        <defs>
          <linearGradient id="glassFace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="14%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.015)" />
            <stop offset="88%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
          </linearGradient>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(34,227,255,0.25)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.3)" />
          </linearGradient>
          <filter id="glassGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* body */}
        <path
          d={`M${BEAKER.x} ${BEAKER.y}
              L${BEAKER.x} ${BEAKER.y + BEAKER.h - BEAKER.r}
              Q${BEAKER.x} ${BEAKER.y + BEAKER.h} ${BEAKER.x + BEAKER.r} ${BEAKER.y + BEAKER.h}
              L${BEAKER.x + BEAKER.w - BEAKER.r} ${BEAKER.y + BEAKER.h}
              Q${BEAKER.x + BEAKER.w} ${BEAKER.y + BEAKER.h} ${BEAKER.x + BEAKER.w} ${BEAKER.y + BEAKER.h - BEAKER.r}
              L${BEAKER.x + BEAKER.w} ${BEAKER.y}`}
          fill="url(#glassFace)"
          stroke="rgba(190,230,255,0.42)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />

        {/* spout + rim */}
        <path
          d={`M${BEAKER.x - 12} ${BEAKER.y - 6} Q${BEAKER.x + 2} ${BEAKER.y - 12} ${BEAKER.x + 14} ${BEAKER.y - 4}`}
          fill="none"
          stroke="rgba(190,230,255,0.5)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <line
          x1={BEAKER.x - 12}
          y1={BEAKER.y - 5}
          x2={BEAKER.x + BEAKER.w + 10}
          y2={BEAKER.y - 5}
          stroke="url(#rim)"
          strokeWidth="3.4"
          strokeLinecap="round"
          filter="url(#glassGlow)"
        />

        {/* graduation marks — visual only, not a measuring scale */}
        {[0.2, 0.4, 0.6, 0.8].map((frac) => {
          const y = BEAKER.y + BEAKER.h - BEAKER.h * frac
          return (
            <g key={frac}>
              <line
                x1={BEAKER.x + BEAKER.w - 34}
                y1={y}
                x2={BEAKER.x + BEAKER.w - 10}
                y2={y}
                stroke="rgba(190,230,255,0.3)"
                strokeWidth="1.4"
              />
              <text
                x={BEAKER.x + BEAKER.w - 40}
                y={y + 3.5}
                textAnchor="end"
                fill="rgba(190,230,255,0.42)"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {Math.round(frac * 100)}
              </text>
            </g>
          )
        })}

        {/* specular streaks */}
        <rect
          x={BEAKER.x + 12}
          y={BEAKER.y + 14}
          width="7"
          height={BEAKER.h - 56}
          rx="3.5"
          fill="rgba(255,255,255,0.12)"
        />
        <rect
          x={BEAKER.x + BEAKER.w - 26}
          y={BEAKER.y + 24}
          width="4"
          height={BEAKER.h - 86}
          rx="2"
          fill="rgba(255,255,255,0.07)"
        />
      </svg>

      {/* pour stream shown briefly when a reagent is dropped in */}
      {pouring && (
        <div
          className="pointer-events-none absolute left-1/2 top-2 w-1.5 -translate-x-1/2 rounded-full"
          style={{
            height: `${BEAKER.y + 40}px`,
            background: `linear-gradient(180deg, transparent, ${pouring.color})`,
            boxShadow: `0 0 16px ${pouring.color}`,
          }}
        />
      )}

      {/* reflection on the bench */}
      <div className="pointer-events-none absolute -bottom-3 left-1/2 h-6 w-48 -translate-x-1/2 rounded-[50%] bg-lab-cyan/12 blur-xl" />
    </div>
  )
}

export default Laboratory
