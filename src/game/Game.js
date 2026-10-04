/**
 * Game — the orchestrator. Owns the run state machine, the level list and
 * the main loop.
 *
 * States:
 *   menu     level-select screen (slow orbit around the current course)
 *   ready    missile parked on the pad (physics frozen, aiming allowed)
 *   flying   physics running, timer counting REAL seconds
 *   crashed  explosion playing, auto-restart after ui.restartDelay
 *   complete target hit, final time + best + next level
 *
 * Plus a `paused` flag: losing pointer lock mid-flight (desktop Esc) freezes
 * the simulation and the clock — click resumes exactly where you were.
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
import { Level } from '../scene/Level.js'

// Scratch vectors shared across the loop (avoid per-frame allocation)
const _tail = new THREE.Vector3()
const _fwd = new THREE.Vector3()

export class Game {
  /**
   * @param {object} deps {
   *   physics, scene (GameScene), input, hud, effects, cameraRig,
   *   missile, grapple, boost, bulletTime, chute,
   *   levels: array of level defs,
   *   getBest: (id) => number|null, setBest: (id, t) => void,
   *   touch: TouchControls|null }
   */
  constructor (deps) {
    Object.assign(this, deps)

    this.state = 'menu'
    this.levelIndex = 0
    this.level = null
    this.runTime = 0
    this.stateTimer = 0
    this.acc = 0 // real-time physics accumulator
    this.paused = false
    this.crashPoint = new THREE.Vector3()
    this.lastTime = performance.now()
    this._fxRamp = 1 // particle-clock factor right after a crash (slow-mo)

    // Route Rapier collision events into the state machine
    this.physics.onCollision = (h1, h2, started) => this._onCollision(h1, h2, started)

    // Backgrounding the app can swallow keyup/touchend — never leave ghost
    // input (especially a LATCHED engine) behind when we come back.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return
      this.input.clearAll()
      if (this.touch) this.touch.releaseAll()
    })

    // Boot into the menu with level 1 as the backdrop
    this.loadLevel(0)
    this.hud.menu()

    this._raf = (t) => this.frame(t)
    requestAnimationFrame(this._raf)
  }

  // ------------------------------------------------------------ level mgmt

  /** Build a level (colliders + visuals + palette) and park the missile. */
  loadLevel (i) {
    const def = this.levels[i]
    if (this.level) this.level.dispose()
    this.levelIndex = i
    this.level = new Level(this.physics, this.scene.scene, def, {
      mobile: CFG.quality.mobile
    })
    this.scene.applyPalette(def.palette)
    this.resetRun()
  }

  /** Wipe run state (missile, abilities, effects) onto the pad. */
  resetRun () {
    const def = this.levels[this.levelIndex]
    this.runTime = 0
    this.stateTimer = 0
    this.acc = 0
    this.paused = false
    this._fxRamp = 1

    // a latched engine from the previous run must not auto-launch the next
    if (this.touch) this.touch.releaseAll()

    this.missile.reset(def.spawn, def.spawn.yaw || 0)
    this.grapple.release()
    this.boost.reset()
    this.bulletTime.reset()
    this.chute.reset()
    this.effects.reset()
    this.cameraRig.snapTo(this.missile)
  }

  /** Card click / keys 1-3 — swap course and enter READY. */
  selectLevel (i) {
    if (i < 0 || i >= this.levels.length) return
    this.loadLevel(i)
    this.state = 'ready'
    if (this.touch) this.touch.setVisible(true)
    this.hud.reset(this.levels[i].name)
    this.hud.setHint(
      'MOUSE steer\u2002\u00b7\u2002SPACE thrust\u2002\u00b7\u2002LMB grapple\u2002\u00b7\u2002' +
      'SHIFT boost\u2002\u00b7\u2002RMB slow-mo\u2002\u00b7\u2002S chute\u2002\u00b7\u2002R restart\u2002\u00b7\u2002ESC menu'
    )
    if (!this.input.touchMode) this.input.requestLock()
  }

  /** Back to the level-select screen. */
  toMenu () {
    this.state = 'menu'
    this.resetRun()
    if (this.touch) this.touch.setVisible(false)
    this.hud.menu()
  }

  /** Retry / R key — restart the current level immediately. */
  restart () {
    this.resetRun()
    this.state = 'ready'
    if (this.touch) this.touch.setVisible(true)
    this.hud.reset(this.levels[this.levelIndex].name)
    if (!this.input.touchMode && !this.input.locked) this.input.requestLock()
  }

  /** Next level button / N key. */
  nextLevel () {
    const n = this.levelIndex + 1
    if (n < this.levels.length) this.selectLevel(n)
    else this.toMenu()
  }

  // ------------------------------------------------------------ state machine

  /** First thrust input leaves the pad: gravity on, clock running. */
  startRun () {
    const def = this.levels[this.levelIndex]
    this.state = 'flying'
    this.runTime = 0
    this.missile.launch(def.launchSpeed || CFG.missile.launchSpeed)
    this.cameraRig.addTrauma(0.18) // ignition kick
    this.hud.launch()
  }

  /** Missile touched level geometry (or left the course). */
  crash () {
    if (this.state !== 'flying') return
    this.state = 'crashed'
    this.stateTimer = 0
    this._fxRamp = CFG.explosion.slowStart // fireball starts in slow-mo

    this.crashPoint.copy(this.missile.position)
    this.effects.explosionAt(this.crashPoint)
    this.cameraRig.addTrauma(1.0)

    // drop any held/latched touch input so the auto-restart starts clean
    if (this.touch) this.touch.releaseAll()

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

    // free the touch layer: no latched engine / held buttons under the
    // end-of-run overlay, and the flight cluster itself isn't needed now
    if (this.touch) { this.touch.releaseAll(); this.touch.setVisible(false) }

    const def = this.levels[this.levelIndex]
    const prevBest = this.getBest(def.id)
    const isNew = prevBest === null || this.runTime < prevBest
    if (isNew) this.setBest(def.id, this.runTime)

    this.effects.fireworksAt(this.level.targetPosition)
    this.cameraRig.addTrauma(0.35)

    this.missile.setVisible(false)
    this.grapple.release()
    this.chute.reset()
    this.bulletTime.reset()
    this.hud.complete(this.runTime, isNew ? this.runTime : prevBest, isNew,
      this.levelIndex + 1 < this.levels.length)

    // free the cursor so the end-of-run buttons are clickable
    if (document.pointerLockElement) document.exitPointerLock()
  }

  /** Pointer lock gained/lost — pause mid-flight, menu from ready. */
  onLockChange (locked) {
    if (locked) {
      if (this.paused) {
        this.paused = false
        this.hud.paused(false)
      }
    } else {
      if (this.state === 'flying' && !this.input.touchMode) {
        this.paused = true
        this.hud.paused(true)
      } else if (this.state === 'ready' && !this.input.touchMode) {
        this.toMenu()
      }
    }
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

    // Global keys
    if (input.wasPressed('KeyR')) this.restart()
    if (this.state === 'menu') {
      if (input.wasPressed('Digit1')) this.selectLevel(0)
      if (input.wasPressed('Digit2')) this.selectLevel(1)
      if (input.wasPressed('Digit3')) this.selectLevel(2)
    } else if (this.state === 'complete') {
      if (input.wasPressed('KeyN')) this.nextLevel()
      if (input.wasPressed('KeyM')) this.toMenu()
    }

    if (this.state !== 'flying' || !this.paused) {
      switch (this.state) {
        case 'menu':
          this._updateMenu(dt)
          break
        case 'ready':
          this._updateReady(dt)
          break
        case 'flying':
          this._updateFlying(dt)
          break
        case 'crashed':
          this.stateTimer += dt
          this._fxRamp = Math.min(1,
            this._fxRamp + dt / CFG.explosion.slowRamp) // fireball speeds back up
          if (this.stateTimer > CFG.ui.restartDelay) this.restart()
          break
        case 'complete':
          this.stateTimer += dt
          break
      }
    }

    // ---- visuals (every state) ----
    const thrusting = this.state === 'flying' && input.isDown('Space') && !this.paused
    this.missile.updateVisual(dt, {
      state: this.state, thrusting, boosting: this.boost.active
    })
    this.chute.updateVisual(dt)
    this.grapple.updateVisual()
    this.hud.setVignette(this.bulletTime.active && this.state === 'flying' && !this.paused)

    // Particles age with GAME time while flying (bullet-time lingers them);
    // after a crash the ramp eases the fireball out of its slow-mo.
    const fxScale = this.state === 'flying'
      ? this.bulletTime.current
      : (this.state === 'crashed' ? this._fxRamp : 1)
    this.effects.update(dt * fxScale)
    this.level.update(dt)

    // Camera
    const def = this.levels[this.levelIndex]
    let focus = null
    if (this.state === 'menu') focus = this._menuFocus()
    else if (this.state === 'crashed') focus = this.crashPoint
    else if (this.state === 'complete') focus = this.level.targetPosition
    this.cameraRig.update(dt, {
      missile: this.missile,
      state: this.state,
      focus: focus || this.missile.position,
      thrusting,
      boostActive: this.boost.active,
      slowmo: this.bulletTime.active && this.state === 'flying',
      speed: this.missile.speed,
      bank: this.missile.bank
    })

    // Sun/shadow frustum follows the missile (or the explosion)
    this.scene.update(dt, this.state === 'flying' || this.state === 'ready'
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
      canHook: this.grapple.canAttach
    })

    input.endFrame()
    requestAnimationFrame(this._raf)
  }

  /** Orbit point for the menu backdrop camera. */
  _menuFocus () {
    const f = this.levels[this.levelIndex].menuFocus
    return new THREE.Vector3(f[0], f[1], f[2])
  }

  // ------------------------------------------------------------ state updates

  _updateMenu (dt) {
    // gentle exhaust idle while parked, purely for flavour
    this.missile.forward(_fwd)
    _tail.set(0, 0, 1.6).applyQuaternion(this.missile.quaternion).add(this.missile.position)
    this.effects.emitExhaust(dt * 0.5, _tail, _fwd, false, false)
  }

  _updateReady (dt) {
    const input = this.input
    // Aiming is allowed while parked
    if (input.locked) {
      const d = input.consumeMouseDelta()
      this.missile.applyLook(d.dx, d.dy)
    } else if (input.touchMode && this.touch) {
      const td = this.touch.lookDelta(dt, CFG.missile)
      if (td) this.missile.applyLookRad(td.yaw, td.pitch)
    }
    // Idle engine wisps
    this.missile.forward(_fwd)
    _tail.set(0, 0, 1.6).applyQuaternion(this.missile.quaternion).add(this.missile.position)
    this.effects.emitExhaust(dt, _tail, _fwd, false, false)

    if (input.wasPressed('Space')) this.startRun()
  }

  _updateFlying (dt) {
    const { input, missile, grapple, boost, bulletTime, chute } = this

    // 1) Steering — mouse (locked) or touch joystick
    if (input.locked) {
      const d = input.consumeMouseDelta()
      missile.applyLook(d.dx, d.dy)
    } else if (input.touchMode && this.touch) {
      const td = this.touch.lookDelta(dt, CFG.missile)
      if (td) missile.applyLookRad(td.yaw, td.pitch)
    }

    // 2) Ability edges — button edges only count while pointer-locked so
    //    the click that re-acquires lock never fires the grapple by accident.
    //    (Touch actions call grappleToggle()/bulletTimeToggle() directly.)
    if (input.locked && input.wasButtonPressed(0)) grapple.toggle()
    if (input.locked && input.wasButtonPressed(2)) bulletTime.toggle()
    if (input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight')) {
      if (boost.tryActivate()) {
        // punchy ignition: instant kick + a shake + a burst of sparks
        missile.forward(_fwd)
        missile.applyKick(_fwd, CFG.boost.kick)
        this.cameraRig.addTrauma(0.24)
        missile.forward(_fwd)
        _tail.set(0, 0, 1.6).applyQuaternion(missile.quaternion).add(missile.position)
        this.effects.emitExhaust(0.06, _tail, _fwd, true, true)
      }
    }
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

    // 6) Course bounds — flew off the map (per level)
    const p = missile.position
    const B = this.levels[this.levelIndex].bounds
    if (p.x < B.minX || p.x > B.maxX || p.z < B.minZ || p.z > B.maxZ ||
        p.y > B.maxY || p.y < B.minY) {
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

  // ------------------------------------------------------------ touch actions

  /** Touch hook button. */
  grappleToggle () {
    if (this.state === 'flying') this.grapple.toggle()
  }

  /** Touch slow-mo button. */
  bulletTimeToggle () {
    if (this.state === 'flying') this.bulletTime.toggle()
  }
}
