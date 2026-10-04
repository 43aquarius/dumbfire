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
   * @param {{mobile?: boolean}} opts quality profile
   */
  constructor (physics, scene, opts = {}) {
    this.physics = physics
    this.scene = scene
    this.mobile = !!opts.mobile

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

    // Engine light — a small warm point light riding the nozzle so the
    // missile paints the geometry it flies past. Skipped on mobile.
    this.engineLight = null
    if (!this.mobile) {
      this.engineLight = new THREE.PointLight(0xff7a33, 0, 22, 2)
      this.engineLight.position.set(0, 0, 2.3)
      this.mesh.add(this.engineLight)
    }
  }

  /** Build the detailed low-poly missile mesh (root group + bank group). */
  _buildMesh () {
    const root = new THREE.Group()
    const bank = new THREE.Group() // cosmetic roll only, physics stays yaw/pitch
    root.add(bank)
    root.userData.bank = bank

    const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({
      color, flatShading: true, roughness: 0.6, metalness: 0.25, ...opts
    })
    // finishes tuned for the IBL environment: paint reads glossy, steel and
    // glass pick up the sky reflection
    const hull = mat(0xe2e6ea, { roughness: 0.42, metalness: 0.3 })   // light fuselage shell
    const hullPanel = mat(0xc2c7ce, { roughness: 0.48, metalness: 0.3 }) // two-tone panel tone
    const red = mat(0xd2372a, { roughness: 0.45 })
    const dark = mat(0x54595f, { roughness: 0.5, metalness: 0.35 })
    const finMat = mat(0x3b3f45, { roughness: 0.5, metalness: 0.3 })
    const steel = mat(0x2b2e33, { metalness: 0.85, roughness: 0.28 })
    const glass = mat(0x101418, { roughness: 0.1, metalness: 0.9 })
    const gold = mat(0xc9a44a, { metalness: 0.9, roughness: 0.3 })  // sensor gold trim

    // ---- fuselage: lathe profile, tail y=0 -> nose y=4.42 -------------------
    // (radius, profileY): boat-tail -> cylinder -> shoulder -> ogive tip
    const prof = [
      [0.30, 0.00], [0.40, 0.10], [0.47, 0.40], [0.47, 2.05],
      [0.44, 2.40], [0.35, 2.72], [0.35, 3.40], [0.29, 3.62],
      [0.21, 3.86], [0.13, 4.08], [0.055, 4.26], [0.0, 4.42]
    ]
    const fuselage = new THREE.Mesh(
      new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 12),
      hull
    )
    fuselage.rotation.x = -Math.PI / 2 // +Y profile axis -> -Z (nose forward)
    fuselage.position.z = 1.95         // tail z=+1.95, nose tip z=-2.47
    bank.add(fuselage)

    // ---- raised panel seam collars (section joints) ----
    // profile y -> world z = 1.95 - y; radii match the profile at those z
    for (const [z, r] of [[1.42, 0.466], [-0.10, 0.474], [-0.77, 0.354], [-1.45, 0.354],
      [0.95, 0.470], [-1.78, 0.272]]) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, 0.07, 12, 1, true), hullPanel)
      ring.rotation.x = Math.PI / 2
      ring.position.z = z
      bank.add(ring)
    }

    // ---- forward red band + aft thin red collar ----
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.354, 0.354, 0.30, 12), red)
    band.rotation.x = Math.PI / 2
    band.position.z = -1.05
    bank.add(band)
    const band2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.468, 0.468, 0.10, 12), red)
    band2.rotation.x = Math.PI / 2
    band2.position.z = 0.55
    bank.add(band2)

    // ---- pitot probe: classic needle off the nose tip ----
    const pitot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.026, 0.55, 8), steel)
    pitot.rotation.x = -Math.PI / 2
    pitot.position.z = -2.68
    bank.add(pitot)

    // ---- seeker head: glossy black cone + gold-ring lens ----
    const seeker = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.36, 10), glass)
    seeker.rotation.x = -Math.PI / 2 // apex -> -Z
    seeker.position.z = -2.29
    bank.add(seeker)
    const lensRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 0.045, 10), gold)
    lensRing.rotation.x = Math.PI / 2
    lensRing.position.z = -2.13
    bank.add(lensRing)
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.05, 10), glass)
    lens.rotation.x = Math.PI / 2
    lens.position.z = -2.11
    bank.add(lens)

    // ---- dorsal spine + comm blister + antenna blades ----
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.15, 1.7), hullPanel)
    spine.position.set(0, 0.44, 0.15)
    bank.add(spine)
    const blister = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.34), dark)
    blister.position.set(0.17, 0.36, -1.25)
    bank.add(blister)
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.38), finMat)
    blade.position.set(-0.13, 0.55, 0.85)
    bank.add(blade)
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.26), finMat)
    blade2.position.set(0.15, 0.5, 1.15)
    bank.add(blade2)
    // cable conduit riding the spine
    const conduit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), dark)
    conduit.rotation.x = Math.PI / 2
    conduit.position.set(0, 0.545, 0.4)
    bank.add(conduit)
    // belly nav window
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.3), glass)
    belly.position.set(0, -0.45, -0.62)
    bank.add(belly)

    // ---- side intakes with splitter plates (mid body) ----
    for (const sx of [1, -1]) {
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.9), hullPanel)
      scoop.position.set(sx * 0.5, 0, -0.15)
      bank.add(scoop)
      const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.44), dark)
      splitter.position.set(sx * 0.63, 0, -0.48)
      bank.add(splitter)
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.34), steel)
      lip.position.set(sx * 0.61, 0, 0.14)
      bank.add(lip)
    }

    // ---- hull stencils: flush service panels ----
    const st1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.5), dark)
    st1.position.set(0.1, -0.465, 0.25)
    bank.add(st1)
    const st2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.42), red)
    st2.position.set(-0.468, 0.12, -0.3)
    bank.add(st2)

    // ---- fins: swept extruded trapezoids, rolled around the body ----
    /** Extruded fin plate. Shape: x=span from axis, y=chord (+ = tailward). */
    const finGeo = (pts, depth) => {
      const shape = new THREE.Shape()
      shape.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
      shape.closePath()
      const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
      g.translate(0, 0, -depth / 2) // centre thickness
      return g
    }
    const rollFin = (geo, finMat2, z, tipPlate) => {
      for (let k = 0; k < 4; k++) {
        const holder = new THREE.Group()
        holder.rotation.z = (k * Math.PI) / 2 // + cross config
        const fin = new THREE.Mesh(geo, finMat2)
        fin.rotation.x = Math.PI / 2 // shape y (chord) -> world +Z
        holder.add(fin)
        if (tipPlate) {
          const tip = new THREE.Mesh(new THREE.BoxGeometry(
            tipPlate[0], 0.1, tipPlate[1]), red)
          tip.position.set(tipPlate[2], 0, tipPlate[3])
          holder.add(tip)
        }
        holder.position.z = z
        bank.add(holder)
      }
    }
    // main delta fins — root rides the aft body (r 0.44), tip swept back
    rollFin(finGeo([
      [0.44, -0.85], [1.26, 0.26], [1.26, 0.60], [0.44, 0.82]
    ], 0.075), finMat, 0.72, [0.3, 0.5, 1.3, 0.5])
    // canards — small forward trapezoids on the reduced section (r 0.35)
    rollFin(finGeo([
      [0.35, -0.26], [0.82, 0.05], [0.82, 0.30], [0.35, 0.28]
    ], 0.055), finMat, -1.5)

    // ---- fin-root actuator fairings: 8 small pods just behind each wing ----
    for (let k = 0; k < 4; k++) {
      const ang = (k * Math.PI) / 2 + Math.PI / 4 // between the fins
      const fair = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.44), dark)
      fair.position.set(Math.cos(ang) * 0.47, Math.sin(ang) * 0.47, 1.08)
      fair.rotation.z = ang
      bank.add(fair)
    }

    // ---- tail: mount ring, ablative collar, nozzle bell ----
    const mount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.16, 12), steel)
    mount.rotation.x = Math.PI / 2
    mount.position.z = 1.9
    bank.add(mount)
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.33, 0.26, 12), dark)
    collar.rotation.x = Math.PI / 2
    collar.position.z = 1.62
    bank.add(collar)
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.37, 0.26, 0.44, 12), steel)
    nozzle.rotation.x = Math.PI / 2 // wide end rearward
    nozzle.position.z = 2.19
    bank.add(nozzle)
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.1, 12),
      mat(0x1a1d21, { metalness: 0.8, roughness: 0.4 }))
    inner.rotation.x = Math.PI / 2
    inner.position.z = 2.28
    bank.add(inner)

    // ---- exhaust: emissive core cone + shock rings (thrust-reactive) ----
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xff8c3a, emissive: 0xff6a00, emissiveIntensity: 0.7, flatShading: true
    })
    const glow = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.6, 10), glowMat)
    glow.rotation.x = Math.PI / 2 // apex -> +Z (plume tapers rearward)
    glow.position.z = 2.72
    bank.add(glow)
    for (const [r, z] of [[0.16, 3.0], [0.1, 3.22], [0.065, 3.4]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.024, 6, 14), glowMat)
      ring.position.z = z
      bank.add(ring)
    }
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

  /** Current cosmetic bank (roll) — consumed by the camera roll-lean. */
  get bank () { return this._bank }

  /** Unit forward vector (local -Z in world space). Pass `out` to reuse. */
  forward (out = new THREE.Vector3()) {
    return out.set(0, 0, -1).applyQuaternion(this.quaternion)
  }

  // ---------------------------------------------------------------- steering

  /**
   * Apply look deltas (mouse pixels, or pre-computed touch stick radians)
   * to yaw/pitch and write the resulting orientation to the body
   * immediately, so the very next physics step and the render both use
   * the fresh rotation.
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

  /**
   * Apply steering as direct radians (touch joystick path — rates already
   * include the response curve; no pixel scaling involved).
   */
  applyLookRad (dYaw, dPitch) {
    if (!dYaw && !dPitch) return
    this.yaw -= dYaw
    this.pitch = THREE.MathUtils.clamp(
      this.pitch - dPitch,
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

  /** One-off velocity kick (m/s) along a world direction. Used by Boost. */
  applyKick (dir, speed) {
    const j = speed * CFG.missile.mass
    this.body.applyImpulse({ x: dir.x * j, y: dir.y * j, z: dir.z * j }, true)
  }

  // ---------------------------------------------------------------- states

  /** Let gravity act + ignition kick — called when the run starts. */
  launch (launchSpeed = CFG.missile.launchSpeed) {
    this.body.setGravityScale(1, true)
    // A dumbfire missile is already flying the moment it launches
    this.forward(_fwd)
    const j = launchSpeed * CFG.missile.mass
    this.body.applyImpulse({ x: _fwd.x * j, y: _fwd.y * j, z: _fwd.z * j }, true)
  }

  /** Deploy/stow the drag chute by switching linear damping. */
  setChute (on) {
    this.body.setLinearDamping(on ? CFG.chute.linearDamping : 0)
  }

  /**
   * Full reset to the launch pad. Accepts the level's spawn + facing yaw.
   * @param {{x:number,y:number,z:number}} spawn
   */
  reset (spawn = CFG.missile.spawn, yaw = 0) {
    this.yaw = yaw
    this.pitch = 0
    this._prevYaw = yaw
    this._bank = 0
    this.body.setTranslation({ x: spawn.x, y: spawn.y, z: spawn.z }, true)
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

    // Exhaust glow + engine light track thrust state
    const target = ctx.boosting ? 4.5 : ctx.thrusting ? 3.0 : 0.7
    this.glowMat.emissiveIntensity = THREE.MathUtils.damp(
      this.glowMat.emissiveIntensity, target, 8, dt
    )
    if (this.engineLight) {
      this.engineLight.intensity = THREE.MathUtils.damp(
        this.engineLight.intensity,
        ctx.boosting ? 30 : ctx.thrusting ? 18 : 4,
        8, dt
      )
    }
  }
}
