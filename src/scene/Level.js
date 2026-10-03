/**
 * Level — the single test course.
 *
 * Layout (missile flies toward -Z):
 *
 *   z=  55  launch pad — missile spawns here facing -Z
 *   z=  20  girder gate — two towers + a beam wall with a centre gap
 *   z= -20  pillar slalom — staggered concrete pillars + cross girders
 *   z= -75  the wall — full-width wall with a small window to thread
 *   z=-140  half pyramid — stacked blocks: thread, climb or grapple around
 *   z=-175  slope wall + arch — steep ramp you can surf with the grapple
 *   z=-215  kicker ramp — launches you up toward the tower
 *   z=-260  finish — red target sphere on a tall block tower
 *
 * Physics colliders and visuals are built from the same primitive list, so
 * what you see is exactly what you collide with. The grapple hook attaches
 * to any 'level' collider; the target sphere is tagged 'target'.
 */
import * as THREE from 'three'
import { RAPIER } from '../physics/PhysicsWorld.js'

const _euler = new THREE.Euler()
const _quat = new THREE.Quaternion()

export class Level {
  /**
   * @param {import('../physics/PhysicsWorld.js').PhysicsWorld} physics
   * @param {THREE.Scene} scene
   */
  constructor (physics, scene) {
    this.physics = physics
    this.scene = scene

    /** Shared fixed body that owns every static collider. */
    this.staticBody = physics.createFixedBody()

    this.targetPosition = new THREE.Vector3(0, 24.8, -260) // sphere rests on the tower cap
    this._targetMat = null
    this._t = 0

    this._concreteMat = new THREE.MeshStandardMaterial({
      color: 0x9aa0a6, flatShading: true, roughness: 0.92, metalness: 0.02
    })
    this._darkConcreteMat = new THREE.MeshStandardMaterial({
      color: 0x7f858c, flatShading: true, roughness: 0.95
    })
    this._girderMat = new THREE.MeshStandardMaterial({
      color: 0x666c75, flatShading: true, roughness: 0.5, metalness: 0.55
    })
    this._accentMat = new THREE.MeshStandardMaterial({
      color: 0xc9522f, flatShading: true, roughness: 0.8
    })
    this._hazardMat = new THREE.MeshStandardMaterial({
      color: 0xd9a021, flatShading: true, roughness: 0.7
    })

    this._build()
  }

