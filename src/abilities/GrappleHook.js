/**
 * GrappleHook — the key movement ability.
 *
 * Fire (LMB): raycast along the missile nose; if it hits level geometry
 * within range we attach a rope of exactly the current distance.
 *
 * Rope physics (run every physics step while attached):
 *  - when taut (dist > ropeLength) the *outward radial velocity component
 *    is cancelled*, so all momentum is redirected tangentially — this is
 *    what produces loss-less slingshot swings around corners
 *  - a soft "stretch recovery" acceleration pulls the missile back toward
 *    the rope sphere so the rope does not visually rubber-band
 *  - an emergency positional clamp stops pathological stretch (e.g. after
 *    teleport-ish situations or huge boost directly away from the anchor)
 *
 * Release (LMB again): rope gone, momentum kept.
 */
import * as THREE from 'three'
import { CFG } from '../config.js'

const _dir = new THREE.Vector3()
const _tail = new THREE.Vector3()
const _mid = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)

export class GrappleHook {
  /**
   * @param {import('../physics/PhysicsWorld.js').PhysicsWorld} physics
   * @param {import('../entities/Missile.js').Missile} missile
   * @param {THREE.Scene} scene
   */
  constructor (physics, missile, scene) {
    this.physics = physics
    this.missile = missile

    this.attached = false
    this.anchor = new THREE.Vector3()
    this.ropeLength = 0

    /** True when a raycast this frame would attach — drives the crosshair. */
    this.canAttach = false

    /** HUD status: 'READY' | 'ATTACHED' | 'OUT_OF_RANGE' */
    this.status = 'READY'
    this._statusTimer = 0

    // --- visuals ------------------------------------------------------------
    // Rope = thin cylinder stretched between tail and anchor.
    this.ropeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1, 6, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe066 })
    )
    this.ropeMesh.visible = false
    this.ropeMesh.frustumCulled = false

    this.anchorMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45),
      new THREE.MeshBasicMaterial({ color: 0xffd24a })
    )
    this.anchorMesh.visible = false
    this.anchorMesh.frustumCulled = false

    scene.add(this.ropeMesh, this.anchorMesh)
  }

  /** LMB behaviour: fire when free, release when attached. */
  toggle () {
    if (this.attached) this.release()
    else this.fire()
  }

  /** Attempt to hook whatever the nose is pointing at. */
  fire () {
    const p = this.missile.position
    const f = this.missile.forward()
    const hit = this.physics.raycast(
      p.x, p.y, p.z, f.x, f.y, f.z, CFG.grapple.maxRange, this.missile.body
    )

    if (hit && this.physics.tagOf(hit.collider.handle) === 'level') {
      this.anchor.set(hit.x, hit.y, hit.z)
      // Hook at exactly the current distance — taut from the first frame
      this.ropeLength = Math.max(hit.dist, 2)
      this.attached = true
      this.status = 'ATTACHED'
    } else {
      this.status = 'OUT_OF_RANGE'
      this._statusTimer = 0.8
    }
  }

  release () {
    this.attached = false
    this.status = 'READY'
    this.ropeMesh.visible = false
    this.anchorMesh.visible = false
  }

  /**
   * One cheap raycast per render frame purely for crosshair feedback
   * (turns the reticle green when a hook is possible).
   */
  updateAim () {
    if (this.attached) { this.canAttach = true; return }
    const p = this.missile.position
    const f = this.missile.forward()
    const hit = this.physics.raycast(
      p.x, p.y, p.z, f.x, f.y, f.z, CFG.grapple.maxRange, this.missile.body
    )
    this.canAttach = !!(hit && this.physics.tagOf(hit.collider.handle) === 'level')
  }

  /** Decay the transient OUT_OF_RANGE status for the HUD. */
  update (dt) {
    if (this._statusTimer > 0) {
      this._statusTimer -= dt
      if (this._statusTimer <= 0 && !this.attached) this.status = 'READY'
    }
  }

  /**
   * Rope constraint — runs BEFORE world.step() each physics step.
   * @param {number} stepDt bullet-time scaled step duration
   */
  preStep (stepDt) {
    if (!this.attached) return

    const body = this.missile.body
    const p = body.translation()

    // Vector missile -> anchor
    let ax = this.anchor.x - p.x
    let ay = this.anchor.y - p.y
    let az = this.anchor.z - p.z
    const d = Math.hypot(ax, ay, az)
    if (d <= this.ropeLength || d < 1e-6) return // slack rope — no force

    // Unit direction toward the anchor
    const inv = 1 / d
    ax *= inv; ay *= inv; az *= inv

    // Remove the outward radial velocity component (rope can only pull).
    // Everything tangential survives -> perfect momentum-preserving swing.
    const v = body.linvel()
    let vx = v.x, vy = v.y, vz = v.z
    const radial = vx * ax + vy * ay + vz * az
    if (radial < 0) {
      vx -= ax * radial
      vy -= ay * radial
      vz -= az * radial
    }

    // Soft stretch recovery — acceleration proportional to overshoot
    const kick = (d - this.ropeLength) * CFG.grapple.recover * stepDt
    vx += ax * kick
    vy += ay * kick
    vz += az * kick

    body.setLinvel({ x: vx, y: vy, z: vz }, true)

    // Emergency positional clamp for extreme stretch
    const maxLen = this.ropeLength * CFG.grapple.hardStretch
    if (d > maxLen) {
      body.setTranslation({
        x: this.anchor.x - ax * maxLen,
        y: this.anchor.y - ay * maxLen,
        z: this.anchor.z - az * maxLen
      }, true)
    }
  }

  /** Stretch the rope cylinder between missile tail and anchor. */
  updateVisual () {
    this.ropeMesh.visible = this.attached
    this.anchorMesh.visible = this.attached
    if (!this.attached) return

    this.anchorMesh.rotation.y += 0.03
    this.anchorMesh.rotation.x += 0.017

    const m = this.missile
    _tail.set(0, 0, 1.6).applyQuaternion(m.quaternion).add(m.position) // local +Z = tail
    _dir.copy(this.anchor).sub(_tail)
    const len = Math.max(_dir.length(), 0.001)
    _dir.multiplyScalar(1 / len)

    _mid.copy(_tail).addScaledVector(_dir, len * 0.5)
    this.ropeMesh.position.copy(_mid)
    this.ropeMesh.scale.set(1, len, 1)
    this.ropeMesh.quaternion.setFromUnitVectors(_up, _dir)
    this.anchorMesh.position.copy(this.anchor)
  }

  /** Rounded rope length for the HUD chip. */
  get hudLength () { return Math.round(this.ropeLength) }
}
