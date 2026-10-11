import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Cpu, ShieldAlert } from 'lucide-react'
import TopNav from './components/TopNav'
import ChemicalLibrary from './components/ChemicalLibrary'
import Laboratory from './components/Laboratory'
import CameraPanel from './components/CameraPanel'
import ResultsPanel from './components/ResultsPanel'
import GestureGuide from './components/GestureGuide'
import ExperimentsView from './components/ExperimentsView'
import CursorOverlay from './components/CursorOverlay'
import DemoMode from './components/DemoMode'
const Lab3D = lazy(() => import('./components/lab3d/Lab3D'))
import LabBoundary from './components/lab3d/LabBoundary'
import LabHud from './components/lab3d/LabHud'
import { CHEMICALS, getChemical } from './data/chemicals'
import { evaluateExperiment, OUTCOME } from './data/reactions'
import { GestureHold } from './lib/handMath'
import {
  PHASE,
  POUR_ANIM_MS,
  POUR_HOLD_MS,
  SCROLL_ARM_MS,
  SCROLL_DEADZONE_PX,
  SCROLL_SENSITIVITY,
} from './lib/interaction'
import { TRACKER_STATUS, useHandTracking } from './hooks/useHandTracking'

const MAX_INGREDIENTS = 2

/**
 * Renderer selection.
 *
 * The immersive 3D lab is the default experience. `?mode=classic` restores the
 * original 2D dashboard — not as dead code, but because it is the accessible,
 * low-GPU fallback AND the surface the existing QA suites assert against.
 * Read once at module scope: switching renderers mid-session would tear down
 * the WebGL context under a live experiment, so it is a page-load decision.
 */
const CLASSIC =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('mode') === 'classic'

/** Short, phase-specific coaching line shown in the 3D HUD. */
function hintFor(phase, held) {
  switch (phase) {
    case PHASE.HOVERING:
      return 'Pinch (or click) to pick this up.'
    case PHASE.CARRYING_SOLID:
      return 'Move it over the beaker and release to drop it in.'
    case PHASE.CARRYING_LIQUID:
      return 'Hold the bottle over the beaker to start pouring.'
    case PHASE.POUR_READY:
      return 'Keep holding — pouring…'
    case PHASE.POURING:
      return `Pouring ${held?.symbol ?? 'reagent'}…`
    default:
      return null
  }
}

const initialQuantities = () =>
  Object.fromEntries(CHEMICALS.map((c) => [c.id, c.defaultQuantity]))

/** Blend the stock tints of the liquids currently in the beaker. */
function blendTints(ingredients) {
  const tints = ingredients.map((i) => i.liquidTint).filter(Boolean)
  if (tints.length === 0) return '#2a4a7a'
  if (tints.length === 1) return tints[0]
  const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const sum = tints.map(parse).reduce((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], [0, 0, 0])
  return `#${sum
    .map((v) => Math.round(v / tints.length).toString(16).padStart(2, '0'))
    .join('')}`
}

