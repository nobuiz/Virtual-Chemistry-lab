/**
 * ReagentArt — the shared SVG artwork for every reagent.
 *
 * One component renders a reagent EVERYWHERE it appears: on the shelf, in the
 * hand-cursor carry preview, and inside the Gesture Guide illustrations. That
 * keeps the "same object" illusion intact while the user drags something out of
 * the library and across the bench.
 *
 * Everything is a plain inline <svg> with a local viewBox, so it scales to any
 * pixel size without a second rasterisation path and without 3D rendering.
 */
import { BOTTLE_GEOMETRY } from '../lib/bottleGeometry'

/* ------------------------------------------------------------------ solids */

/** Simulated metal samples. Each shape is distinct enough to read at 44 px. */
function SolidArt({ chemical, size, tilt }) {
  const { color, accent, shape, id } = chemical
  const shade = '#0b1124'
  const gid = `ra-${id}`

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      <defs>
        {/* top-left key light, consistent across every sample */}
        <linearGradient id={`${gid}-face`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="48%" stopColor={color} />
          <stop offset="100%" stopColor={shade} />
        </linearGradient>
        <linearGradient id={`${gid}-top`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id={`${gid}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={shade} />
        </linearGradient>
      </defs>

      {/* contact shadow — sells the "resting on a shelf" read */}
      <ellipse cx="32" cy="55" rx="19" ry="4.2" fill="rgba(0,0,0,0.45)" />

      {shape === 'ingot' && (
        <g>
          <path d="M14 46 L20 28 L46 28 L52 46 Z" fill={`url(#${gid}-face)`} />
          <path d="M20 28 L24 22 L44 22 L46 28 Z" fill={`url(#${gid}-top)`} />
          <path d="M46 28 L52 46 L48 46 L44 28 Z" fill={`url(#${gid}-side)`} />
          <path d="M23 30 L28 30 L26 44 L21 44 Z" fill="rgba(255,255,255,0.3)" />
        </g>
      )}

      {shape === 'block' && (
        <g>
          <path d="M16 44 L16 26 L40 26 L40 44 Z" fill={`url(#${gid}-face)`} />
          <path d="M16 26 L26 18 L50 18 L40 26 Z" fill={`url(#${gid}-top)`} />
          <path d="M40 26 L50 18 L50 36 L40 44 Z" fill={`url(#${gid}-side)`} />
          <rect x="19" y="29" width="4" height="12" fill="rgba(255,255,255,0.34)" />
        </g>
      )}

      {shape === 'nugget' && (
        <g>
          <path
            d="M18 42 L14 31 L22 22 L36 19 L48 26 L49 38 L39 46 L26 47 Z"
            fill={`url(#${gid}-face)`}
          />
          <path d="M22 22 L36 19 L40 27 L26 30 Z" fill={`url(#${gid}-top)`} opacity="0.85" />
          <path d="M26 30 L40 27 L44 38 L30 41 Z" fill={color} opacity="0.55" />
          <circle cx="24" cy="27" r="2.6" fill="rgba(255,255,255,0.4)" />
        </g>
      )}

      {shape === 'shard' && (
        <g>
          <path d="M14 45 L22 20 L34 16 L46 28 L44 45 Z" fill={`url(#${gid}-face)`} />
          <path d="M22 20 L34 16 L36 29 L24 32 Z" fill={`url(#${gid}-top)`} opacity="0.8" />
          <path d="M36 29 L46 28 L44 45 L34 44 Z" fill={`url(#${gid}-side)`} />
          <path d="M26 23 L30 22 L28 40 L25 40 Z" fill="rgba(255,255,255,0.22)" />
        </g>
      )}

      {shape === 'granules' && (
        <g>
          {/* irregular granules rather than smooth spheres */}
          <path d="M14 46 L12 37 L19 31 L27 34 L28 43 L21 48 Z" fill={`url(#${gid}-face)`} />
          <path d="M31 48 L29 38 L37 32 L46 35 L48 45 L40 50 Z" fill={`url(#${gid}-face)`} />
          <path d="M22 33 L21 25 L29 20 L37 23 L38 31 L30 35 Z" fill={`url(#${gid}-face)`} />
          <path d="M44 34 L43 27 L50 24 L55 29 L53 36 L47 37 Z" fill={color} opacity="0.8" />
          <path d="M21 25 L29 20 L31 25 L23 29 Z" fill="rgba(255,255,255,0.35)" />
          <path d="M12 37 L19 31 L21 35 L14 40 Z" fill="rgba(255,255,255,0.25)" />
          <path d="M29 38 L37 32 L39 37 L31 42 Z" fill="rgba(255,255,255,0.22)" />
        </g>
      )}

      {shape === 'ribbon' && (
        <g>
          {/* a folded strip of ribbon lying on the shelf */}
          <path
            d="M13 45 L13 39 L45 23 L45 17 L51 17 L51 27 L19 43 L19 45 Z"
            fill={`url(#${gid}-face)`}
          />
          <path d="M13 39 L45 23 L45 20 L13 36 Z" fill={`url(#${gid}-top)`} />
          <path
            d="M13 39 L45 23"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <rect x="11" y="43" width="12" height="4.5" rx="1.6" fill={`url(#${gid}-side)`} />
        </g>
      )}
    </svg>
  )
}


/* ----------------------------------------------------------------- liquids */

/** A labelled laboratory bottle with a visible stock level. */
function LiquidArt({ chemical, size, tilt = 0, showLabel = true }) {
  const { color, symbol, id } = chemical
  const b = chemical.bottle ?? { glass: '#bcd9e8', cap: '#38bdf8', fill: 0.7 }
  const gid = `ra-${id}`
  const { pivot } = BOTTLE_GEOMETRY

  // liquid surface inside the body (body spans y 22..50)
  const bodyTop = 22
  const bodyBottom = 50
  const level = bodyBottom - (bodyBottom - bodyTop) * b.fill

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id={`${gid}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={b.glass} stopOpacity="0.5" />
          <stop offset="28%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="70%" stopColor={b.glass} stopOpacity="0.26" />
          <stop offset="100%" stopColor="#0b1124" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${gid}-liq`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`${gid}-cap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={b.cap} />
          <stop offset="100%" stopColor="#0b1124" />
        </linearGradient>
        {/* clip keeps the simulated liquid inside the bottle body */}
        <clipPath id={`${gid}-body`}>
          <path d="M22 22 Q22 18 25 16 L25 12 L39 12 L39 16 Q42 18 42 22 L42 47 Q42 51 38 51 L26 51 Q22 51 22 47 Z" />
        </clipPath>
      </defs>

      <ellipse cx="32" cy="55" rx="16" ry="3.8" fill="rgba(0,0,0,0.45)" />

      <g transform={tilt ? `rotate(${tilt} ${pivot.x} ${pivot.y})` : undefined}>
        {/* cap */}
        <rect x="26" y="5" width="12" height="7" rx="1.6" fill={`url(#${gid}-cap)`} />
        <rect x="26" y="5" width="12" height="2.2" rx="1.1" fill="rgba(255,255,255,0.35)" />
        {/* neck */}
        <rect x="27.5" y="11" width="9" height="6" fill={b.glass} opacity="0.4" />

        {/* body */}
        <path
          d="M22 22 Q22 18 25 16 L25 12 L39 12 L39 16 Q42 18 42 22 L42 47 Q42 51 38 51 L26 51 Q22 51 22 47 Z"
          fill={`url(#${gid}-glass)`}
          stroke="rgba(200,235,255,0.55)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />

        {/* simulated contents */}
        <g clipPath={`url(#${gid}-body)`}>
          <rect x="20" y={level} width="24" height={52 - level} fill={`url(#${gid}-liq)`} />
          <rect x="20" y={level} width="24" height="1.4" fill="#ffffff" opacity="0.5" />
        </g>

        {/* paper label */}
        {showLabel && (
          <g>
            <rect
              x="23.5"
              y="29"
              width="17"
              height="12"
              rx="1.6"
              fill="rgba(246,250,255,0.9)"
              stroke="rgba(10,18,40,0.25)"
              strokeWidth="0.5"
            />
            <text
              x="32"
              y="36.4"
              textAnchor="middle"
              fontSize="6.4"
              fontWeight="700"
              fill="#0b1124"
              fontFamily="Space Grotesk, Inter, sans-serif"
            >
              {symbol}
            </text>
            <rect x="25.5" y="37.6" width="13" height="1" rx="0.5" fill="rgba(11,17,36,0.35)" />
          </g>
        )}

        {/* specular highlight */}
        <rect x="25" y="20" width="2.6" height="22" rx="1.3" fill="rgba(255,255,255,0.4)" />
      </g>
    </svg>
  )
}

/**
 * Public entry point — picks the right artwork for a reagent.
 *
 * @param {object}  chemical  entry from data/chemicals.js
 * @param {number}  size      square pixel size of the art box
 * @param {number}  tilt      degrees; liquids rotate about their base to pour
 * @param {boolean} showLabel draw the paper label (off at very small sizes)
 */
export default function ReagentArt({ chemical, size = 44, tilt = 0, showLabel = true }) {
  if (!chemical) return null
  return chemical.form === 'liquid' ? (
    <LiquidArt chemical={chemical} size={size} tilt={tilt} showLabel={showLabel} />
  ) : (
    <SolidArt chemical={chemical} size={size} tilt={tilt} />
  )
}
