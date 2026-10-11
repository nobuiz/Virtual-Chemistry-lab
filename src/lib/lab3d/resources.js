/**
 * Shared GPU resources for the 3D laboratory.
 *
 * PERFORMANCE CONTRACT: a geometry or material that is used by more than one
 * mesh is created exactly ONCE here and reused. React Three Fiber would
 * otherwise build a fresh BufferGeometry per `<boxGeometry />` element, which
 * on this scene would mean ~60 redundant uploads on every remount.
 *
 * Everything is low-poly on purpose — this is an interactive simulator, not a
 * renderer benchmark, and it has to stay smooth on integrated graphics.
 */
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DodecahedronGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  SphereGeometry,
  TorusGeometry,
} from 'three'

/* ------------------------------ geometries ------------------------------ */
/** Unit cube, scaled per instance. One geometry serves every box in the room. */
export const UNIT_BOX = new BoxGeometry(1, 1, 1)

/** Unit plane for labels and decals. */
export const UNIT_PLANE = new PlaneGeometry(1, 1)

/** Low-segment cylinders. 24 radial segments reads as round at this scale. */
export const UNIT_CYL = new CylinderGeometry(0.5, 0.5, 1, 24, 1, true)
export const UNIT_CYL_CAPPED = new CylinderGeometry(0.5, 0.5, 1, 24)
export const UNIT_CYL_LOW = new CylinderGeometry(0.5, 0.5, 1, 12)

/** Bubble sphere — tiny on screen, so 8x6 segments is plenty. */
export const BUBBLE_GEO = new SphereGeometry(1, 8, 6)

/** Irregular chunk used for metal granules and settled solids. */
export const CHUNK_GEO = new DodecahedronGeometry(1, 0)

/** Rim/ring detail (beaker lip, test-tube collars). */
export const RING_GEO = new TorusGeometry(1, 0.06, 6, 20)

/* ------------------------------- materials ------------------------------ */
const std = (params) => new MeshStandardMaterial(params)

export const MAT = {
  /* --- room --- */
  floor: std({ color: '#2a2f3b', roughness: 0.92, metalness: 0.02 }),
  wall: std({ color: '#39434f', roughness: 0.96, metalness: 0 }),
  wallTile: std({ color: '#4a5666', roughness: 0.78, metalness: 0.03 }),
  ceiling: std({ color: '#2b313c', roughness: 1 }),

  /* --- bench --- */
  benchTop: std({ color: '#3f4752', roughness: 0.56, metalness: 0.16 }),
  benchEdge: std({ color: '#596575', roughness: 0.4, metalness: 0.45 }),
  cabinet: std({ color: '#323a46', roughness: 0.82, metalness: 0.08 }),
  steel: std({ color: '#8b97a6', roughness: 0.34, metalness: 0.78 }),
  darkSteel: std({ color: '#4d5663', roughness: 0.42, metalness: 0.6 }),

  /* --- shelving --- */
  shelfPlank: std({ color: '#55606f', roughness: 0.68, metalness: 0.22 }),
  shelfBracket: std({ color: '#39414d', roughness: 0.5, metalness: 0.55 }),

  /* --- glass --- */
  glass: std({
    color: '#cfe6f2',
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.26,
  }),
  glassThin: std({
    color: '#dff1fb',
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.18,
  }),

  /* --- misc props --- */
  label: std({ color: '#ecf1f6', roughness: 0.85 }),
  rubber: std({ color: '#1f242d', roughness: 0.95 }),
  paperTray: std({ color: '#6c7686', roughness: 0.7, metalness: 0.2 }),
  screen: std({ color: '#0d2a33', roughness: 0.3, emissive: '#0a3d4a', emissiveIntensity: 0.6 }),
  bubble: std({
    color: '#ffffff',
    roughness: 0.12,
    transparent: true,
    opacity: 0.4,
  }),
}

/* ---------------------- per-chemical cached materials -------------------- */
const cache = new Map()

