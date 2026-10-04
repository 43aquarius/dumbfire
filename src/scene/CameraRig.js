/**
 * CameraRig — smooth third-person chase camera.
 *
 * Sits above and behind the missile (offset applied in missile space so it
 * follows pitch too), looks at a point ahead of the nose, and adds:
 *  - exponential smoothing (position slower than look-at -> speed sensation)
 *  - speed-based pull-back: the camera drifts further back as you accelerate
 *  - FOV kicks: thrust, boost, bullet-time and raw speed each pull the FOV
 *  - roll-lean: the whole camera banks with the missile's turn (up-vector tilt)
 *  - trauma-based camera shake (crashes, boost rumble)
 *  - slow orbits for the menu / crash / target end-of-run views
 */
import * as THREE from 'three'
import { CFG } from '../config.js'

const _desiredPos = new THREE.Vector3()
const _desiredLook = new THREE.Vector3()
const _off = new THREE.Vector3()
const _fwd = new THREE.Vector3()

export class CameraRig {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {Missile} missile (for the initial framing only)
   * @param {{mobile?: boolean}} opts touch profile — wider FOV + more pull-back
   */
  constructor (camera, missile, opts = {}) {
    this.cam = camera
    this.mobile = !!opts.mobile
    this.pos = new THREE.Vector3()
    this.look = new THREE.Vector3()
    this.trauma = 0
    this._shakeT = 0
    this._orbit = 0
    this._lean = 0
    this.fov = CFG.camera.fovBase
    /** Portrait FOV compensation — set by the GameScene via onResize(). */
    this.fovMul = 1

    // Start framed on the missile waiting on the pad
    _off.set(CFG.camera.offset.x, CFG.camera.offset.y, CFG.camera.offset.z)
      .applyQuaternion(missile.quaternion)
    this.pos.copy(missile.position).add(_off)
    this.look.copy(missile.position)
  }

  /** Add a unitless amount of shake (0..1). Squared when applied. */
  addTrauma (v) { this.trauma = Math.min(1, this.trauma + v) }

  /** Snap directly onto the missile (used right after a level load). */
  snapTo (missile) {
    _off.set(CFG.camera.offset.x, CFG.camera.offset.y, CFG.camera.offset.z)
      .applyQuaternion(missile.quaternion)
    this.pos.copy(missile.position).add(_off)
    this.look.copy(missile.position)
    this._orbit = 0
  }

  /**
   * @param {number} dt real dt
   * @param {object} ctx { missile, state, focus, thrusting, boostActive,
   *                       slowmo, speed, bank }
   */
  update (dt, ctx) {
    let posLerp, lookLerp

    if (ctx.state === 'menu' || ctx.state === 'crashed' || ctx.state === 'complete') {
      // Slow orbit around the focus point (target / crash / menu backdrop)
      this._orbit += dt * (ctx.state === 'menu' ? 0.12 : 0.3)
      const radius = ctx.state === 'menu' ? CFG.camera.menuRadius : 26
      const height = ctx.state === 'menu' ? CFG.camera.menuHeight : 10
      _desiredPos.set(Math.cos(this._orbit) * radius, height, Math.sin(this._orbit) * radius)
        .add(ctx.focus)
      _desiredLook.copy(ctx.focus)
      posLerp = 1 - Math.exp(-2.5 * dt)
      lookLerp = 1 - Math.exp(-4 * dt)
      this._lean = THREE.MathUtils.damp(this._lean, 0, 4, dt)
    } else {
      const m = ctx.missile
      // speed-based pull-back — camera trails further out at high speed
      // (touch devices pull back a touch more: thumbs + small screens)
      const pull = CFG.camera.pullbackMax * (this.mobile ? CFG.camera.touchPullbackMul : 1) *
        Math.min(1, (ctx.speed || 0) / CFG.camera.pullbackSpeed)
      _off.set(
        CFG.camera.offset.x,
        CFG.camera.offset.y,
        CFG.camera.offset.z + pull
      ).applyQuaternion(m.quaternion)
      _desiredPos.copy(m.position).add(_off)
      _desiredLook.copy(m.position).addScaledVector(m.forward(_fwd), CFG.camera.lookAhead)
      posLerp = 1 - Math.exp(-CFG.camera.posLerp * dt)
      lookLerp = 1 - Math.exp(-CFG.camera.lookLerp * dt)
    }

    this.pos.lerp(_desiredPos, posLerp)
    this.look.lerp(_desiredLook, lookLerp)
    if (this.pos.y < 1.2) this.pos.y = 1.2 // never dip below the floor

    // Trauma shake — smooth pseudo-noise from layered sines
    this.trauma = Math.max(0, this.trauma - CFG.camera.shakeDecay * dt)
    this._shakeT += dt * 34
    const s = this.trauma * this.trauma
    const ox = (Math.sin(this._shakeT * 1.7) + 0.6 * Math.sin(this._shakeT * 3.9)) * 1.1 * s
    const oy = (Math.sin(this._shakeT * 2.3 + 2) + 0.6 * Math.sin(this._shakeT * 4.7)) * 1.1 * s

    this.cam.position.set(this.pos.x + ox, this.pos.y + oy, this.pos.z)

    // Roll-lean: tilt the up-vector into the missile's bank so turns feel
    // weighty without ever disorienting (kept well below the missile's own roll)
    if (ctx.state === 'flying' || ctx.state === 'ready') {
      this._lean = THREE.MathUtils.damp(this._lean, -(ctx.bank || 0) * CFG.camera.rollLean, 6, dt)
    }
    this.cam.up.set(Math.sin(this._lean), Math.cos(this._lean), 0)
    this.cam.lookAt(this.look)

    // FOV state — thrust / boost / bullet-time / raw speed
    // (phones start a little wider; portrait phones get extra vertical FOV
    //  through fovMul so the horizontal view stays flyable)
    let targetFov = CFG.camera.fovBase +
      (this.mobile ? CFG.camera.touchFovBoost : 0)
    if (ctx.boostActive) targetFov = CFG.camera.fovBoost
    else if (ctx.thrusting) targetFov = CFG.camera.fovThrust
    if (ctx.slowmo) targetFov += CFG.camera.fovSlowmoDelta
    targetFov += CFG.camera.fovSpeedMax *
      Math.min(1, (ctx.speed || 0) / CFG.camera.pullbackSpeed)
    this.fov = THREE.MathUtils.damp(this.fov, targetFov * this.fovMul, 5, dt)
    this.cam.fov = this.fov
    this.cam.updateProjectionMatrix()
  }
}
