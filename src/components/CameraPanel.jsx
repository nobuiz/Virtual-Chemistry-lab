import { useEffect, useRef } from 'react'
import { AlertTriangle, Camera, Hand, Loader2, Pointer, SlidersHorizontal } from 'lucide-react'
import { HAND_CONNECTIONS, LM } from '../lib/handMath'
import { TRACKER_STATUS } from '../hooks/useHandTracking'

/**
 * Live webcam preview with the 21-point hand skeleton drawn on top.
 *
 * Landmarks are read from a ref the tracking loop writes to, so the overlay
 * runs on its own rAF and never re-renders React at camera framerate.
 */
export default function CameraPanel({
  videoRef,
  landmarksRef,
  status,
  error,
  snapshot,
  onRetry,
  pinchSensitivity,
  onPinchSensitivity,
  reachMargin,
  onReachMargin,
}) {
  const overlayRef = useRef(null)
  const pinchingRef = useRef(false)

  // The overlay loop reads this ref instead of a prop so that changing pinch
  // state never has to restart the animation frame loop.
  useEffect(() => {
    pinchingRef.current = snapshot.pinching
  }, [snapshot.pinching])

  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let raf = 0

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.floor(rect.width * dpr)) {
        canvas.width = Math.max(1, Math.floor(rect.width * dpr))
        canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, rect.width, rect.height)

      const lm = landmarksRef.current
      if (lm && lm.length === 21) {
        // The preview is mirrored, so mirror the landmarks to match.
        const px = (p) => ({ x: (1 - p.x) * rect.width, y: p.y * rect.height })
        const pinching = pinchingRef.current

        ctx.lineWidth = 2
        ctx.strokeStyle = pinching ? 'rgba(52, 211, 153, 0.9)' : 'rgba(34, 227, 255, 0.75)'
        ctx.shadowColor = pinching ? 'rgba(52,211,153,0.8)' : 'rgba(34,227,255,0.8)'
        ctx.shadowBlur = 7
        HAND_CONNECTIONS.forEach(([a, b]) => {
          const pa = px(lm[a])
          const pb = px(lm[b])
          ctx.beginPath()
          ctx.moveTo(pa.x, pa.y)
          ctx.lineTo(pb.x, pb.y)
          ctx.stroke()
        })

        lm.forEach((p, i) => {
          const q = px(p)
          const key = i === LM.THUMB_TIP || i === LM.INDEX_TIP
          ctx.beginPath()
          ctx.arc(q.x, q.y, key ? 5 : 2.6, 0, Math.PI * 2)
          ctx.fillStyle = key ? (pinching ? '#34d399' : '#22e3ff') : 'rgba(226,232,240,0.85)'
          ctx.fill()
        })

        // Pinch gap indicator between thumb and index tips.
        const a = px(lm[LM.THUMB_TIP])
        const b = px(lm[LM.INDEX_TIP])
        ctx.setLineDash([4, 4])
        ctx.lineWidth = 1.5
        ctx.strokeStyle = pinching ? 'rgba(52,211,153,0.95)' : 'rgba(251,191,36,0.8)'
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.setLineDash([])

        if (pinching) {
          ctx.beginPath()
          ctx.arc((a.x + b.x) / 2, (a.y + b.y) / 2, 13, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(52,211,153,0.8)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
        ctx.shadowBlur = 0
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [landmarksRef])

  const busy =
    status === TRACKER_STATUS.LOADING_MODEL || status === TRACKER_STATUS.REQUESTING_CAMERA

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-lab-void">
        <video
          ref={videoRef}
          className="h-full w-full scale-x-[-1] object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />

        {status === TRACKER_STATUS.RUNNING && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="h-[2px] w-full animate-scan-line bg-gradient-to-r from-transparent via-lab-cyan/60 to-transparent" />
          </div>
        )}

        {/* corner brackets */}
        <div className="pointer-events-none absolute inset-2">
          {[
            'left-0 top-0 border-l-2 border-t-2',
            'right-0 top-0 border-r-2 border-t-2',
            'left-0 bottom-0 border-l-2 border-b-2',
            'right-0 bottom-0 border-r-2 border-b-2',
          ].map((cls) => (
            <span key={cls} className={`absolute h-4 w-4 rounded-sm border-lab-cyan/50 ${cls}`} />
          ))}
        </div>

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-lab-void/85 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-lab-cyan" />
              <p className="font-display text-xs text-slate-300">
                {status === TRACKER_STATUS.LOADING_MODEL
                  ? 'Loading Hand Landmarker…'
                  : 'Waiting for camera permission…'}
              </p>
            </div>
          </div>
        )}

        {(status === TRACKER_STATUS.IDLE || status === TRACKER_STATUS.STOPPED) && (
          <div className="absolute inset-0 grid place-items-center bg-lab-void/80 px-5 text-center">
            <div className="space-y-2">
              <Camera className="mx-auto h-6 w-6 text-slate-500" />
              <p className="text-[11px] leading-relaxed text-slate-400">
                Camera is off. Press <span className="text-lab-cyan">Start Tracking</span> to control
                the lab with your hands — or just use your mouse.
              </p>
            </div>
          </div>
        )}

        {status === TRACKER_STATUS.ERROR && (
          <div className="absolute inset-0 grid place-items-center bg-lab-void/[0.92] px-4 text-center">
            <div className="space-y-2.5">
              <AlertTriangle className="mx-auto h-6 w-6 text-rose-400" />
              <p className="text-[11px] leading-relaxed text-rose-200/90">{error}</p>
              <button type="button" className="btn-ghost mx-auto" onClick={onRetry}>
                Retry camera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* live telemetry */}
      <div className="grid grid-cols-2 gap-2">
        <Stat
          icon={Hand}
          label="Hand"
          value={snapshot.handPresent ? snapshot.handedness ?? 'Detected' : 'None'}
          active={snapshot.handPresent}
        />
        <Stat
          icon={Pointer}
          label="Pinch"
          value={snapshot.pinching ? 'GRABBING' : 'Open'}
          active={snapshot.pinching}
          tone="mint"
        />
      </div>

      <div className="space-y-1.5 rounded-lg border border-white/8 bg-white/[0.025] p-2.5">
        <Meter
          label="Pinch ratio (hand-size normalised)"
          value={snapshot.pinchRatio}
          threshold={pinchSensitivity}
        />
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
          <span>conf {snapshot.confidence || '—'}</span>
          <span>{snapshot.fingersExtended} fingers up</span>
          <span>{snapshot.fps ? `${snapshot.fps} fps` : '— fps'}</span>
        </div>
      </div>

      {/* calibration */}
      <details className="rounded-lg border border-white/8 bg-white/[0.025] p-2.5">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-medium text-slate-300">
          <SlidersHorizontal className="h-3.5 w-3.5 text-lab-violet" />
          Tracking calibration
        </summary>
        <div className="mt-3 space-y-3">
          <Slider
            label="Pinch sensitivity"
            hint={`grab below ${pinchSensitivity.toFixed(2)} · release above ${(
              pinchSensitivity + 0.15
            ).toFixed(2)}`}
            min={0.25}
            max={0.6}
            step={0.01}
            value={pinchSensitivity}
            onChange={onPinchSensitivity}
          />
          <Slider
            label="Cursor reach"
            hint={`${Math.round(reachMargin * 100)}% camera margin — higher means less hand travel`}
            min={0}
            max={0.3}
            step={0.01}
            value={reachMargin}
            onChange={onReachMargin}
          />
        </div>
      </details>
    </div>
  )
}

