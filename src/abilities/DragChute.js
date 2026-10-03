/**
 * DragChute — hold S to rapidly bleed off velocity for sharp turns.
 *
 * Implemented as a strong Rapier linear damping on the missile body while
 * held (velocity roughly halves every 0.23 s). Also owns the cosmetic
 * drogue-chute cone on the missile tail and emits white smoke puffs.
 */
import * as THREE from 'three'
import { CFG } from '../config.js'

export class DragChute {
  /**
   * @param {import('../entities/Missile.js').Missile} missile
   * @param {THREE.Scene} scene
   */
  constructor (missile, scene) {
    this.missile = missile
    this.deployed = false
    this._visual = 0     // 0..1 chute deployment animation
    this._wobbleT = 0

    // Drogue chute: open cone, apex pointing back at the missile
    const chute = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 1.6, 8, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xe8863c, flatShading: true, roughness: 0.85,
        side: THREE.DoubleSide
      })
    )
    chute.rotation.x = -Math.PI / 2 // apex -> -Z (toward missile nose)
    chute.position.set(0, 0, 3.1)
    chute.scale.setScalar(0.001)
    chute.visible = false
    chute.castShadow = false
    this.mesh = chute
    missile.mesh.add(chute) // rides on the missile root, behind the tail
  }

  /** Called every frame with the raw key state. */
  setDeployed (v) {
    const next = !!v
    if (next !== this.deployed) {
      this.deployed = next
      this.missile.setChute(next) // switch body linear damping
    }
  }

  /** Animate the chute cone (deployment scale + fabric wobble). */
  updateVisual (dt) {
    this._visual = THREE.MathUtils.damp(this._visual, this.deployed ? 1 : 0, 10, dt)
    const vis = this._visual > 0.02
    this.mesh.visible = vis
    if (!vis) return
    this._wobbleT += dt
    const w = 1 + Math.sin(this._wobbleT * 9) * 0.06
    this.mesh.scale.set(this._visual * w, this._visual, this._visual * w)
  }

  reset () {
    this.deployed = false
    this._visual = 0
    this.mesh.visible = false
    this.missile.setChute(false)
  }
}
