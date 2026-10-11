import { Activity, CircleHelp, FlaskConical, Hand, Video, VideoOff } from 'lucide-react'
import { TRACKER_STATUS } from '../hooks/useHandTracking'

const NAV = [
  { id: 'lab', label: 'Laboratory', icon: FlaskConical },
  { id: 'experiments', label: 'Experiments', icon: Activity },
  { id: 'help', label: 'Gesture Guide', icon: CircleHelp },
]

const STATUS_META = {
  [TRACKER_STATUS.IDLE]: { text: 'Camera off', tone: 'slate', pulse: false },
  [TRACKER_STATUS.STOPPED]: { text: 'Camera off', tone: 'slate', pulse: false },
  [TRACKER_STATUS.LOADING_MODEL]: { text: 'Loading model…', tone: 'amber', pulse: true },
  [TRACKER_STATUS.REQUESTING_CAMERA]: { text: 'Requesting camera…', tone: 'amber', pulse: true },
  [TRACKER_STATUS.RUNNING]: { text: 'Camera connected', tone: 'mint', pulse: true },
  [TRACKER_STATUS.ERROR]: { text: 'Camera error', tone: 'danger', pulse: false },
}

const TONES = {
  slate: 'border-white/12 bg-white/[0.04] text-slate-400',
  amber: 'border-amber-300/35 bg-amber-300/10 text-amber-200',
  mint: 'border-emerald-300/35 bg-emerald-300/10 text-emerald-200',
  danger: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
}

const DOTS = {
  slate: 'bg-slate-500',
  amber: 'bg-amber-300',
  mint: 'bg-emerald-300',
  danger: 'bg-rose-400',
}

export default function TopNav({ view, onViewChange, trackerStatus, handPresent, onToggleCamera }) {
  const meta = STATUS_META[trackerStatus] ?? STATUS_META[TRACKER_STATUS.IDLE]
  const cameraOn =
    trackerStatus === TRACKER_STATUS.RUNNING ||
    trackerStatus === TRACKER_STATUS.LOADING_MODEL ||
    trackerStatus === TRACKER_STATUS.REQUESTING_CAMERA

  return (
    <header className="relative z-20 flex shrink-0 items-center gap-4 border-b border-white/8 bg-lab-abyss/70 px-5 py-3 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-lab-cyan/30 bg-gradient-to-br from-lab-cyan/18 to-lab-violet/18 shadow-glow">
          <FlaskConical className="h-5 w-5 text-lab-cyan" strokeWidth={2} />
          <span className="absolute inset-0 rounded-xl border border-lab-cyan/25 animate-pulse-ring" />
        </div>
        <div className="leading-tight">
          <h1 className="font-display text-base font-bold tracking-tight text-white">
            GestureLab<span className="text-lab-cyan"> AI</span>
          </h1>
          <p className="hidden text-[10px] font-medium tracking-[0.14em] text-slate-500 xl:block">
            YOUR HANDS. YOUR LABORATORY. UNLIMITED DISCOVERY.
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="ml-4 flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.025] p-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onViewChange(id)}
              data-grabbable="false"
              className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 font-display text-xs font-medium transition-all duration-200 ${
                active
                  ? 'bg-lab-cyan/12 text-lab-cyan shadow-[inset_0_0_0_1px_rgba(34,227,255,0.28)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Hand indicator */}
      <div
        className={`chip hidden md:inline-flex ${
          handPresent
            ? 'border-lab-cyan/40 bg-lab-cyan/10 text-lab-cyan'
            : 'border-white/10 bg-white/[0.03] text-slate-500'
        }`}
      >
        <Hand className={`h-3 w-3 ${handPresent ? 'animate-float' : ''}`} />
        {handPresent ? 'Hand detected' : 'No hand'}
      </div>

      {/* Camera status */}
      <div className={`chip ${TONES[meta.tone]}`}>
        <span className="relative flex h-1.5 w-1.5">
          {meta.pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-70 ${DOTS[meta.tone]} animate-ping`}
            />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${DOTS[meta.tone]}`} />
        </span>
        {meta.text}
      </div>

      <button
        type="button"
        onClick={onToggleCamera}
        className={cameraOn ? 'btn-ghost' : 'btn-primary'}
        title={cameraOn ? 'Stop the webcam and release all CV resources' : 'Start hand tracking'}
      >
        {cameraOn ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
        <span className="hidden lg:inline">{cameraOn ? 'Stop Tracking' : 'Start Tracking'}</span>
      </button>
    </header>
  )
}
