import { useEffect, useRef } from 'react'

/**
 * Canvas liquid renderer for the virtual beaker.
 *
 * Draws, bottom-up: the liquid body, two travelling surface waves, rising gas
 * bubbles, settled solids and an optional thermal glow. Everything here is a
 * qualitative illustration — none of it is a quantitative prediction.
 */

function hexToRgb(hex) {
  const h = (hex || '#38bdf8').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

const mix = (a, b, t) => ({
  r: Math.round(a.r + (b.r - a.r) * t),
  g: Math.round(a.g + (b.g - a.g) * t),
  b: Math.round(a.b + (b.b - a.b) * t),
})

const rgba = ({ r, g, b }, a) => `rgba(${r}, ${g}, ${b}, ${a})`

export default function BeakerCanvas({
  fillLevel = 0,
  liquidColor = '#38bdf8',
  bubbleRate = 0,
  bubbleScale = 1,
  thermal = 0,
  solids = [],
  className = '',
}) {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    bubbles: [],
    spawnAcc: 0,
    level: 0,
    color: hexToRgb(liquidColor),
    targetColor: hexToRgb(liquidColor),
    thermal: 0,
    last: 0,
  })
  const propsRef = useRef({ fillLevel, bubbleRate, bubbleScale, thermal, solids })

  useEffect(() => {
    propsRef.current = { fillLevel, bubbleRate, bubbleScale, thermal, solids }
    stateRef.current.targetColor = hexToRgb(liquidColor)

    // Dev/QA instrumentation only — dead-code-eliminated from production builds.
    // Lets automated tests assert that reaction effects actually reach the
    // renderer, which is otherwise invisible inside a <canvas>.
    if (import.meta.env.DEV) {
      window.__gl_effects = {
        fillLevel,
        liquidColor,
        bubbleRate,
        bubbleScale,
        thermal,
        solidCount: solids.length,
      }
    }
  }, [fillLevel, liquidColor, bubbleRate, bubbleScale, thermal, solids])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let raf = 0
    let running = true

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const wave = (x, surfaceY, t) =>
      surfaceY +
      Math.sin(x / 42 + t * 1.5) * 2.6 +
      Math.sin(x / 19 - t * 2.3) * 1.3 +
      Math.sin(t * 0.8) * 1.1

    const draw = (now) => {
      if (!running) return
      const s = stateRef.current
      const p = propsRef.current
      const dt = Math.min((now - (s.last || now)) / 1000, 0.05)
      s.last = now

      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const H = rect.height
      ctx.clearRect(0, 0, W, H)

      // Ease level, colour and heat so additions and reactions look smooth.
      s.level += (p.fillLevel - s.level) * Math.min(dt * 3.2, 1)
      s.color = mix(s.color, s.targetColor, Math.min(dt * 1.6, 1))
      s.thermal += (p.thermal - s.thermal) * Math.min(dt * 2, 1)

      const surfaceY = H - s.level * H
      const t = now / 1000

      if (s.level > 0.004) {
        const grad = ctx.createLinearGradient(0, surfaceY, 0, H)
        grad.addColorStop(0, rgba(s.color, 0.62))
        grad.addColorStop(0.45, rgba(s.color, 0.78))
        grad.addColorStop(1, rgba(mix(s.color, { r: 4, g: 10, b: 30 }, 0.35), 0.92))

        ctx.beginPath()
        ctx.moveTo(0, H)
        ctx.lineTo(0, surfaceY)
        for (let x = 0; x <= W; x += 4) ctx.lineTo(x, wave(x, surfaceY, t))
        ctx.lineTo(W, H)
        ctx.closePath()
        ctx.fillStyle = grad
        ctx.fill()

        // Bright meniscus line along the surface.
        ctx.beginPath()
        for (let x = 0; x <= W; x += 4) {
          const y = wave(x, surfaceY, t)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = rgba(mix(s.color, { r: 255, g: 255, b: 255 }, 0.65), 0.75)
        ctx.lineWidth = 1.6
        ctx.stroke()
      }

      /* ------------------------------- solids ------------------------------- */
      p.solids.forEach((solid, i) => {
        const baseY = H - 8 - (i % 2) * 5
        const cx = W * (0.32 + 0.16 * i + 0.05 * Math.sin(t * 0.6 + i))
        ctx.save()
        ctx.translate(cx, baseY)
        ctx.rotate(Math.sin(t * 0.4 + i) * 0.12)
        const g = ctx.createLinearGradient(-9, -7, 9, 7)
        g.addColorStop(0, solid.accent || '#ffffff')
        g.addColorStop(1, solid.color)
        ctx.fillStyle = g
        ctx.shadowColor = solid.color
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.moveTo(-9, 5)
        ctx.lineTo(-5, -6)
        ctx.lineTo(6, -7)
        ctx.lineTo(10, 3)
        ctx.lineTo(3, 7)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      })

      /* ------------------------------ bubbles ------------------------------- */
      if (p.bubbleRate > 0 && s.level > 0.02) {
        s.spawnAcc += p.bubbleRate * dt
        while (s.spawnAcc >= 1) {
          s.spawnAcc -= 1
          if (s.bubbles.length < 220) {
            s.bubbles.push({
              x: W * (0.15 + Math.random() * 0.7),
              y: H - 6 - Math.random() * 14,
              r: (1.4 + Math.random() * 3.4) * (p.bubbleScale || 1),
              v: 22 + Math.random() * 58 * (p.bubbleScale || 1),
              drift: (Math.random() - 0.5) * 16,
              phase: Math.random() * Math.PI * 2,
            })
          }
        }
      }

      s.bubbles = s.bubbles.filter((b) => {
        b.y -= b.v * dt
        b.x += Math.sin(t * 2.4 + b.phase) * b.drift * dt
        b.r += dt * 0.35 // gas expands slightly as it rises

        if (b.y < -b.r || p.bubbleRate <= 0) return false

        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(230,250,255,0.4)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'
        ctx.lineWidth = 0.9
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.32, Math.max(b.r * 0.26, 0.4), 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.fill()
        return true
      })

      /* --------------------------- thermal shimmer --------------------------- */
      if (s.thermal > 0.02 && s.level > 0.02) {
        const pulse = 0.55 + 0.45 * Math.sin(t * 2.1)
        const glow = ctx.createLinearGradient(0, H, 0, surfaceY)
        glow.addColorStop(0, `rgba(251, 146, 60, ${0.3 * s.thermal * pulse})`)
        glow.addColorStop(1, 'rgba(251, 146, 60, 0)')
        ctx.fillStyle = glow
        ctx.fillRect(0, surfaceY, W, H - surfaceY)

        ctx.save()
        for (let i = 0; i < 5; i += 1) {
          const x = W * (0.2 + i * 0.15)
          const off = ((t * 24 + i * 30) % 60) - 10
          ctx.beginPath()
          ctx.ellipse(
            x + Math.sin(t * 1.6 + i) * 6,
            surfaceY - off,
            9 + Math.sin(t + i) * 3,
            4,
            0,
            0,
            Math.PI * 2,
          )
          ctx.fillStyle = `rgba(253, 186, 116, ${Math.max(0, 0.22 * s.thermal * (1 - off / 50))})`
          ctx.fill()
        }
        ctx.restore()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
