/**
 * BulletTime — right-mouse toggled slow motion.
 *
 * Rather than stepping the physics less often (which would look choppy),
 * the Game keeps stepping at a steady real-time 60 Hz but feeds the world
 * a dt multiplied by `current`. `current` ramps smoothly between 1 and the
 * bullet-time scale so entering/leaving slow motion feels like decelerating
 * through honey rather than hitting a wall.
 */
import { CFG } from '../config.js'
import * as THREE from 'three'

export class BulletTime {
  constructor () {
    this.active = false
    /** Smoothed time scale actually applied to physics steps. */
    this.current = 1
  }

  /** RMB — toggle. */
  toggle () { this.active = !this.active }

  /** Force a state (used when resetting the run). */
  set (v) { this.active = v }

  reset () {
    this.active = false
    this.current = 1
  }

  update (dt) {
    const target = this.active ? CFG.bulletTime.scale : 1
    this.current = THREE.MathUtils.damp(this.current, target, CFG.bulletTime.lerpRate, dt)
  }

  /** The multiplier the Game applies to the fixed step dt. */
  get scale () { return this.current }
}
