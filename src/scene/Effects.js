/**
 * Effects — facade over the particle pools:
 *  - exhaust trail (engine idle / thrust / boost rates, color shifts white-hot on boost)
 *  - drag-chute smoke puffs
 *  - explosion burst + light flash (crash)
 *  - red firework burst (target destroyed)
 *
 * All bursts share one "burst" pool; the exhaust has its own so a long trail
 * never starves explosions.
 */
import * as THREE from 'three'
import { ParticleSystem } from './particles.js'
import { CFG } from '../config.js'

// Emission color palettes (linear-ish RGB, additive blended)
const EXHAUST_COLORS = [
  [1.0, 0.45, 0.12], // orange
  [1.0, 0.72, 0.30], // amber
  [1.0, 0.92, 0.70]  // near white
]
const BOOST_COLORS = [
  [1.0, 0.95, 0.80],
  [1.0, 0.80, 0.40],
  [0.90, 0.95, 1.00] // hint of blue-white
]
const FIRE_COLORS = [
  [1.0, 0.85, 0.55],
  [1.0, 0.40, 0.10],
  [0.90, 0.15, 0.05],
  [0.55, 0.50, 0.45] // sparse dark smoke
]

const rand = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[(Math.random() * arr.length) | 0]

export class Effects {
  /** @param {import('./GameScene.js').GameScene} gameScene */
  constructor (gameScene) {
    const scene = gameScene.scene
    this.scene = scene

    this.exhaust = new ParticleSystem(scene, 900, { gravity: -1.5, drag: 0.8 })
    this.puffs = new ParticleSystem(scene, 300, { gravity: -0.8, drag: 0.6 })
    this.burst = new ParticleSystem(scene, 500, { gravity: -22, drag: 1.6 })

    // Single reusable flash light for explosions / fireworks
    this.flash = new THREE.PointLight(0xffa050, 0, 160, 2)
    scene.add(this.flash)
    this._flashI = 0

    this._exAcc = 0
    this._puffAcc = 0

    // Keep particle screen-size stable across window resizes
    gameScene.onResize((h) => {
      this.exhaust.setScale(h)
      this.puffs.setScale(h)
      this.burst.setScale(h)
    })
  }

  /**
   * Continuous exhaust emission from the missile tail.
   * @param {number} dt
   * @param {THREE.Vector3} tail world position of the nozzle
   * @param {THREE.Vector3} fwd missile forward (-Z) — exhaust drifts backward
   * @param {boolean} thrusting SPACE held
   * @param {boolean} boosting boost burst active
   */
  emitExhaust (dt, tail, fwd, thrusting, boosting) {
    const rate = boosting ? CFG.trail.rateBoost
      : thrusting ? CFG.trail.rateThrust
        : CFG.trail.rateIdle
    this._exAcc += rate * dt
    let n = this._exAcc | 0
    this._exAcc -= n

    const palette = boosting ? BOOST_COLORS : EXHAUST_COLORS
    const back = boosting ? 16 : 8
    const spread = boosting ? 0.34 : 0.18

    for (; n > 0; n--) {
      const c = pick(palette)
      this.exhaust.spawn(
        tail.x + rand(-spread, spread),
        tail.y + rand(-spread, spread),
        tail.z + rand(-spread, spread),
        -fwd.x * back * rand(0.4, 1) + rand(-2, 2),
        -fwd.y * back * rand(0.4, 1) + rand(-2, 2),
        -fwd.z * back * rand(0.4, 1) + rand(-2, 2),
        boosting ? rand(0.22, 0.55) : rand(0.35, 0.8),
        (boosting ? 1.25 : 1) * rand(0.5, 1.05),
        c[0], c[1], c[2]
      )
    }
  }

  /** White-ish smoke from the drag chute. */
  emitChutePuff (dt, pos) {
    this._puffAcc += 30 * dt
    let n = this._puffAcc | 0
    this._puffAcc -= n
    for (; n > 0; n--) {
      this.puffs.spawn(
        pos.x + rand(-0.4, 0.4),
        pos.y + rand(-0.4, 0.4),
        pos.z + rand(-0.4, 0.4),
        rand(-1.5, 1.5), rand(-1.5, 1.5), rand(-1.5, 1.5),
        rand(0.9, 1.5),
        rand(0.55, 0.95),
        0.62, 0.63, 0.68
      )
    }
  }

  /** Crash: fireball + flash + lingering embers. */
  explosionAt (p) {
    this._spawnBurst(p, CFG.explosion.count, 6, 55, FIRE_COLORS, 0.7, 2.6)
    this.flash.position.copy(p)
    this.flash.color.set(0xffa050)
    this._flashI = CFG.explosion.flashIntensity
  }

  /** Target destroyed: red/white firework. */
  fireworksAt (p) {
    const palette = [[1.0, 0.25, 0.15], [1.0, 0.95, 0.85], [1.0, 0.70, 0.30]]
    this._spawnBurst(p, 280, 5, 42, palette, 0.7, 2.2)
    this.flash.position.copy(p)
    this.flash.color.set(0xff4030)
    this._flashI = 260
  }

  _spawnBurst (p, count, minSpeed, maxSpeed, palette, minLife, maxLife) {
    for (let i = 0; i < count; i++) {
      // Uniform random direction on a sphere
      const u = Math.random() * 2 - 1
      const phi = Math.random() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      // Bias speeds downward (sqrt) for a denser core
      const speed = maxSpeed * Math.sqrt(Math.random()) + minSpeed * 0.3
      const c = pick(palette)
      this.burst.spawn(
        p.x, p.y, p.z,
        s * Math.cos(phi) * speed,
        u * speed,
        s * Math.sin(phi) * speed,
        rand(minLife, maxLife),
        rand(0.7, 2.4),
        c[0], c[1], c[2]
      )
    }
  }

  /** Advance all particles + decay the flash light. */
  update (dt) {
    this.exhaust.update(dt)
    this.puffs.update(dt)
    this.burst.update(dt)

    if (this._flashI > 0) {
      this._flashI *= Math.exp(-6 * dt)
      if (this._flashI < 0.5) this._flashI = 0
      this.flash.intensity = this._flashI
    }
  }

  /** Clear everything (run restart). */
  reset () {
    this.exhaust.clear()
    this.puffs.clear()
    this.burst.clear()
    this._flashI = 0
    this.flash.intensity = 0
    this._exAcc = 0
    this._puffAcc = 0
  }
}
