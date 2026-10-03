/**
 * PhysicsWorld — thin wrapper around a Rapier3D world.
 *
 * Provides:
 *  - async creation (Rapier compat needs to decode its embedded WASM first)
 *  - fixed-timestep stepping with a *scaled* dt (bullet-time)
 *  - collision-event routing via collider handle -> tag mapping
 *  - raycast helper used by the grapple hook (with rigid-body exclusion)
 *
 * The game never touches the raw Rapier API through other modules except
 * for building collider descriptors (Level, Missile) — they import the
 * re-exported RAPIER namespace from here.
 */
import RAPIER from '@dimforge/rapier3d-compat'
import { CFG } from '../config.js'

export { RAPIER }

export class PhysicsWorld {
  /** Await Rapier WASM init, then build the world. */
  static async create () {
    await RAPIER.init()
    return new PhysicsWorld()
  }

  constructor () {
    this.world = new RAPIER.World({ x: 0, y: CFG.physics.gravity, z: 0 })
    this.events = new RAPIER.EventQueue(false) // manual drain -> no event loss across sub-steps

    /** collider.handle -> tag ('missile' | 'level' | 'target') */
    this.tags = new Map()

    /** Collision callback: (handleA, handleB, started) — assigned by the Game. */
    this.onCollision = null

    this.setStepDt(CFG.physics.fixedDt)
  }

  /**
   * Set the dt the world advances per step().
   * Bullet-time multiplies this so the world runs in slow motion while we
   * keep stepping at a steady real-time 60 Hz.
   */
  setStepDt (dt) {
    // Rapier <=0.13 exposes `world.timestep`; newer versions moved it to
    // `world.integrationParameters.dt`. Support both defensively.
    try {
      if (typeof this.world.timestep === 'number') this.world.timestep = dt
      else if (this.world.integrationParameters) this.world.integrationParameters.dt = dt
    } catch (_) { /* keep last known dt */ }
  }

  /** Advance the simulation by one step. */
  step () {
    this.world.step(this.events)
  }

  /** Forward queued collision events to this.onCollision. */
  drainCollisions () {
    if (!this.onCollision) {
      // Still drain to keep the queue from growing unbounded
      this.events.drainCollisionEvents(() => {})
      return
    }
    this.events.drainCollisionEvents((h1, h2, started) => {
      this.onCollision(h1, h2, started)
    })
  }

  /** Register a collider under a gameplay tag. */
  tag (collider, tag) { this.tags.set(collider.handle, tag) }

  /** Resolve a collider handle back to its tag (undefined if unknown). */
  tagOf (handle) { return this.tags.get(handle) }

  /** Create a shared static body for level geometry. */
  createFixedBody () {
    return this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
  }

  /**
   * Raycast. Returns { x, y, z, dist, collider } or null.
   * `excludeBody` (e.g. the missile) is filtered out so the ray can start
   * inside the missile's own collider without hitting it.
   */
  raycast (ox, oy, oz, dx, dy, dz, maxDist, excludeBody) {
    const ray = new RAPIER.Ray({ x: ox, y: oy, z: oz }, { x: dx, y: dy, z: dz })
    let hit = null
    try {
      // 0.12 signature: (ray, maxToi, solid, filterFlags, filterGroups,
      //                  filterExcludeCollider, filterExcludeRigidBody)
      hit = this.world.castRay(ray, maxDist, true, undefined, undefined, undefined, excludeBody)
    } catch (_) {
      hit = this.world.castRay(ray, maxDist, true)
    }
    if (!hit) return null
    const toi = hit.toi !== undefined ? hit.toi : hit.timeOfImpact
    if (typeof toi !== 'number') return null
    return {
      x: ox + dx * toi,
      y: oy + dy * toi,
      z: oz + dz * toi,
      dist: toi,
      collider: hit.collider
    }
  }
}
