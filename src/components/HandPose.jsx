/**
 * HandPose — small, accurate SVG illustrations of the gestures the app uses.
 *
 * Deliberately SVG rather than emoji: the finger relationships that matter
 * (thumb-to-index distance for a pinch, splayed fingers for an open palm) have
 * to be legible, and emoji render differently on every platform.
 *
 * Each pose is drawn in a 0..100 viewBox with the wrist at the bottom.
 */

const SKIN = '#22e3ff'
const SKIN_DIM = 'rgba(34,227,255,0.22)'

/** One finger, drawn as a rounded stroke from knuckle to tip. */
function Finger({ x1, y1, x2, y2, dim = false, width = 9 }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={dim ? SKIN_DIM : SKIN}
      strokeWidth={width}
      strokeLinecap="round"
    />
  )
}

function Palm({ children }) {
  return (
    <g>
      {/* palm block */}
      <rect x="30" y="52" width="40" height="34" rx="13" fill={SKIN} opacity="0.3" />
      <rect
        x="30"
        y="52"
        width="40"
        height="34"
        rx="13"
        fill="none"
        stroke={SKIN}
        strokeWidth="2.5"
      />
      {children}
    </g>
  )
}

/**
 * @param {'open'|'pinch'|'carry-solid'|'carry-bottle'|'pour'|'scroll'} pose
 */
export default function HandPose({ pose, size = 72, className = '' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      overflow="visible"
    >
      {/* ---------------- open hand / cursor ---------------- */}
      {(pose === 'open' || pose === 'scroll') && (
        <Palm>
          <Finger x1="36" y1="54" x2="30" y2="26" />
          <Finger x1="46" y1="54" x2="45" y2="18" />
          <Finger x1="56" y1="54" x2="58" y2="22" />
          <Finger x1="65" y1="55" x2="71" y2="31" />
          {/* thumb, held clearly away from the index */}
          <Finger x1="33" y1="66" x2="12" y2="56" />
        </Palm>
      )}

      {/* ---------------- pinch ---------------- */}
      {pose === 'pinch' && (
        <Palm>
          {/* index and thumb meet at a single contact point */}
          <Finger x1="44" y1="54" x2="38" y2="30" />
          <Finger x1="34" y1="64" x2="36" y2="36" />
          <circle cx="37" cy="31" r="7" fill="none" stroke="#34d399" strokeWidth="3" />
          {/* remaining fingers curled away */}
          <Finger x1="56" y1="54" x2="60" y2="42" dim />
          <Finger x1="64" y1="56" x2="70" y2="46" dim />
        </Palm>
      )}

      {/* ---------------- carrying a solid ---------------- */}
      {pose === 'carry-solid' && (
        <Palm>
          <Finger x1="44" y1="54" x2="38" y2="34" />
          <Finger x1="34" y1="64" x2="36" y2="40" />
          <Finger x1="56" y1="54" x2="60" y2="42" dim />
          {/* the held sample */}
          <path d="M26 20 L31 10 L45 10 L50 20 L44 28 L32 28 Z" fill="#f7c948" />
          <path d="M31 10 L45 10 L43 17 L29 17 Z" fill="#fff2b8" />
        </Palm>
      )}

      {/* ---------------- holding a bottle upright ---------------- */}
      {pose === 'carry-bottle' && (
        <Palm>
          <Finger x1="44" y1="54" x2="40" y2="36" />
          <Finger x1="34" y1="64" x2="34" y2="44" />
          <Finger x1="58" y1="54" x2="60" y2="44" dim />
          <g>
            <rect x="30" y="2" width="12" height="7" rx="2" fill="#f05454" />
            <rect
              x="27"
              y="9"
              width="18"
              height="34"
              rx="5"
              fill="rgba(190,230,255,0.3)"
              stroke="#bee6ff"
              strokeWidth="2"
            />
            <rect x="29" y="26" width="14" height="15" rx="3" fill="#2bd4c0" opacity="0.9" />
          </g>
        </Palm>
      )}

      {/* ---------------- pouring: bottle tilted, stream out ---------------- */}
      {pose === 'pour' && (
        <Palm>
          <Finger x1="46" y1="54" x2="46" y2="38" />
          <Finger x1="36" y1="64" x2="38" y2="46" />
          <g transform="rotate(-62 46 44)">
            <rect x="40" y="2" width="12" height="7" rx="2" fill="#f05454" />
            <rect
              x="37"
              y="9"
              width="18"
              height="34"
              rx="5"
              fill="rgba(190,230,255,0.3)"
              stroke="#bee6ff"
              strokeWidth="2"
            />
            <rect x="39" y="24" width="14" height="17" rx="3" fill="#2bd4c0" opacity="0.9" />
          </g>
          {/* stream leaving the (now sideways) mouth */}
          <path
            d="M14 32 Q16 50 24 62"
            fill="none"
            stroke="#2bd4c0"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <ellipse cx="26" cy="66" rx="12" ry="4" fill="#2bd4c0" opacity="0.45" />
        </Palm>
      )}

      {/* scroll arrows sit beside the open palm */}
      {pose === 'scroll' && (
        <g stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M88 40 L88 8" />
          <path d="M81 15 L88 8 L95 15" />
          <path d="M88 60 L88 92" />
          <path d="M81 85 L88 92 L95 85" />
        </g>
      )}
    </svg>
  )
}