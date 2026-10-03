/**
 * Boost — short high-acceleration burst on SHIFT.
 *
 * Pure state machine (the Game applies the actual acceleration along the
 * missile's current nose direction, so the burst stays steerable).
 *
 * Timers: the burst duration counts in *game* time (bullet-time stretches
 * the burst — by design), the cooldown counts in *real* time so slow-mo
 * never punishes you with a longer wait.
 */
import { CFG } from '../config.js'

const STATE = {
  READY: 'ready',
  ACTIVE: 'active',
  COOLDOWN: 'cooldown'
}

export class Boost {
  constructor () {
    this.state = STATE.READY
    this._t = 0 // seconds left in the current state
  }

  /** SHIFT pressed — ignite if the booster is charged. */
  tryActivate () {
    if (this.state !== STATE.READY) return false
    this.state = STATE.ACTIVE
    this._t = CFG.boost.duration
    return true
  }

  /**
   * @param {number} dtGame  bullet-time scaled dt (burn duration)
   * @param {number} dtReal  real dt (cooldown)
   */
  update (dtGame, dtReal) {
    if (this.state === STATE.ACTIVE) {
      this._t -= dtGame
      if (this._t <= 0) {
        this.state = STATE.COOLDOWN
        this._t = CFG.boost.cooldown
      }
    } else if (this.state === STATE.COOLDOWN) {
      this._t -= dtReal
      if (this._t <= 0) {
        this.state = STATE.READY
        this._t = 0
      }
    }
  }

  reset () {
    this.state = STATE.READY
    this._t = 0
  }

  get active () { return this.state === STATE.ACTIVE }

  /** Acceleration to apply this step (m/s^2) — 0 when not burning. */
  get accel () { return this.active ? CFG.boost.accel : 0 }

  /** 0..1 fill for the HUD cooldown bar. */
  get hudRatio () {
    if (this.state === STATE.READY || this.state === STATE.ACTIVE) return 1
    return 1 - this._t / CFG.boost.cooldown
  }
}
