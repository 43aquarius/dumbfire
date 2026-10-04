/**
 * LEVEL 6 — "MAGMA CORE" (volcanic night / basalt corridors over lava).
 *
 * Basalt canyon: hex-flanked gates -> lava cascade crossing (the floor is
 * gone; stone pillars only) -> obsidian shard slalom -> the magma chamber
 * with its grapple horn -> the lava-fall wall window -> hex terrace climb
 * -> the volcanic amphitheater, target on a basalt spire.
 *
 * Missile flies toward -Z.
 */
export const LEVEL_6 = {
  id: 'magma-core',
  name: 'MAGMA CORE',
  subtitle: '熔岩之心 · 玄武长峡',
  difficulty: 3,

  spawn: { x: 0, y: 12, z: 58, yaw: 0 },
  launchSpeed: 24,
  bounds: { minX: -110, maxX: 110, minZ: -420, maxZ: 110, maxY: 130, minY: -30 },
  menuFocus: [0, 14, -140],

  palette: {
    skyZenith: 0x140b10,
    skyHorizon: 0x69290f,
    skyGround: 0x1a1210,
    fogColor: 0x361810, fogNear: 40, fogFar: 470,
    sunColor: 0xff8a4a, sunIntensity: 1.4, sunOffset: [0.65, 0.3, -0.45],
    hemiSky: 0x5a3828, hemiGround: 0x1e1410, hemiIntensity: 0.6,
    concrete: 0x4a4244, dark: 0x3a3336, girder: 0x463c38, accent: 0xff5a1e,
    mountain: 0x2c2024, cloud: 0x54382c, cloudOpacity: 0.4, stars: 0.45,
    ground: 0x201614, groundY: -2.05,
    facade: 0x5a4a48, trim: 0x2c2422
  },

  boxes: [
    // ---- canyon floor sections; the lava spans burn through the gaps ----
    [0, -2, 35, 170, 4, 130, 'concrete'],            // z +100 .. -30
    [0, -12, -55, 170, 4, 50, 'concrete'],            // lava lake 1 floor (deep)
    [0, -2, -100, 170, 4, 50, 'concrete'],           // z -75 .. -125
    [0, -14, -160, 170, 4, 46, 'concrete'],          // lava lake 2 floor
    [0, -2, -215, 180, 4, 78, 'concrete'],          // z -176 .. -254
    [0, -2, -330, 190, 4, 110, 'concrete'],         // approach + amphitheater
    // cliff faces between floor levels
    [0, -7, -30, 170, 10, 2, 'dark'],
    [0, -7, -75, 170, 10, 2, 'dark'],
    [0, -8, -125, 170, 12, 2, 'dark'],
    [0, -8, -176, 170, 12, 2, 'dark'],

    // ---- zone 1: basalt hex gates (z = 25, 15) — stacked hex feel ----
    [-11, 7, 25, 5, 14, 6, 'dark', [0, 0.5, 0]],
    [11, 7, 25, 5, 14, 6, 'dark', [0, -0.5, 0]],
    [0, 14.5, 25, 27, 1, 3, 'accent'],
    [-9, 5, 10, 4, 10, 6, 'dark', [0, -0.4, 0]],
    [9, 5, 10, 4, 10, 6, 'dark', [0, 0.4, 0]],

    // ---- zone 2: lava lake 1 (z = -30 .. -75): pillar hops only ----
    [-8, -1, -40, 5, 6, 5, 'concrete'],
    [8, -2, -50, 5, 6, 5, 'concrete'],
    [0, -3, -62, 6, 6, 6, 'concrete'],
    [-14, 6, -55, 8, 20, 8, 'dark'],                 // horn to grapple
    [14, 5, -45, 7, 18, 7, 'dark'],
    [-14, 16.4, -55, 9, 0.6, 9, 'hazard'],

    // ---- zone 3: obsidian shard slalom (z = -85 .. -120) — props ----

    // ---- zone 4: the magma chamber (z = -130 .. -150) ----
    [-38, 10, -140, 26, 24, 24, 'dark'],
    [38, 10, -140, 26, 24, 24, 'dark'],
    [0, 0, -140, 22, 4, 24, 'concrete'],            // chamber floor
    [10, 14, -140, 6, 28, 6, 'dark'],               // central horn column
    [10, 28.4, -140, 7, 0.8, 7, 'hazard'],

    // ---- zone 5: lava lake 2 (z = -150 .. -176) + lava-fall wall ----
    [-8, -4, -158, 5, 8, 5, 'concrete'],
    [8, -5, -168, 5, 8, 5, 'concrete'],
    // the lava-fall wall with its window (z = -176)
    [0, 10, -176, 74, 24, 4, 'dark'],
    [0, 3, -176, 74, 10, 4, 'dark'],
    [0, 8, -174, 7, 6, 0.4, 'hazard'],
    [0, 11.4, -174, 7, 0.5, 0.4, 'hazard'],
    [-3.1, 8, -174, 0.5, 6.4, 0.4, 'hazard'],
    [3.1, 8, -174, 0.5, 6.4, 0.4, 'hazard'],

    // ---- zone 6: hex terrace climb (z = -205 .. -250) ----
    [-12, 6, -210, 14, 12, 10, 'dark', [0, 0.35, 0]],
    [12, 10, -222, 14, 20, 10, 'dark', [0, -0.35, 0]],
    [-12, 14, -236, 14, 28, 10, 'dark', [0, 0.35, 0]],
    [12, 18, -248, 14, 36, 10, 'dark', [0, -0.35, 0]],

    // ---- zone 7: volcanic amphitheater (z = -300 .. -370) ----
    [-48, 16, -330, 28, 32, 58, 'dark'],
    [48, 16, -330, 28, 32, 58, 'dark'],
    [0, 26, -368, 96, 52, 12, 'dark'],
    // target spire
    [0, 8, -325, 8, 16, 8, 'concrete'],
    [0, 16.4, -325, 9, 0.5, 9, 'hazard']
  ],

  // [x, z, w, d, h, style, opts]
  buildings: [
    // mining outposts clinging to the canyon walls
    [-58, 20, 14, 12, 8, 2, { rot: 0.3 }],
    [58, -20, 14, 12, 9, 2, { rot: -0.25 }],
    [-60, -110, 12, 12, 10, 1, { rot: 0.15 }],
    [60, -140, 14, 12, 8, 2, { rot: -0.1 }],
    [-56, -230, 12, 12, 12, 1, { rot: 0.2 }],
    [58, -260, 14, 12, 9, 1, { rot: -0.2 }],
    [-56, -350, 3.2, 3.2, 15, 3],
    [56, -370, 3.2, 3.2, 18, 3]
  ],

  props: [
    // lava rocks everywhere (visual, emissive cracks)
    { t: 'lavarock', p: [-26, 0, 30], s: [4.4, 3.2] },
    { t: 'lavarock', p: [26, 0, 18], s: [3.6, 2.8] },
    { t: 'lavarock', p: [-30, -12, -50], s: [4, 3] },
    { t: 'lavarock', p: [30, -12, -65], s: [4.4, 3.4] },
    { t: 'lavarock', p: [-34, 0, -90], s: [4.2, 3] },
    { t: 'lavarock', p: [34, 0, -115], s: [3.8, 2.8] },
    { t: 'lavarock', p: [-40, 0, -200], s: [4.6, 3.4] },
    { t: 'lavarock', p: [38, 0, -230], s: [4, 3] },
    { t: 'lavarock', p: [-36, 0, -290], s: [4.4, 3.2] },
    { t: 'lavarock', p: [36, 0, -350], s: [4, 3] },
    // hanging lava rock under the hex terraces
    { t: 'lavarock', p: [0, 2, -230], s: [4, 6], flip: true },
    // obsidian shards (collidable) — zone 3 slalom
    { t: 'shard', p: [-9, 6, -88], s: [2.2, 16], c: 0x2c2428, col: true },
    { t: 'shard', p: [10, 7, -98], s: [2.6, 18], c: 0x2c2428, col: true },
    { t: 'shard', p: [-11, 5, -108], s: [2.0, 14], c: 0x332a2e, col: true },
    { t: 'shard', p: [8, 8, -118], s: [2.4, 20], c: 0x2c2428, col: true },
    // amphitheater glow shards
    { t: 'shard', p: [-28, 8, -345], s: [2.8, 18], c: 0x3a2822, col: true, glow: true },
    { t: 'shard', p: [28, 7, -350], s: [2.4, 15], c: 0x3a2822, col: true, glow: true },
    // emissive marker plates on the gates
    { t: 'neon', p: [-14, 8, 27], s: [6, 3], c: 0xff5a1e, col: true, rot: 0.3 },
    { t: 'neon', p: [14, 8, 27], s: [6, 3], c: 0xff5a1e, col: true, rot: -0.3 },
    { t: 'neon', p: [0, 2, -177.8], s: [8, 1.2], c: 0xff8a2e },
    // dressing
    { t: 'rock', p: [-22, 0, 45], s: [3.6, 2.6] },
    { t: 'rock', p: [24, 0, -15], s: [3.2, 2.4] },
    { t: 'crate', p: [-7, 0.8, 52] },
    { t: 'crate', p: [-8.6, 0.8, 53.2] },
    { t: 'antenna', p: [-58, 8, 20] },
    { t: 'antenna', p: [10, 28.6, -140] },
    { t: 'antenna', p: [0, 16.6, -325] },
    { t: 'pipe', p: [10, 29.6, -140], len: 8, axis: 'x' },
    { t: 'barrier', p: [-4, 0.6, 45] },
    { t: 'barrier', p: [4, 0.6, 45] },
    { t: 'vent', p: [-8, 5.5, -85] },
    { t: 'vent', p: [8, 5.5, -120] },
    // guidance rings
    { t: 'ring', p: [0, 10, 25] },
    { t: 'ring', p: [0, 6, -50] },
    { t: 'ring', p: [0, 6, -103] },
    { t: 'ring', p: [0, 10, -140] },
    { t: 'ring', p: [0, 8, -176] },
    { t: 'ring', p: [0, 12, -230] },
    { t: 'ring', p: [0, 16, -325] }
  ],

  target: { p: [0, 21.6, -325], r: 2.4 }
}
