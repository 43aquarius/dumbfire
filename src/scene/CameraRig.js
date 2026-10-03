/**
 * CameraRig — smooth third-person chase camera.
 *
 * Sits above and behind the missile (offset applied in missile space so it
 * follows pitch too), looks at a point ahead of the nose, and adds:
 *  - exponential smoothing (position slower than look-at -> speed sensation)
 *  - FOV kicks: thrust, boost and bullet-time each pull the field of view
 *  - trauma-based camera shake (crashes, boost rumble)
 *  - a slow orbit around the crash/target point for the end-of-run views
 */
import * as THREE from 'three'
import { CFG } from '../config.js'

const _desiredPos = new THREE.Vector3()
const _desiredLook = new THREE.Vector3()
const _off = new THREE.Vector3()
const _fwd = new THREE.Vector3()

export class CameraRig {
  /** @param {THREE.PerspectiveCamera} camera */
  constructor (camera, missile) {
    this.cam = camera
    this.pos = new THREE.Vector3()
    this.look = new THREE.Vector3()
    this.trauma = 0
    this._shakeT = 0
    this._orbit = 0
    this.fov = CFG.camera.fovBase

    // Start framed on the missile waiting on the pad
    _off.set(CFG.camera.offset.x, CFG.camera.offset.y, CFG.camera.offset.z)
      .applyQuaternion(missile.quaternion)
    this.pos.copy(missile.position).add(_off)
    this.look.copy(missile.position)
  }

  /** Add a unitless amount of shake (0..1). Squared when applied. */
  addTrauma (v) { this.trauma = Math.min(1, this.trauma + v) }

  /**
   * @param {number} dt real dt
   * @param {object} ctx { missile, state, focus, thrusting, boostActive, slowmo }
   */
  update (dt, ctx) {
    let posLerp, lookLerp

    if (ctx.state === 'crashed' || ctx.state === 'complete') {
      // Slow orbit around the explosion / target
      this._orbit += dt * 0.3
      _desiredPos.set(Math.cos(this._orbit) * 26, 10, Math.sin(this._orbit) * 26)
        .add(ctx.focus)
      _desiredLook.copy(ctx.focus)
      posLerp = 1 - Math.exp(-2.5 * dt)
      lookLerp = 1 - Math.exp(-4 * dt)
    } else {
      const m = ctx.missile
      _off.set(CFG.camera.offset.x, CFG.camera.offset.y, CFG.camera.offset.z)
        .applyQuaternion(m.quaternion)
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
    this.cam.lookAt(this.look)

    // FOV state
    let targetFov = CFG.camera.fovBase
    if (ctx.boostActive) targetFov = CFG.camera.fovBoost
    else if (ctx.thrusting) targetFov = CFG.camera.fovThrust
    if (ctx.slowmo) targetFov += CFG.camera.fovSlowmoDelta
    this.fov = THREE.MathUtils.damp(this.fov, targetFov, 5, dt)
    this.cam.fov = this.fov
    this.cam.updateProjectionMatrix()
  }
}
