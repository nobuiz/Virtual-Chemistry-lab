import ReactionWarning from '../ReactionWarning'
import { useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Camera,
  CameraOff,
  ChevronDown,
  Hand,
  Loader2,
  Mouse,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { QUANTITY } from '../../data/chemicals'
import { OUTCOME } from '../../data/reactions'
import { TRACKER_STATUS } from '../../hooks/useHandTracking'

/**
 * The floating heads-up display for the 3D lab.
 *
 * Design rule: the 3D viewport is the product, so the HUD never takes layout
 * space. Everything here is absolutely positioned over the canvas, in narrow
 * cards pinned to the corners, leaving the bench and shelves fully visible.
 * `pointer-events-none` on the containers with `pointer-events-auto` on the
 * actual controls means the HUD never steals a grab from the scene — which
 * matters because a hand cursor cannot see a transparent panel.
 */

/* ------------------------------ small pieces ------------------------------ */

function Card({ className = '', children, ...rest }) {
  return (
    <div
      {...rest}
      className={`pointer-events-auto rounded-xl border border-white/10 bg-lab-void/70 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  )
}

function TrackerBadge({ status, handPresent, onToggle }) {
  const running = status === TRACKER_STATUS.RUNNING
  const loading = (status === TRACKER_STATUS.LOADING_MODEL || status === TRACKER_STATUS.REQUESTING_CAMERA)
  const failed = status === TRACKER_STATUS.ERROR

  const tone = failed
    ? 'border-rose-400/40 text-rose-200'
    : running && handPresent
      ? 'border-emerald-300/50 text-emerald-200'
      : running
        ? 'border-lab-cyan/40 text-cyan-100'
        : 'border-white/15 text-slate-300'

  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid="hud-camera-toggle"
      data-tracker-status={status}
      className={`pointer-events-auto flex items-center gap-2 rounded-full border bg-lab-void/70 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-xl transition hover:bg-white/10 ${tone}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : failed ? (
        <AlertTriangle className="h-3.5 w-3.5" />
      ) : running ? (
        <Camera className="h-3.5 w-3.5" />
      ) : (
        <CameraOff className="h-3.5 w-3.5" />
      )}
      {loading
        ? 'Starting camera…'
        : failed
          ? 'Camera unavailable'
          : running
            ? handPresent
              ? 'Hand tracked'
              : 'Show your hand'
            : 'Enable camera'}
      {/* The mouse fallback is ALWAYS advertised, never hidden behind an error
          state: a user whose webcam fails must still see how to proceed. */}
      {!running && (
        <span className="flex items-center gap-1 border-l border-white/15 pl-2 font-normal text-slate-400">
          <Mouse className="h-3 w-3" />
          mouse works
        </span>
      )}
    </button>
  )
}

/* ------------------------------- the HUD -------------------------------- */

export default function LabHud({
  status,
  handPresent,
  onToggleCamera,
  hoveredChemical,
  carrying,
  quantity,
  onQuantityChange,
  ingredients,
  result,
  onRemove,
  onReset,
  hint,
}) {
  const [showScience, setShowScience] = useState(false)
  const reacted = result?.outcome === OUTCOME.REACTION
  const empty = result?.outcome === OUTCOME.INCOMPLETE
  // While carrying, the slider targets the held reagent; otherwise the hovered
  // one. That is what lets a SINGLE slider feel like it belongs to "the thing
  // you are looking at", instead of needing one control per bottle.
  const focus = carrying ?? hoveredChemical

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {/* ------------------------- top-left: status ------------------------- */}
      <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
        <TrackerBadge status={status} handPresent={handPresent} onToggle={onToggleCamera} />
        {hint && (
          <div
            data-testid="hud-hint"
            className="animate-fade-up rounded-lg border border-white/10 bg-lab-void/60 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-xl"
          >
            {hint}
          </div>
        )}
      </div>

      {/* --------------------- top-right: focused reagent --------------------- */}
      {focus && (
        <Card className="absolute right-4 top-4 w-[228px] p-3" data-testid="hud-focus">
          <div className="flex items-center gap-2">
            <span
              className="h-7 w-1.5 shrink-0 rounded-full"
              style={{ background: focus.color, boxShadow: `0 0 12px ${focus.color}` }}
            />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-white">
                {focus.symbol}
              </p>
              <p className="truncate text-[10px] text-slate-400">{focus.name}</p>
            </div>
          </div>

          {/* quantity — the one setting a user changes mid-experiment */}
          <label className="mt-2.5 block">
            <span className="flex items-center justify-between text-[10px] text-slate-500">
              Quantity
              <span className="font-mono tabular-nums text-slate-300">
                {quantity} {QUANTITY.label}
              </span>
            </span>
            <input
              type="range"
              min={QUANTITY.min}
              max={QUANTITY.max}
              step={QUANTITY.step}
              value={quantity}
              data-testid="hud-quantity"
              data-chemical-id={focus.id}
              onChange={(e) => onQuantityChange(focus.id, Number(e.target.value))}
              className="mt-1 w-full accent-lab-cyan"
            />
          </label>
          <p className="mt-1 text-[10px] leading-snug text-slate-500">{focus.blurb}</p>
        </Card>
      )}

      {/* -------------------- bottom-left: beaker contents -------------------- */}
      <Card className="absolute bottom-4 left-4 w-[230px] p-3" data-testid="hud-contents">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="panel-title">In the beaker</h3>
          {ingredients.length > 0 && (
            <button
              type="button"
              onClick={onReset}
              data-testid="reset-beaker"
              className="btn-ghost !px-2 !py-1 !text-[10px]"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        {ingredients.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/12 px-2.5 py-3 text-center text-[11px] text-slate-500">
            Empty — grab a reagent from the shelf.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {ingredients.map((ing) => (
              <li
                key={ing.slot ?? ing.id}
                className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5"
              >
                <span
                  className="h-5 w-1 rounded-full"
                  style={{ background: ing.color, boxShadow: `0 0 8px ${ing.color}` }}
                />
                <p className="min-w-0 flex-1 truncate font-display text-[11px] font-semibold text-white">
                  {ing.symbol}
                </p>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">
                  {ing.quantity} {QUANTITY.label}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(ing.slot ?? ing.id)}
                  data-testid="remove-ingredient"
                  data-remove-id={ing.id}
                  aria-label={`Remove ${ing.name} from the beaker`}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded border border-white/10 text-slate-500 transition hover:border-rose-400/50 hover:text-rose-300"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ----------------------- bottom-right: result ----------------------- */}
      {!empty && (
        <Card
          className={`animate-fade-up absolute bottom-16 right-4 max-h-[58vh] w-[298px] overflow-y-auto p-3 ${
            reacted ? '!border-emerald-300/30' : ''
          }`}
        >
          <div data-testid="results-panel" data-outcome={result.outcome} className="space-y-2">
            <div className="flex items-start gap-2">
              <Sparkles
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  reacted ? 'text-emerald-300' : 'text-slate-400'
                }`}
              />
              <div className="min-w-0">
                <h3
                  className={`font-display text-[13px] font-semibold leading-tight ${
                    reacted ? 'text-emerald-200' : 'text-slate-200'
                  }`}
                >
                  {result.title}
                </h3>
                {result.concept && (
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                    {result.concept}
                  </p>
                )}
              </div>
            </div>

            <ReactionWarning result={result} />
      {result.effects?.gas && <p data-testid="gas-label" className="my-2 text-xs font-semibold text-cyan-200">↑ {result.effects.gas} gas escaping · white markers illustrate colourless gas</p>}
      {result.effects?.explosion && <p className="my-2 text-xs font-semibold text-amber-200">Simulated explosion · possible hazard, not a prediction</p>}
      {result.equation && (
              <p className="rounded-lg border border-white/10 bg-lab-void/80 px-2.5 py-1.5 text-center font-mono text-[11px] leading-relaxed text-white">
                {result.equation}
              </p>
            )}

            {result.conditions && (
              <p className="text-[10px] leading-relaxed text-slate-400">
                <span className="text-slate-300">Conditions: </span>{result.conditions}
              </p>
            )}

            {result.observations?.length > 0 && (
              <ul className="space-y-1">
                {result.observations.map((obs) => (
                  <li key={obs} className="flex gap-1.5 text-[10px] leading-relaxed text-slate-300">
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-lab-cyan" />
                    {obs}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setShowScience((s) => !s)}
              className="btn-ghost w-full justify-center !text-[10px]"
            >
              <BookOpen className="h-3 w-3" />
              {showScience ? 'Hide the science' : 'Explain the science'}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showScience ? 'rotate-180' : ''}`}
              />
            </button>

            {showScience && (
              <div className="animate-fade-up space-y-1.5 rounded-lg border border-lab-violet/25 bg-lab-violet/[0.07] p-2.5">
                <p className="text-[10px] leading-relaxed text-slate-200">{result.explanation}</p>
                {result.quantitiesNote && (
                  <p className="text-[9px] leading-relaxed text-slate-400">
                    {result.quantitiesNote}
                  </p>
                )}
              </div>
            )}

            {result.safety && (
              <p className="flex gap-1.5 rounded-lg border border-rose-400/25 bg-rose-400/[0.07] p-2 text-[9px] leading-relaxed text-rose-200/90">
                <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
                {result.safety}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* ------------------ bottom-centre: gesture cheat-sheet ------------------ */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-lab-void/60 px-4 py-1.5 text-[10px] text-slate-400 backdrop-blur-xl">
        <span className="flex items-center gap-1.5">
          <Hand className="h-3 w-3 text-lab-cyan" />
          Pinch to grab
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span>Hold a bottle over the beaker to pour</span>
        <span className="h-3 w-px bg-white/10" />
        <span>Release a solid over the beaker to drop</span>
      </div>

      {/* safety footer — kept visible because this is an educational sim */}
      <p className="absolute left-1/2 top-4 w-[340px] -translate-x-1/2 text-center text-[9px] leading-relaxed text-slate-500">
        Educational simulation. Video is processed locally and never uploaded.
      </p>
    </div>
  )
}

