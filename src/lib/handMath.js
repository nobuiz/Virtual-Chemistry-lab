/**
 * Hand-tracking utilities for GestureLab AI.
 *
 * All of the geometry here operates on MediaPipe's normalised landmark space
 * (x, y in 0..1 relative to the *camera* image, origin top-left).
 */

/** MediaPipe HandLandmarker landmark indices we care about. */
export const LM = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_TIP: 20,
}

/** Skeleton connections used for drawing the overlay. */
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

export const dist2D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

export const lerp = (a, b, t) => a + (b - a) * t

/**
 * A hand-size reference that is invariant to how far the user is from the
 * camera: the span from the wrist to the middle-finger knuckle, falling back
 * to the knuckle span across the palm.
 */
export function handScale(landmarks) {
  const wristToMiddle = dist2D(landmarks[LM.WRIST], landmarks[LM.MIDDLE_MCP])
  const palmWidth = dist2D(landmarks[LM.INDEX_MCP], landmarks[LM.PINKY_MCP])
  const scale = Math.max(wristToMiddle, palmWidth * 1.15)
  // Guard against degenerate detections producing a divide-by-zero.
  return scale > 0.01 ? scale : 0.01
}

/**
 * Normalised pinch distance: thumb-tip to index-tip expressed as a fraction of
 * the hand size. ~0.25 = closed pinch, ~1.0+ = open hand — and crucially this
 * holds no matter how far the user is sitting from the webcam.
 */
export function pinchRatio(landmarks) {
  return dist2D(landmarks[LM.THUMB_TIP], landmarks[LM.INDEX_TIP]) / handScale(landmarks)
}

/**
 * Where the virtual cursor should sit: midway between the thumb and index
 * tips, which is where the user intuitively feels they are "holding".
 */
export function pinchPoint(landmarks) {
  const t = landmarks[LM.THUMB_TIP]
  const i = landmarks[LM.INDEX_TIP]
  return { x: (t.x + i.x) / 2, y: (t.y + i.y) / 2 }
}

/**
 * Hysteresis gate. A lower threshold to START a pinch and a higher one to
 * RELEASE it stops the grab state flickering when the user's fingers hover
 * right at the boundary. A short frame streak adds extra debouncing.
 */
export class PinchGate {
  constructor({ closeAt = 0.4, openAt = 0.55, holdFrames = 2 } = {}) {
    this.closeAt = closeAt
    this.openAt = openAt
    this.holdFrames = holdFrames
    this.pinching = false
    this._streak = 0
  }

  /** Calibration keeps a fixed gap between the two thresholds. */
  setSensitivity(closeAt) {
    this.closeAt = closeAt
    this.openAt = closeAt + 0.15
  }

  /** @returns {{pinching: boolean, changed: boolean}} */
  update(ratio) {
    const was = this.pinching
    const threshold = this.pinching ? this.openAt : this.closeAt
    const wants = ratio < threshold

    if (wants === this.pinching) {
      this._streak = 0
    } else {
      this._streak += 1
      if (this._streak >= this.holdFrames) {
        this.pinching = wants
        this._streak = 0
      }
    }
    return { pinching: this.pinching, changed: this.pinching !== was }
  }

  reset() {
    this.pinching = false
    this._streak = 0
  }
}

/**
 * One Euro filter — low lag when the hand moves fast, heavy smoothing when it
 * is nearly still. Noticeably better cursor feel than a plain EMA.
 */
class LowPass {
  constructor() {
    this.y = null
  }
  filter(x, alpha) {
    this.y = this.y === null ? x : alpha * x + (1 - alpha) * this.y
    return this.y
  }
  reset() {
    this.y = null
  }
}

export class OneEuroFilter {
  constructor({ minCutoff = 1.2, beta = 0.035, dCutoff = 1 } = {}) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
    this.xFilter = new LowPass()
    this.dxFilter = new LowPass()
    this.lastTime = null
    this.lastValue = null
  }

  static alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * cutoff)
    return 1 / (1 + tau / dt)
  }

  filter(value, timestampMs) {
    if (this.lastTime === null) {
      this.lastTime = timestampMs
      this.lastValue = value
      return this.xFilter.filter(value, 1)
    }
    const dt = Math.max((timestampMs - this.lastTime) / 1000, 1 / 120)
    this.lastTime = timestampMs

    const dx = (value - (this.lastValue ?? value)) / dt
    this.lastValue = value
    const edx = this.dxFilter.filter(dx, OneEuroFilter.alpha(this.dCutoff, dt))
    const cutoff = this.minCutoff + this.beta * Math.abs(edx)
    return this.xFilter.filter(value, OneEuroFilter.alpha(cutoff, dt))
  }

  reset() {
    this.xFilter.reset()
    this.dxFilter.reset()
    this.lastTime = null
    this.lastValue = null
  }
}

/** Convenience wrapper that smooths a 2D point. */
export class PointSmoother {
  constructor(options) {
    this.fx = new OneEuroFilter(options)
    this.fy = new OneEuroFilter(options)
  }
  filter(point, timestampMs) {
    return {
      x: this.fx.filter(point.x, timestampMs),
      y: this.fy.filter(point.y, timestampMs),
    }
  }
  reset() {
    this.fx.reset()
    this.fy.reset()
  }
}

/**
 * Map a normalised camera point to viewport pixels.
 *
 * The webcam preview is mirrored so the interaction feels like looking in a
 * mirror, which means the x axis must be flipped. A calibration margin is also
 * applied so the user can reach the edges of the screen without moving their
 * hand out of the camera frame entirely.
 */
export function cameraToViewport(point, { width, height, margin = 0.12 }) {
  const span = Math.max(1 - margin * 2, 0.2)
  const mx = clamp((1 - point.x - margin) / span, 0, 1)
  const my = clamp((point.y - margin) / span, 0, 1)
  return { x: mx * width, y: my * height }
}

/** How many fingers are extended — powers the "open hand" readout. */
export function extendedFingerCount(landmarks) {
  const scale = handScale(landmarks)
  const tips = [LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP]
  return tips.reduce(
    (count, tip) => count + (dist2D(landmarks[tip], landmarks[LM.WRIST]) / scale > 1.45 ? 1 : 0),
    0,
  )
}

/**
 * Is the hand an deliberate OPEN PALM?
 *
 * Used to arm gesture scrolling, so it has to be stricter than
 * `extendedFingerCount` alone — otherwise a relaxed hand drifting across the
 * shelf would start scrolling by accident. Two independent conditions must
 * agree: at least 3 of 4 fingers extended, AND the thumb/index pair clearly
 * apart (which is exactly what a pinch is not).
 */
export function isOpenPalm(landmarks, { minFingers = 3, minPinch = 0.75 } = {}) {
  if (!landmarks || landmarks.length < 21) return false
  return extendedFingerCount(landmarks) >= minFingers && pinchRatio(landmarks) > minPinch
}

/**
 * Debounces a boolean gesture so it only latches after it has been held
 * steady for `holdMs`. Prevents a frame of noise from toggling scroll mode.
 */
export class GestureHold {
  constructor(holdMs = 200) {
    this.holdMs = holdMs
    this.active = false
    this._since = null
  }

  /** @returns {boolean} whether the gesture is currently latched */
  update(raw, nowMs) {
    if (!raw) {
      this._since = null
      this.active = false
      return false
    }
    if (this._since === null) this._since = nowMs
    this.active = nowMs - this._since >= this.holdMs
    return this.active
  }

  reset() {
    this.active = false
    this._since = null
  }
}
