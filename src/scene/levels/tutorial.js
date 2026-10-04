/**
 * LEVEL 0 — "FIRST FLIGHT" (bright morning / flight school).
 *
 * A calm, brightly lit teaching course. Big roadside instruction boards
 * introduce every mechanic in flight order: steering -> thrust -> grapple ->
 * boost -> bullet-time -> chute -> the target. Gates are wide, corners are
 * gentle and the target is fat — the goal is comprehension, not challenge.
 *
 * Missile flies toward -Z.
 */

/** Wide gate: two flanking walls + accent lintel + hazard jambs. */
const gate = (z, cx, holeW = 15) => {
  const L = cx - holeW / 2
  const R = cx + holeW / 2
  return [
    [(-90 + L) / 2, 7, z, Math.max(4, L + 90), 14, 3, 'girder'],
    [(R + 90) / 2, 7, z, Math.max(4, 90 - R), 14, 3, 'girder'],
    [cx, 14.8, z, holeW + 1.6, 1.6, 3.4, 'accent'],
    [L + 0.4, 7, z - 1.7, 0.8, 13, 0.4, 'hazard'],
    [R - 0.4, 7, z - 1.7, 0.8, 13, 0.4, 'hazard']
  ]
}

export const LEVEL_T = {
  id: 'first-flight',
  name: 'FIRST FLIGHT',
  subtitle: '新手教学 · 飞行学院',
  tag: '教学',
  difficulty: 0,
  tutorial: true,
  hint: '跟着路牌学操作 · SPACE 起飞 · 命中红色目标球通关',

  spawn: { x: 0, y: 10, z: 60, yaw: 0 },
  launchSpeed: 20,
  bounds: { minX: -115, maxX: 115, minZ: -360, maxZ: 150, maxY: 150, minY: -6 },
  menuFocus: [0, 14, -60],

  palette: {
    skyZenith: 0x7fb2e6,
    skyHorizon: 0xeaf3fa,
    skyGround: 0x79836e,
    fogColor: 0xd6e3ec, fogNear: 70, fogFar: 620,
    sunColor: 0xfff4e0, sunIntensity: 2.7, sunOffset: [50, 90, 30],
    hemiSky: 0xeef5fc, hemiGround: 0x6a7460, hemiIntensity: 1.0,
    concrete: 0xa8b0a8, dark: 0x8c949a, girder: 0x6e7680, accent: 0xe8622c,
    mountain: 0x8a96a2, cloud: 0xffffff, cloudOpacity: 0.68,
    ground: 0x8fa878, groundY: -2.05,
    facade: 0xaab4be, trim: 0x50565c
  },

  boxes: [
    // ---- big friendly airfield ----
    [0, -2, -120, 230, 4, 480, 'concrete'],           // z +120 .. -360
    [0, 0.2, 60, 12, 0.4, 12, 'accent'],              // launch pad

    // ---- lesson 1: steering — weave the wide gates ----
    ...gate(18, -8),
    ...gate(-10, 8),
    ...gate(-38, 0, 16),

    // ---- lesson 2: thrust — the marked runway ----
    [0, 0.15, -62, 16, 0.3, 46, 'accent'],            // painted lane z -39..-85
    [-11, 4, -62, 1.2, 8, 46, 'girder'],              // low guide rails
    [11, 4, -62, 1.2, 8, 46, 'girder'],

    // ---- lesson 3: grapple — practice tower off the line ----
    [26, 21, -110, 10, 42, 10, 'girder'],
    [26, 42.4, -110, 7, 0.4, 7, 'hazard'],

    // ---- lesson 4: boost — long open speedway ----
    [-8, 5.5, -170, 4, 11, 4, 'concrete'],            // sparse slalom pylon
    [8, 5.5, -186, 4, 11, 4, 'concrete'],
    [-8, 5.5, -202, 4, 11, 4, 'concrete'],

    // ---- lesson 6: chute — the braking chicane before finals ----
    ...gate(-248, 0, 13),
    ...gate(-268, -7, 12),

    // ---- finals: target pedestal ----
    [0, 4.5, -315, 10, 9, 10, 'dark'],
    [0, 9.2, -315, 7, 0.4, 7, 'hazard']
  ],

  buildings: [
    // flight-school campus, well back from the line
    [55, 18, 18, 14, 12, 2, { rot: -0.5 }],
    [-62, -70, 16, 14, 26, 0],
    [62, -140, 18, 16, 34, 0],
    [-64, -210, 14, 14, 22, 1],
    [58, -260, 16, 14, 30, 0],
    [-118, -100, 18, 18, 46, 0, { far: true }],
    [118, -180, 20, 20, 56, 0, { far: true }],
    [-114, -280, 18, 18, 40, 0, { far: true }]
  ],

  props: [
    // ---- the lesson boards (in teaching order) ----
    { t: 'sign', p: [0, 12, 38], s: [13, 5], text: '移动鼠标 = 转向', sub: 'MOUSE / 摇杆 · 穿过前方大门' },
    { t: 'sign', p: [0, 12, -48], s: [13, 5], text: 'SPACE = 持续推进', sub: '按住加速 · 松开滑翔' },
    { t: 'sign', p: [0, 12, -88], s: [13, 5], text: 'LMB = 抓钩摆荡', sub: '瞄准右侧高塔 · 再按松开' },
    { t: 'sign', p: [0, 12, -136], s: [13, 5], text: 'SHIFT = 超级加速', sub: 'BOOST · 冷却约3秒' },
    { t: 'sign', p: [0, 12, -186], s: [13, 5], text: 'RMB = 子弹时间', sub: 'SLOW-MO · 穿过光环' },
    { t: 'sign', p: [0, 12, -230], s: [13, 5], text: 'S = 减速伞', sub: 'CHUTE · 稳住节奏过弯' },
    { t: 'sign', p: [0, 12, -284], s: [14, 5], text: '命中红色目标球!', sub: 'R = 重试 · ESC = 选关' },

    // grapple aim helper on the practice tower
    { t: 'antenna', p: [26, 42.4, -110] },
    // slow-mo practice hoop (frame is solid — thread the hole)
    { t: 'hoop', p: [0, 12, -202], r: 7.5 },
    // guidance rings along the line
    { t: 'ring', p: [0, 12, -62] },
    { t: 'ring', p: [0, 12, -158] },
    { t: 'ring', p: [0, 12, -224] },
    { t: 'ring', p: [0, 12, -296] },
    // airfield dressing
    { t: 'lightpole', p: [-16, 0, 20], h: 9 },
    { t: 'lightpole', p: [16, 0, -24], h: 9 },
    { t: 'lightpole', p: [-16, 0, -150], h: 9 },
    { t: 'lightpole', p: [16, 0, -232], h: 9 },
    { t: 'barrier', p: [-5, 0.6, 66] },
    { t: 'barrier', p: [5, 0.6, 66] },
    { t: 'crate', p: [-8, 0.8, 48] },
    { t: 'crate', p: [-9.6, 0.8, 49.2] },
    { t: 'vent', p: [-14, 0.5, 66] }
  ],

  target: { p: [0, 12.4, -315], r: 2.7 }
}
