/**
 * LEVEL 2 — "RED CANYON" (sunset / serpentine desert canyon).
 *
 * A winding slot between rust-red mesas: rock-fin slalom -> narrow slot ->
 * tunnel -> open bowl with a grapple spire -> natural arch -> dive into the
 * pit where the target sits on a low spire.
 *
 * Tighter lines than Pillar Run — the chute and bullet time earn their keep.
 * Missile flies toward -Z.
 */
export const LEVEL_2 = {
  id: 'red-canyon',
  name: 'RED CANYON',
  subtitle: '赤色峡谷 · 落日穿行',
  difficulty: 2,

  spawn: { x: 0, y: 12, z: 62, yaw: 0 },
  launchSpeed: 24,
  bounds: { minX: -95, maxX: 95, minZ: -300, maxZ: 120, maxY: 130, minY: -26 },
  menuFocus: [0, 8, -100],

  palette: {
    skyZenith: 0x5a4a7a,
    skyHorizon: 0xff9a5e,
    skyGround: 0x6e4436,
    fogColor: 0xe8956a, fogNear: 45, fogFar: 620,
    sunColor: 0xffb070, sunIntensity: 2.3, sunOffset: [0.8, 0.26, 0.5],
    hemiSky: 0xffc9a0, hemiGround: 0x5a4038, hemiIntensity: 0.85,
    concrete: 0xb08268, dark: 0x94644e, girder: 0x6b5a55, accent: 0xd95f2b,
    mountain: 0x8a5a48, cloud: 0xffb890, cloudOpacity: 0.55,
    ground: 0xa5654d, groundY: -2.05
  },

  boxes: [
    // ---- ground: main desert floor, then the pit ----
    [0, -2, -45, 200, 4, 310, 'concrete'],          // z +110 .. -200
    [0, -10, -232, 160, 4, 64, 'concrete'],         // pit floor, top at y = -8
    [0, -4, -200.5, 200, 8, 3, 'dark'],             // cliff face at pit mouth

    // ---- canyon wall chains (staggered mesas make the S-bend) ----
    // left chain (x = -38)
    [-38, 13, 30, 24, 26, 28, 'dark'],
    [-38, 15, -15, 26, 30, 30, 'dark'],
    [-38, 12, -58, 22, 24, 26, 'dark'],
    [-38, 15, -95, 26, 30, 28, 'dark'],
    [-38, 14, -140, 24, 28, 34, 'dark'],
    // right chain (x = +38)
    [38, 12, 10, 22, 24, 26, 'dark'],
    [38, 15, -35, 26, 30, 30, 'dark'],
    [38, 13, -75, 24, 26, 26, 'dark'],
    [38, 15, -118, 26, 30, 26, 'dark'],
    [38, 14, -160, 24, 28, 30, 'dark'],

    // ---- rock-fin slalom (first fin offset from the spawn line) ----
    [-3, 6, -8, 3, 12, 10, 'concrete', [0, 0.2, 0]],
    [-9, 7, -32, 3, 14, 12, 'concrete', [0, -0.3, 0]],
    [8, 7, -55, 3, 14, 12, 'concrete', [0, 0.25, 0]],

    // ---- narrow slot (z = -85 .. -100), 12 m gap ----
    [-9, 7, -92, 6, 14, 18, 'dark'],
    [9, 7, -92, 6, 14, 18, 'dark'],
    [0, 14.4, -83, 12, 0.8, 0.6, 'hazard'],

    // ---- tunnel (z = -115 .. -140): passage x [-7,7], y [2,13] ----
    [0, 1, -127.5, 22, 2, 25, 'dark'],              // floor, top y = 2
    [-9, 8, -127.5, 4, 12, 25, 'dark'],             // left wall
    [9, 8, -127.5, 4, 12, 25, 'dark'],              // right wall
    [0, 15, -127.5, 22, 4, 25, 'dark'],             // ceiling, bottom y = 13
    [0, 13.4, -114, 16, 0.8, 0.8, 'hazard'],        // entrance marker

    // ---- open bowl (z = -150 .. -200) ringed by mesas ----
    [-55, 16, -175, 30, 32, 40, 'dark'],
    [55, 16, -175, 30, 32, 40, 'dark'],
    [-40, 10, -155, 24, 20, 18, 'concrete'],
    [40, 12, -198, 24, 24, 18, 'concrete'],
    // central grapple spire — the swing anchor of this level
    [12, 12, -172, 8, 24, 8, 'concrete'],
    [12, 24.4, -172, 9, 0.8, 9, 'hazard'],

    // ---- natural arch (z = -203) ----
    [-9, 9, -203, 5, 18, 5, 'dark'],
    [9, 9, -203, 5, 18, 5, 'dark'],
    [0, 18.5, -203, 24, 3, 5, 'dark'],

    // ---- the pit: target spire (z = -238) ----
    [0, -4.5, -238, 6, 7, 6, 'concrete'],           // top at y = -1
    [0, -0.9, -238, 7, 0.5, 7, 'hazard']
  ],

  props: [
    { t: 'rock', p: [-30, 0, 40], s: [4, 3] },
    { t: 'rock', p: [26, 0, -12], s: [3, 2.4] },
    { t: 'rock', p: [-24, 0, -52], s: [5, 3.5] },
    { t: 'rock', p: [18, 0, -70], s: [2.6, 2] },
    { t: 'rock', p: [-26, 0, -125], s: [4, 2.8] },
    { t: 'rock', p: [30, 0, -185], s: [6, 4] },
    { t: 'rock', p: [-18, -8, -225], s: [4, 3] },
    { t: 'rock', p: [16, -8, -250], s: [3.4, 2.6] },
    { t: 'antenna', p: [-38, 28, -15] },
    { t: 'antenna', p: [38, 28, -35] },
    { t: 'crate', p: [-13, 2.9, -108] },
    { t: 'crate', p: [13, 2.9, -146] },
    { t: 'barrier', p: [-6, 0.6, -198] },
    { t: 'barrier', p: [6, 0.6, -198] },
    { t: 'pipe', p: [-9, 14.6, -92], len: 16, axis: 'z' }
  ],

  target: { p: [0, 1.6, -238], r: 2.4 }
}
