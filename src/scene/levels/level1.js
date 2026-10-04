/**
 * LEVEL 1 — "PILLAR RUN" (day / industrial training grounds).
 *
 * Two-part course: the original training line (launch pad -> girder gate ->
 * pillar slalom -> window wall -> half pyramid -> slope + arch -> kicker ->
 * tower), then the industrial district extension (cooling towers -> container
 * yard -> pipeline bridge -> twin windows -> gantry crane -> helix ramp ->
 * final canyon -> target tower). City towers flank the whole run.
 *
 * Layout coordinates: missile flies toward -Z.
 */
export const LEVEL_1 = {
  id: 'pillar-run',
  name: 'PILLAR RUN',
  subtitle: '立柱回旋 · 工业训练场',
  difficulty: 1,

  spawn: { x: 0, y: 10, z: 55, yaw: 0 },
  launchSpeed: 22,
  bounds: { minX: -140, maxX: 140, minZ: -640, maxZ: 120, maxY: 150, minY: -6 },
  menuFocus: [0, 14, -170],

  palette: {
    skyZenith: 0x89b7e8,
    skyHorizon: 0xdbe7ef,
    skyGround: 0x6a6f66,
    fogColor: 0xc6d0da, fogNear: 60, fogFar: 560,
    sunColor: 0xfff1de, sunIntensity: 2.6, sunOffset: [55, 85, 35],
    hemiSky: 0xe9f2fb, hemiGround: 0x606468, hemiIntensity: 0.9,
    concrete: 0x9aa0a6, dark: 0x7f858c, girder: 0x666c75, accent: 0xc9522f,
    mountain: 0x7c8894, cloud: 0xffffff, cloudOpacity: 0.5,
    ground: 0x8a8f85, groundY: -2.05,
    facade: 0x9aa2ac, trim: 0x4c5157
  },

  // [x, y, z, sx, sy, sz, material, [rotX, rotY, rotZ]?]
  boxes: [
    // ---- ground slab (crashing into it ends the run) ----
    [0, -2, -90, 240, 4, 430, 'concrete'],                 // z +110 .. -300
    [0, -2, -460, 260, 4, 320, 'concrete'],                // z -300 .. -620
    // ---- perimeter walls (start bowl only; city takes over beyond) ----
    [-73, 7, 60, 4, 18, 120, 'girder'],
    [73, 7, 60, 4, 18, 120, 'girder'],
    [0, 7, 120, 150, 18, 4, 'girder'],

    // ---- zone 1: launch pad ----
    [0, 0.2, 55, 10, 0.4, 10, 'accent'],

    // ---- zone 2: girder gate (z = 20) ----
    [-8, 5, 20, 4, 10, 4, 'girder'],
    [8, 5, 20, 4, 10, 4, 'girder'],
    [-17, 5, 20, 18, 10, 3, 'girder'],
    [17, 5, 20, 18, 10, 3, 'girder'],
    [-2.5, 5, 18.4, 1, 10, 0.4, 'hazard'],
    [2.5, 5, 18.4, 1, 10, 0.4, 'hazard'],

    // ---- zone 3: pillar slalom (z = -5 .. -30) ----
    [-5, 5, -5, 3, 10, 3, 'concrete'],
    [5, 5, -10, 3, 10, 3, 'concrete'],
    [-5, 5, -15, 3, 10, 3, 'concrete'],
    [5, 5, -20, 3, 10, 3, 'concrete'],
    [-5, 5, -25, 3, 10, 3, 'concrete'],
    [-5, 10.5, -15, 1.2, 1.2, 24, 'girder'],
    [5, 10.5, -15, 1.2, 1.2, 24, 'girder'],

    // ---- zone 4: the wall with a window (z = -75) ----
    [0, 3.5, -75, 60, 7, 3, 'dark'],
    [0, 20, -75, 60, 14, 3, 'dark'],
    [-16.5, 10, -75, 27, 6, 3, 'dark'],
    [16.5, 10, -75, 27, 6, 3, 'dark'],
    [0, 7, -73.4, 7.4, 0.5, 0.4, 'hazard'],
    [0, 13, -73.4, 7.4, 0.5, 0.4, 'hazard'],
    [-3.2, 10, -73.4, 0.5, 6.4, 0.4, 'hazard'],
    [3.2, 10, -73.4, 0.5, 6.4, 0.4, 'hazard'],

    // ---- zone 5: half pyramid (z = -140) ----
    [0, 2, -140, 40, 4, 40, 'dark'],
    [0, 6, -140, 32, 4, 32, 'dark'],
    [0, 10, -140, 24, 4, 24, 'dark'],
    [0, 14, -140, 16, 4, 16, 'dark'],
    [0, 18, -140, 8, 4, 8, 'dark'],
    [-26, 8, -140, 6, 1, 10, 'girder'],
    [26, 12, -140, 6, 1, 10, 'girder'],

    // ---- zone 6: slope wall + arch (z = -175 / -188) ----
    [0, 8.5, -175, 40, 1.6, 26, 'dark', [-0.58, 0, 0]],
    [-6, 12, -188, 3, 24, 3, 'girder'],
    [6, 12, -188, 3, 24, 3, 'girder'],
    [0, 24.5, -188, 15, 3, 3, 'accent'],

    // ---- zone 7: kicker ramp (z = -215) ----
    [0, 5, -215, 14, 1.6, 14, 'dark', [-0.42, 0, 0]],

    // ---- zone 8: waypoint tower (z = -260, no longer the target) ----
    [0, 10, -260, 10, 24, 10, 'dark'],
    [0, 22.2, -260, 6, 0.4, 6, 'accent'],

    // ---- zone 9: cooling tower pair (z = -295) — thread the gap ----
    // (props below: coolingtower x +-13, waist gap ~9 m)

    // ---- zone 10: container yard (z = -315 .. -345) — stacks as props ----

    // ---- zone 11: pipeline bridge (z = -372) ----
    [-11, 11, -372, 3, 22, 3, 'girder'],
    [11, 11, -372, 3, 22, 3, 'girder'],
    [0, 21.6, -372, 3.4, 1.2, 1.2, 'hazard'],
    [0, 6, -372, 24, 0.9, 0.9, 'girder'],
    [0, 10, -372, 24, 0.9, 0.9, 'girder'],
    [0, 14, -372, 24, 0.9, 0.9, 'girder'],

    // ---- zone 12: twin-window wall (z = -408) ----
    [0, 12, -408, 74, 24, 3, 'dark'],
    [-9, 9, -406.4, 6.4, 0.5, 0.4, 'hazard'],
    [9, 9, -406.4, 6.4, 0.5, 0.4, 'hazard'],
    [-12.2, 12, -406.4, 0.5, 6.4, 0.4, 'hazard'],
    [-5.8, 12, -406.4, 0.5, 6.4, 0.4, 'hazard'],
    [5.8, 12, -406.4, 0.5, 6.4, 0.4, 'hazard'],
    [12.2, 12, -406.4, 0.5, 6.4, 0.4, 'hazard'],
    [0, 3.5, -408, 74, 7, 3, 'dark'],

    // ---- zone 13: gantry crane portal (z = -440) — props ----

    // ---- zone 14: helix ramp (z = -475) — corkscrew girders around a core ----
    [0, 14, -475, 6, 28, 6, 'dark'],
    [0, 28.4, -475, 7, 0.5, 7, 'hazard'],
    [9.0, 3.0, -475.0, 10, 1, 3, 'girder', [0, 1.5708, 0]],
    [6.4, 5.6, -468.6, 10, 1, 3, 'girder', [0, 2.3562, 0]],
    [0.0, 8.2, -466.0, 10, 1, 3, 'girder', [0, 3.1416, 0]],
    [-6.4, 10.8, -468.6, 10, 1, 3, 'girder', [0, 3.9270, 0]],
    [-9.0, 13.4, -475.0, 10, 1, 3, 'girder', [0, 4.7124, 0]],
    [-6.4, 16.0, -481.4, 10, 1, 3, 'girder', [0, 5.4978, 0]],
    [0.0, 18.6, -484.0, 10, 1, 3, 'girder', [0, 6.2832, 0]],
    [6.4, 21.2, -481.4, 10, 1, 3, 'girder', [0, 0.7854, 0]],

    // ---- zone 15: final canyon + target tower (z = -545 .. -585) ----
    [-14, 14, -545, 6, 28, 6, 'concrete'],
    [14, 14, -556, 6, 28, 6, 'concrete'],
    [-14, 14, -567, 6, 28, 6, 'concrete'],
    [14, 14, -578, 6, 28, 6, 'concrete'],
    [0, 16, -585, 9, 32, 9, 'dark'],
    [0, 32.2, -585, 6, 0.4, 6, 'accent']
  ],

  // [x, z, w, d, h, style, opts] — style 0 tower, 1 slab, 2 hangar, 3 stack
  buildings: [
    // ---- mid-course city flanks (colliders — grapple-able skylines) ----
    [-52, 10, 14, 14, 26, 0],
    [52, 0, 16, 16, 34, 0],
    [-48, -45, 18, 14, 22, 1],
    [56, -55, 13, 13, 30, 0],
    [-55, -95, 15, 15, 38, 0],
    [50, -120, 20, 14, 24, 1],
    [-50, -160, 14, 14, 42, 0],
    [54, -190, 16, 16, 28, 0],
    [-56, -230, 18, 14, 32, 0],
    [48, -260, 14, 20, 22, 2, { rot: 0.5 }],   // hangar by the waypoint tower
    [-52, -300, 22, 16, 20, 2, { rot: -0.4 }], // hangars near container yard
    [50, -320, 12, 12, 36, 0],
    [-54, -360, 14, 14, 26, 0],
    [52, -410, 18, 14, 30, 0],
    [-50, -450, 15, 15, 34, 0],
    [55, -490, 16, 16, 26, 0],
    [-52, -530, 14, 18, 30, 0],
    [-13, -345, 3.4, 3.4, 26, 3],             // stacks near cooling towers
    [13, -345, 3.4, 3.4, 30, 3],
    // ---- far skyline (visual only) ----
    [-105, -40, 18, 18, 52, 0, { far: true }],
    [105, -60, 20, 20, 66, 0, { far: true }],
    [-100, -140, 16, 16, 44, 0, { far: true }],
    [112, -150, 18, 18, 58, 0, { far: true }],
    [-115, -240, 20, 20, 62, 0, { far: true }],
    [100, -260, 16, 16, 48, 0, { far: true }],
    [-108, -340, 18, 18, 56, 0, { far: true }],
    [104, -420, 20, 20, 70, 0, { far: true }],
    [-102, -480, 16, 16, 50, 0, { far: true }],
    [110, -540, 18, 18, 64, 0, { far: true }]
  ],

  // decoration-only geometry (no colliders unless stated)
  props: [
    { t: 'pipe', p: [-5, 11.6, -10], len: 18, axis: 'z' },
    { t: 'pipe', p: [5, 11.6, -20], len: 18, axis: 'z' },
    { t: 'pipe', p: [-26, 9.3, -140], len: 8, axis: 'x' },
    { t: 'pipe', p: [-11, 6.9, -370], len: 22, axis: 'x' },   // pipeline rails
    { t: 'pipe', p: [11, 6.9, -370], len: 22, axis: 'x' },
    { t: 'crate', p: [-6, 0.8, 50.5] },
    { t: 'crate', p: [-7.6, 0.8, 51.8] },
    { t: 'crate', p: [-6.8, 2.2, 51.1] },
    { t: 'crate', p: [21, 0.8, -70] },
    { t: 'crate', p: [22.6, 0.8, -69] },
    { t: 'barrier', p: [4.5, 0.6, 59.5] },
    { t: 'barrier', p: [-4.5, 0.6, 59.5] },
    { t: 'barrier', p: [0, 0.6, -196] },
    { t: 'vent', p: [-10, 14.5, -73.2] },
    { t: 'vent', p: [12, 5.5, -73.2] },
    { t: 'vent', p: [-30, 5.5, -73.2] },
    { t: 'antenna', p: [3.2, 22.4, -257] },
    { t: 'antenna', p: [12, 0, 66] },
    { t: 'antenna', p: [-24, 0, -95] },
    { t: 'antenna', p: [0, 28.6, -475] },                    // helix core top
    // zone 9: cooling towers
    { t: 'coolingtower', p: [-13, 0, -295], r: 8.5, h: 30 },
    { t: 'coolingtower', p: [13, 0, -295], r: 8.5, h: 30 },
    // zone 10: container yard
    { t: 'containers', p: [-16, 0, -318], stacks: 2, gap: 8, rot: 0.1 },
    { t: 'containers', p: [-4, 0, -326], stacks: 2, gap: 8, rot: -0.08 },
    { t: 'containers', p: [9, 0, -320], stacks: 3, gap: 8, rot: 0.06 },
    { t: 'containers', p: [19, 0, -330], stacks: 2, gap: 8, rot: -0.12 },
    { t: 'containers', p: [-13, 0, -338], stacks: 3, gap: 8, rot: 0.15 },
    { t: 'containers', p: [4, 0, -344], stacks: 2, gap: 8, rot: 0 },
    // zone 13: gantry crane portal
    { t: 'crane', p: [0, 0, -440], w: 32, h: 26, rot: 0, tx: 0.5 },
    { t: 'crane', p: [0, 0, -452], w: 26, h: 20, rot: 0, tx: -0.4 },
    // guidance rings along the extended line
    { t: 'ring', p: [0, 14, -270] },
    { t: 'ring', p: [0, 12, -358] },
    { t: 'ring', p: [-9, 12, -404] },
    { t: 'ring', p: [0, 16, -465] },
    { t: 'ring', p: [0, 20, -520] },
    { t: 'ring', p: [0, 34, -560] }
  ],

  target: { p: [0, 35.6, -585], r: 2.4 }
}
