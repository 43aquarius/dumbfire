/**
 * DUMBFIRE — central tuning file.
 *
 * Every gameplay-relevant constant lives here so the *feel* of the game
 * can be iterated on without touching module code.
 *
 * Per-level values (spawn, bounds, palette, layout) live in
 * src/scene/levels/*.js — this file only holds the cross-level feel.
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
    spawn: { x: 0, y: 10, z: 55, yaw: 0 },       // fallback birth position (levels override)
    launchSpeed: 22,                            // m/s kick the moment the run starts
    thrustAccel: 62,                             // m/s^2 while SPACE is held
    lookSens: 0.0021,                            // rad of rotation per mouse pixel
    maxPitch: 1.48,                              // rad (~85 deg) — FPS-style steering
    halfExtents: { x: 0.38, y: 0.38, z: 1.55 },  // box-collider half sizes
    colliderOffsetZ: -0.35,                      // collider centre pushed toward nose
    // --- touch steering (virtual joystick) ---
    touchYawRate: 2.6,      // rad/s at full stick deflection
    touchPitchRate: 2.05,   // rad/s at full stick deflection
    touchExpo: 1.35,        // stick response curve exponent (>1 = finer near centre)
    touchDeadzone: 0.07,    // ignore jitter below this deflection
    touchSmooth: 26,        // stick low-pass rate (1/s) — de-jitters noisy touch
    touchTapMs: 280         // press shorter than this counts as a TAP (latch/toggle)
  },

  boost: {
    accel: 250,      // m/s^2 extra acceleration during the burst
    kick: 9,         // m/s instant kick when the booster lights (feel)
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
    fovSpeedMax: 7,                   // extra FOV degrees at top speed (speed feel)
    pullbackMax: 3.2,                 // extra metres of camera pull-back at top speed
    pullbackSpeed: 85,                // speed (m/s) at which pull-back maxes out
    rollLean: 0.24,                   // camera rolls into turns with the missile bank
    shakeDecay: 1.5,                  // trauma decay (1/s)
    menuRadius: 46,                   // slow orbit radius on the menu screen
    menuHeight: 22,
    // --- touch / portrait compensation ---
    touchFovBoost: 4.5,               // extra base FOV on phones (small screens need context)
    touchPullbackMul: 1.18,           // camera sits further back on touch (thumbs occlude)
    portraitFovCap: 104               // max vertical FOV when held in portrait (deg)
  },

  trail: {
    rateIdle: 12,    // particles/s engine idle
    rateThrust: 90,  // particles/s under thrust
    rateBoost: 220   // particles/s during super boost
  },

  explosion: {
    count: 240,
    flashIntensity: 320,
    /** After a crash the particle clock ramps from this factor back to 1
     *  over crashFxDelay seconds — a short cinematic slow-mo of the fireball. */
    slowStart: 0.22,
    slowRamp: 0.55
  },

  ui: {
    restartDelay: 1.8,   // s before auto-restart after a crash
    hintFadeAfter: 9      // s before the controls hint dims
  },

  /** Filled in at boot by main.js — drives all mobile downgrades. */
  quality: {
    mobile: false,
    fxScale: 1,
    cloudCount: 26,
    mountainCount: 42,
    propDetail: 1        // 0 = skip small decorations (mobile), 1 = full
  }
}
