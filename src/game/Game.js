/**
 * Game — the orchestrator. Owns the run state machine and the main loop.
 *
 * States:
 *   ready    missile parked on the pad (physics frozen, aiming allowed)
 *   flying   physics running, timer counting REAL seconds
 *   crashed  explosion playing, auto-restart after ui.restartDelay
 *   complete target hit, final time shown
 *
 * Physics stepping model (bullet-time aware):
 *   A real-time accumulator produces a steady 60 steps/s. Each step advances
 *   the world by fixedDt * bulletTime.scale, so slow motion stays smooth
 *   (same step rate, smaller dt) while gravity/thrust integration stays
 *   physically consistent. The run timer always counts real seconds —
 *   bullet time buys control, never a better clock.
 */
import * as THREE from 'three'
import { CFG } from '../config.js'

// Scratch vectors shared across the loop (avoid per-frame allocation)
const _tail = new THREE.Vector3()
const _fwd = new THREE.Vector3()

export class Game {
  /**
   * @param {object} deps {
   *   physics, scene (GameScene), level, input, hud, effects,
   *   cameraRig, missile, grapple, boost, bulletTime, chute }
   */
  constructor (deps) {
    Object.assign(this, deps)

    this.state = 'ready'
    this.runTime = 0
    this.stateTimer = 0
    this.acc = 0 // real-time physics accumulator
    this.crashPoint = new THREE.Vector3()
    this.lastTime = performance.now()

    // Route Rapier collision events into the state machine
    this.physics.onCollision = (h1, h2, started) => this._onCollision(h1, h2, started)

    this.reset()

    this._raf = (t) => this.frame(t)
    requestAnimationFrame(this._raf)
  }

  // ------------------------------------------------------------ state machine

  /** Full reset to the launch pad. */
  reset () {
    this.state = 'ready'
    this.runTime = 0
    this.stateTimer = 0
    this.acc = 0

    this.missile.reset()
    this.grapple.release()
    this.boost.reset()
    this.bulletTime.reset()
    this.chute.reset()
    this.effects.reset()
    this.hud.reset()
  }

  /** First thrust input leaves the pad: gravity on, clock running. */
  startRun () {
    this.state = 'flying'
    this.runTime = 0
    this.missile.launch()
    this.hud.launch()
  }

  /** Missile touched level geometry (or left the course). */
  crash () {
    if (this.state !== 'flying') return
    this.state = 'crashed'
    this.stateTimer = 0

    this.crashPoint.copy(this.missile.position)
    this.effects.explosionAt(this.crashPoint)
    this.cameraRig.addTrauma(1.0)

    this.missile.setVisible(false)
    this.grapple.release()
    this.chute.reset()
    this.bulletTime.reset()
    this.hud.crash()
  }

  /** Missile touched the red target. */
  complete () {
    if (this.state !== 'flying') return
    this.state = 'complete'
    this.stateTimer = 0

    this.effects.fireworksAt(this.level.targetPosition)
    this.cameraRig.addTrauma(0.35)

    this.missile.setVisible(false)
    this.grapple.release()
    this.chute.reset()
    this.bulletTime.reset()
    this.hud.complete(this.runTime)
  }

  /** Rapier collision event router. */
  _onCollision (h1, h2, started) {
    if (!started || this.state !== 'flying') return
    const a = this.physics.tagOf(h1)
    const b = this.physics.tagOf(h2)
    const has = (t) => a === t || b === t
    if (has('missile') && has('level')) this.crash()
    else if (has('missile') && has('target')) this.complete()
  }

  // ------------------------------------------------------------ main loop

