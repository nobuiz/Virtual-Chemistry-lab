/** Qualitative visual timings, never physical predictions. */
export function burstState(seconds) {
  const progress = Math.max(0, Math.min(1, (seconds - 0.45) / 2.2))
  return { progress, active: seconds >= 0.45 && seconds < 2.65, opacity: Math.sin(progress * Math.PI) * (1 - progress) }
}

export function gasParticle(time, index, rate = 18) {
  const rise = (time * (0.3 + Math.min(rate, 42) / 100) + index * 0.618) % 1
  return { rise, opacity: Math.sin(Math.PI * rise) * 0.8, spread: 0.015 + rise * 0.07 }
}
