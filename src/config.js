/**
 * DUMBFIRE — central tuning file.
 *
 * Every gameplay-relevant constant lives here so the *feel* of the game
 * can be iterated on without touching module code.
 */
export const CFG = {
  physics: {
    /** Real-time seconds between physics steps (fixed timestep). */
    fixedDt: 1 / 60,
    /** Spiral-of-death guard for the accumulator loop. */
    maxStepsPerFrame: 5,
    /** World gravity (m/s^2). Slightly stronger than earth for gamey falls. */
    gravity: -13.0
  },

  missile: {
    mass: 110,                                   // kg
    spawn: { x: 0, y: 10, z: 55 },              // launch position (faces -Z)
    launchSpeed: 22,                            // m/s kick the moment the run starts
    thrustAccel: 62,                             // m/s^2 while SPACE is held
    lookSens: 0.0021,                            // rad of rotation per mouse pixel
    maxPitch: 1.48,                              // rad (~85 deg) — FPS-style steering
    halfExtents: { x: 0.38, y: 0.38, z: 1.55 },  // box-collider half sizes
    colliderOffsetZ: -0.35                       // collider centre pushed toward nose
  },

  boost: {
    accel: 250,      // m/s^2 extra acceleration during the burst
    duration: 0.6,   // s (counts in *game* time, so bullet-time stretches it)
    cooldown: 3.2    // s (counts in *real* time)
  },

  bulletTime: {
    scale: 0.28,     // physics time scale while active
    lerpRate: 7      // how fast time-scale ramps in/out (1/s)
  },

  chute: {
    linearDamping: 3.0   // Rapier linear damping while deployed (velocity ~halves every 0.23 s)
  },

  grapple: {
    maxRange: 120,   // m — max raycast distance
    recover: 10,     // stretch-recovery acceleration per metre of stretch (1/s^2)
    hardStretch: 1.6 // emergency positional clamp beyond this multiple of rope length
  },

  camera: {
    offset: { x: 0, y: 2.4, z: 8.5 }, // third-person rig offset in missile space (+Z = tail)
    lookAhead: 12,                    // look-at point this many metres ahead of the nose
    posLerp: 9,                       // position follow rate (1/s)
    lookLerp: 14,                     // look-at follow rate (1/s)
    fovBase: 74,
    fovThrust: 79,
    fovBoost: 90,
    fovSlowmoDelta: -12,
    shakeDecay: 1.5                    // trauma decay (1/s)
  },

  bounds: {
    minX: -70, maxX: 70,
    minZ: -300, maxZ: 110,
    maxY: 110
  },

  trail: {
    rateIdle: 12,    // particles/s engine idle
    rateThrust: 90,  // particles/s under thrust
    rateBoost: 220   // particles/s during super boost
  },

  explosion: {
    count: 240,
    flashIntensity: 320
  },

  ui: {
    restartDelay: 1.8,   // s before auto-restart after a crash
    hintFadeAfter: 9      // s before the controls hint dims
  }
}
