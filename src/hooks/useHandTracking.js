import { useCallback, useEffect, useRef, useState } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import {
  PinchGate,
  PointSmoother,
  cameraToViewport,
  extendedFingerCount,
  isOpenPalm,
  pinchPoint,
  pinchRatio,
} from '../lib/handMath'

export const TRACKER_STATUS = {
  IDLE: 'idle',
  LOADING_MODEL: 'loading-model',
  REQUESTING_CAMERA: 'requesting-camera',
  RUNNING: 'running',
  ERROR: 'error',
  STOPPED: 'stopped',
}

/** Assets are vendored into /public so the demo also works offline. */
const WASM_PATH = '/wasm'
const MODEL_PATH = '/models/hand_landmarker.task'
const CDN_WASM =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const CDN_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/** How long the hand may vanish before we drop the grab (ms). */
const TRACK_LOSS_GRACE_MS = 420

function describeCameraError(err) {
  const name = err?.name || ''
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera permission was denied. Allow camera access in your browser’s site settings, then press Retry. You can keep using the lab with your mouse in the meantime.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No webcam was found. Plug one in and press Retry — mouse control still works without a camera.'
  }
  if (name === 'NotReadableError') {
    return 'Your webcam is already in use by another application (Zoom, Teams, OBS…). Close it and press Retry.'
  }
  return err?.message
    ? `Camera could not start: ${err.message}`
    : 'Camera could not start. Mouse control is still available.'
}

/**
 * Real MediaPipe hand tracking with a stable pinch state machine.
 *
 * The hook deliberately keeps the per-frame result in a ref and only pushes a
 * throttled snapshot into React state, so a 30-60 fps detector never causes
 * 60 re-renders per second of the whole dashboard.
 */
