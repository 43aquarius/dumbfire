/**
 * LEVEL 2 — "RED CANYON" (sunset / serpentine desert canyon).
 *
 * Part one: rock-fin slalom -> narrow slot -> tunnel -> open bowl with a
 * grapple spire -> natural arch -> dive into the pit. Part two: the climb
 * out of the pit onto the high plateau -> mesa forest -> twin slots ->
 * giant natural bridge -> hoodoo spire garden -> final amphitheater where
 * the target crowns a low spire.
 *
 * Missile flies toward -Z.
 */
export const LEVEL_2 = {
  id: 'red-canyon',
  name: 'RED CANYON',
  subtitle: '赤色峡谷 · 落日穿行',
  difficulty: 2,

  spawn: { x: 0, y: 12, z: 62, yaw: 0 },
  launchSpeed: 24,
  bounds: { minX: -120, maxX: 120, minZ: -620, maxZ: 120, maxY: 150, minY: -30 },
  menuFocus: [0, 10, -140],

  palette: {
    skyZenith: 0x5a4a7a,
    skyHorizon: 0xff9a5e,
    skyGround: 0x6e4436,
    fogColor: 0xe8956a, fogNear: 45, fogFar: 620,
    sunColor: 0xffb070, sunIntensity: 2.3, sunOffset: [0.8, 0.26, 0.5],
    hemiSky: 0xffc9a0, hemiGround: 0x5a4038, hemiIntensity: 0.85,
    concrete: 0xb08268, dark: 0x94644e, girder: 0x6b5a55, accent: 0xd95f2b,
    mountain: 0x8a5a48, cloud: 0xffb890, cloudOpacity: 0.55,
    ground: 0xa5654d, groundY: -2.05,
    facade: 0xb08a6e, trim: 0x6e5244
  },

  boxes: [
    // ---- ground: main desert floor, the pit, then the high plateau ----
    [0, -2, -45, 200, 4, 310, 'concrete'],           // z +110 .. -200
    [0, -10, -232, 160, 4, 64, 'concrete'],          // pit floor, top y = -8
    [0, -4, -200.5, 200, 8, 3, 'dark'],              // cliff face at pit mouth
    [0, -1, -400, 260, 4, 300, 'concrete'],          // plateau, top y = 1

    // ---- canyon wall chains (staggered mesas make the S-bend) ----
    [-38, 13, 30, 24, 26, 28, 'dark'],
    [-38, 15, -15, 26, 30, 30, 'dark'],
    [-38, 12, -58, 22, 24, 26, 'dark'],
    [-38, 15, -95, 26, 30, 28, 'dark'],
    [-38, 14, -140, 24, 28, 34, 'dark'],
    [38, 12, 10, 22, 24, 26, 'dark'],
    [38, 15, -35, 26, 30, 30, 'dark'],
    [38, 13, -75, 24, 26, 26, 'dark'],
    [38, 15, -118, 26, 30, 26, 'dark'],
    [38, 14, -160, 24, 28, 30, 'dark'],

    // ---- rock-fin slalom ----
    [-3, 6, -8, 3, 12, 10, 'concrete', [0, 0.2, 0]],
    [-9, 7, -32, 3, 14, 12, 'concrete', [0, -0.3, 0]],
    [8, 7, -55, 3, 14, 12, 'concrete', [0, 0.25, 0]],

    // ---- narrow slot (z = -85 .. -100), 12 m gap ----
    [-9, 7, -92, 6, 14, 18, 'dark'],
    [9, 7, -92, 6, 14, 18, 'dark'],
    [0, 14.4, -83, 12, 0.8, 0.6, 'hazard'],

    // ---- tunnel (z = -115 .. -140): passage x [-7,7], y [2,13] ----
    [0, 1, -127.5, 22, 2, 25, 'dark'],
    [-9, 8, -127.5, 4, 12, 25, 'dark'],
    [9, 8, -127.5, 4, 12, 25, 'dark'],
    [0, 15, -127.5, 22, 4, 25, 'dark'],
    [0, 13.4, -114, 16, 0.8, 0.8, 'hazard'],

    // ---- open bowl (z = -150 .. -200) ringed by mesas ----
    [-55, 16, -175, 30, 32, 40, 'dark'],
    [55, 16, -175, 30, 32, 40, 'dark'],
    [-40, 10, -155, 24, 20, 18, 'concrete'],
    [40, 12, -198, 24, 24, 18, 'concrete'],
    [12, 12, -172, 8, 24, 8, 'concrete'],
    [12, 24.4, -172, 9, 0.8, 9, 'hazard'],

    // ---- natural arch (z = -203) ----
    [-9, 9, -203, 5, 18, 5, 'dark'],
    [9, 9, -203, 5, 18, 5, 'dark'],
    [0, 18.5, -203, 24, 3, 5, 'dark'],

    // ---- the pit: old target spire (z = -238) ----
    [0, -4.5, -238, 6, 7, 6, 'concrete'],
    [0, -0.9, -238, 7, 0.5, 7, 'hazard'],

    // ---- EXTENSION: pit exit ramp (z = -252 .. -268) ----
    [0, -5, -260, 34, 1.6, 22, 'dark', [-0.34, 0, 0]],

    // ---- mesa forest slalom on the plateau (z = -290 .. -355) ----
    [-16, 12, -290, 14, 22, 14, 'dark'],
    [14, 13, -305, 16, 24, 16, 'dark'],
    [-14, 14, -322, 18, 26, 18, 'dark'],
    [15, 11, -338, 14, 20, 14, 'dark'],
    // side walls confining the forest
    [-58, 18, -320, 34, 34, 110, 'dark'],
    [58, 18, -320, 34, 34, 110, 'dark'],

    // ---- twin slots (z = -378): pick a lane, divider in the middle ----
    [0, 10, -378, 10, 20, 26, 'dark'],
    [-26, 12, -378, 20, 24, 30, 'dark'],
    [26, 12, -378, 20, 24, 30, 'dark'],
    [0, 20.4, -371, 10, 0.8, 0.8, 'hazard'],

    // ---- giant natural bridge (z = -412): 34 m span, 24 m tall opening ----
    [-17, 13, -412, 6, 26, 8, 'dark'],
    [17, 13, -412, 6, 26, 8, 'dark'],
    [0, 25.5, -412, 40, 5, 8, 'dark'],
    [0, 27.8, -412, 42, 0.8, 9, 'hazard'],

    // ---- hoodoo garden (z = -445 .. -490) ----
    [-10, 9, -448, 4, 18, 4, 'concrete'],
    [8, 10, -455, 5, 20, 5, 'concrete'],
    [-6, 11, -465, 5, 22, 5, 'concrete'],
    [12, 8, -470, 4, 16, 4, 'concrete'],
    [-14, 10, -478, 5, 20, 5, 'concrete'],
    [5, 11, -485, 5, 22, 5, 'concrete'],
    // caps for grapple hooks on the tallest
    [-6, 22.4, -465, 5, 0.5, 5, 'hazard'],
    [5, 22.4, -485, 5, 0.5, 5, 'hazard'],

    // ---- final amphitheater (z = -510 .. -560): ringed by mesas ----
    [-52, 17, -535, 30, 32, 46, 'dark'],
    [52, 17, -535, 30, 32, 46, 'dark'],
    [-30, 13, -560, 24, 26, 24, 'dark'],
    [30, 13, -560, 24, 26, 24, 'dark'],
    // target spire in the centre
    [0, 8, -540, 9, 14, 9, 'concrete'],
    [0, 15.4, -540, 10, 0.5, 10, 'hazard']
  ],

  // [x, z, w, d, h, style, opts]
  buildings: [
    // desert outposts flanking the plateau
    [-72, -300, 12, 12, 10, 2, { rot: 0.3 }],
    [74, -340, 12, 12, 9, 2, { rot: -0.4 }],
    [-70, -420, 3.2, 3.2, 18, 3],
    [70, -450, 3.2, 3.2, 22, 3],
    [-75, -530, 14, 10, 8, 1, { rot: 0.2 }],
    [76, -555, 14, 10, 9, 1, { rot: -0.25 }]
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
    // plateau rocks
    { t: 'rock', p: [-40, 1, -300], s: [5, 3.2] },
    { t: 'rock', p: [38, 1, -330], s: [4, 3] },
    { t: 'rock', p: [-44, 1, -430], s: [6, 4] },
    { t: 'rock', p: [42, 1, -480], s: [4.4, 3.4] },
    { t: 'rock', p: [-36, 1, -520], s: [5, 3.6] },
    { t: 'antenna', p: [-38, 28, -15] },
    { t: 'antenna', p: [38, 28, -35] },
    { t: 'antenna', p: [-30, 1, -335] },
    { t: 'antenna', p: [34, 1, -470] },
    { t: 'crate', p: [-13, 2.9, -108] },
    { t: 'crate', p: [13, 2.9, -146] },
    { t: 'crate', p: [-20, 3.9, -300] },
    { t: 'crate', p: [21, 3.9, -337] },
    { t: 'barrier', p: [-6, 0.6, -198] },
    { t: 'barrier', p: [6, 0.6, -198] },
    { t: 'barrier', p: [-6, 1.6, -370] },
    { t: 'barrier', p: [6, 1.6, -370] },
    { t: 'pipe', p: [-9, 14.6, -92], len: 16, axis: 'z' },
    { t: 'pipe', p: [22, 15.4, -322], len: 12, axis: 'x' },
    // guidance rings through the new sections
    { t: 'ring', p: [0, 6, -262] },
    { t: 'ring', p: [0, 10, -312] },
    { t: 'ring', p: [-13, 9, -378] },
    { t: 'ring', p: [0, 13, -412] },
    { t: 'ring', p: [-6, 9, -455] },
    { t: 'ring', p: [0, 14, -540] }
  ],

  target: { p: [0, 19.6, -540], r: 2.4 }
}