/** Metal material for a solid sample, created once per chemical. */
export function metalMaterial(id, color) {
  const k = `metal:${id}`
  let m = cache.get(k)
  if (!m) {
    m = std({ color, roughness: 0.3, metalness: 0.85 })
    cache.set(k, m)
  }
  return m
}

/** Translucent bottle glass tinted by the reagent's stock colour. */
export function bottleGlassMaterial(id, color) {
  const k = `bglass:${id}`
  let m = cache.get(k)
  if (!m) {
    m = std({ color, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.34 })
    cache.set(k, m)
  }
  return m
}

/** Opaque liquid inside a bottle. */
export function bottleLiquidMaterial(id, color) {
  const k = `bliquid:${id}`
  let m = cache.get(k)
  if (!m) {
    m = std({ color, roughness: 0.22, metalness: 0.04, transparent: true, opacity: 0.88 })
    cache.set(k, m)
  }
  return m
}

/** Plastic screw cap. */
export function capMaterial(id, color) {
  const k = `cap:${id}`
  let m = cache.get(k)
  if (!m) {
    m = std({ color, roughness: 0.55, metalness: 0.1 })
    cache.set(k, m)
  }
  return m
}

/**
 * Highlight material used for the hover/carry outline.
 * Shared by every reagent — only one object is ever highlighted at a time.
 */
export const HIGHLIGHT_MAT = std({
  color: '#22e3ff',
  emissive: '#22e3ff',
  emissiveIntensity: 1.6,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
})

/* ------------------------------ text labels ------------------------------ */
/**
 * Labels are rendered into small canvases rather than with an SDF text engine.
 *
 * Rationale: the app vendors its MediaPipe assets specifically so it works
 * offline with no CDN. A 3D text library that fetches a default font over the
 * network would quietly break that guarantee, and a full font atlas is far
 * more bytes than the ~20 tiny textures this scene needs. Each label is
 * generated once and cached.
 */
const labelCache = new Map()

/**
 * @param {string} title     large line (e.g. "Zn")
 * @param {string} subtitle  small line (e.g. "Zinc")
 * @param {object} opts
 * @returns {import('three').CanvasTexture}
 */
export function labelTexture(title, subtitle = '', opts = {}) {
  const {
    width = 256,
    height = 128,
    bg = '#eef3f8',
    fg = '#141a24',
    accent = '#5b6878',
    border = null,
  } = opts
  const k = `${title}|${subtitle}|${width}x${height}|${bg}|${fg}|${border}`
  const hit = labelCache.get(k)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  if (border) {
    ctx.strokeStyle = border
    ctx.lineWidth = Math.max(4, height * 0.05)
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth)
  }

  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (subtitle) {
    ctx.font = `bold ${Math.round(height * 0.38)}px "Space Grotesk", system-ui, sans-serif`
    ctx.fillText(title, width / 2, height * 0.38, width * 0.9)
    ctx.font = `${Math.round(height * 0.17)}px Inter, system-ui, sans-serif`
    ctx.fillStyle = accent
    ctx.fillText(subtitle.toUpperCase(), width / 2, height * 0.72, width * 0.9)
  } else {
    ctx.font = `bold ${Math.round(height * 0.46)}px "Space Grotesk", system-ui, sans-serif`
    ctx.fillText(title, width / 2, height / 2, width * 0.9)
  }

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  labelCache.set(k, tex)
  return tex
}

/** An unlit material showing a generated label, cached alongside its texture. */
const labelMatCache = new Map()
export function labelMaterial(title, subtitle, opts) {
  const k = `${title}|${subtitle}|${JSON.stringify(opts ?? {})}`
  let m = labelMatCache.get(k)
  if (!m) {
    m = new MeshBasicMaterial({ map: labelTexture(title, subtitle, opts), toneMapped: false })
    labelMatCache.set(k, m)
  }
  return m
}
