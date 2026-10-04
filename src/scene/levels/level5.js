/**
 * LEVEL 5 — "GLACIER RUN" (arctic noon / crystal desert of ice).
 *
 * Glacier tongue: frozen gates -> crevasse leaps (the floor falls away)
 * -> the ice cave -> frozen arch with hanging icicles -> crevasse bowl
 * with a grapple monolith -> shard forest -> the caldera, where the
 * target burns cold on an ice spire.
 *
 * Missile flies toward -Z.
 */
export const LEVEL_5 = {
  id: 'glacier-run',
  name: 'GLACIER RUN',
  subtitle: '冰河回旋 · 极昼裂谷',
  difficulty: 3,

  spawn: { x: 0, y: 10, z: 58, yaw: 0 },
  launchSpeed: 24,
  bounds: { minX: -110, maxX: 110, minZ: -380, maxZ: 110, maxY: 130, minY: -22 },
  menuFocus: [0, 12, -130],

  palette: {
    skyZenith: 0x9ec8e8,
    skyHorizon: 0xeaf3f8,
    skyGround: 0xcfd8dc,
    fogColor: 0xdbe6ec, fogNear: 55, fogFar: 600,
    sunColor: 0xffffff, sunIntensity: 2.8, sunOffset: [45, 75, 40],
    hemiSky: 0xf2f7fb, hemiGround: 0xc8d2d8, hemiIntensity: 1.0,
    concrete: 0xcfd8de, dark: 0xb4c2cc, girder: 0x8fa2b0, accent: 0x2ea8c9,
    mountain: 0xd6e0e8, cloud: 0xffffff, cloudOpacity: 0.72,
    ground: 0xe4ebf0, groundY: -2.05,
    facade: 0xd8e2ea, trim: 0x8a98a4
  },

  boxes: [
    // ---- glacier tongue: main floor with two crevasses carved out ----
    [0, -2, 30, 180, 4, 150, 'concrete'],            // z +105 .. -45
    [0, -14, -62, 180, 4, 34, 'concrete'],            // crevasse 1 floor, top y=-12
    [0, -2, -105, 180, 4, 52, 'concrete'],            // z -79 .. -105
    [0, -16, -135, 180, 4, 34, 'concrete'],           // crevasse 2 floor
    [0, -2, -180, 190, 4, 56, 'concrete'],           // z -152 .. -208
    [0, -2, -300, 200, 4, 120, 'concrete'],          // caldera approach z -240..-360
    // crevasse walls (cliff faces between levels)
    [0, -8, -45, 180, 12, 2, 'dark'],
    [0, -8, -79, 180, 12, 2, 'dark'],
    [0, -9, -118, 180, 14, 2, 'dark'],
    [0, -9, -152, 180, 14, 2, 'dark'],

    // ---- zone 1: frozen gates (z = 25) ----
    [-10, 6, 25, 4, 12, 4, 'girder'],
    [10, 6, 25, 4, 12, 4, 'girder'],
    [0, 12.5, 25, 24, 1, 3, 'accent'],

    // ---- zone 2: ice fin slalom (z = 0 .. -35) ----
    [-6, 6, -5, 4, 12, 5, 'dark', [0, 0.2, 0]],
    [7, 7, -18, 4, 14, 5, 'dark', [0, -0.3, 0]],
    [-7, 6, -32, 4, 12, 5, 'dark', [0, 0.25, 0]],

    // ---- zone 3: crevasse 1 (z = -45 .. -79): leap the gap ----
    // bridge fragments partway — bouncing points if you drop low
    [-8, -9, -55, 8, 1.2, 4, 'girder', [0, 0.3, 0]],
    [8, -10, -68, 8, 1.2, 4, 'girder', [0, -0.25, 0]],

    // ---- zone 4: the ice cave (z = -85 .. -112): passage x [-7,7], y [2,12] ----
    [0, 1, -98, 22, 2, 28, 'dark'],
    [-9, 7, -98, 4, 10, 28, 'dark'],
    [9, 7, -98, 4, 10, 28, 'dark'],
    [0, 13.5, -98, 22, 3, 28, 'dark'],
    [0, 12.2, -85, 14, 0.7, 0.7, 'hazard'],

    // ---- zone 5: crevasse 2 + frozen arch (z = -118 .. -152) ----
    [-8, 8, -158, 5, 16, 5, 'dark'],                  // arch pillars
    [8, 8, -158, 5, 16, 5, 'dark'],
    [0, 16.5, -158, 22, 2.5, 5, 'dark'],
    // stepping ice blocks across the second crevasse
    [-6, -6, -124, 4, 1.5, 4, 'dark'],
    [6, -8, -132, 4, 1.5, 4, 'dark'],
    [-5, -10, -142, 4, 1.5, 4, 'dark'],

    // ---- zone 6: crevasse bowl (z = -170 .. -200): grapple monolith ----
    [-40, 8, -185, 26, 16, 26, 'dark'],
    [40, 8, -185, 26, 16, 26, 'dark'],
    [10, 12, -185, 6, 24, 6, 'concrete'],
    [10, 24.4, -185, 7, 0.8, 7, 'hazard'],

    // ---- zone 7: shard forest (z = -225 .. -275) — shards as props ----

    // ---- zone 8: the caldera (z = -300 .. -355): ringed wall, one mouth ----
    [-46, 14, -325, 26, 28, 52, 'dark'],
    [46, 14, -325, 26, 28, 52, 'dark'],
    [0, 22, -352, 90, 44, 14, 'dark'],
    // target spire
    [0, 9, -318, 8, 18, 8, 'concrete'],
    [0, 18.4, -318, 9, 0.5, 9, 'hazard']
  ],

  // [x, z, w, d, h, style, opts]
  buildings: [
    // research station on the flank
    [-62, 10, 16, 12, 9, 2, { rot: 0.2 }],
    [64, -30, 14, 12, 8, 2, { rot: -0.3 }],
    [-60, -140, 14, 12, 10, 1, { rot: 0.1 }],
    [62, -220, 16, 12, 9, 1, { rot: -0.15 }],
    [-58, -300, 3.2, 3.2, 16, 3],
    [60, -330, 3.2, 3.2, 14, 3]
  ],

  props: [
    // zone 2 + dressing: ice shards (some collidable)
    { t: 'shard', p: [-14, 4, -10], s: [2.2, 14], c: 0xbfe6f2, col: true },
    { t: 'shard', p: [16, 5, -20], s: [2.6, 16], c: 0xbfe6f2, col: true },
    { t: 'shard', p: [-18, 3, 30], s: [1.8, 10], c: 0xd0ecf6, col: true },
    { t: 'shard', p: [20, 4, 8], s: [2.0, 12], c: 0xbfe6f2, col: true },
    // hanging icicles under the arch and cave roof
    { t: 'shard', p: [-4, 14, -158], s: [1.2, 6], c: 0xd8eef8, flip: true, tilt: 0.2 },
    { t: 'shard', p: [3, 14, -160], s: [1.4, 7], c: 0xd8eef8, flip: true, tilt: -0.15 },
    { t: 'shard', p: [0, 13, -98], s: [1.1, 5], c: 0xd8eef8, flip: true },
    // zone 6 bowl crystals
    { t: 'shard', p: [-28, 2, -185], s: [2.4, 12], c: 0xbfe6f2, col: true, glow: true },
    { t: 'shard', p: [28, 3, -178], s: [2.0, 10], c: 0xbfe6f2, col: true, glow: true },
    // zone 7: the shard forest (dense, collidable)
    { t: 'shard', p: [-12, 5, -228], s: [2.2, 16], c: 0xa8dcf0, col: true, glow: true },
    { t: 'shard', p: [10, 6, -234], s: [2.6, 18], c: 0xa8dcf0, col: true, glow: true },
    { t: 'shard', p: [-8, 4, -244], s: [1.8, 12], c: 0xc0e8f4, col: true },
    { t: 'shard', p: [14, 5, -250], s: [2.2, 14], c: 0xa8dcf0, col: true },
    { t: 'shard', p: [-16, 6, -256], s: [2.8, 20], c: 0x98d4ec, col: true, glow: true },
    { t: 'shard', p: [6, 4, -262], s: [1.6, 10], c: 0xd0ecf6, col: true },
    { t: 'shard', p: [-4, 5, -270], s: [2.2, 14], c: 0xa8dcf0, col: true },
    { t: 'shard', p: [18, 3, -268], s: [1.8, 11], c: 0xc0e8f4, col: true },
    // caldera glow crystals
    { t: 'shard', p: [-30, 6, -330], s: [3, 20], c: 0x8fd0e8, col: true, glow: true },
    { t: 'shard', p: [30, 5, -335], s: [2.6, 16], c: 0x8fd0e8, col: true, glow: true },
    { t: 'shard', p: [0, 6, -344], s: [2.2, 13], c: 0xa8dcf0, col: true, glow: true },
    // snowy rocks
    { t: 'rock', p: [-24, 0, 15], s: [4, 2.6] },
    { t: 'rock', p: [26, 0, -5], s: [3.4, 2.4] },
    { t: 'rock', p: [-30, 0, -95], s: [4.6, 3] },
    { t: 'rock', p: [32, 0, -170], s: [4, 2.8] },
    { t: 'rock', p: [-26, 0, -205], s: [3.6, 2.6] },
    { t: 'rock', p: [28, 0, -285], s: [4.2, 3] },
    { t: 'crate', p: [-6, 0.8, 52] },
    { t: 'crate', p: [-7.6, 0.8, 53.2] },
    { t: 'antenna', p: [10, 0, 40] },
    { t: 'antenna', p: [-62, 9, 10] },
    { t: 'antenna', p: [0, 18.6, -318] },
    { t: 'pipe', p: [10, 25.5, -185], len: 8, axis: 'x' },
    { t: 'barrier', p: [-4, 0.6, 40] },
    { t: 'barrier', p: [4, 0.6, 40] },
    { t: 'vent', p: [-9, 5.5, -84] },
    { t: 'vent', p: [9, 5.5, -84] },
    // guidance rings
    { t: 'ring', p: [0, 9, 25] },
    { t: 'ring', p: [0, 8, -62] },
    { t: 'ring', p: [0, 7, -98] },
    { t: 'ring', p: [0, 9, -135] },
    { t: 'ring', p: [0, 12, -185] },
    { t: 'ring', p: [-2, 8, -248] },
    { t: 'ring', p: [0, 14, -318] }
  ],

  target: { p: [0, 23.6, -318], r: 2.4 }
}
