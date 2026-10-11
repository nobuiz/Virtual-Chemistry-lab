import { useMemo, useState } from 'react'
import { FlaskConical, Search, Sparkles } from 'lucide-react'
import { ALL_REACTIONS, MODELLED_PAIR_COUNT, OUTCOME } from '../data/reactions'
import { getChemical } from '../data/chemicals'

/**
 * A browsable index of every verified pair in the reaction database.
 * Useful both as a discovery aid and as an honesty statement: the user can see
 * exactly how much the engine actually knows.
 */
export default function ExperimentsView({ onTry }) {
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_REACTIONS.filter((r) => {
      if (!q) return true
      const names = r.reactants.map((id) => getChemical(id)?.name ?? id).join(' ')
      return `${names} ${r.reactants.join(' ')} ${r.title} ${r.equation}`.toLowerCase().includes(q)
    })
  }, [query])

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-3 overflow-hidden p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Verified reaction database</h2>
          <p className="mt-1 text-xs text-slate-400">
            {MODELLED_PAIR_COUNT} hand-checked pairs. Anything outside this list is reported as
            “not modelled” rather than guessed.
          </p>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reagents or equations…"
            className="w-64 rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-lab-cyan/50 focus:outline-none"
          />
        </label>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/12 p-6 text-center text-xs text-slate-500">
            No modelled pair matches “{query}”.
          </p>
        )}

        {rows.map((r) => {
          const [a, b] = r.reactants.map((id) => getChemical(id))
          const reacted = r.outcome === OUTCOME.REACTION
          return (
            <article
              key={`${r.reactants[0]}+${r.reactants[1]}`}
              className="glass glass-hover flex items-center gap-3 p-3"
            >
              <div className="flex shrink-0 items-center gap-1.5">
                <Pill chem={a} />
                <span className="font-display text-xs text-slate-500">+</span>
                <Pill chem={b} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xs font-semibold text-white">{r.title}</p>
                <p className="truncate font-mono text-[10px] text-slate-400">{r.equation}</p>
              </div>

              <span
                className={`chip shrink-0 ${
                  reacted
                    ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-200'
                    : 'border-white/12 bg-white/[0.04] text-slate-400'
                }`}
              >
                {reacted ? <Sparkles className="h-3 w-3" /> : null}
                {reacted ? 'Reaction' : r.outcome === OUTCOME.CONDITIONAL ? 'Condition-dependent' : 'No reaction'}
              </span>

              <button
                type="button"
                onClick={() => onTry(r.reactants)}
                className="btn-primary shrink-0 !px-2.5 !py-1.5 !text-[10px]"
              >
                <FlaskConical className="h-3 w-3" />
                Load
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Pill({ chem }) {
  if (!chem) return null
  return (
    <span
      className="inline-flex h-7 min-w-[44px] items-center justify-center rounded-lg border px-1.5 font-display text-[11px] font-bold"
      style={{
        borderColor: `${chem.color}66`,
        background: `${chem.color}1f`,
        color: chem.color,
      }}
      title={chem.name}
    >
      {chem.symbol}
    </span>
  )
}
