/**
 * textures.js — procedural canvas textures.
 *
 * All level surfaces get generated detail (noise, panel seams, rivets,
 * hazard stripes) without any external asset. Textures are neutral-grey
 * so each level tints them through material.color — one set of maps for
 * every palette.
 *
 * Textures are generated ONCE and cached on the module (Level instances
 * share them); per-box tiling uses cheap clones that share the same
 * GPU source.
 */
import * as THREE from 'three'

let CACHE = null

/** Create a size x size canvas, run draw(ctx, size), wrap as a texture. */
function canvasTex (size, draw) {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  draw(c.getContext('2d'), size)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

const rnd = (a, b) => a + Math.random() * (b - a)

/** Speckle noise pass — thousands of tiny alpha dots.
 *  `tone` = 0 dark dots, 1 light dots, 0.5 mixed. */
function speckle (ctx, size, count, tone, alphaMax) {
  for (let i = 0; i < count; i++) {
    const light = tone >= 0.5 ? Math.random() < tone : Math.random() < 0.5
    ctx.fillStyle = light
      ? `rgba(255,255,255,${Math.random() * alphaMax})`
      : `rgba(0,0,0,${Math.random() * alphaMax})`
    ctx.fillRect(Math.random() * size, Math.random() * size, rnd(1, 2.4), rnd(1, 2.4))
  }
}

/** Soft radial stains — big translucent blotches. */
function stains (ctx, size, count, color) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = rnd(size * 0.06, size * 0.22)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
}

