import { useEffect, useRef } from 'react'
import ReagentArt from './ReagentArt'
import { bottleMouthOffset } from '../lib/bottleGeometry'

const ART = 52 // px size of the carried reagent artwork
const RING_R = 26
const RING_C = 2 * Math.PI * RING_R

/**
 * The virtual hand cursor, the reagent currently being carried, the
 * hold-to-pour progress ring and the pour stream.
 *
 * EVERYTHING that changes at frame rate (cursor position, bottle tilt, ring
 * progress, stream geometry) is written straight to the DOM inside a single
 * rAF. React only re-renders when the *identity* of the carried reagent
 * changes, so a 60 fps drag costs zero reconciliations.
 */
export default function CursorOverlay({
  pointerRef,
  visible,
  pinching,
  carrying,
  pourRef,
  dropZoneRef,
  /**
   * Whether to draw the carried reagent and the pour stream in 2D.
   *
   * The 3D lab renders both IN THE SCENE, where they are lit, occluded and
   * correctly scaled — drawing them again as a flat sprite on top would
   * double the object. The cursor dot and the hold-to-pour ring are still
   * wanted there, because they are UI, not objects.
   */
  showArt = true,
}) {
  const rootRef = useRef(null)
  const artRef = useRef(null)
  const ringRef = useRef(null)
  const streamRef = useRef(null)
  const isLiquid = carrying?.form === 'liquid'

  useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined
    let raf = 0

    const tick = () => {
      const p = pointerRef.current
      if (p) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`

      const pour = pourRef?.current
      const progress = pour?.progress ?? 0
      const pouring = Boolean(pour?.pouring)

      // --- hold-to-pour progress ring ---
      const ring = ringRef.current
      if (ring) {
        ring.style.strokeDashoffset = String(RING_C * (1 - progress))
        ring.style.opacity = progress > 0.01 && !pouring ? '1' : '0'
      }

      // --- bottle tilt: eases in over the pour, rotating about its base ---
      const art = artRef.current
      let tilt = 0
      if (art) {
        if (pouring) tilt = -78 * Math.min(1, pour.tiltProgress ?? 0)
        else if (progress > 0) tilt = -10 * progress
        art.style.transform = `rotate(${tilt}deg)`
      }

      // --- liquid stream, anchored to the real bottle mouth ---
      const stream = streamRef.current
      if (stream) {
        const box = dropZoneRef?.current?.getBoundingClientRect()
        if (pouring && p && box) {
          const m = bottleMouthOffset(tilt, ART)
          const x1 = p.x + m.x
          const y1 = p.y + m.y
          const x2 = box.left + box.width / 2
          const y2 = box.top + box.height * 0.3
          stream.setAttribute('d', `M${x1} ${y1} Q${x1} ${(y1 + y2) / 2} ${x2} ${y2}`)
          stream.style.opacity = '1'
        } else {
          stream.style.opacity = '0'
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pointerRef, pourRef, dropZoneRef])

  return (
    <>
      {/* ---------------- pour stream (own fixed layer) ---------------- */}
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 h-full w-full"
        data-testid="pour-stream"
      >
        <path
          ref={streamRef}
          d=""
          fill="none"
          stroke={carrying?.color ?? '#38bdf8'}
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0"
          style={{
            filter: `drop-shadow(0 0 10px ${carrying?.color ?? '#38bdf8'})`,
            transition: 'opacity 140ms linear',
            display: showArt ? undefined : 'none',
          }}
        />
      </svg>

      {/* ---------------- cursor + carried reagent ---------------- */}
      <div
        ref={rootRef}
        aria-hidden="true"
        data-testid="cursor-overlay"
        data-visible={visible ? 'true' : 'false'}
        data-pinching={pinching ? 'true' : 'false'}
        className={`pointer-events-none fixed left-0 top-0 z-50 transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          {/* outer ring */}
          <div
            className={`grid place-items-center rounded-full border-2 backdrop-blur-[2px] transition-all duration-150 ${
              pinching
                ? 'h-7 w-7 border-emerald-300 bg-emerald-300/25 shadow-[0_0_24px_rgba(52,211,153,0.75)]'
                : 'h-11 w-11 border-lab-cyan/80 bg-lab-cyan/10 shadow-glow'
            }`}
          >
            <span
              className={`rounded-full transition-all duration-150 ${
                pinching ? 'h-1.5 w-1.5 bg-emerald-200' : 'h-2 w-2 bg-lab-cyan'
              }`}
            />
          </div>

          {/* idle pulse */}
          {!pinching && (
            <span className="absolute inset-0 animate-pulse-ring rounded-full border border-lab-cyan/40" />
          )}

          {/* hold-to-pour progress ring */}
          {isLiquid && (
            <svg
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              width={(RING_R + 5) * 2}
              height={(RING_R + 5) * 2}
              aria-hidden="true"
            >
              <circle
                ref={ringRef}
                cx={RING_R + 5}
                cy={RING_R + 5}
                r={RING_R}
                fill="none"
                stroke="#22e3ff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C}
                transform={`rotate(-90 ${RING_R + 5} ${RING_R + 5})`}
                opacity="0"
                style={{ filter: 'drop-shadow(0 0 6px #22e3ff)' }}
              />
            </svg>
          )}

          {/* the carried reagent — same artwork as on the shelf.
              In 3D the object itself is in the scene, so only the identity
              tag is kept: the tag is a label, not a duplicate of the object.
              The wrapper stays mounted either way so `carry-preview` remains
              a reliable QA probe for "what am I holding?" in both renderers. */}
          {carrying && (
            <div
              data-testid="carry-preview"
              data-carry-id={carrying.id}
              data-carry-form={carrying.form}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              {showArt && (
                <div
                  ref={artRef}
                  className="origin-bottom"
                  style={{ transition: 'transform 90ms linear' }}
                >
                  <ReagentArt chemical={carrying} size={ART} showLabel={false} />
                </div>
              )}

              {/* identity tag, offset so it never covers the object */}
              <div
                className="absolute left-1/2 top-full -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg border px-2 py-0.5 backdrop-blur-md"
                style={{
                  borderColor: `${carrying.color}99`,
                  background: 'rgba(7,11,26,0.9)',
                  boxShadow: `0 0 20px -6px ${carrying.color}`,
                }}
              >
                <span className="font-display text-[10px] font-bold text-white">
                  {carrying.symbol}
                </span>
                <span className="ml-1 font-mono text-[9px] text-slate-300">
                  {carrying.quantity} vu
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
