/**
 * LEVEL 3 — "SKY GAUNTLET" (dusk / floating islands above an abyss).
 *
 * Part one: launch island -> hop chain -> beam bridge -> central monolith
 * (grapple swing) -> pumphouse fly-through -> stepping stones. Part two:
 * suspension bridge (swing under the deck) -> split-path islands -> hoop
 * gate gauntlet -> helix climb around a spire -> final sky citadel with
 * the antenna target.
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
  bounds: { minX: -110, maxX: 110, minZ: -620, maxZ: 100, maxY: 170, minY: 2 },
  menuFocus: [0, 26, -120],

  palette: {
    skyZenith: 0x232a4d,
    skyHorizon: 0xd77a6a,
    skyGround: 0x1c1830,
    fogColor: 0x4a4266, fogNear: 40, fogFar: 480,
    sunColor: 0xff8866, sunIntensity: 1.6, sunOffset: [0.7, 0.2, -0.4],
    hemiSky: 0x8a7ab8, hemiGround: 0x302840, hemiIntensity: 0.8,
    concrete: 0x8a8fa8, dark: 0x6a7088, girder: 0x565e75, accent: 0x35c9d9,
    mountain: 0x3a3a55, cloud: 0x9a86c0, cloudOpacity: 0.4,
    ground: 0x35304a, groundY: -72,
    facade: 0x6a7288, trim: 0x3a4152, windowsNight: true
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

    // ---- island 6: pumphouse fly-through ----
    [10, 24, -176, 14, 4, 16, 'concrete'],
    [10, 29.5, -181, 9, 7, 1, 'dark'],
    [5.5, 29, -176, 1, 6, 8, 'dark'],
    [14.5, 29, -176, 1, 6, 8, 'dark'],
    [10, 32.6, -176, 11, 1.2, 9, 'dark'],
    [10, 26.2, -170.6, 9, 0.6, 0.6, 'hazard'],

    // ---- stepping stones across the void ----
    [0, 27, -200, 3, 2, 3, 'dark'],
    [-7, 25, -212, 3, 2, 3, 'dark'],
    [5, 27, -224, 3, 2, 3, 'dark'],

    // ---- waypoint island (was the finish; now mid-route) ----
    [0, 22, -258, 24, 6, 24, 'concrete'],
    [0, 23.9, -258, 16, 0.3, 16, 'accent'],
    [0, 37, -258, 3, 24, 3, 'dark'],

    // ---- EXTENSION: suspension bridge (z = -280 .. -320) ----
    // towers + deck: swing UNDER the deck, or ride over it
    [-9, 30, -286, 2.5, 20, 2.5, 'girder'],
    [9, 30, -286, 2.5, 20, 2.5, 'girder'],
    [0, 39.6, -286, 22, 1.2, 3, 'hazard'],
    [-9, 30, -314, 2.5, 20, 2.5, 'girder'],
    [9, 30, -314, 2.5, 20, 2.5, 'girder'],
    [0, 39.6, -314, 22, 1.2, 3, 'hazard'],
    [0, 20.6, -300, 44, 1.2, 10, 'dark'],           // the deck itself
    [0, 21.4, -300, 38, 0.4, 8, 'accent'],          // road stripe

    // ---- split path (z = -345): upper chain (y 32) or lower chain (y 15) ----
    // upper: floating slabs with lit rail
    [-14, 32, -342, 10, 1.5, 10, 'concrete'],
    [-14, 34, -356, 8, 1.5, 8, 'concrete'],
    [-14, 36, -370, 10, 1.5, 10, 'concrete'],
    // lower: wide shelf under them
    [-14, 15, -350, 26, 3, 30, 'dark'],
    [-14, 16.7, -350, 18, 0.4, 22, 'accent'],
    // central divider wall forces the choice
    [6, 24, -356, 10, 40, 34, 'dark'],

    // ---- hoop gate gauntlet (z = -400 .. -430) — props with colliders ----

    // ---- helix climb (z = -478): corkscrew girders rising around the spire ----
    [0, 26, -478, 7, 40, 7, 'dark'],
    [0, 46.6, -478, 8, 1, 8, 'hazard'],
    [11.0, 20.0, -478.0, 10, 1.5, 4, 'girder', [0, 1.5708, 0]],
    [7.8, 23.4, -470.2, 10, 1.5, 4, 'girder', [0, 2.3562, 0]],
    [0.0, 26.8, -467.0, 10, 1.5, 4, 'girder', [0, 3.1416, 0]],
    [-7.8, 30.2, -470.2, 10, 1.5, 4, 'girder', [0, 3.9270, 0]],
    [-11.0, 33.6, -478.0, 10, 1.5, 4, 'girder', [0, 4.7124, 0]],
    [-7.8, 37.0, -485.8, 10, 1.5, 4, 'girder', [0, 5.4978, 0]],
    [0.0, 40.4, -489.0, 10, 1.5, 4, 'girder', [0, 6.2832, 0]],
    [7.8, 43.8, -485.8, 10, 1.5, 4, 'girder', [0, 0.7854, 0]],

    // ---- final sky citadel (z = -540) ----
    [0, 26, -540, 34, 8, 34, 'concrete'],
    [0, 30.4, -540, 26, 0.4, 26, 'accent'],
    [0, 36, -540, 20, 4, 20, 'dark'],              // citadel base
    [0, 44, -540, 14, 12, 14, 'dark'],             // citadel keep
    [0, 50.4, -540, 15, 1, 15, 'hazard'],
    [0, 56, -540, 8, 10, 8, 'dark'],               // top tier
    [0, 61.2, -540, 9, 0.6, 9, 'accent'],
    [0, 68, -540, 2.4, 14, 2.4, 'dark']            // target mast, top y = 75
  ],

  // [x, z, w, d, h, style, opts] — dusk towers floating far off the route
  buildings: [
    [-58, -180, 14, 14, 44, 0, { y: 10 }],
    [58, -260, 16, 16, 52, 0, { y: 6 }],
    [-60, -350, 14, 14, 40, 0, { y: 14 }],
    [56, -430, 18, 14, 58, 0, { y: 4 }],
    [-52, -500, 16, 16, 48, 0, { y: 8 }],
    [60, -545, 14, 14, 40, 0, { y: 10 }],
    // far silhouettes
    [-95, -300, 20, 20, 66, 0, { far: true, y: 0 }],
    [95, -380, 22, 22, 74, 0, { far: true, y: 0 }],
    [-92, -470, 18, 18, 58, 0, { far: true, y: 0 }],
    [96, -560, 20, 20, 62, 0, { far: true, y: 0 }]
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
    { t: 'rock', p: [0, 20, -540], s: [14, 12], flip: true },
    { t: 'rock', p: [-14, 12, -350], s: [7, 5], flip: true },

    // guidance rings (visual only) along the intended line
    { t: 'ring', p: [0, 27, 26] },
    { t: 'ring', p: [6, 23, -44] },
    { t: 'ring', p: [-4, 27, -100] },
    { t: 'ring', p: [-2, 29, -198] },
    { t: 'ring', p: [0, 26, -232] },
    { t: 'ring', p: [-14, 28, -320] },
    { t: 'ring', p: [-14, 38, -378] },
    { t: 'ring', p: [0, 42, -478] },
    { t: 'ring', p: [0, 66, -530] },

    // HOOP GATES with colliders — thread them all
    { t: 'hoop', p: [0, 28, -400], r: 7 },
    { t: 'hoop', p: [4, 31, -412], r: 6.5 },
    { t: 'hoop', p: [-4, 27, -424], r: 6 },

    // dressing
    { t: 'antenna', p: [8, 22, 55] },
    { t: 'antenna', p: [-10, 21.9, -150] },
    { t: 'antenna', p: [0, 62, -540] },
    { t: 'crate', p: [4, 23.6, 52] },
    { t: 'crate', p: [-6, 18.1, 7] },
    { t: 'pipe', p: [10, 33.5, -177], len: 7, axis: 'x' },
    { t: 'vent', p: [-13, 33, -59.4] },
    { t: 'barrier', p: [0, 22.4, 37] },
    { t: 'vent', p: [8, 25.4, -286] },
    { t: 'vent', p: [-8, 25.4, -314] }
  ],

  target: { p: [0, 76.4, -540], r: 2.4 }
}
