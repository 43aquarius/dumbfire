/**
 * LEVEL 1 — "PILLAR RUN" (day / industrial training grounds).
 *
 * The original test course: launch pad -> girder gate -> pillar slalom ->
 * window wall -> half pyramid -> slope + arch -> kicker ramp -> target tower.
 * Comfortably wide lines — this is where players learn the momentum.
 *
 * Layout coordinates: missile flies toward -Z.
 */
export const LEVEL_1 = {
  id: 'pillar-run',
  name: 'PILLAR RUN',
  subtitle: '立柱回旋 · 标准训练场',
  difficulty: 1,

  spawn: { x: 0, y: 10, z: 55, yaw: 0 },
  launchSpeed: 22,
  bounds: { minX: -70, maxX: 70, minZ: -300, maxZ: 110, maxY: 110, minY: -6 },
  menuFocus: [0, 12, -110],

  palette: {
    skyZenith: 0x89b7e8,
    skyHorizon: 0xdbe7ef,
    skyGround: 0x6a6f66,
    fogColor: 0xc6d0da, fogNear: 60, fogFar: 560,
    sunColor: 0xfff1de, sunIntensity: 2.6, sunOffset: [55, 85, 35],
    hemiSky: 0xe9f2fb, hemiGround: 0x606468, hemiIntensity: 0.9,
    concrete: 0x9aa0a6, dark: 0x7f858c, girder: 0x666c75, accent: 0xc9522f,
    mountain: 0x7c8894, cloud: 0xffffff, cloudOpacity: 0.5,
    ground: 0x8a8f85, groundY: -2.05
  },

  // [x, y, z, sx, sy, sz, material, [rotX, rotY, rotZ]?]
  boxes: [
    // ---- ground slab (crashing into it ends the run) ----
    [0, -2, -90, 240, 4, 430, 'concrete'],
    // ---- perimeter walls ----
    [-73, 7, -90, 4, 18, 430, 'girder'],
    [73, 7, -90, 4, 18, 430, 'girder'],
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
    // cross girders linking pillar tops — prime grapple rails
    [-5, 10.5, -15, 1.2, 1.2, 24, 'girder'],
    [5, 10.5, -15, 1.2, 1.2, 24, 'girder'],

    // ---- zone 4: the wall with a window (z = -75) ----
    // window: x in [-3, 3], y in [7, 13] — 6 m wide, 6 m tall at speed
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
    // floating slabs beside the pyramid for swing practice
    [-26, 8, -140, 6, 1, 10, 'girder'],
    [26, 12, -140, 6, 1, 10, 'girder'],

    // ---- zone 6: slope wall + arch (z = -175 / -188) ----
    [0, 8.5, -175, 40, 1.6, 26, 'dark', [-0.58, 0, 0]],
    [-6, 12, -188, 3, 24, 3, 'girder'],
    [6, 12, -188, 3, 24, 3, 'girder'],
    [0, 24.5, -188, 15, 3, 3, 'accent'],

    // ---- zone 7: kicker ramp (z = -215) ----
    [0, 5, -215, 14, 1.6, 14, 'dark', [-0.42, 0, 0]],

    // ---- zone 8: finish tower (z = -260) ----
    [0, 10, -260, 10, 24, 10, 'dark'],
    [0, 22.2, -260, 6, 0.4, 6, 'accent']
  ],

  // decoration-only geometry (no colliders)
  props: [
    { t: 'pipe', p: [-5, 11.6, -10], len: 18, axis: 'z' },
    { t: 'pipe', p: [5, 11.6, -20], len: 18, axis: 'z' },
    { t: 'pipe', p: [-26, 9.3, -140], len: 8, axis: 'x' },
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
    { t: 'antenna', p: [-24, 0, -95] }
  ],

  target: { p: [0, 24.8, -260], r: 2.4 }
}