export function useHandTracking({
  onFrame,
  pinchSensitivity = 0.42,
  reachMargin = 0.12,
  enabled = false,
} = {}) {
  const videoRef = useRef(null)
  const landmarkerRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const gateRef = useRef(new PinchGate({ closeAt: pinchSensitivity, openAt: pinchSensitivity + 0.15 }))
  const smootherRef = useRef(new PointSmoother({ minCutoff: 1.3, beta: 0.04 }))
  const lastVideoTimeRef = useRef(-1)
  const lastSeenRef = useRef(0)
  const mountedRef = useRef(true)
  const onFrameRef = useRef(onFrame)
  const marginRef = useRef(reachMargin)
  const fpsRef = useRef({ frames: 0, last: performance.now(), value: 0 })

  const [status, setStatus] = useState(TRACKER_STATUS.IDLE)
  const [error, setError] = useState(null)
  const [snapshot, setSnapshot] = useState({
    handPresent: false,
    pinching: false,
    pinchRatio: null,
    confidence: 0,
    handedness: null,
    fingersExtended: 0,
    fps: 0,
  })

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    marginRef.current = reachMargin
  }, [reachMargin])

  useEffect(() => {
    gateRef.current.setSensitivity(pinchSensitivity)
  }, [pinchSensitivity])

  /* ------------------------------ teardown ------------------------------ */
  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    const video = videoRef.current
    if (video) {
      video.pause?.()
      video.srcObject = null
    }
    if (landmarkerRef.current) {
      landmarkerRef.current.close?.()
      landmarkerRef.current = null
    }
    gateRef.current.reset()
    smootherRef.current.reset()
    lastVideoTimeRef.current = -1
    if (mountedRef.current) {
      setStatus(TRACKER_STATUS.STOPPED)
      setSnapshot((s) => ({ ...s, handPresent: false, pinching: false, pinchRatio: null, fps: 0 }))
    }
    onFrameRef.current?.({ handPresent: false, pinching: false, point: null, landmarks: null })
  }, [])

  /* --------------------------- detection loop --------------------------- */
  const predict = useCallback(() => {
    const video = videoRef.current
    const landmarker = landmarkerRef.current
    if (!video || !landmarker || !mountedRef.current) return

    const now = performance.now()

    if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime

      let result = null
      try {
        result = landmarker.detectForVideo(video, now)
      } catch {
        // A single dropped frame must never kill the loop.
        result = null
      }

      const landmarks = result?.landmarks?.[0] ?? null

      if (landmarks && landmarks.length === 21) {
        lastSeenRef.current = now
        const ratio = pinchRatio(landmarks)
        const { pinching } = gateRef.current.update(ratio)
        const smoothed = smootherRef.current.filter(pinchPoint(landmarks), now)
        const point = cameraToViewport(smoothed, {
          width: window.innerWidth,
          height: window.innerHeight,
          margin: marginRef.current,
        })

        onFrameRef.current?.({
          handPresent: true,
          pinching,
          point,
          landmarks,
          // Raw per-frame gesture flag. Debouncing lives in App.jsx so the
          // detector stays a pure sensor and the interaction rules stay in
          // one place.
          openPalm: !pinching && isOpenPalm(landmarks),
          timestamp: now,
        })

        const fps = fpsRef.current
        fps.frames += 1
        if (now - fps.last > 500) {
          fps.value = Math.round((fps.frames * 1000) / (now - fps.last))
          fps.frames = 0
          fps.last = now
        }

        setSnapshot((prev) => {
          const next = {
            handPresent: true,
            pinching,
            pinchRatio: Number(ratio.toFixed(3)),
            confidence: Number((result?.handedness?.[0]?.[0]?.score ?? 0).toFixed(2)),
            handedness: result?.handedness?.[0]?.[0]?.categoryName ?? null,
            fingersExtended: extendedFingerCount(landmarks),
            fps: fps.value,
          }
          // Skip the re-render when nothing meaningful changed.
          const same =
            prev.handPresent === next.handPresent &&
            prev.pinching === next.pinching &&
            prev.fps === next.fps &&
            Math.abs((prev.pinchRatio ?? 9) - next.pinchRatio) < 0.02 &&
            prev.fingersExtended === next.fingersExtended
          return same ? prev : next
        })
      } else if (now - lastSeenRef.current > TRACK_LOSS_GRACE_MS) {
        // Tracking lost for long enough: release the grab cleanly rather than
        // leaving a chemical stuck to a cursor that no longer exists.
        if (gateRef.current.pinching) gateRef.current.reset()
        smootherRef.current.reset()
        onFrameRef.current?.({ handPresent: false, pinching: false, point: null, landmarks: null })
        setSnapshot((prev) =>
          prev.handPresent || prev.pinching
            ? { ...prev, handPresent: false, pinching: false, pinchRatio: null }
            : prev,
        )
      }
    }

    rafRef.current = requestAnimationFrame(predict)
  }, [])

  /* ------------------------------- start -------------------------------- */
  const start = useCallback(async () => {
    if (!mountedRef.current) return
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(TRACKER_STATUS.ERROR)
      setError(
        'This browser does not expose a webcam API (or the page is not served over https/localhost). Mouse control is still fully available.',
      )
      return
    }

    /* 1. Model — local copy first, CDN as a fallback. */
    try {
      setStatus(TRACKER_STATUS.LOADING_MODEL)
      let vision
      try {
        vision = await FilesetResolver.forVisionTasks(WASM_PATH)
      } catch {
        vision = await FilesetResolver.forVisionTasks(CDN_WASM)
      }
      if (!mountedRef.current) return

      const options = {
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }
      let landmarker
      try {
        landmarker = await HandLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
        })
      } catch {
        // GPU delegate unavailable, or the local model is missing — fall back.
        landmarker = await HandLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: CDN_MODEL, delegate: 'CPU' },
        })
      }
      if (!mountedRef.current) {
        landmarker.close?.()
        return
      }
      landmarkerRef.current = landmarker
    } catch (err) {
      if (!mountedRef.current) return
      setStatus(TRACKER_STATUS.ERROR)
      setError(
        `The hand-tracking model could not be loaded (${err?.message ?? 'unknown error'}). Check your connection and press Retry — the lab still works with your mouse.`,
      )
      return
    }

    /* 2. Camera. */
    try {
      setStatus(TRACKER_STATUS.REQUESTING_CAMERA)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream

      const video = videoRef.current
      if (!video) throw new Error('the video element is not mounted')
      video.srcObject = stream
      video.muted = true
      video.playsInline = true
      await video.play()

      lastSeenRef.current = performance.now()
      fpsRef.current = { frames: 0, last: performance.now(), value: 0 }
      setStatus(TRACKER_STATUS.RUNNING)
      rafRef.current = requestAnimationFrame(predict)
    } catch (err) {
      if (!mountedRef.current) return
      setStatus(TRACKER_STATUS.ERROR)
      setError(describeCameraError(err))
      landmarkerRef.current?.close?.()
      landmarkerRef.current = null
    }
  }, [predict])

  /* --------------------------- lifecycle wiring --------------------------- */
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (enabled) start()
    // `stop` doubles as the cleanup: camera tracks, rAF and the MediaPipe
    // graph are all released on unmount or when tracking is switched off.
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { videoRef, status, error, snapshot, start, stop }
}
