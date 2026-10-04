/**
 * LEVEL 7 — "TOWER ASCENT" (vertical / the boring tower, un-bored).
 *
 * A VERTICAL course: launch into the mega-tower's ground-floor doorway,
 * then climb 220 m by threading the offset hole in each stacked slab
 * (the holes alternate left / right / front / back, so the climb weaves).
 * Corner pillars carry the eye up; balcony rails ring every slab. Top it
 * off by threading the crown hole and tagging the target on the roof.
 *
 * Vertical, bright, steel-blue daylight.
 */

const TX = 23          // tower half-width
const TZ = -60         // tower centre z
const TH = 2.5         // slab thickness
const HH = 8           // hole half-size (16 m square holes)
const FLOORS = [26, 50, 74, 98, 122, 146, 170, 194, 218]
const HOLES = [[10, 0], [-10, 0], [0, 10], [0, -10]]

/** Four slab segments covering the floor except a 16x16 hole at (hx, hz). */
const slabWithHole = (y, hx, hz) => {
  const segs = []
  const wl = (hx - HH) + TX
  if (wl > 0.5) segs.push([(-TX + hx - HH) / 2, y, TZ, wl, TH, 46, 'dark'])
  const el = TX - (hx + HH)
  if (el > 0.5) segs.push([(hx + HH + TX) / 2, y, TZ, el, TH, 46, 'dark'])
  const sl = (hz - HH) + TX
  if (sl > 0.5) segs.push([hx, y, (-TX + hz - HH) / 2 + TZ, 2 * HH, TH, sl, 'dark'])
  const nl = TX - (hz + HH)
  if (nl > 0.5) segs.push([hx, y, (hz + HH + TX) / 2 + TZ, 2 * HH, TH, nl, 'dark'])
  return segs
}

/** Bright hazard frame sitting on the slab around the hole. */
const holeFrame = (y, hx, hz) => ([
  [hx, y + TH / 2 + 0.3, hz - HH - 0.35 + TZ, 2 * HH + 1.6, 0.55, 0.7, 'hazard'],
  [hx, y + TH / 2 + 0.3, hz + HH + 0.35 + TZ, 2 * HH + 1.6, 0.55, 0.7, 'hazard'],
  [hx - HH - 0.35, y + TH / 2 + 0.3, hz + TZ, 0.7, 0.55, 2 * HH + 1.6, 'hazard'],
  [hx + HH + 0.35, y + TH / 2 + 0.3, hz + TZ, 0.7, 0.55, 2 * HH + 1.6, 'hazard']
])

/** Balcony rail ringing a slab's outer edge (reads as a stacked tower). */
const rail = (y) => ([
  [0, y + TH / 2 + 0.5, TZ - TX - 0.4, 2 * TX + 2.2, 1.0, 0.8, 'girder'],
  [0, y + TH / 2 + 0.5, TZ + TX + 0.4, 2 * TX + 2.2, 1.0, 0.8, 'girder'],
  [-TX - 0.4, y + TH / 2 + 0.5, TZ, 0.8, 1.0, 2 * TX + 0.6, 'girder'],
  [TX + 0.4, y + TH / 2 + 0.5, TZ, 0.8, 1.0, 2 * TX + 0.6, 'girder']
])

const boxes = [
  // ---- plaza ground ----
  [0, -2, -50, 320, 4, 340, 'concrete'],
  // ---- launch pad facing the doorway ----
  [0, 0.2, 25, 12, 0.4, 12, 'accent'],

  // ---- ground floor walls with the entry doorway (front, z = -37) ----
  [-16, 12.5, -37, 14, 25, 2.5, 'dark'],
  [16, 12.5, -37, 14, 25, 2.5, 'dark'],
  [0, 22.5, -37, 18, 5, 2.5, 'dark'],
  [-23, 12.5, -60, 2.5, 25, 46, 'dark'],           // side walls
  [23, 12.5, -60, 2.5, 25, 46, 'dark'],
  [0, 12.5, -83, 46, 25, 2.5, 'dark'],             // back wall
  [-9.7, 12.5, -36.2, 0.6, 25, 0.5, 'hazard'],      // door jambs
  [9.7, 12.5, -36.2, 0.6, 25, 0.5, 'hazard'],
  [0, 20.4, -36.2, 19.6, 0.6, 0.5, 'hazard'],       // door header

  // ---- corner pillars (full height) ----
  [-21.5, 127, -83.5, 4, 254, 4, 'concrete'],
  [21.5, 127, -83.5, 4, 254, 4, 'concrete'],
  [-21.5, 127, -36.5, 4, 254, 4, 'concrete'],
  [21.5, 127, -36.5, 4, 254, 4, 'concrete'],

  // ---- climbing floors: 8 holed slabs + hazard frames + rails ----
  ...FLOORS.slice(0, 8).flatMap((y, i) => [
    ...slabWithHole(y, ...HOLES[i % 4]),
    ...holeFrame(y, ...HOLES[i % 4]),
    ...rail(y)
  ]),

  // ---- the crown (y 228): ring slab with a centre hole, then open air ----
  ...slabWithHole(228, 0, 0),
  ...holeFrame(228, 0, 0),
  ...rail(228),

  // ---- roof deck furniture ----
  [0, 229.5, -60, 6, 0.5, 6, 'accent'],
  [0, 231.2, -60, 3, 3, 3, 'girder']                  // target pedestal
]

