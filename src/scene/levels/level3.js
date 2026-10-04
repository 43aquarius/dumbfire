/**
 * LEVEL 3 — "SKY GAUNTLET" (dusk / floating islands above an abyss).
 *
 * A chain of floating platforms with real gaps: launch island -> hop chain ->
 * beam bridge -> central monolith (grapple swing) -> pumphouse fly-through ->
 * stepping stones across the void -> final island with the antenna target.
 *
 * Falling is a crash. The grapple is not optional here.
 * Missile flies toward -Z.
 */
export const LEVEL_3 = {
  id: 'sky-gauntlet',
  name: 'SKY GAUNTLET',
  subtitle: '天空回廊 · 无底深渊',
  difficulty: 3,

  spawn: { x: 0, y: 27, z: 50, yaw: 0 },
  launchSpeed: 24,
  bounds: { minX: -80, maxX: 80, minZ: -320, maxZ: 100, maxY: 140, minY: 2 },
  menuFocus: [0, 26, -60],

  palette: {
    skyZenith: 0x232a4d,
    skyHorizon: 0xd77a6a,
    skyGround: 0x1c1830,
    fogColor: 0x4a4266, fogNear: 40, fogFar: 480,
    sunColor: 0xff8866, sunIntensity: 1.6, sunOffset: [0.7, 0.2, -0.4],
    hemiSky: 0x8a7ab8, hemiGround: 0x302840, hemiIntensity: 0.8,
    concrete: 0x8a8fa8, dark: 0x6a7088, girder: 0x565e75, accent: 0x35c9d9,
    mountain: 0x3a3a55, cloud: 0x9a86c0, cloudOpacity: 0.4,
    ground: 0x35304a, groundY: -72
  },

  boxes: [
    // ---- start island ----
    [0, 20, 48, 18, 4, 20, 'concrete'],
    [0, 21.9, 48, 12, 0.3, 14, 'accent'],

    // ---- island 2 (low hop) ----
    [0, 16, 4, 14, 4, 14, 'concrete'],

    // ---- island 3 (drift right) ----
    [13, 20, -28, 12, 4, 12, 'concrete'],
    [13, 21.9, -28, 8, 0.3, 8, 'accent'],

    // ---- island 4 (tower block, grapple-friendly edge) ----
    [-13, 24, -62, 12, 4, 12, 'concrete'],
    [-13, 30, -62, 7, 8, 7, 'dark'],

    // ---- beam bridge toward the monolith (grapple rail) ----
    [-13, 29, -92, 1.6, 1.6, 36, 'girder'],

    // ---- central monolith: the big swing anchor ----
    [0, 24, -118, 10, 48, 10, 'dark'],
    [0, 47.6, -118, 12, 1, 12, 'hazard'],

    // ---- island 5 ----
    [-16, 20, -144, 14, 4, 14, 'concrete'],

    // ---- island 6: pumphouse fly-through (passage x [6,14], y [26,32]) ----
    [10, 24, -176, 14, 4, 16, 'concrete'],
    [10, 29.5, -181, 9, 7, 1, 'dark'],              // back wall
    [5.5, 29, -176, 1, 6, 8, 'dark'],               // left wall
    [14.5, 29, -176, 1, 6, 8, 'dark'],               // right wall
    [10, 32.6, -176, 11, 1.2, 9, 'dark'],            // roof
    [10, 26.2, -170.6, 9, 0.6, 0.6, 'hazard'],      // front marker

    // ---- stepping stones across the void ----
    [0, 27, -200, 3, 2, 3, 'dark'],
    [-7, 25, -212, 3, 2, 3, 'dark'],
    [5, 27, -224, 3, 2, 3, 'dark'],

    // ---- final island + antenna target ----
    [0, 22, -258, 24, 6, 24, 'concrete'],
    [0, 23.9, -258, 16, 0.3, 16, 'accent'],
    [0, 37, -258, 3, 24, 3, 'dark']                 // mast, top at y = 49
  ],

  props: [
    // under-island rock chunks (visual anchors for the floating platforms)
    { t: 'rock', p: [0, 15, 48], s: [7, 7], flip: true },
    { t: 'rock', p: [0, 11, 4], s: [6, 6], flip: true },
    { t: 'rock', p: [13, 15, -28], s: [5, 5], flip: true },
    { t: 'rock', p: [-13, 19, -62], s: [5, 5], flip: true },
    { t: 'rock', p: [0, -1, -118], s: [6, 9], flip: true },
    { t: 'rock', p: [-16, 15, -144], s: [6, 6], flip: true },
    { t: 'rock', p: [10, 19, -176], s: [6, 6], flip: true },
    { t: 'rock', p: [0, 17, -258], s: [9, 9], flip: true },

    // guidance rings (visual only) along the intended line
    { t: 'ring', p: [0, 27, 26] },
    { t: 'ring', p: [6, 23, -44] },
    { t: 'ring', p: [-4, 27, -100] },
    { t: 'ring', p: [-2, 29, -198] },

    // dressing
    { t: 'antenna', p: [8, 22, 55] },
    { t: 'antenna', p: [-10, 21.9, -150] },
    { t: 'crate', p: [4, 23.6, 52] },
    { t: 'crate', p: [-6, 18.1, 7] },
    { t: 'pipe', p: [10, 33.5, -177], len: 7, axis: 'x' },
    { t: 'vent', p: [-13, 33, -59.4] },
    { t: 'barrier', p: [0, 22.4, 37] }
  ],

  target: { p: [0, 51.8, -258], r: 2.4 }
}
