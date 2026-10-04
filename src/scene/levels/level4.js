/**
 * LEVEL 4 — "NEON HARBOR" (midnight / neon metropolis).
 *
 * Launch from the pier -> thread the gantry cranes -> under the elevated
 * highway -> skyscraper slalom between lit towers -> neon hoop gates ->
 * rooftop hop over street canyons -> the mega-billboard window -> final
 * harbor crane, with the target hanging from its hook.
 *
 * Missile flies toward -Z.
 */
export const LEVEL_4 = {
  id: 'neon-harbor',
  name: 'NEON HARBOR',
  subtitle: '霓虹港湾 · 午夜穿梭',
  difficulty: 2,

  spawn: { x: 0, y: 10, z: 60, yaw: 0 },
  launchSpeed: 24,
  bounds: { minX: -140, maxX: 140, minZ: -400, maxZ: 120, maxY: 140, minY: -8 },
  menuFocus: [0, 16, -120],

  palette: {
    skyZenith: 0x0a1026,
    skyHorizon: 0x27334e,
    skyGround: 0x0d1118,
    fogColor: 0x131b30, fogNear: 45, fogFar: 540,
    sunColor: 0xcfe0ff, sunIntensity: 0.55, sunOffset: [-0.5, 0.5, 0.35],
    hemiSky: 0x2c3a58, hemiGround: 0x141824, hemiIntensity: 0.55,
    concrete: 0x5a6470, dark: 0x49505c, girder: 0x3e4450, accent: 0x27d8c8,
    mountain: 0x1c2434, cloud: 0x2e3a56, cloudOpacity: 0.32, stars: 0.9,
    ground: 0x20293a, groundY: -2.05,
    facade: 0x8a94a4, trim: 0x2e333c, windowsNight: true
  },

  boxes: [
    // ---- harbor ground / water plate ----
    [0, -2, -140, 280, 4, 520, 'concrete'],

    // ---- zone 1: the pier (spawn) ----
    [0, 0.2, 60, 12, 0.4, 26, 'accent'],

    // ---- zone 2: gantry crane pair (z = 15) — thread between the hooks ----
    // (cranes as props: x -16 and +16)

    // ---- zone 3: elevated highway (z = -45 .. -75) ----
    // pylons + segments: fly UNDER (y < 11) or OVER (y > 15)
    [-20, 5, -45, 3, 10, 3, 'concrete'],
    [20, 5, -45, 3, 10, 3, 'concrete'],
    [-20, 5, -75, 3, 10, 3, 'concrete'],
    [20, 5, -75, 3, 10, 3, 'concrete'],
    [0, 12, -45, 64, 2, 10, 'dark'],
    [0, 12, -75, 64, 2, 10, 'dark'],
    [0, 13.1, -45, 60, 0.3, 7, 'accent'],
    [0, 13.1, -75, 60, 0.3, 7, 'accent'],
    // gap between segments at z = -60 — hop the missing span

    // ---- zone 4: skyscraper slalom (z = -105 .. -175) ----
    [-15, 20, -105, 13, 40, 13, 'dark'],
    [14, 23, -120, 14, 46, 14, 'dark'],
    [-13, 19, -137, 13, 38, 13, 'dark'],
    [15, 21, -153, 15, 42, 15, 'dark'],
    [-8, 16, -170, 12, 32, 12, 'dark'],

    // ---- zone 5: neon hoops (z = -205 .. -225) — props with colliders ----

    // ---- zone 6: rooftop hop (z = -250 .. -290) ----
    [-12, 9, -250, 16, 18, 16, 'dark'],
    [12, 10, -268, 16, 20, 16, 'dark'],
    [-10, 8, -286, 16, 16, 16, 'dark'],

    // ---- zone 7: mega-billboard wall with the lighted window (z = -315) ----
    [0, 14, -315, 90, 28, 3, 'dark'],
    [0, 3.5, -315, 90, 7, 3, 'dark'],
    [0, 14, -313.4, 9, 9, 0.4, 'hazard'],
    [0, 20, -313.4, 9, 0.5, 0.4, 'hazard'],
    [0, 8, -313.4, 9, 0.5, 0.4, 'hazard'],
    [-4.6, 14, -313.4, 0.5, 9, 0.4, 'hazard'],
    [4.6, 14, -313.4, 0.5, 9, 0.4, 'hazard'],

    // ---- zone 8: final harbor crane (z = -355) — props ----
    // target hangs from the trolley hook
    [0, 5, -380, 30, 10, 24, 'concrete']           // quay block under the crane
  ],

  // [x, z, w, d, h, style, opts]
  buildings: [
    // ---- downtown mass flanking the course ----
    [-46, -20, 16, 16, 34, 0],
    [46, -30, 18, 18, 42, 0],
    [-42, -90, 14, 14, 30, 0],
    [44, -110, 20, 16, 50, 0],
    [-48, -150, 16, 16, 44, 0],
    [46, -170, 14, 14, 36, 0],
    [-40, -210, 18, 14, 28, 1],
    [42, -240, 16, 16, 40, 0],
    [-44, -270, 18, 14, 32, 0],
    [40, -300, 14, 14, 46, 0],
    [-38, -330, 16, 16, 38, 0],
    // waterfront warehouses + stacks near the pier
    [-34, 45, 20, 14, 11, 2, { rot: 0.1 }],
    [34, 40, 22, 14, 9, 2, { rot: -0.15 }],
    [-28, 20, 3.4, 3.4, 24, 3],
    [28, 12, 3.4, 3.4, 20, 3],
    // ---- far skyline (visual only) ----
    [-95, -60, 20, 20, 62, 0, { far: true }],
    [95, -80, 22, 22, 74, 0, { far: true }],
    [-100, -160, 18, 18, 56, 0, { far: true }],
    [98, -190, 20, 20, 68, 0, { far: true }],
    [-92, -280, 22, 22, 72, 0, { far: true }],
    [100, -330, 18, 18, 58, 0, { far: true }],
    [-70, -380, 20, 20, 50, 0, { far: true }]
  ],

  props: [
    // pier lights
    { t: 'lightpole', p: [-8, 0, 66], h: 9 },
    { t: 'lightpole', p: [8, 0, 54], h: 9 },
    { t: 'lightpole', p: [-8, 0, 40], h: 9 },
    { t: 'lightpole', p: [8, 0, 28], h: 9 },
    // container stacks on the pier
    { t: 'containers', p: [-22, 0, 30], stacks: 3, gap: 8, rot: 0.2 },
    { t: 'containers', p: [24, 0, 24], stacks: 2, gap: 8, rot: -0.1 },
    // zone 2: gantry cranes — thread between their hanging hooks
    { t: 'crane', p: [-16, 0, 15], w: 26, h: 24, rot: 0, tx: 0.4 },
    { t: 'crane', p: [16, 0, 15], w: 26, h: 24, rot: 0, tx: -0.4 },
    // zone 5: neon hoop gates + billboard signs
    { t: 'hoop', p: [0, 12, -205], r: 7 },
    { t: 'hoop', p: [-4, 15, -215], r: 6.5 },
    { t: 'hoop', p: [4, 11, -225], r: 6 },
    { t: 'neon', p: [-26, 18, -200], s: [14, 7], c: 0x27d8c8, rot: 0.3 },
    { t: 'neon', p: [26, 20, -220], s: [14, 7], c: 0xff5f9e, rot: -0.3 },
    { t: 'neon', p: [-30, 10, -255], s: [10, 5], c: 0xffb02e, rot: 0.15 },
    { t: 'neon', p: [30, 9, -280], s: [10, 5], c: 0x27d8c8, rot: -0.15 },
    // zone 7: billboard sign rows on the wall face
    { t: 'neon', p: [-24, 22, -313.2], s: [12, 6], c: 0xff5f9e, col: true },
    { t: 'neon', p: [24, 22, -313.2], s: [12, 6], c: 0x27d8c8, col: true },
    // zone 8: final crane carrying the target
    { t: 'crane', p: [0, 0, -355], w: 40, h: 30, rot: 0, tx: 0 },
    // rooftop details
    { t: 'vent', p: [-12, 18.4, -250] },
    { t: 'vent', p: [12, 20.4, -268] },
    { t: 'antenna', p: [-12, 18.2, -250] },
    { t: 'antenna', p: [10, 32.2, -137] },
    { t: 'crate', p: [-18, 3, 48] },
    { t: 'crate', p: [-19.6, 3, 49.3] },
    { t: 'barrier', p: [-5, 0.7, 44] },
    { t: 'barrier', p: [5, 0.7, 44] },
    // guidance rings
    { t: 'ring', p: [0, 10, 15] },
    { t: 'ring', p: [0, 8, -60] },
    { t: 'ring', p: [0, 14, -128] },
    { t: 'ring', p: [0, 14, -196] },
    { t: 'ring', p: [0, 14, -313] },
    { t: 'ring', p: [0, 18, -345] }
  ],

  target: { p: [0, 18, -355], r: 2.4 }
}
