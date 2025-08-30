import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * SparkleText — Canvas particle system that emits tiny "sparks" from the *actual*
 * edges of rendered text glyphs (including inner holes like “O”, “a”, “B”).
 *
 * Approach
 * 1) We render the text to an offscreen canvas to obtain an alpha mask.
 * 2) From that mask we compute:
 *    - outsideMask via flood-fill from the borders (so “O” holes are NOT outside).
 *    - edge points by finding alpha pixels that touch outside pixels.
 *    - per-edge normals using a small gradient kernel so sparks fire outward.
 * 3) A visible canvas overlays the real DOM text. We spawn particles from edge
 *    points and only draw them where outsideMask===true, so nothing ever shows
 *    inside the glyphs or their holes.
 *
 * Why this works
 * - No special font tooling or path extraction.
 * - Works for any language/font the browser can render.
 * - Letter holes are respected because we distinguish “outside world” from
 *   “interior holes” with flood-fill.
 *
 * Usage
 * <SparkleText className="text-6xl font-black tracking-tight">SPARKLE</SparkleText>
 *
 * Notes
 * - The actual text remains in the DOM for accessibility and SEO.
 * - The overlayed canvas is pointer-events: none.
 */

export type SparkleTextProps = {
  children: string
  className?: string
  /** Particles per second (approx). */
  emissionRate?: number
  /** Base speed in px/s. */
  speed?: number
  /** Spread angle in radians around the outward normal. */
  spread?: number
  /** Gravity in px/s^2 (positive = downward). */
  gravity?: number
  /** Maximum live particles. */
  maxParticles?: number
  /** Range for particle radius in CSS pixels. */
  particleSize?: { min: number; max: number }
  /** Particle lifetime in seconds. */
  ttl?: { min: number; max: number }
  /** Optional fixed colors; if empty, random HSL. */
  colors?: string[]
  /** Pause animation (e.g., when offscreen). */
  paused?: boolean
  /** Extra off-canvas padding in CSS px to avoid visual clipping at edges. */
  canvasBleed?: number
  style?: React.CSSProperties
}

