/**
 * Missile — the player entity.
 *
 * A dynamic Rapier rigid body with:
 *  - locked rotations: we steer by writing the orientation directly from
 *    accumulated mouse yaw/pitch (FPS-style), physics never tumbles it
 *  - CCD enabled: at 100+ m/s we would tunnel straight through thin girders
 *  - zero linear damping: velocity persists — the whole point of Dumbfire
 *  - gravity scale toggled: 0 while waiting on the pad, 1 once launched
 *
 * Orientation convention: forward is local -Z (three.js camera convention),
 * so yaw=0/pitch=0 faces down the course (-Z).
 */
import * as THREE from 'three'
import { RAPIER } from '../physics/PhysicsWorld.js'
import { CFG } from '../config.js'

// Module-level scratch objects (avoid per-frame allocations)
const _euler = new THREE.Euler(0, 0, 0, 'YXZ')
const _quat = new THREE.Quaternion()
const _fwd = new THREE.Vector3()

export class Missile {
  /**
   * @param {import('../physics/PhysicsWorld.js').PhysicsWorld} physics
   * @param {THREE.Scene} scene
   */
  constructor (physics, scene) {
    this.physics = physics
    this.scene = scene

    // --- steering state -----------------------------------------------------
    this.yaw = 0       // around world +Y
    this.pitch = 0     // around local +X, clamped to avoid gimbal flip
    this._prevYaw = 0  // for banking visual
    this._bank = 0     // current cosmetic roll (rad)

    // --- physics body -------------------------------------------------------
    const s = CFG.missile.spawn
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(s.x, s.y, s.z)
      .setLinearDamping(0)      // NO auto-braking — momentum is everything
      .setAngularDamping(1)
      .setCcdEnabled(true)       // fast projectile, thin girders
      .setCanSleep(false)
      .lockRotations()           // orientation is ours, not the solver's

    this.body = physics.world.createRigidBody(bodyDesc)

    const he = CFG.missile.halfExtents
    this.collider = physics.world.createCollider(
      RAPIER.ColliderDesc.cuboid(he.x, he.y, he.z)
        .setTranslation(0, 0, CFG.missile.colliderOffsetZ)
        .setMass(CFG.missile.mass)
        .setFriction(0.6)
        .setRestitution(0.05)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      this.body
    )
    physics.tag(this.collider, 'missile')

    // Frozen (no gravity) until the player launches
    this.body.setGravityScale(0, true)

    // --- visuals ------------------------------------------------------------
    this.mesh = this._buildMesh()
    this.glowMat = this.mesh.userData.glowMat
    scene.add(this.mesh)
  }