/** Fine surface cracks — jagged polylines. */
function cracks (ctx, size, count) {
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'
  ctx.lineWidth = 1
  for (let i = 0; i < count; i++) {
    let x = Math.random() * size
    let y = Math.random() * size
    ctx.beginPath()
    ctx.moveTo(x, y)
    const segs = 3 + (Math.random() * 4) | 0
    for (let s = 0; s < segs; s++) {
      x += rnd(-18, 18)
      y += rnd(-18, 18)
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

/** Panel seam grid — makes big surfaces read as poured slabs. */
function panels (ctx, size, step) {
  ctx.strokeStyle = 'rgba(0,0,0,0.16)'
  ctx.lineWidth = 1.4
  for (let p = 0; p <= size; p += step) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke()
  }
  // subtle 2px highlight beside each seam (chamfer illusion)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  for (let p = step / 2; p < size; p += step) {
    ctx.beginPath(); ctx.moveTo(p + 2, 0); ctx.lineTo(p + 2, size); ctx.stroke()
  }
}

/** Build (or return cached) the shared texture set. */
export function buildTextures () {
  if (CACHE) return CACHE

  // ---- concrete: grey base, panels, stains, cracks, speckle ----
  const concrete = canvasTex(512, (ctx, s) => {
    ctx.fillStyle = '#a9adb2'
    ctx.fillRect(0, 0, s, s)
    stains(ctx, s, 7, 'rgba(60,64,70,0.07)')
    stains(ctx, s, 3, 'rgba(255,255,255,0.05)')
    panels(ctx, s, 128)
    cracks(ctx, s, 7)
    speckle(ctx, s, 2600, 0.5, 0.09)
  })

  // ---- darker structural concrete ----
  const dark = canvasTex(512, (ctx, s) => {
    ctx.fillStyle = '#8e939a'
    ctx.fillRect(0, 0, s, s)
    stains(ctx, s, 9, 'rgba(40,44,50,0.10)')
    panels(ctx, s, 170)
    cracks(ctx, s, 9)
    speckle(ctx, s, 2200, 0.4, 0.10)
  })

  // ---- girder steel: brushed bands + rivet rows ----
  const girder = canvasTex(512, (ctx, s) => {
    ctx.fillStyle = '#70767f'
    ctx.fillRect(0, 0, s, s)
    for (let y = 0; y < s; y += rnd(2, 6)) { // horizontal brushing
      ctx.fillStyle = `rgba(255,255,255,${rnd(0.01, 0.05)})`
      ctx.fillRect(0, y, s, 1)
    }
    stains(ctx, s, 5, 'rgba(94,70,44,0.10)') // rust weep
    speckle(ctx, s, 1200, 0.5, 0.06)
    // rivets around a border band
    ctx.fillStyle = 'rgba(22,24,28,0.55)'
    const inset = 22
    const step = 52
    for (let p = inset; p < s; p += step) {
      for (const [x, y] of [[p, inset], [p, s - inset], [inset, p], [s - inset, p]]) {
        ctx.beginPath(); ctx.arc(x, y, 3.4, 0, Math.PI * 2); ctx.fill()
      }
    }
  })

  // ---- hazard: diagonal warning stripes ----
  const hazard = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#23262b'
    ctx.fillRect(0, 0, s, s)
    ctx.fillStyle = '#e0a92c'
    const w = 34
    for (let x = -s; x < s * 2; x += w * 2) {
      ctx.beginPath()
      ctx.moveTo(x, 0); ctx.lineTo(x + w, 0)
      ctx.lineTo(x + w - s, s); ctx.lineTo(x - s, s)
      ctx.closePath(); ctx.fill()
    }
    speckle(ctx, s, 700, 0.5, 0.08)
  })

  // ---- accent / brand colour plates ----
  const accent = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#c9522f'
    ctx.fillRect(0, 0, s, s)
    panels(ctx, s, 128)
    speckle(ctx, s, 900, 0.5, 0.08)
    stains(ctx, s, 3, 'rgba(60,20,10,0.10)')
  })

  // ---- ground: neutral detail, tinted per level via material.color ----
  const ground = canvasTex(512, (ctx, s) => {
    ctx.fillStyle = '#9c9c9c'
    ctx.fillRect(0, 0, s, s)
    speckle(ctx, s, 5200, 0.5, 0.13)
    stains(ctx, s, 12, 'rgba(30,30,30,0.09)')
    stains(ctx, s, 6, 'rgba(230,230,230,0.05)')
    cracks(ctx, s, 12)
  })

  // ---- soft round puff sprite (clouds) ----
  const puff = canvasTex(256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.55)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })
  puff.wrapS = puff.wrapT = THREE.ClampToEdgeWrapping

  // ---- building facades: day (glass with sky tint) + night (lit windows) ----
  // One tile = 4 window columns x 6 floors. Facade body stays mid-grey so the
  // palette tint dominates; glass varies per window so facades read at speed.
  const facade = (night, litRatio) => canvasTex(256, (ctx, s) => {
    const COLS = 4, ROWS = 6
    const cw = s / COLS, ch = s / ROWS
    ctx.fillStyle = night ? '#101318' : '#a7abb1'
    ctx.fillRect(0, 0, s, s)
    // concrete mullion grid
    ctx.strokeStyle = night ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.28)'
    ctx.lineWidth = 3
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, s); ctx.stroke()
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(s, r * ch); ctx.stroke()
    }
    // spandrel band under each floor
    ctx.fillStyle = night ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.18)'
    for (let r = 0; r < ROWS; r++) ctx.fillRect(0, r * ch + ch * 0.72, s, ch * 0.28)
    // windows
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const x = c * cw + 4, y = r * ch + 3
        const w = cw - 8, h = ch * 0.62
        if (night) {
          const lit = Math.random() < litRatio
          if (lit) {
            // warm / cool interior light
            const warm = Math.random() < 0.6
            const a = 0.55 + Math.random() * 0.45
            ctx.fillStyle = warm
              ? `rgba(255,${180 + (Math.random() * 50) | 0},${90 + (Math.random() * 60) | 0},${a})`
              : `rgba(${150 + (Math.random() * 40) | 0},${200 + (Math.random() * 40) | 0},255,${a})`
          } else {
            ctx.fillStyle = 'rgba(18,22,30,0.9)'
          }
        } else {
          // daylight glass: blue-grey with per-window brightness variation
          const v = 118 + ((Math.random() * 54) | 0)
          ctx.fillStyle = `rgb(${(v * 0.82) | 0},${(v * 0.94) | 0},${v + 24 > 255 ? 255 : v + 24})`
        }
        ctx.fillRect(x, y, w, h)
      }
    }
    // weathering streaks on day facades
    if (!night) {
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * s
        ctx.fillStyle = 'rgba(0,0,0,0.05)'
        ctx.fillRect(x, 0, 2 + Math.random() * 3, s)
      }
    }
  })
  const windowsDay = facade(false, 0)
  const windowsNight = facade(true, 0.34)

  // ---- fine metal cladding for building trims / rooftop units ----
  const metalPanel = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#9298a0'
    ctx.fillRect(0, 0, s, s)
    for (let y = 0; y < s; y += 16) {
      ctx.fillStyle = y % 32 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, y, s, 1)
    }
    for (let x = 0; x < s; x += 32) {
      ctx.fillStyle = 'rgba(0,0,0,0.10)'
      ctx.fillRect(x, 0, 1, s)
    }
    stains(ctx, s, 4, 'rgba(70,60,40,0.12)')
    speckle(ctx, s, 600, 0.5, 0.07)
  })

  // ---- lava / emissive fault lines (volcanic level) ----
  const lava = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#141210'
    ctx.fillRect(0, 0, s, s)
    // branching glowing cracks
    for (let i = 0; i < 9; i++) {
      let x = Math.random() * s
      let y = Math.random() * s
      ctx.lineWidth = 1 + Math.random() * 2.4
      ctx.beginPath()
      ctx.moveTo(x, y)
      const segs = 5 + ((Math.random() * 6) | 0)
      for (let k = 0; k < segs; k++) {
        x += rnd(-46, 46); y += rnd(-46, 46)
        ctx.lineTo(x, y)
      }
      const hot = Math.random() < 0.5 ? '#ff5a1e' : '#ff9d2e'
      ctx.strokeStyle = hot
      ctx.globalAlpha = 0.85
      ctx.stroke()
      ctx.globalAlpha = 0.35
      ctx.lineWidth *= 2.6
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    speckle(ctx, s, 500, 0.5, 0.1)
  })

  CACHE = { concrete, dark, girder, hazard, accent, ground, puff, windowsDay, windowsNight, metalPanel, lava }
  return CACHE
}

/**
 * Clone a base texture for per-box tiling. Clones share the same canvas
 * source so the GPU only ever holds one copy of each map.
 * `sx/sy/sz` are the box dimensions — repeats approximate one tile per ~3.5 m.
 */
export function tiledClone (base, sx, sy, sz) {
  const t = base.clone()
  t.needsUpdate = true
  const longest = Math.max(sx, sy, sz)
  const shortest = Math.max(Math.min(sx, sy, sz), 0.001)
  // tile by the two dominant dimensions; thin plates get at least a full tile
  const r = Math.max(1, Math.round(longest / 3.5))
  const r2 = Math.max(1, Math.round(shortest / 3.5))
  t.repeat.set(r, r2)
  return t
}