export default function SparkleText({
  children,
  className,
  emissionRate = 180,
  speed = 120,
  spread = Math.PI / 6,
  gravity = 100,
  maxParticles = 1200,
  particleSize = { min: 0.7, max: 2.0 },
  ttl = { min: 0.7, max: 1.6 },
  colors,
  paused = false,
  canvasBleed = 48,
  style: styleProp,
}: SparkleTextProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Offscreen mask buffers
  const maskRef = useRef<HTMLCanvasElement | null>(null)
  const edgePointsRef = useRef<Array<{ x: number; y: number; nx: number; ny: number }>>([])
  const outsideMaskRef = useRef<Uint8Array | null>(null) // 1 for outside pixels, 0 otherwise
  const insideMaskRef = useRef<Uint8Array | null>(null) // 1 for glyph fill pixels, 0 otherwise
  const dimsRef = useRef({ w: 0, h: 0, dpr: 1 })

  const [ready, setReady] = useState(false)

  // Recompute mask & edges whenever size or font changes.
  useLayoutEffect(() => {
    if (!wrapRef.current) return

    const ro = new ResizeObserver(() => rebuildMask())
    ro.observe(wrapRef.current)

    // Also rebuild once fonts are loaded (important for accuracy)
    let cancelled = false
    ;(async () => {
      try {
        if (document?.fonts?.ready) {
          await document.fonts.ready
          if (!cancelled) rebuildMask()
        } else {
          rebuildMask()
        }
      } catch {
        rebuildMask()
      }
    })()

    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [children, className])

  function rebuildMask() {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const rect = wrap.getBoundingClientRect()
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    const bleed = Math.max(0, Math.floor(canvasBleed))
    const w = Math.max(1, Math.ceil(rect.width))
    const h = Math.max(1, Math.ceil(rect.height))
    const cssW = w + bleed * 2
    const cssH = h + bleed * 2

    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    canvas.width = Math.ceil(cssW * dpr)
    canvas.height = Math.ceil(cssH * dpr)

    dimsRef.current = { w: canvas.width, h: canvas.height, dpr }

    // Prepare offscreen mask canvas
    const mask = document.createElement('canvas')
    mask.width = canvas.width
    mask.height = canvas.height
    maskRef.current = mask

    // Render text to mask
    const mctx = mask.getContext('2d', { willReadFrequently: true })!
    mctx.clearRect(0, 0, mask.width, mask.height)

    // Mirror the computed styles so the offscreen text matches DOM text
    const cs = window.getComputedStyle(wrap)
    const font = cs.font || `${cs.fontStyle} ${cs.fontVariant} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`

    mctx.save()
    mctx.scale(dpr, dpr)
    mctx.font = font
    mctx.textBaseline = 'alphabetic'
    mctx.fillStyle = '#000'

    // Find the first child text node span to measure baseline.
    const inner = wrap.querySelector('span[data-sparkle-inner]') as HTMLSpanElement | null
    const innerRect = inner?.getBoundingClientRect?.() || rect
    const leftPad = innerRect.left - rect.left

    // TextMetrics: prefer font bounding box metrics so baseline alignment
    // is independent of the particular glyphs in `children`.
    const metrics = mctx.measureText(children)
    type ExtendedTextMetrics = TextMetrics & {
      emHeightAscent?: number
      emHeightDescent?: number
      fontBoundingBoxAscent?: number
      fontBoundingBoxDescent?: number
    }
    const em = metrics as ExtendedTextMetrics
    const fontSizePx = parseFloat(cs.fontSize) || 16
    // Prefer CSS em-box metrics (what line-height is based on),
    // then font bounding box, then the actual glyph box.
    const asc = em.emHeightAscent ?? em.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent ?? fontSizePx * 0.8
    const desc = em.emHeightDescent ?? em.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent ?? fontSizePx * 0.2
    // Use the actual layout height of the wrapper as the used line-height in px.
    // This tracks font size and any CSS line-height precisely.
    const lineH = rect.height || fontSizePx * 1.2
    const contentH = asc + desc
    const halfLeading = Math.max(0, lineH - contentH) / 2
    const ascentForY = asc
    const baselineNudge = 0
    const x = leftPad + bleed
    const y = halfLeading + ascentForY + baselineNudge + bleed

    mctx.fillText(children, x, y)
    mctx.restore()

    // Read pixels
    const img = mctx.getImageData(0, 0, mask.width, mask.height)
    const alpha = img.data // RGBA, alpha at i+3

    // Build binary inside mask (1 if text pixel, else 0)
    const inside = new Uint8Array(mask.width * mask.height)
    for (let y = 0; y < mask.height; y++) {
      for (let x = 0; x < mask.width; x++) {
        const idx = (y * mask.width + x) * 4 + 3
        inside[y * mask.width + x] = alpha[idx] > 12 ? 1 : 0
      }
    }

    // Flood-fill from borders over inside==0 to mark true outside (holes remain 0)
    const outside = new Uint8Array(mask.width * mask.height)
    const qx = new Uint32Array(mask.width * mask.height)
    const qy = new Uint32Array(mask.width * mask.height)
    let qh = 0,
      qt = 0

    function enqueue(px: number, py: number) {
      const p = py * mask.width + px
      if (outside[p] === 0 && inside[p] === 0) {
        outside[p] = 1
        qx[qt] = px
        qy[qt] = py
        qt++
      }
    }

    for (let x0 = 0; x0 < mask.width; x0++) {
      enqueue(x0, 0)
      enqueue(x0, mask.height - 1)
    }
    for (let y0 = 0; y0 < mask.height; y0++) {
      enqueue(0, y0)
      enqueue(mask.width - 1, y0)
    }
    while (qh < qt) {
      const px = qx[qh]
      const py = qy[qh]
      qh++
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = px + dx,
            ny = py + dy
          if (nx >= 0 && nx < mask.width && ny >= 0 && ny < mask.height) enqueue(nx, ny)
        }
      }
    }

    // Edge detection (outer edges and inner-hole edges) + normals using a tiny gradient on the binary mask
    const edges: Array<{ x: number; y: number; nx: number; ny: number }> = []
    const W = mask.width

    function isOutside(ix: number, iy: number) {
      return outside[iy * W + ix] === 1
    }

    function insideAt(ix: number, iy: number) {
      return inside[iy * W + ix] === 1
    }

    function isHole(ix: number, iy: number) {
      // A hole pixel is not inside and not outside (enclosed void)
      return inside[iy * W + ix] === 0 && outside[iy * W + ix] === 0
    }

    for (let iy = 1; iy < mask.height - 1; iy++) {
      for (let ix = 1; ix < mask.width - 1; ix++) {
        if (!insideAt(ix, iy)) continue
        // If any neighbor is outside, it's an outer edge; if any neighbor is a hole, it's an inner-hole edge
        let touchesOutside = false
        let touchesHole = false
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nxp = ix + dx
            const nyp = iy + dy
            if (isOutside(nxp, nyp)) touchesOutside = true
            else if (isHole(nxp, nyp)) touchesHole = true
          }
        }
        if (!touchesOutside && !touchesHole) continue

        // Simple central differences on the binary inside mask
        const gx = (insideAt(ix + 1, iy) ? 1 : 0) - (insideAt(ix - 1, iy) ? 1 : 0)
        const gy = (insideAt(ix, iy + 1) ? 1 : 0) - (insideAt(ix, iy - 1) ? 1 : 0)
        let nx = gx,
          ny = gy
        const len = Math.hypot(nx, ny) || 1
        nx /= len
        ny /= len
        // Prepare two orientations from the same gradient: toward outside and toward hole
        if (touchesOutside) {
          let nxo = nx,
            nyo = ny
          const testXo = Math.min(W - 1, Math.max(0, Math.round(ix + nxo * 2)))
          const testYo = Math.min(mask.height - 1, Math.max(0, Math.round(iy + nyo * 2)))
          // Ensure normal points toward outside region
          if (!isOutside(testXo, testYo)) {
            nxo = -nxo
            nyo = -nyo
          }
          edges.push({ x: ix, y: iy, nx: nxo, ny: nyo })
        }

        if (touchesHole) {
          let nxh = nx,
            nyh = ny
          const testXh = Math.min(W - 1, Math.max(0, Math.round(ix + nxh * 2)))
          const testYh = Math.min(mask.height - 1, Math.max(0, Math.round(iy + nyh * 2)))
          // Ensure normal points toward hole region
          if (!isHole(testXh, testYh)) {
            nxh = -nxh
            nyh = -nyh
          }
          edges.push({ x: ix, y: iy, nx: nxh, ny: nyh })
        }
      }
    }

    edgePointsRef.current = edges
    outsideMaskRef.current = outside
    insideMaskRef.current = inside
    setReady(true)
  }

  // Particle system
  type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; ttl: number; color: string }
  const particlesRef = useRef<Particle[]>([])
  const lastTRef = useRef<number>(performance.now())
  const spawnCarryRef = useRef(0)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!ready || paused) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const { w, h } = dimsRef.current

      const now = performance.now()
      const dt = Math.min(0.05, (now - lastTRef.current) / 1000)
      lastTRef.current = now

      // Spawn new particles
      const edges = edgePointsRef.current
      const insideMask = insideMaskRef.current
      if (!insideMask || edges.length === 0) return

      // keep within budget
      const arr = particlesRef.current
      if (arr.length > maxParticles) arr.splice(0, Math.max(0, arr.length - maxParticles))

      const toSpawnFloat = emissionRate * dt + spawnCarryRef.current
      let toSpawn = Math.floor(toSpawnFloat)
      spawnCarryRef.current = toSpawnFloat - toSpawn

      while (toSpawn-- > 0 && arr.length < maxParticles) {
        const e = edges[(Math.random() * edges.length) | 0]
        const off = 1.2 + Math.random() * 1.8 // start just outside the edge
        // direction with spread
        const baseAng = Math.atan2(e.ny, e.nx)
        const ang = baseAng + (Math.random() - 0.5) * spread
        const spd = speed * (0.8 + Math.random() * 0.6)

        const col = colors && colors.length ? colors[(Math.random() * colors.length) | 0] : `hsl(${(Math.random() * 360) | 0} 90% 65%)`

        const pr = particleSize.min + Math.random() * (particleSize.max - particleSize.min)
        const pttl = ttl.min + Math.random() * (ttl.max - ttl.min)

        const px = e.x + Math.cos(ang) * off
        const py = e.y + Math.sin(ang) * off

        arr.push({ x: px, y: py, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r: pr, life: 0, ttl: pttl, color: col })
      }

      // Update
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i]
        p.vy += gravity * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life += dt
        if (p.life >= p.ttl) {
          arr.splice(i, 1)
          continue
        }
        // Cull if entering the glyph fill (keep only outside or hole regions)
        const ix = p.x | 0,
          iy = p.y | 0
        if (ix < 0 || iy < 0 || ix >= w || iy >= h || insideMask[iy * w + ix] === 1) {
          arr.splice(i, 1)
        }
      }

      // Draw
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter' // add a subtle glow
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i]
        const t = p.life / p.ttl // 0..1
        const alpha = 1 - t
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (0.6 + 0.8 * (1 - t)), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready, paused, emissionRate, speed, spread, gravity, maxParticles, particleSize.min, particleSize.max, ttl.min, ttl.max, colors])

  return (
    <span
      ref={wrapRef}
      className={className || ''}
      style={{ ...styleProp, position: 'relative', display: 'inline-block', verticalAlign: 'baseline' }}
    >
      {/* Real DOM text for accessibility/SEO */}
      <span data-sparkle-inner style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>
      {/* Particle canvas overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: -canvasBleed,
          left: -canvasBleed,
          right: -canvasBleed,
          bottom: -canvasBleed,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </span>
  )
}
