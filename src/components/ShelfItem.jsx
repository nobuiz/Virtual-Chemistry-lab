import { memo } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { CATEGORY_STYLES, QUANTITY } from '../data/chemicals'
import ReagentArt from './ReagentArt'

/**
 * A single reagent standing on a laboratory shelf.
 *
 * `data-grabbable` + `data-chemical-id` are how the shared pointer layer finds
 * this item by hit-testing, so the SAME code path serves both the hand cursor
 * and the mouse. Nothing here knows which input device is in use — that
 * contract is unchanged from the original flat card.
 */
function ShelfItem({ chemical, quantity, onQuantityChange, hovered, grabbed, inBeaker, disabled }) {
  const style = CATEGORY_STYLES[chemical.category]
  const isLiquid = chemical.form === 'liquid'

  return (
    <div
      data-grabbable={disabled ? 'false' : 'true'}
      data-chemical-id={chemical.id}
      data-form={chemical.form}
      className={`group relative flex flex-col rounded-xl border px-2 pb-2 pt-1.5 transition-all duration-200 no-select ${
        grabbed
          ? 'border-lab-cyan/70 bg-lab-cyan/10'
          : hovered
            ? 'scale-[1.04] border-lab-cyan/60 bg-white/[0.07] shadow-glow'
            : 'border-white/8 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]'
      } ${disabled ? 'pointer-events-none opacity-40 grayscale' : 'cursor-grab'}`}
      style={hovered && !grabbed ? { boxShadow: `0 0 26px -6px ${style.ring}` } : undefined}
    >
      {/* category tint wash */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(90px 50px at 50% 0%, ${style.tint}, transparent 70%)` }}
      />

      {/* ---- the object itself, standing on its shelf ---- */}
      <div className="relative grid h-[72px] place-items-end justify-items-center">
        {/* pool of light from above */}
        <div
          className="pointer-events-none absolute inset-x-2 top-0 h-10 rounded-full blur-xl transition-opacity duration-300"
          style={{ background: style.tint, opacity: hovered ? 0.9 : 0.45 }}
        />
        <div
          className={`relative transition-transform duration-200 ${
            grabbed ? 'scale-75 opacity-25' : hovered ? '-translate-y-1 scale-105' : ''
          }`}
          data-testid="shelf-art"
        >
          <ReagentArt chemical={chemical} size={isLiquid ? 56 : 52} />
        </div>
      </div>

      {/* the shelf board the object rests on */}
      <div className="relative -mx-2 mb-1.5 h-[7px]">
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: 'linear-gradient(180deg, rgba(190,230,255,0.38), rgba(120,170,220,0.14))',
          }}
        />
        <div
          className="absolute inset-x-0 top-[3px] h-[4px]"
          style={{ background: 'linear-gradient(180deg, rgba(8,14,32,0.85), rgba(8,14,32,0))' }}
        />
      </div>

      {/* ---- identity ---- */}
      <div className="relative flex items-center justify-center gap-1.5">
        <span className="font-display text-[13px] font-bold leading-none text-white">
          {chemical.symbol}
        </span>
        {inBeaker && (
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-emerald-300/50 bg-emerald-400/15">
            <Check className="h-2.5 w-2.5 text-emerald-300" />
          </span>
        )}
      </div>
      <p className="relative mt-0.5 truncate text-center text-[10px] leading-tight text-slate-400">
        {chemical.name}
      </p>

      {/* ---- quantity selector — mouse, keyboard and touch ---- */}
      <div className="relative mt-1.5 flex items-center gap-1" data-grabbable="false">
        <button
          type="button"
          aria-label={`Decrease ${chemical.name} quantity`}
          onClick={() => onQuantityChange(chemical.id, quantity - QUANTITY.step)}
          className="grid h-5 w-5 shrink-0 place-items-center rounded border border-white/10 bg-white/5 text-slate-400 transition hover:border-lab-cyan/50 hover:text-lab-cyan"
        >
          <Minus className="h-2.5 w-2.5" />
        </button>

        <input
          type="range"
          min={QUANTITY.min}
          max={QUANTITY.max}
          step={QUANTITY.step}
          value={quantity}
          aria-label={`${chemical.name} quantity in ${QUANTITY.longLabel}`}
          onChange={(e) => onQuantityChange(chemical.id, Number(e.target.value))}
          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400
                     [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-lab-cyan [&::-webkit-slider-thumb]:shadow-glow"
          style={{
            background: `linear-gradient(90deg, ${chemical.color} ${
              ((quantity - QUANTITY.min) / (QUANTITY.max - QUANTITY.min)) * 100
            }%, rgba(255,255,255,0.1) 0%)`,
          }}
        />

        <button
          type="button"
          aria-label={`Increase ${chemical.name} quantity`}
          onClick={() => onQuantityChange(chemical.id, quantity + QUANTITY.step)}
          className="grid h-5 w-5 shrink-0 place-items-center rounded border border-white/10 bg-white/5 text-slate-400 transition hover:border-lab-cyan/50 hover:text-lab-cyan"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      </div>
      <span className="relative mt-1 text-center font-mono text-[9px] tabular-nums text-slate-400">
        {quantity} {QUANTITY.label}
      </span>
    </div>
  )
}

export default memo(ShelfItem)