  frame (now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now
    const input = this.input

    // R restarts from anywhere, any time
    if (input.wasPressed('KeyR')) this.reset()

    switch (this.state) {
      case 'ready': this._updateReady(dt); break
      case 'flying': this._updateFlying(dt); break
      case 'crashed':
        this.stateTimer += dt
        if (this.stateTimer > CFG.ui.restartDelay) this.reset()
        break
      case 'complete': this.stateTimer += dt; break
    }

    // ---- visuals (every state) ----
    const thrusting = this.state === 'flying' && input.isDown('Space')
    this.missile.updateVisual(dt, {
      state: this.state, thrusting, boosting: this.boost.active
    })
    this.chute.updateVisual(dt)
    this.grapple.updateVisual()
    this.hud.setVignette(this.bulletTime.active && this.state === 'flying')

    // Particles age with GAME time while flying (bullet-time lingers them),
    // real time otherwise so explosions still animate after a crash.
    const fxScale = this.state === 'flying' ? this.bulletTime.current : 1
    this.effects.update(dt * fxScale)
    this.level.update(dt)

    // Camera
    const focus = this.state === 'crashed'
      ? this.crashPoint
      : (this.state === 'complete' ? this.level.targetPosition : null)
    this.cameraRig.update(dt, {
      missile: this.missile, state: this.state, focus,
      thrusting, boostActive: this.boost.active, slowmo: this.bulletTime.active
    })

    // Sun/shadow frustum follows the missile (or the explosion)
    this.scene.update(this.state === 'flying' || this.state === 'ready'
      ? this.missile.position
      : (focus || this.missile.position))
    this.scene.render()

    // HUD
    this.hud.update(dt, {
      state: this.state,
      time: this.runTime,
      speed: this.missile.speed,
      thrust: thrusting,
      boostRatio: this.boost.hudRatio,
      boostActive: this.boost.active,
      slowmo: this.bulletTime.active && this.state === 'flying',
      chute: this.chute.deployed,
      hooked: this.grapple.attached,
      hookLen: this.grapple.hudLength,
      hookStatus: this.grapple.status,
      canHook: this.grapple.canAttach,
      locked: input.locked
    })

    input.endFrame()
    requestAnimationFrame(this._raf)
  }

  // ------------------------------------------------------------ state updates

  _updateReady (dt) {
    const input = this.input
    // Aiming is allowed while parked
    if (input.locked) {
      const d = input.consumeMouseDelta()
      this.missile.applyLook(d.dx, d.dy)
    }
    // Idle engine wisps
    this.missile.forward(_fwd)
    _tail.set(0, 0, 1.6).applyQuaternion(this.missile.quaternion).add(this.missile.position)
    this.effects.emitExhaust(dt, _tail, _fwd, false, false)

    if (input.wasPressed('Space')) this.startRun()
  }

  _updateFlying (dt) {
    const { input, missile, grapple, boost, bulletTime, chute } = this

    // 1) Steering (mouse look, direct orientation write)
    if (input.locked) {
      const d = input.consumeMouseDelta()
      missile.applyLook(d.dx, d.dy)
    }

    // 2) Ability edges — button edges only count while pointer-locked so the
    //    click that re-acquires lock never fires the grapple by accident.
    if (input.locked && input.wasButtonPressed(0)) grapple.toggle()
    if (input.locked && input.wasButtonPressed(2)) bulletTime.toggle()
    if (input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight')) boost.tryActivate()
    chute.setDeployed(input.isDown('KeyS'))
    grapple.updateAim()
    grapple.update(dt)

    // 3) Ability timers — boost duration in game time, cooldown in real time
    const dtGame = dt * bulletTime.current
    boost.update(dtGame, dt)
    bulletTime.update(dt)

    // 4) Physics: fixed real-time steps, dt scaled by bullet time
    this.acc += dt
    const FIXED = CFG.physics.fixedDt
    let steps = 0
    while (this.acc >= FIXED && steps < CFG.physics.maxStepsPerFrame) {
      const stepDt = FIXED * bulletTime.current
      this.physics.setStepDt(stepDt)

      missile.preStep(stepDt, input.isDown('Space')) // main thrust impulse

      if (boost.active) { // super boost along the current nose
        missile.forward(_fwd).multiplyScalar(CFG.boost.accel)
        missile.applyAcceleration(_fwd, stepDt)
      }

      grapple.preStep(stepDt) // rope constraint before integration

      this.physics.step()
      this.acc -= FIXED
      steps++
    }
    if (steps === CFG.physics.maxStepsPerFrame) this.acc = 0 // dump backlog

    // 5) Collision consequences
    this.physics.drainCollisions()

    // 6) Course bounds — flew off the map
    const p = missile.position
    const B = CFG.bounds
    if (p.x < B.minX || p.x > B.maxX || p.z < B.minZ || p.z > B.maxZ ||
        p.y > B.maxY || p.y < -6) {
      this.crash()
      return
    }

    // 7) Run clock — REAL seconds, bullet time never buys a better time
    this.runTime += dt

    // 8) Exhaust trail
    missile.forward(_fwd)
    _tail.set(0, 0, 1.6).applyQuaternion(missile.quaternion).add(p)
    this.effects.emitExhaust(dt, _tail, _fwd, input.isDown('Space'), boost.active)
    if (chute.deployed) this.effects.emitChutePuff(dt, _tail)
  }
}
