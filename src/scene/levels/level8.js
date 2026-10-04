/**
 * LEVEL 8 — "SKY LADDER" (vertical / the canyon wall).
 *
 * A 300 m cliff face is the course. Zig-zag hoop ladders carry you up the
 * first half, rock shelves jut out of the wall to hop over, three grapple
 * monoliths stand in front for rope-assisted climbing, waterfalls spill
 * down the face — and the target burns on the summit at the very top.
 *
 * Vertical, complex, bright morning canyon light.
 */

const hoopLadder = (items) => items.map(([x, y, z]) => ({ t: 'hoop', p: [x, y, z], r: 7 }))

// shelves: alternating rock steps sticking out of the cliff face
const shelf = (x, y, w) => ([
  [x, y, -124, w, 3.5, 30, 'dark'],
  [x, y + 1.9, -108.6, w, 0.4, 0.8, 'hazard']      // edge marker
])

const boxes = [
  // ---- canyon floor ----
  [0, -2, -10, 360, 4, 300, 'concrete'],
  // ---- launch meadow ----
  [0, 0.2, 100, 12, 0.4, 12, 'accent'],

  // ---- zone 1: warm-up gates (z = 55 / 40) ----
  [-10, 6, 55, 4, 12, 4, 'girder'],
  [10, 6, 55, 4, 12, 4, 'girder'],
  [0, 12.5, 55, 24, 1, 3, 'accent'],
  [-11, 7, 25, 4, 14, 4, 'girder'],
  [11, 7, 25, 4, 14, 4, 'girder'],
  [0, 14.5, 25, 26, 1, 3, 'accent'],

  // ---- zone 2: THE WALL (z -138 .. -182, top at y 298) ----
  [0, 148, -160, 420, 300, 44, 'dark'],
  // face buttresses — vertical ribs that break the wall up
  [-150, 148, -136, 10, 300, 5, 'concrete'],
  [-90, 148, -136, 8, 300, 4, 'concrete'],
  [-30, 148, -136, 10, 300, 5, 'concrete'],
  [30, 148, -136, 8, 300, 4, 'concrete'],
  [90, 148, -136, 10, 300, 5, 'concrete'],
  [150, 148, -136, 8, 300, 4, 'concrete'],

  // ---- zone 3: rock shelves (climb the steps over the ledges) ----
  ...shelf(-46, 62, 34),
  ...shelf(44, 96, 30),
  ...shelf(-42, 148, 32),
  ...shelf(46, 196, 28),

  // ---- zone 4: grapple monoliths in front of the wall ----
  [-38, 150, -60, 7, 300, 7, 'concrete'],
  [0, 150, -74, 7, 300, 7, 'concrete'],
  [38, 150, -60, 7, 300, 7, 'concrete'],
  [-38, 300.4, -60, 8.4, 0.6, 8.4, 'hazard'],
  [0, 300.4, -74, 8.4, 0.6, 8.4, 'hazard'],
  [38, 300.4, -60, 8.4, 0.6, 8.4, 'hazard'],

  // ---- zone 5: the summit (on the wall top, y 298) ----
  [0, 299.25, -160, 46, 2.5, 30, 'concrete'],      // landing deck
  [0, 301.6, -160, 12, 2, 12, 'girder'],           // target pedestal
  [0, 302.8, -160, 13, 0.4, 13, 'hazard'],
  [-24, 300.5, -150, 3, 5, 3, 'girder'],           // summit masts
  [24, 300.5, -170, 3, 5, 3, 'girder']
]

export const LEVEL_8 = {
  id: 'sky-ladder',
  name: 'SKY LADDER',
  subtitle: '天梯峡谷 · 纵向挑战',
  difficulty: 3,

  spawn: { x: 0, y: 10, z: 100, yaw: 0 },
  launchSpeed: 22,
  bounds: { minX: -170, maxX: 170, minZ: -250, maxZ: 170, maxY: 340, minY: -6 },
  menuFocus: [0, 150, -105],

  palette: {
    skyZenith: 0x86b8ea,
    skyHorizon: 0xf2efdf,
    skyGround: 0x8a7c64,
    fogColor: 0xe2e6da, fogNear: 70, fogFar: 660,
    sunColor: 0xfff6e6, sunIntensity: 2.8, sunOffset: [60, 95, 45],
    hemiSky: 0xf4f6ec, hemiGround: 0x7a6e58, hemiIntensity: 1.0,
    concrete: 0xc6b8a2, dark: 0xb0a08c, girder: 0x8a8478, accent: 0x27c9a8,
    mountain: 0xa8a292, cloud: 0xffffff, cloudOpacity: 0.7,
    ground: 0xb99a78, groundY: -2.05, shadowFrustum: 120,
    facade: 0xd8c8b0, trim: 0x6a5f50
  },

  boxes,

  buildings: [
    // base-camp village behind the launch meadow
    [-56, 62, 16, 14, 20, 1],
    [58, 48, 14, 14, 26, 0],
    [-52, 30, 18, 16, 12, 2, { rot: -0.5 }],
    [55, 12, 16, 14, 18, 0],
    [-120, 40, 20, 20, 40, 0, { far: true }],
    [118, -20, 22, 22, 52, 0, { far: true }]
  ],

  props: [
    // ---- the hoop ladders: zig-zag climb, then straight up the face ----
    ...hoopLadder([
      [-14, 34, -2], [14, 58, -28], [-14, 82, -54], [14, 106, -78],
      [-14, 130, -94], [14, 154, -102]
    ]),
    ...hoopLadder([
      [-16, 180, -106], [16, 204, -106], [-16, 228, -106], [16, 252, -106],
      [0, 274, -106]
    ]),
    // guidance rings up the first stretch
    { t: 'ring', p: [0, 14, 10] },
    { t: 'ring', p: [0, 20, -15] },
    // altitude halos around the grapple monolith row
    { t: 'halo', p: [0, 120, -64], r: 40 },
    { t: 'halo', p: [0, 220, -64], r: 40 },
    // ---- waterfalls spilling down the cliff face ----
    { t: 'waterfall', p: [-118, 148, -135.5], s: [12, 288] },
    { t: 'waterfall', p: [62, 150, -135.5], s: [9, 290] },
    { t: 'waterfall', p: [158, 144, -135.5], s: [13, 284] },
    // ---- dressing ----
    { t: 'containers', p: [-30, 0, 40], stacks: 3, gap: 8, rot: 0.15 },
    { t: 'containers', p: [26, 0, 62], stacks: 2, gap: 8, rot: -0.2 },
    { t: 'crate', p: [-8, 0.8, 96] },
    { t: 'crate', p: [-9.6, 0.8, 97.2] },
    { t: 'barrier', p: [-6, 0.6, 108] },
    { t: 'barrier', p: [6, 0.6, 108] },
    { t: 'lightpole', p: [-18, 0, 84], h: 9 },
    { t: 'lightpole', p: [18, 0, 60], h: 9 },
    { t: 'antenna', p: [-24, 301.75, -150] },
    { t: 'antenna', p: [24, 301.75, -170] },
    { t: 'rock', p: [-70, 0, -20], s: [7, 12] },
    { t: 'rock', p: [72, 0, 30], s: [6, 10] },
    { t: 'rock', p: [-80, 0, 70], s: [8, 14] }
  ],

  target: { p: [0, 304.8, -160], r: 2.4 }
}
