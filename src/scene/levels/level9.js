/**
 * LEVEL 9 — "ORBITAL SPIRE" (vertical / the space-elevator mast).
 *
 * The final exam, straight up: a 350 m tapered mast ringed with cantilevered
 * maintenance arms to weave through, glowing altitude halos every 45 m, and
 * a halo of floating sky-platforms (grapple anchors, window towers and all)
 * orbiting the climb. Thread the very tip and the target to finish.
 *
 * Vertical, complex, high-altitude bright blue.
 */

const SZ = -90 // spire centre z

// tapered mast: 14 stacked segments, rotated 0/45 deg for an octagonal read
const SEG_W = [40, 36, 33, 30, 27, 24, 21, 18, 15, 12, 10, 8, 6, 5]
const SEG_H = 25
const mast = SEG_W.map((w, i) =>
  [0, i * SEG_H + SEG_H / 2, SZ, w, SEG_H, w, i % 2 ? 'dark' : 'concrete',
    [0, i % 2 ? Math.PI / 4 : 0, 0]])

// cantilevered arms: two opposite radial beams at each altitude
const ARMS = [55, 85, 115, 145, 175, 205, 235, 265, 295]
const arms = ARMS.flatMap((y, i) => {
  const a = i * 0.7 // arms rotate as you climb -> forced spiral
  const out = []
  for (const dir of [0, Math.PI]) {
    const ang = a + dir
    out.push([
      Math.cos(ang) * 17, y, SZ + Math.sin(ang) * 17,
      24, 2.5, 2.5, 'girder', [0, -ang, 0]
    ])
    // tip counterweight
    out.push([
      Math.cos(ang) * 27, y, SZ + Math.sin(ang) * 27,
      3.4, 3.4, 3.4, 'hazard'
    ])
  }
  return out
})

// floating platforms: slabs orbiting the spire (grapple anchors + skyline)
const PLATS = [
  [64, 80, -46, 30, 24], [-70, 120, -134, 26, 20], [58, 165, -140, 28, 22],
  [-64, 210, -52, 26, 20], [66, 255, -120, 30, 22], [-58, 300, -84, 26, 20]
]
const platforms = PLATS.map(([x, y, z, w, d], i) => ([
  [x, y, z, w, 3, d, 'dark'],
  [x, y + 1.7, z, w - 6, 0.4, d - 6, 'hazard']
]))

const boxes = [
  // ---- base plaza ----
  [0, -2, SZ, 340, 4, 340, 'concrete'],
  [0, 0.2, 20, 12, 0.4, 12, 'accent'],

  // ---- the mast ----
  ...mast,
  // mast foot: hazard plinth ring
  [0, 1.2, SZ, 50, 2.4, 50, 'hazard'],

  // ---- the arms (with counterweights) ----
  ...arms,

  // ---- floating platforms ----
  ...platforms.flat(),

  // ---- the tip: hazard deck + pedestal ----
  [0, 351.2, SZ, 13, 2.4, 13, 'accent'],
  [0, 353.6, SZ, 5, 2.4, 5, 'girder']
]

export const LEVEL_9 = {
  id: 'orbital-spire',
  name: 'ORBITAL SPIRE',
  subtitle: '轨道尖峰 · 纵向大师',
  difficulty: 3,

  spawn: { x: 0, y: 10, z: 20, yaw: 0 },
  launchSpeed: 22,
  bounds: { minX: -150, maxX: 150, minZ: -290, maxZ: 150, maxY: 400, minY: -8 },
  menuFocus: [0, 170, SZ],

  palette: {
    skyZenith: 0x5f9fe8,
    skyHorizon: 0xf0f6fc,
    skyGround: 0x8c96a2,
    fogColor: 0xdde9f4, fogNear: 80, fogFar: 700,
    sunColor: 0xffffff, sunIntensity: 2.9, sunOffset: [50, 100, 40],
    hemiSky: 0xf4f8fd, hemiGround: 0x8a94a0, hemiIntensity: 1.05,
    concrete: 0xbcc4d0, dark: 0x9aa6b4, girder: 0x74808c, accent: 0xffb02e,
    mountain: 0x9aa6b4, cloud: 0xffffff, cloudOpacity: 0.8,
    ground: 0x9aa8b4, groundY: -2.05, shadowFrustum: 120,
    facade: 0xc4cee0, trim: 0x565e68
  },

  boxes,

  buildings: [
    // base industrial ring
    [-58, -30, 16, 14, 30, 0],
    [58, -40, 18, 16, 44, 0],
    [-62, -140, 18, 14, 26, 1],
    [60, -150, 16, 16, 38, 0],
    [-52, -170, 20, 16, 14, 2, { rot: 0.5 }],
    [54, -175, 16, 16, 22, 0],
    [-116, -70, 20, 20, 56, 0, { far: true }],
    [118, -120, 22, 22, 66, 0, { far: true }],
    // window towers standing ON the floating platforms (sky-city dressing)
    [64, -46, 10, 10, 22, 0, { y: 81.5 }],
    [-70, -134, 9, 9, 18, 0, { y: 121.5 }],
    [58, -140, 10, 10, 24, 0, { y: 166.5 }],
    [-64, -52, 9, 9, 20, 0, { y: 211.5 }],
    [66, -120, 10, 10, 26, 0, { y: 256.5 }],
    [-58, -84, 9, 9, 18, 0, { y: 301.5 }]
  ],

  props: [
    // altitude halos up the mast
    { t: 'halo', p: [0, 45, SZ], r: 30 },
    { t: 'halo', p: [0, 90, SZ], r: 30 },
    { t: 'halo', p: [0, 135, SZ], r: 30 },
    { t: 'halo', p: [0, 180, SZ], r: 30 },
    { t: 'halo', p: [0, 225, SZ], r: 30 },
    { t: 'halo', p: [0, 270, SZ], r: 30 },
    { t: 'halo', p: [0, 315, SZ], r: 30 },
    // approach rings on the opening straight
    { t: 'ring', p: [0, 14, 42] },
    { t: 'ring', p: [0, 22, 2] },
    { t: 'ring', p: [0, 34, -38] },
    // tip dressing
    { t: 'antenna', p: [0, 354.8, SZ] },
    { t: 'ring', p: [0, 344, SZ] },
    // base dressing
    { t: 'containers', p: [-34, 0, -20], stacks: 3, gap: 8, rot: 0.2 },
    { t: 'containers', p: [36, 0, -30], stacks: 2, gap: 8, rot: -0.15 },
    { t: 'crate', p: [-8, 0.8, 40] },
    { t: 'crate', p: [-9.6, 0.8, 41.2] },
    { t: 'lightpole', p: [-18, 0, 6], h: 9 },
    { t: 'lightpole', p: [18, 0, -14], h: 9 },
    { t: 'barrier', p: [-6, 0.6, 30] },
    { t: 'barrier', p: [6, 0.6, 30] },
    { t: 'shard', p: [-40, 0, -70], s: [2.2, 9], c: 0xbfe2f2, glow: true },
    { t: 'shard', p: [42, 0, -110], s: [2.6, 12], c: 0xbfe2f2, glow: true }
  ],

  target: { p: [0, 357.4, SZ], r: 2.4 }
}