export const LEVEL_7 = {
  id: 'tower-ascent',
  name: 'TOWER ASCENT',
  subtitle: '峻塔攀升 · 纵向爬升',
  difficulty: 2,

  spawn: { x: 0, y: 10, z: 25, yaw: 0 },
  launchSpeed: 22,
  bounds: { minX: -140, maxX: 140, minZ: -210, maxZ: 140, maxY: 310, minY: -6 },
  menuFocus: [0, 125, -60],

  palette: {
    skyZenith: 0x8ab8ec,
    skyHorizon: 0xeaf1f6,
    skyGround: 0x79806e,
    fogColor: 0xd8e4ec, fogNear: 70, fogFar: 640,
    sunColor: 0xfff4e2, sunIntensity: 2.8, sunOffset: [55, 95, 30],
    hemiSky: 0xf0f6fc, hemiGround: 0x66705e, hemiIntensity: 1.05,
    concrete: 0xb2bac2, dark: 0x98a2ac, girder: 0x74808c, accent: 0xff8a3c,
    mountain: 0x8a96a2, cloud: 0xffffff, cloudOpacity: 0.62,
    ground: 0x9aa892, groundY: -2.05, shadowFrustum: 120,
    facade: 0xb6c0ca, trim: 0x545a62
  },

  boxes,

  buildings: [
    // ---- plaza neighbours (grapple-able if you bail out of the tower) ----
    [-62, -12, 18, 16, 40, 0],
    [62, -22, 20, 16, 56, 0],
    [-66, -85, 16, 14, 32, 1],
    [64, -100, 18, 14, 48, 0],
    [-60, -130, 16, 16, 26, 2, { rot: 0.4 }],
    [66, -140, 14, 14, 36, 0],
    [-110, -60, 20, 20, 64, 0, { far: true }],
    [112, -80, 22, 22, 78, 0, { far: true }],
    [-116, -140, 18, 18, 52, 0, { far: true }]
  ],

  props: [
    // guidance rings under each floor hole (the intended weave)
    ...FLOORS.slice(0, 8).map((y, i) =>
      ({ t: 'ring', p: [HOLES[i % 4][0], y - 7, HOLES[i % 4][1] + TZ] })),
    { t: 'ring', p: [0, 220, TZ] },                    // crown hole approach
    // halos ringing the tower mark your altitude from outside
    { t: 'halo', p: [0, 70, TZ], r: 34 },
    { t: 'halo', p: [0, 130, TZ], r: 34 },
    { t: 'halo', p: [0, 190, TZ], r: 34 },
    // rooftop dressing
    { t: 'antenna', p: [8, 229.75, -68] },
    { t: 'antenna', p: [-8, 229.75, -52] },
    { t: 'vent', p: [12, 229.9, -54] },
    { t: 'vent', p: [-12, 229.9, -66] },
    // plaza dressing
    { t: 'containers', p: [-36, 0, -6], stacks: 2, gap: 8, rot: 0.2 },
    { t: 'containers', p: [34, 0, -16], stacks: 3, gap: 8, rot: -0.1 },
    { t: 'crate', p: [-6, 0.8, 14] },
    { t: 'crate', p: [-7.6, 0.8, 15.2] },
    { t: 'lightpole', p: [-16, 0, 30], h: 9 },
    { t: 'lightpole', p: [16, 0, 8], h: 9 },
    { t: 'barrier', p: [-8, 0.6, 32] },
    { t: 'barrier', p: [8, 0.6, 32] }
  ],

  target: { p: [0, 235.2, -60], r: 2.4 }
}
