import ReactionWarning from './ReactionWarning'
import { useState } from 'react'
import {
  AlertTriangle,
  Atom,
  BookOpen,
  Eye,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { OUTCOME } from '../data/reactions'
import { QUANTITY } from '../data/chemicals'

/**
 * Lab notebook for the current experiment.
 *
 * The panel is deliberately explicit about epistemics: a verified
 * "no significant reaction" looks very different from "not modelled", which
 * is the engine refusing to guess.
 */
export default function ResultsPanel({ result, ingredients, onRemove, onReset }) {
  const [showScience, setShowScience] = useState(true)
  const empty = result.outcome === OUTCOME.INCOMPLETE

  return (
    <div className="space-y-3" data-testid="results-panel" data-outcome={result.outcome}>
      {/* ------------------------------ contents ------------------------------ */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="panel-title">Experiment contents</h3>
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
          <p className="rounded-lg border border-dashed border-white/12 px-3 py-4 text-center text-[11px] text-slate-500">
            The beaker is empty.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {ingredients.map((ing) => (
              <li
                key={ing.slot ?? ing.id}
                className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-2"
              >
                <span
                  className="h-6 w-1 rounded-full"
                  style={{ background: ing.color, boxShadow: `0 0 10px ${ing.color}` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xs font-semibold text-white">
                    {ing.symbol} <span className="font-normal text-slate-400">{ing.name}</span>
                  </p>
                  <p className="truncate text-[10px] text-slate-500">{ing.state}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-300">
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
      </section>

      <div className="hair" />

      {/* ------------------------------- result ------------------------------- */}
      {empty ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-center">
          <Atom className="mx-auto h-6 w-6 text-slate-600" />
          <p className="mt-2 font-display text-xs font-semibold text-slate-300">{result.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{result.message}</p>
        </div>
      ) : result.outcome === OUTCOME.NOT_MODELLED ? (
        <div className="animate-fade-up rounded-xl border border-amber-300/30 bg-amber-300/[0.07] p-3.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-300" />
            <h3 className="font-display text-sm font-semibold text-amber-200">{result.title}</h3>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-100/85">{result.message}</p>
          <p className="mt-2 rounded-lg bg-amber-300/10 px-2.5 py-2 text-[10px] leading-relaxed text-amber-200/90">
            Honest uncertainty is a feature: GestureLab AI only animates outcomes it can back with a
            verified, hand-checked entry.
          </p>
        </div>
      ) : (
        <ResultBody result={result} showScience={showScience} onToggle={() => setShowScience((v) => !v)} />
      )}
    </div>
  )
}

/** A verified reaction / verified no-reaction write-up. */
function ResultBody({ result, showScience, onToggle }) {
  const reacted = result.outcome === OUTCOME.REACTION
  return (
    <div
      className={`animate-fade-up rounded-xl border p-3.5 ${
        reacted
          ? 'border-emerald-300/30 bg-emerald-300/[0.06]'
          : 'border-white/12 bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start gap-2">
        {reacted ? (
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        ) : (
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        )}
        <div className="min-w-0">
          <h3
            className={`font-display text-sm font-semibold ${
              reacted ? 'text-emerald-200' : 'text-slate-200'
            }`}
          >
            {result.title}
          </h3>
          {result.concept && (
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {result.concept}
            </p>
          )}
        </div>
      </div>

      {/* equation */}
      <ReactionWarning result={result} />
      {result.effects?.gas && <p data-testid="gas-label" className="my-2 text-xs font-semibold text-cyan-200">↑ {result.effects.gas} gas escaping · white markers illustrate colourless gas</p>}
      {result.effects?.explosion && <p className="my-2 text-xs font-semibold text-amber-200">Simulated explosion · possible hazard, not a prediction</p>}
      {result.equation && (
        <div className="mt-3 space-y-1.5">
          <p className="rounded-lg border border-white/10 bg-lab-void/70 px-3 py-2 text-center font-mono text-[12px] leading-relaxed text-white">
            {result.equation}
          </p>
          {result.ionic && (
            <p className="text-center font-mono text-[10px] text-slate-500">
              net ionic: {result.ionic}
            </p>
          )}
        </div>
      )}

      {/* observations */}
      {result.observations?.length > 0 && (
        <div className="mt-3">
          <h4 className="panel-title mb-1.5">What you would observe</h4>
          <ul className="space-y-1">
            {result.observations.map((obs) => (
              <li key={obs} className="flex gap-2 text-[11px] leading-relaxed text-slate-300">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-lab-cyan" />
                {obs}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* products + conditions */}
      {result.products?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {result.products.map((p) => (
            <span key={p} className="chip border-white/12 bg-white/[0.05] text-slate-300">
              {p}
            </span>
          ))}
        </div>
      )}
      {result.conditions && (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          <span className="text-slate-400">Assumed conditions:</span> {result.conditions}
        </p>
      )}

      {/* explanation */}
      <button
        type="button"
        onClick={onToggle}
        className="btn-ghost mt-3 w-full justify-center !text-[11px]"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {showScience ? 'Hide the science' : 'Explain the science'}
      </button>

      {showScience && (
        <div className="animate-fade-up mt-2 space-y-2 rounded-lg border border-lab-violet/25 bg-lab-violet/[0.07] p-3">
          <p className="text-[11px] leading-relaxed text-slate-200">{result.explanation}</p>
          {result.quantitiesNote && (
            <p className="text-[10px] leading-relaxed text-slate-400">{result.quantitiesNote}</p>
          )}
        </div>
      )}

      {result.safety && (
        <p className="mt-2 flex gap-2 rounded-lg border border-rose-400/25 bg-rose-400/[0.07] p-2.5 text-[10px] leading-relaxed text-rose-200/90">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          {result.safety}
        </p>
      )}
    </div>
  )
}