export default function App() {
  const [view, setView] = useState('lab')
  const [tracking, setTracking] = useState(false)
  const [pinchSensitivity, setPinchSensitivity] = useState(0.42)
  const [reachMargin, setReachMargin] = useState(0.12)

  const [quantities, setQuantities] = useState(initialQuantities)
  const [ingredients, setIngredients] = useState([])
  const [grabbed, setGrabbed] = useState(null) // { id, quantity }
  const [hoveredId, setHoveredId] = useState(null)
  const [dropActive, setDropActive] = useState(false)
  const [handVisible, setHandVisible] = useState(false)
  const [pouring, setPouring] = useState(null)
  const [toast, setToast] = useState(null)
  const [phase, setPhase] = useState(PHASE.IDLE)
  const [scrolling, setScrolling] = useState(false)
  const [demo, setDemo] = useState(false)

  const pointerRef = useRef({ x: 0, y: 0 })
  const landmarksRef = useRef(null)
  const dropZoneRef = useRef(null)
  const libraryRef = useRef(null)
  const downRef = useRef(false)
  const grabbedRef = useRef(null)
  const quantitiesRef = useRef(quantities)
  const ingredientsRef = useRef(ingredients)
  const hoveredRef = useRef(null)
  const dropActiveRef = useRef(false)
  const toastTimer = useRef(null)
  const pourTimer = useRef(null)
  const pourAnimTimer = useRef(null)
  const phaseRef = useRef(PHASE.IDLE)

  /**
   * Live pour transaction. Lives in a ref because it is written every frame
   * and read by the overlay's rAF — putting it in state would re-render the
   * whole dashboard 60x/second.
   *
   *   enteredAt    when the bottle entered the beaker zone (null = outside)
   *   progress     0..1 hold progress, drives the ring
   *   pouring      the atomic pour has started
   *   tiltProgress 0..1 animation clock for the bottle tilt
   *   consumed     this pinch already poured; blocks a second add
   *   token        invalidates in-flight timers after a reset
   */
  const pourRef = useRef({
    enteredAt: null,
    progress: 0,
    pouring: false,
    tiltProgress: 0,
    consumed: false,
    token: 0,
  })

  /** Open-palm scroll state; also ref-only for the same reason. */
  const scrollRef = useRef({ gate: new GestureHold(SCROLL_ARM_MS), lastY: null, active: false })

  const setPhaseSafe = useCallback((next) => {
    if (phaseRef.current === next) return
    phaseRef.current = next
    setPhase(next)
  }, [])

  // Mirror the pieces of state the pointer handlers need into refs so the
  // callbacks stay stable and always see fresh values. Synced in an effect so
  // nothing is mutated during render.
  useEffect(() => {
    quantitiesRef.current = quantities
  }, [quantities])
  useEffect(() => {
    ingredientsRef.current = ingredients
  }, [ingredients])
  useEffect(() => {
    grabbedRef.current = grabbed
  }, [grabbed])

  const flash = useCallback((message, tone = 'info') => {
    setToast({ message, tone })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  /* ------------------------- beaker mutations ------------------------- */
  /** @returns {boolean} whether the reagent was actually added. */
  const addToBeaker = useCallback(
    (id, quantity) => {
      const chemical = getChemical(id)
      if (!chemical) return false
      const current = ingredientsRef.current

      if (current.some((i) => i.id === id)) {
        flash(`${chemical.name} is already in the beaker.`, 'warn')
        return false
      }
      if (current.length >= MAX_INGREDIENTS) {
        flash('The beaker already holds two reagents — reset to try another pair.', 'warn')
        return false
      }

      const next = [...current, { ...chemical, quantity, slot: `${chemical.id}-${current.length}` }]
      // Keep the ref in lockstep so two adds in the same tick cannot both see
      // an empty beaker and race past the two-reagent cap.
      ingredientsRef.current = next
      setIngredients(next)
      setPouring({ color: chemical.color })
      clearTimeout(pourTimer.current)
      pourTimer.current = setTimeout(() => setPouring(null), 650)
      return true
    },
    [flash],
  )

  const removeFromBeaker = useCallback((key) => {
    // `key` is a slot id when present (water + water needs this), else the id.
    setIngredients((prev) => {
      const next = prev.filter((i) => (i.slot ?? i.id) !== key)
      ingredientsRef.current = next
      return next
    })
  }, [])

  /** Abort any in-flight pour. Bumping the token makes queued timers no-ops. */
  const cancelPour = useCallback(() => {
    const p = pourRef.current
    p.token += 1
    p.enteredAt = null
    p.progress = 0
    p.pouring = false
    p.tiltProgress = 0
    p.consumed = false
  }, [])

  const resetExperiment = useCallback(() => {
    // A reset must also kill anything the user is mid-way through, otherwise a
    // pour that started before the reset would land in the fresh experiment.
    cancelPour()
    grabbedRef.current = null
    downRef.current = false
    dropActiveRef.current = false
    ingredientsRef.current = []
    setGrabbed(null)
    setDropActive(false)
    setIngredients([])
    setPouring(null)
    setPhaseSafe(PHASE.IDLE)
  }, [cancelPour, setPhaseSafe])

  const setQuantity = useCallback((id, value) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.min(50, value)) }))
  }, [])

  const loadPair = useCallback(
    (ids) => {
      // Loading a canned experiment replaces the beaker, so any half-finished
      // carry or pour has to be torn down first.
      cancelPour()
      grabbedRef.current = null
      downRef.current = false
      setGrabbed(null)
      setDropActive(false)
      const q = quantitiesRef.current
      const next = ids
        .map((id, index) => {
          const chemical = getChemical(id)
          if (!chemical) return null
          // Control cases such as water + water legitimately repeat a reagent,
          // so the slot index (not the chemical id) has to key the list.
          return { ...chemical, quantity: q[chemical.id], slot: `${chemical.id}-${index}` }
        })
        .filter(Boolean)
      ingredientsRef.current = next
      setIngredients(next)
      setView('lab')
      flash('Experiment loaded into the beaker.')
    },
    [cancelPour, flash],
  )

  const result = useMemo(() => evaluateExperiment(ingredients), [ingredients])

  const fillLevel = useMemo(() => {
    const liquid = ingredients
      .filter((i) => i.form === 'liquid')
      .reduce((sum, i) => sum + i.quantity, 0)
    if (liquid === 0) return ingredients.length ? 0.05 : 0
    return Math.min(0.1 + liquid / 110, 0.84)
  }, [ingredients])

  const liquidColor = result.effects?.liquidColor ?? blendTints(ingredients)

  /* ===================================================================
   * UNIFIED POINTER LAYER
   * Mouse events and hand-tracking frames are both funnelled into these
   * three primitives, so there is exactly one drag implementation.
   * =================================================================== */

  /**
   * PLUGGABLE HIT-TESTING.
   *
   * The state machine below asks three spatial questions — "what is under the
   * cursor?", "is the cursor over the beaker?", "is it over the library?" —
   * and nothing else. In the classic 2D dashboard those are answered against
   * the DOM; in the 3D lab they are answered by raycasting into the scene.
   *
   * Rather than fork the state machine, the 3D view publishes an answering
   * object into this ref (see Lab3D.jsx) and the helpers below delegate to it
   * when present. The grab/carry/pour logic, the pinch semantics and the
   * tracking-lost recovery are therefore IDENTICAL in both renderers, which
   * is what lets the existing QA suites keep covering them.
   */
  const hitTestRef = useRef(null)

  /** Which grabbable reagent (if any) is under this point? */
  const chemicalAt = (x, y) => {
    const ht = hitTestRef.current
    if (ht) return ht.chemicalAt(x, y)
    const el = document.elementFromPoint(x, y)
    const card = el?.closest?.('[data-chemical-id]')
    if (!card || card.getAttribute('data-grabbable') === 'false') return null
    return card.getAttribute('data-chemical-id')
  }

  const overDropZone = (x, y) => {
    const ht = hitTestRef.current
    if (ht) return ht.overDropZone(x, y)
    const box = dropZoneRef.current?.getBoundingClientRect()
    if (!box) return false
    const pad = 34 // forgiving margin — hand cursors are not pixel-precise
    return (
      x >= box.left - pad && x <= box.right + pad && y >= box.top - pad && y <= box.bottom + pad
    )
  }

  /** Is the cursor inside the library's scrollable viewport? */
  const overLibrary = (x, y) => {
    const ht = hitTestRef.current
    // The 3D lab has no scrollable shelf — every reagent is reachable on the
    // wall — so palm-scroll is simply inert there rather than special-cased.
    if (ht) return false
    const box = libraryRef.current?.getBoundingClientRect()
    if (!box) return false
    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
  }

  /**
   * Tell the active renderer where the cursor is, so it can place the carried
   * object. A no-op in 2D (the overlay reads `pointerRef` directly).
   */
  const trackCarry = (x, y) => {
    hitTestRef.current?.track?.(x, y)
  }

  /**
   * ATOMIC POUR.
   *
   * Runs exactly once per pinch: `consumed` latches immediately, before any
   * async work, so a duplicated frame can never add the reagent twice. The
   * token captured here is compared on completion — if the user reset the
   * experiment meanwhile, the callback becomes a no-op.
   */
  const startPour = useCallback(
    (held) => {
      const p = pourRef.current
      if (p.pouring || p.consumed) return
      p.consumed = true
      p.pouring = true
      p.tiltProgress = 0
      p.progress = 1
      const token = p.token
      setPhaseSafe(PHASE.POURING)

      const t0 = performance.now()
      const animate = () => {
        const cur = pourRef.current
        if (cur.token !== token || !cur.pouring) return // cancelled
        cur.tiltProgress = Math.min(1, (performance.now() - t0) / 260)
        if (cur.tiltProgress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)

      clearTimeout(pourAnimTimer.current)
      pourAnimTimer.current = setTimeout(() => {
        const cur = pourRef.current
        if (cur.token !== token) return // reset happened mid-pour: drop it
        addToBeaker(held.id, held.quantity)

        // bottle goes back on its shelf; a new grab is required to pour again
        cur.pouring = false
        cur.tiltProgress = 0
        cur.progress = 0
        cur.enteredAt = null
        grabbedRef.current = null
        setGrabbed(null)
        dropActiveRef.current = false
        setDropActive(false)
        setPhaseSafe(PHASE.IDLE)
      }, POUR_ANIM_MS)
    },
    [addToBeaker, setPhaseSafe],
  )

  const pointerDown = useCallback(
    (x, y, source = 'mouse') => {
      if (downRef.current) return
      downRef.current = true
      // Place the carried object before the first frame renders, so a grab
      // never flashes the reagent at its previous position.
      trackCarry(x, y)
      // A pinch always wins over scrolling (interaction priority #2 beats #3).
      scrollRef.current.gate.reset()
      scrollRef.current.lastY = null
      if (scrollRef.current.active) {
        scrollRef.current.active = false
        setScrolling(false)
      }
      const id = chemicalAt(x, y)
      if (!id) return
      const chemical = getChemical(id)
      const picked = {
        id,
        quantity: quantitiesRef.current[id],
        form: chemical?.form ?? 'solid',
        source,
      }
      grabbedRef.current = picked

      // Fresh grab = fresh pour transaction.
      const p = pourRef.current
      p.enteredAt = null
      p.progress = 0
      p.consumed = false

      setGrabbed(picked)
      setPhaseSafe(picked.form === 'liquid' ? PHASE.CARRYING_LIQUID : PHASE.CARRYING_SOLID)
    },
    [setPhaseSafe],
  )

  /**
   * Advance the hold-to-pour transaction for a carried bottle.
   *
   * Progress is derived from WALL-CLOCK TIME, not from pointer movement, and
   * is driven by a rAF ticker as well as by pointer events. A user who holds
   * the bottle perfectly still — the most natural thing to do — must still
   * see the ring fill and the pour fire.
   */
  const tickPour = useCallback(
    (held, over) => {
      const p = pourRef.current
      if (!held || held.form !== 'liquid' || p.pouring) return

      if (over && !p.consumed) {
        const now = performance.now()
        if (p.enteredAt === null) p.enteredAt = now
        p.progress = Math.min(1, (now - p.enteredAt) / POUR_HOLD_MS)
        if (p.progress >= 1) startPour(held)
        else setPhaseSafe(PHASE.POUR_READY)
      } else if (!over) {
        // Left the zone before the threshold — cancel the progress.
        p.enteredAt = null
        p.progress = 0
        setPhaseSafe(PHASE.CARRYING_LIQUID)
      }
    },
    [setPhaseSafe, startPour],
  )

  const pointerMove = useCallback(
    (x, y) => {
      pointerRef.current = { x, y }
      trackCarry(x, y)
      const held = grabbedRef.current
      const p = pourRef.current

      if (held) {
        const over = overDropZone(x, y)
        if (over !== dropActiveRef.current) {
          dropActiveRef.current = over
          setDropActive(over)
        }
        if (hoveredRef.current !== null) {
          hoveredRef.current = null
          setHoveredId(null)
        }

        // ---- liquids: hold over the beaker to pour ----
        tickPour(held, over)
        return
      }

      const id = chemicalAt(x, y)
      if (id !== hoveredRef.current) {
        hoveredRef.current = id
        setHoveredId(id)
      }
      if (!p.pouring && !scrollRef.current.active) {
        setPhaseSafe(id ? PHASE.HOVERING : PHASE.IDLE)
      }
    },
    [setPhaseSafe, tickPour],
  )

  /**
   * Hold-to-pour ticker.
   *
   * Pointer events alone are not a reliable clock: a steady mouse emits none,
   * and MediaPipe can stall for a frame or two. While a bottle is carried we
   * therefore re-evaluate the hold every animation frame using the last known
   * pointer position. Runs only while a liquid is held, so it adds no cost to
   * the idle app and cannot leak — the effect tears the loop down on release.
   */
  useEffect(() => {
    if (grabbed?.form !== 'liquid') return undefined
    let raf = 0
    const loop = () => {
      const held = grabbedRef.current
      if (held?.form === 'liquid' && !pourRef.current.pouring) {
        const { x, y } = pointerRef.current
        tickPour(held, overDropZone(x, y))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [grabbed, tickPour])

  const pointerUp = useCallback(
    (x, y) => {
      downRef.current = false
      const held = grabbedRef.current
      const p = pourRef.current

      // Releasing the pinch mid-pour must NOT cancel it: the transaction is
      // already committed and will finish on its own.
      if (p.pouring) return

      grabbedRef.current = null
      p.enteredAt = null
      p.progress = 0
      if (!held) {
        setPhaseSafe(PHASE.IDLE)
        return
      }

      setGrabbed(null)
      if (dropActiveRef.current) {
        dropActiveRef.current = false
        setDropActive(false)
      }

      // Already poured on this pinch — nothing more to add.
      if (p.consumed) {
        p.consumed = false
        setPhaseSafe(PHASE.IDLE)
        return
      }

      /* ---------------------------------------------------------------
       * Release semantics differ by input, deliberately.
       *
       * A MOUSE release is unambiguous: the user let go on purpose, so a
       * bottle dropped on the beaker is added. That keeps the fallback
       * obvious for anyone who never reads the hint.
       *
       * A PINCH release is NOT reliable: MediaPipe drops the pinch for a
       * frame whenever the hand rotates, the fingers blur, or the lighting
       * shifts. Honouring it would silently dump a reagent the user never
       * meant to pour — the exact failure this build must not have. Under
       * hand control a bottle is therefore committed ONLY by completing the
       * timed hold; an early release just puts it back.
       * --------------------------------------------------------------- */
      const overBeaker = overDropZone(x, y)
      if (held.form === 'liquid' && held.source === 'hand') {
        if (overBeaker) flash('Hold the bottle over the beaker to pour.', 'warn')
        setPhaseSafe(PHASE.IDLE)
        return
      }

      if (overBeaker) addToBeaker(held.id, held.quantity)
      setPhaseSafe(PHASE.IDLE)
    },
    [addToBeaker, flash, setPhaseSafe],
  )

  /* ----------------------------- hand input ----------------------------- */
  const handleFrame = useCallback(
    ({ handPresent, pinching, point, landmarks, openPalm, timestamp }) => {
      landmarksRef.current = landmarks
      setHandVisible((v) => (v === handPresent ? v : handPresent))

      const s = scrollRef.current

      if (!handPresent || !point) {
        // ---- TRACKING LOST: fail safe ----
        // A carried item is cancelled WITHOUT being added (releasing at an
        // impossible coordinate makes the drop-zone test fail). A pour that
        // has already committed is deliberately left to finish.
        if (grabbedRef.current && !pourRef.current.pouring) pointerUp(-1, -1)
        if (!pourRef.current.pouring) {
          pourRef.current.enteredAt = null
          pourRef.current.progress = 0
        }
        downRef.current = false
        s.gate.reset()
        s.lastY = null
        if (s.active) {
          s.active = false
          setScrolling(false)
        }
        return
      }

      pointerMove(point.x, point.y)

      if (pinching && !downRef.current) pointerDown(point.x, point.y, 'hand')
      else if (!pinching && downRef.current) pointerUp(point.x, point.y)

      /* ---------------------- open-palm shelf scrolling ----------------------
       * Priority order is enforced here: an active grab or pour (1) and a
       * pinch (2) both suppress scrolling (3) before it can ever arm.
       */
      const busy =
        pinching || downRef.current || Boolean(grabbedRef.current) || pourRef.current.pouring
      const inRegion = overLibrary(point.x, point.y)
      const armed = s.gate.update(Boolean(openPalm) && !busy && inRegion, timestamp ?? performance.now())

      if (armed !== s.active) {
        s.active = armed
        s.lastY = armed ? point.y : null
        setScrolling(armed)
        if (armed) setPhaseSafe(PHASE.SCROLLING)
        else if (phaseRef.current === PHASE.SCROLLING) setPhaseSafe(PHASE.IDLE)
      }

      if (armed) {
        const el = libraryRef.current
        if (el && s.lastY !== null) {
          const dy = point.y - s.lastY
          // Dead zone: a held-still hand still jitters a pixel or two, and
          // that must not creep the list.
          if (Math.abs(dy) > SCROLL_DEADZONE_PX) {
            // Hand DOWN (increasing y) scrolls the list content down.
            el.scrollTop += dy * SCROLL_SENSITIVITY
            s.lastY = point.y
          }
        } else if (el) {
          s.lastY = point.y
        }
      }
    },
    [pointerDown, pointerMove, pointerUp, setPhaseSafe],
  )

  const { videoRef, status, error, snapshot, start } = useHandTracking({
    onFrame: handleFrame,
    pinchSensitivity,
    reachMargin,
    enabled: tracking,
  })

  // Dev/QA only — lets automated tests drive the exact same hand->pointer
  // bridge MediaPipe uses, without needing a real webcam or a real hand.
  // Stripped from production builds by `import.meta.env.DEV`.
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    window.__gl_handFrame = handleFrame
    return () => {
      delete window.__gl_handFrame
    }
  }, [handleFrame])

  /* ----------------------------- mouse input ----------------------------- */
  useEffect(() => {
    if (view !== 'lab') return undefined

    const isInteractive = (target) =>
      Boolean(target?.closest?.('button, input, a, select, textarea, summary, [data-grabbable="false"]'))

    const onMove = (e) => {
      // While the hand is driving, ignore stray mouse motion.
      if (snapshot.handPresent) return
      pointerMove(e.clientX, e.clientY)
    }
    const onDown = (e) => {
      if (e.button !== 0 || isInteractive(e.target)) return
      pointerDown(e.clientX, e.clientY)
    }
    const onUp = (e) => {
      if (!grabbedRef.current) {
        downRef.current = false
        return
      }
      pointerUp(e.clientX, e.clientY)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    }
  }, [view, snapshot.handPresent, pointerDown, pointerMove, pointerUp])

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current)
      clearTimeout(pourTimer.current)
      clearTimeout(pourAnimTimer.current)
    },
    [],
  )

  const carrying = grabbed
    ? { ...getChemical(grabbed.id), quantity: grabbed.quantity }
    : null

  const beakerIds = ingredients.map((i) => i.id)

  return (
    <div className="relative flex h-full flex-col">
      <TopNav
        view={view}
        onViewChange={setView}
        trackerStatus={status}
        handPresent={handVisible}
        onToggleCamera={() => setTracking((t) => !t)}
      />

      <a href={CLASSIC ? '?mode=immersive' : '?mode=classic'} className="absolute right-4 top-[72px] z-40 rounded-lg border border-white/20 bg-slate-900/90 px-3 py-1 text-xs text-cyan-200">{CLASSIC ? 'Open 3D lab' : '2D fallback'}</a>
      <main className="relative z-10 flex min-h-0 flex-1 gap-3 p-3">
        {view === 'lab' && !CLASSIC && (
          /* -------------------- immersive 3D laboratory -------------------- *
           * The canvas fills the whole work area; every control floats over it
           * in LabHud. That is what gets the 3D view past 75% of the screen,
           * which is the entire point of the upgrade. */
          <section className="relative min-h-0 flex-1">
            <LabBoundary><Suspense fallback={<div className="p-8 text-slate-300">Preparing your laboratory…</div>}><Lab3D
              hitTestRef={hitTestRef}
              pourRef={pourRef}
              hoveredId={hoveredId}
              carriedId={grabbed?.id ?? null}
              fillLevel={fillLevel}
              liquidColor={liquidColor}
              effects={result.effects}
              solids={ingredients.filter((i) => i.form === 'solid')}
              dropActive={dropActive}
            />

            </Suspense></LabBoundary>
            <LabHud
              status={status}
              handPresent={handVisible}
              onToggleCamera={() => setTracking((t) => !t)}
              hoveredChemical={hoveredId ? getChemical(hoveredId) : null}
              carrying={carrying}
              quantity={quantities[carrying?.id ?? hoveredId] ?? 0}
              onQuantityChange={setQuantity}
              ingredients={ingredients}
              result={result}
              onRemove={removeFromBeaker}
              onReset={resetExperiment}
              hint={hintFor(phase, carrying)}
            />

            {/* The webcam preview stays mounted but compact — users need to
                see WHY tracking is failing, and the skeleton overlay is the
                fastest way to understand a missed pinch. */}
            <div className="pointer-events-auto absolute left-4 top-1/2 w-[196px] -translate-y-1/2">
              <CameraPanel
                videoRef={videoRef}
                landmarksRef={landmarksRef}
                status={status}
                error={error}
                snapshot={snapshot}
                onRetry={start}
                pinchSensitivity={pinchSensitivity}
                onPinchSensitivity={setPinchSensitivity}
                reachMargin={reachMargin}
                onReachMargin={setReachMargin}
              />
            </div>
          </section>
        )}

        {view === 'lab' && CLASSIC && (
          <>
            <ChemicalLibrary
              ref={libraryRef}
              quantities={quantities}
              onQuantityChange={setQuantity}
              hoveredId={hoveredId}
              grabbedId={grabbed?.id ?? null}
              beakerIds={beakerIds}
              full={ingredients.length >= MAX_INGREDIENTS}
              scrolling={scrolling}
            />

            <Laboratory
              ref={dropZoneRef}
              ingredients={ingredients}
              result={result}
              fillLevel={fillLevel}
              liquidColor={liquidColor}
              dropActive={dropActive}
              pouring={pouring}
              phase={phase}
            />

            <aside className="glass edge-glow flex h-full min-h-0 w-[330px] shrink-0 flex-col">
              <div className="flex items-center gap-2 px-4 pb-3 pt-4">
                <Cpu className="h-4 w-4 text-lab-violet" />
                <h2 className="panel-title">Vision &amp; Analysis</h2>
              </div>
              <div className="hair" />
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                <CameraPanel
                  videoRef={videoRef}
                  landmarksRef={landmarksRef}
                  status={status}
                  error={error}
                  snapshot={snapshot}
                  onRetry={start}
                  pinchSensitivity={pinchSensitivity}
                  onPinchSensitivity={setPinchSensitivity}
                  reachMargin={reachMargin}
                  onReachMargin={setReachMargin}
                />
                <div className="hair" />
                <ResultsPanel
                  result={result}
                  ingredients={ingredients}
                  onRemove={removeFromBeaker}
                  onReset={resetExperiment}
                />
              </div>
              <div className="hair" />
              <p className="flex items-start gap-2 px-4 py-3 text-[10px] leading-relaxed text-slate-500">
                <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0 text-slate-600" />
                Educational simulation. Video is processed locally and never uploaded. Animations
                are qualitative illustrations, not quantitative predictions.
              </p>
            </aside>
          </>
        )}

        {view === 'experiments' && (
          <section className="glass edge-glow min-h-0 flex-1 overflow-hidden">
            <ExperimentsView onTry={loadPair} />
          </section>
        )}

        {view === 'help' && (
          <section className="glass edge-glow min-h-0 flex-1 overflow-hidden">
            <GestureGuide />
          </section>
        )}
      </main>

      {/* virtual hand cursor */}
      <CursorOverlay
        pointerRef={pointerRef}
        visible={
          view === 'lab' &&
          ((status === TRACKER_STATUS.RUNNING && handVisible) || Boolean(carrying))
        }
        pinching={snapshot.pinching || Boolean(carrying)}
        carrying={carrying}
        pourRef={pourRef}
        dropZoneRef={dropZoneRef}
        showArt={CLASSIC}
      />

      {/* optional guided walkthrough (Zn + dilute HCl) */}
      {view === 'lab' && (
        <DemoMode
          active={demo}
          onStart={() => setDemo(true)}
          onExit={() => setDemo(false)}
          state={{
            tracking: status === TRACKER_STATUS.RUNNING,
            handVisible,
            usingMouse: !tracking,
            carryingId: grabbed?.id ?? null,
            beakerIds,
            hasReaction: result?.outcome === OUTCOME.REACTION,
          }}
        />
      )}

      {/* transient feedback */}
      {toast && (
        <div
          className={`animate-fade-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2.5 text-xs backdrop-blur-xl ${
            toast.tone === 'warn'
              ? 'border-amber-300/40 bg-amber-300/10 text-amber-100'
              : 'border-lab-cyan/40 bg-lab-cyan/10 text-cyan-100'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}


