import { forwardRef } from 'react'
import { Beaker, Droplet, Hand, Layers, Package } from 'lucide-react'
import { CHEMICALS } from '../data/chemicals'
import ShelfItem from './ShelfItem'

/**
 * Two physical shelf sections. Solids and liquids are separated because they
 * are *interacted with differently* (drop vs. pour), so the grouping teaches
 * the control scheme as well as organising the inventory.
 */
const SECTIONS = [
  {
    key: 'solid',
    label: 'Solid Reagents',
    hint: 'Pinch to pick up · release over the beaker',
    icon: Package,
    match: (c) => c.form === 'solid',
  },
  {
    key: 'liquid',
    label: 'Liquid Reagents',
    hint: 'Pinch to lift · hold over the beaker to pour',
    icon: Droplet,
    match: (c) => c.form === 'liquid',
  },
]

/**
 * The chemical library.
 *
 * The forwarded ref points at the scrolling viewport. App.jsx needs it for two
 * things: hit-testing whether the hand cursor is inside the scroll region, and
 * applying open-palm scroll deltas directly to `scrollTop` (no React state, so
 * scrolling never re-renders the shelves).
 */
const ChemicalLibrary = forwardRef(function ChemicalLibrary(
  { quantities, onQuantityChange, hoveredId, grabbedId, beakerIds, full, scrolling },
  scrollRef,
) {
  return (
    <aside className="glass edge-glow relative flex h-full min-h-0 w-[272px] shrink-0 flex-col xl:w-[300px]">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-lab-cyan" />
          <h2 className="panel-title">Chemical Library</h2>
        </div>
        <span className="chip border-white/10 bg-white/[0.04] text-slate-400">
          {CHEMICALS.length} reagents
        </span>
      </div>
      <div className="hair" />

      {/* scroll-mode banner — only while the gesture is actually latched */}
      {scrolling && (
        <div
          data-testid="scroll-mode"
          className="animate-fade-up absolute left-1/2 top-12 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-lab-cyan/50 bg-lab-cyan/15 px-3 py-1 text-[10px] font-semibold text-cyan-100 backdrop-blur-md"
        >
          <Hand className="h-3 w-3" />
          Scroll mode active
        </div>
      )}

      <div
        ref={scrollRef}
        data-testid="library-scroll"
        data-scrolling={scrolling ? 'true' : 'false'}
        className={`min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 transition-shadow duration-200 ${
          scrolling ? 'shadow-[inset_0_0_0_1px_rgba(34,227,255,0.35)]' : ''
        }`}
      >
        {full && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300/25 bg-amber-300/[0.07] p-2.5 text-[11px] leading-relaxed text-amber-200/90">
            <Beaker className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              The beaker holds a maximum of two reagents in this MVP, which keeps the reaction logic
              reliable. Reset the experiment to try a different pair.
            </span>
          </div>
        )}

        {SECTIONS.map(({ key, label, hint, icon: Icon, match }) => {
          const items = CHEMICALS.filter(match)
          return (
            <section key={key} data-testid={`shelf-${key}`} className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-1">
                <Icon className="h-3 w-3 text-lab-violet" />
                <h3 className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {label}
                </h3>
              </div>
              <p className="px-1 text-[9px] leading-tight text-slate-500">{hint}</p>

              {/* the shelf unit: back panel + the row of reagents on it */}
              <div
                className="relative rounded-xl border border-white/8 p-1.5"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(12,20,44,0.9), rgba(8,13,30,0.55) 60%, rgba(16,26,54,0.75))',
                  boxShadow: 'inset 0 1px 0 rgba(190,230,255,0.08), inset 0 -10px 20px -14px #000',
                }}
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {items.map((chemical) => (
                    <ShelfItem
                      key={chemical.id}
                      chemical={chemical}
                      quantity={quantities[chemical.id]}
                      onQuantityChange={onQuantityChange}
                      hovered={hoveredId === chemical.id}
                      grabbed={grabbedId === chemical.id}
                      inBeaker={beakerIds.includes(chemical.id)}
                      disabled={full && !beakerIds.includes(chemical.id)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <div className="hair" />
      <p className="px-4 py-3 text-[10px] leading-relaxed text-slate-500">
        Quantities are recorded in virtual units (vu) — this MVP does not model stoichiometry.
      </p>
    </aside>
  )
})

export default ChemicalLibrary