  /**
   * Box primitive: physics collider + visual mesh from one description.
   * `rot` is an optional {x,y,z} Euler in radians.
   */
  _addBox (x, y, z, sx, sy, sz, {
    material = this._concreteMat, tag = 'level', rot = null, castShadow = true
  } = {}) {
    let quat = null
    if (rot) {
      _euler.set(rot.x || 0, rot.y || 0, rot.z || 0)
      _quat.setFromEuler(_euler)
      quat = { x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w }
    }

    let desc = RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2)
      .setTranslation(x, y, z)
      .setFriction(0.8)
    if (quat) desc = desc.setRotation(quat)
    const collider = this.physics.world.createCollider(desc, this.staticBody)
    this.physics.tag(collider, tag)

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material)
    mesh.position.set(x, y, z)
    if (quat) mesh.quaternion.set(quat.x, quat.y, quat.z, quat.w)
    mesh.castShadow = castShadow
    mesh.receiveShadow = true
    this.scene.add(mesh)
    return mesh
  }

  _build () {
    // ---- ground slab (crashing into it ends the run) -----------------------
    this._addBox(0, -2, -90, 240, 4, 430)

    // ---- perimeter walls: keep the missile inside the course ---------------
    this._addBox(-73, 7, -90, 4, 18, 430, { material: this._girderMat })
    this._addBox(73, 7, -90, 4, 18, 430, { material: this._girderMat })
    this._addBox(0, 7, 120, 150, 18, 4, { material: this._girderMat })

    // ---- zone 1: launch pad -------------------------------------------------
    this._addBox(0, 0.2, 55, 10, 0.4, 10, { material: this._accentMat })

    // ---- zone 2: girder gate (z = 20) ----------------------------------------
    this._addBox(-8, 5, 20, 4, 10, 4, { material: this._girderMat })
    this._addBox(8, 5, 20, 4, 10, 4, { material: this._girderMat })
    this._addBox(-17, 5, 20, 18, 10, 3, { material: this._girderMat })
    this._addBox(17, 5, 20, 18, 10, 3, { material: this._girderMat })
    // hazard markers framing the centre gap
    this._addBox(-2.5, 5, 18.4, 1, 10, 0.4, { material: this._hazardMat })
    this._addBox(2.5, 5, 18.4, 1, 10, 0.4, { material: this._hazardMat })

    // ---- zone 3: pillar slalom (z = -5 .. -30) -------------------------------
    for (const [x, z] of [[-5, -5], [5, -10], [-5, -15], [5, -20], [-5, -25]]) {
      this._addBox(x, 5, z, 3, 10, 3)
    }
    // cross girders linking pillar tops — prime grapple rails
    this._addBox(-5, 10.5, -15, 1.2, 1.2, 24, { material: this._girderMat })
    this._addBox(5, 10.5, -15, 1.2, 1.2, 24, { material: this._girderMat })

    // ---- zone 4: the wall with a window (z = -75) ----------------------------
    // Window: x in [-3, 3], y in [7, 13] — 6 m wide, 6 m tall at speed.
    this._addBox(0, 3.5, -75, 60, 7, 3, { material: this._darkConcreteMat })   // below window
    this._addBox(0, 20, -75, 60, 14, 3, { material: this._darkConcreteMat })   // above window
    this._addBox(-16.5, 10, -75, 27, 6, 3, { material: this._darkConcreteMat }) // left of window
    this._addBox(16.5, 10, -75, 27, 6, 3, { material: this._darkConcreteMat }) // right of window
    // hazard frame around the opening
    this._addBox(0, 7, -73.4, 7.4, 0.5, 0.4, { material: this._hazardMat })
    this._addBox(0, 13, -73.4, 7.4, 0.5, 0.4, { material: this._hazardMat })
    this._addBox(-3.2, 10, -73.4, 0.5, 6.4, 0.4, { material: this._hazardMat })
    this._addBox(3.2, 10, -73.4, 0.5, 6.4, 0.4, { material: this._hazardMat })

    // ---- zone 5: half pyramid (z = -140) ---------------------------------------
    // Five stacked steps; thread the gaps or grapple-sling around the whole thing.
    const steps = [
      [40, 4, 40],
      [32, 4, 32],
      [24, 4, 24],
      [16, 4, 16],
      [8, 4, 8]
    ]
    let y = 2
    for (const [sx, sz] of steps) {
      this._addBox(0, y, -140, sx, 4, sz, { material: this._darkConcreteMat })
      y += 4
    }
    // Floating slabs beside the pyramid for strafe-swing practice
    this._addBox(-26, 8, -140, 6, 1, 10, { material: this._girderMat })
    this._addBox(26, 12, -140, 6, 1, 10, { material: this._girderMat })

    // ---- zone 6: slope wall + arch (z = -175) -----------------------------------
    // 26 m long ramp rising to 17 m — grapple the face and "surf" it.
    // A ramp is a rotated box: length 26 at 33 degrees rises ~14 m.
    this._addBox(0, 8.5, -175, 40, 1.6, 26, {
      material: this._darkConcreteMat, rot: { x: -0.58 }
    })
    // Arch: two pillars + a lintel you can fly under
    this._addBox(-6, 12, -188, 3, 24, 3, { material: this._girderMat })
    this._addBox(6, 12, -188, 3, 24, 3, { material: this._girderMat })
    this._addBox(0, 24.5, -188, 15, 3, 3, { material: this._accentMat })

    // ---- zone 7: kicker ramp (z = -215) -------------------------------------------
    this._addBox(0, 5, -215, 14, 1.6, 14, {
      material: this._darkConcreteMat, rot: { x: -0.42 }
    })

    // ---- zone 8: finish — target sphere on a tower (z = -260) --------------------
    this._addBox(0, 10, -260, 10, 24, 10, { material: this._darkConcreteMat })
    this._addBox(0, 22.2, -260, 6, 0.4, 6, { material: this._accentMat })

    // The red target sphere itself.
    this._targetMat = new THREE.MeshStandardMaterial({
      color: 0xff2a1a, emissive: 0xff2200, emissiveIntensity: 2.0,
      flatShading: true, roughness: 0.4
    })
    const target = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 12, 8), this._targetMat
    )
    target.position.copy(this.targetPosition)
    target.castShadow = true
    this.scene.add(target)
    this.target = target

    // Physics: ball collider tagged 'target' (hitting it completes the level)
    const targetCollider = this.physics.world.createCollider(
      RAPIER.ColliderDesc.ball(2.4)
        .setTranslation(this.targetPosition.x, this.targetPosition.y, this.targetPosition.z)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      this.staticBody
    )
    this.physics.tag(targetCollider, 'target')

    // Vertical light beam so the goal is visible from the launch pad
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 90, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xff3322, transparent: true, opacity: 0.16,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      })
    )
    beam.position.set(this.targetPosition.x, 45, this.targetPosition.z)
    beam.frustumCulled = false
    this.scene.add(beam)
  }

  /** Idle animation for the target (pulse + spin). */
  update (dt) {
    this._t += dt
    this._targetMat.emissiveIntensity = 1.8 + Math.sin(this._t * 4) * 0.7
    this.target.rotation.y += dt * 0.8
  }
}