function Stat({ icon: Icon, label, value, active, tone = 'cyan' }) {
  const on =
    tone === 'mint'
      ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200'
      : 'border-lab-cyan/40 bg-lab-cyan/10 text-lab-cyan'
  return (
    <div
      className={`rounded-lg border p-2 transition-all duration-200 ${
        active ? on : 'border-white/8 bg-white/[0.025] text-slate-500'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        <span className="text-[9px] uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-0.5 font-display text-xs font-semibold">{value}</p>
    </div>
  )
}

function Meter({ label, value, threshold }) {
  const pct = value === null ? 0 : Math.min((value / 1.2) * 100, 100)
  const tPct = Math.min((threshold / 1.2) * 100, 100)
  const grabbing = value !== null && value < threshold
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-slate-400">{value ?? '—'}</span>
      </div>
      <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            grabbing ? 'bg-emerald-400' : 'bg-lab-cyan'
          }`}
          style={{ width: `${pct}%` }}
        />
        <span
          className="absolute top-0 h-full w-px bg-amber-300/90"
          style={{ left: `${tPct}%` }}
          title="pinch threshold"
        />
      </div>
    </div>
  )
}

function Slider({ label, hint, min, max, step, value, onChange }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10
                   [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-lab-violet"
      />
      <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{hint}</p>
    </label>
  )
}