  /** Build the low-poly blocky missile mesh (root group + bank group). */
  _buildMesh () {
    const root = new THREE.Group()
    const bank = new THREE.Group() // cosmetic roll only, physics stays yaw/pitch
    root.add(bank)
    root.userData.bank = bank

    const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({
      color, flatShading: true, roughness: 0.6, metalness: 0.25, ...opts
    })

    // Fuselage — slightly longer than the collider is wide
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 2.6), mat(0xd8dbe0))
    bank.add(fuselage)

    // Red band + nose cone (4 segments = blocky pyramid nose)
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.74, 0.32), mat(0xd2372a))
    band.position.z = -0.55
    bank.add(band)

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), mat(0xd2372a))
    nose.rotation.x = -Math.PI / 2 // apex points -Z (forward)
    nose.position.z = -1.9
    bank.add(nose)

    // Tail ring + 4 fins
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.86, 0.5), mat(0x54595f))
    tail.position.z = 1.25
    bank.add(tail)

    const finGeoX = new THREE.BoxGeometry(0.95, 0.14, 0.8)
    const finGeoY = new THREE.BoxGeometry(0.14, 0.95, 0.8)
    const finMat = mat(0x3b3f45)
    for (const [geo, x, y] of [
      [finGeoX, 0.62, 0], [finGeoX, -0.62, 0],
      [finGeoY, 0, 0.62], [finGeoY, 0, -0.62]
    ]) {
      const fin = new THREE.Mesh(geo, finMat)
      fin.position.set(x, y, 0.95)
      bank.add(fin)
    }

    // Exhaust glow — a small emissive box behind the nozzle whose intensity
    // reacts to thrust / boost state
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xff8c3a, emissive: 0xff6a00, emissiveIntensity: 0.7, flatShading: true
    })
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.28), glowMat)
    glow.position.z = 1.6
    bank.add(glow)
    root.userData.glowMat = glowMat

    root.traverse((o) => { if (o.isMesh) o.castShadow = true })
    return root
  }

  // ---------------------------------------------------------------- getters

  /** Fresh THREE.Vector3 of the body position. */
  get position () {
    const t = this.body.translation()
    return new THREE.Vector3(t.x, t.y, t.z)
  }

  /** Fresh THREE.Quaternion of the body orientation. */
  get quaternion () {
    const r = this.body.rotation()
    return new THREE.Quaternion(r.x, r.y, r.z, r.w)
  }

  /** Current speed in m/s. */
  get speed () {
    const v = this.body.linvel()
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  }

  /** Unit forward vector (local -Z in world space). Pass `out` to reuse. */
  forward (out = new THREE.Vector3()) {
    return out.set(0, 0, -1).applyQuaternion(this.quaternion)
  }

  // ---------------------------------------------------------------- steering

  /**
   * Apply mouse look (pixel deltas) to yaw/pitch and write the resulting
   * orientation to the body immediately, so the very next physics step and
   * the render both use the fresh rotation.
   */
  applyLook (dx, dy) {
    if (!dx && !dy) return
    this.yaw -= dx * CFG.missile.lookSens
    this.pitch = THREE.MathUtils.clamp(
      this.pitch - dy * CFG.missile.lookSens,
      -CFG.missile.maxPitch, CFG.missile.maxPitch
    )
    this._syncBodyRotation()
  }

  _syncBodyRotation () {
    _euler.set(this.pitch, this.yaw, 0)
    _quat.setFromEuler(_euler)
    this.body.setRotation({ x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w }, true)
  }

  // ---------------------------------------------------------------- forces

  /**
   * Per-physics-step forces. Runs inside the fixed-step loop, so `stepDt`
   * is already bullet-time scaled. Thrust is applied as an impulse of
   * a*dt along the nose.
   */
  preStep (stepDt, thrustHeld) {
    if (!thrustHeld) return
    this.forward(_fwd)
    const j = CFG.missile.thrustAccel * stepDt * CFG.missile.mass
    this.body.applyImpulse({ x: _fwd.x * j, y: _fwd.y * j, z: _fwd.z * j }, true)
  }

  /** Apply an arbitrary acceleration (m/s^2) for one step. Used by Boost. */
  applyAcceleration (accel, stepDt) {
    const j = stepDt * CFG.missile.mass
    this.body.applyImpulse({ x: accel.x * j, y: accel.y * j, z: accel.z * j }, true)
  }

  // ---------------------------------------------------------------- states

  /** Let gravity act + ignition kick — called when the run starts. */
  launch () {
    this.body.setGravityScale(1, true)
    // A dumbfire missile is already flying the moment it launches
    this.forward(_fwd)
    const j = CFG.missile.launchSpeed * CFG.missile.mass
    this.body.applyImpulse({ x: _fwd.x * j, y: _fwd.y * j, z: _fwd.z * j }, true)
  }

  /** Deploy/stow the drag chute by switching linear damping. */
  setChute (on) {
    this.body.setLinearDamping(on ? CFG.chute.linearDamping : 0)
  }

  /** Full reset to launch-pad state. */
  reset () {
    const s = CFG.missile.spawn
    this.yaw = 0
    this.pitch = 0
    this._prevYaw = 0
    this._bank = 0
    this.body.setTranslation({ x: s.x, y: s.y, z: s.z }, true)
    this._syncBodyRotation()
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    this.body.setGravityScale(0, true)
    this.body.setLinearDamping(0)
    this.setVisible(true)
    this.updateVisual(0.016, { state: 'ready', thrusting: false, boosting: false })
  }

  setVisible (v) { this.mesh.visible = v }

  // ---------------------------------------------------------------- visuals

  /**
   * Sync mesh to body, animate banking (roll into turns), idle bob while
   * waiting on the pad, and the exhaust glow intensity.
   */
  updateVisual (dt, ctx) {
    if (!this.mesh.visible && ctx.state === 'crashed') return

    const t = this.body.translation()
    const r = this.body.rotation()
    this.mesh.position.set(t.x, t.y, t.z)
    this.mesh.quaternion.set(r.x, r.y, r.z, r.w)

    // Banking: roll into the turn proportional to yaw rate, smoothed
    const yawRate = dt > 0 ? (this.yaw - this._prevYaw) / dt : 0
    this._prevYaw = this.yaw
    this._bank = THREE.MathUtils.damp(
      this._bank,
      THREE.MathUtils.clamp(yawRate * 0.65, -1.15, 1.15),
      7, dt
    )
    this.mesh.userData.bank.rotation.z = this._bank

    // Idle bob on the launch pad
    if (ctx.state === 'ready') {
      this.mesh.position.y += Math.sin(performance.now() * 0.002) * 0.18
    }

    // Exhaust glow tracks thrust state
    const target = ctx.boosting ? 4.5 : ctx.thrusting ? 3.0 : 0.7
    this.glowMat.emissiveIntensity = THREE.MathUtils.damp(
      this.glowMat.emissiveIntensity, target, 8, dt
    )
  }
}
