/**
 * Rapier API smoke test (plain Node, no browser needed).
 *
 * Validates every Rapier call signature the game relies on:
 *   - World.timestep setter (bullet-time stepping)
 *   - dynamic body + lockRotations + CCD + collider setMass
 *   - collision event queue (crash / target detection)
 *   - castRay with rigid-body exclusion (grapple hook)
 *   - velocity & impulse APIs (thrust, boost, rope)
 *
 * Run: npm run test:physics
 */
import RAPIER from '@dimforge/rapier3d-compat'

let failures = 0
const check = (name, cond, extra = '') => {
  if (cond) console.log(`  PASS  ${name}`)
  else { failures++; console.error(`  FAIL  ${name} ${extra}`) }
}

await RAPIER.init()
console.log('Rapier initialised')

const world = new RAPIER.World({ x: 0, y: -10, z: 0 })

// 1. timestep property ------------------------------------------------------
world.timestep = 1 / 120
check('world.timestep set/get', Math.abs(world.timestep - 1 / 120) < 1e-9,
  `got ${world.timestep}`)
world.timestep = 1 / 60

// 2. rigid body description chain (Missile-style) -----------------------------
const body = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 20, 0)
    .setLinearDamping(0)
    .setAngularDamping(1)
    .setCcdEnabled(true)
    .setCanSleep(false)
    .lockRotations()
)
check('dynamic body created', !!body)
check('ccd enabled', body.isCcdEnabled() === true)

// 3. collider with mass + collision events -----------------------------------
const col = world.createCollider(
  RAPIER.ColliderDesc.cuboid(0.38, 0.38, 1.55)
    .setTranslation(0, 0, -0.35)
    .setMass(110)
    .setFriction(0.6)
    .setRestitution(0.05)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
  body
)
check('missile-like collider', !!col && typeof col.handle === 'number')
check('gravity scale API', typeof body.setGravityScale === 'function')

// 4. static floor -------------------------------------------------------------
const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
const floor = world.createCollider(
  RAPIER.ColliderDesc.cuboid(50, 1, 50).setTranslation(0, -1, 0),
  fixed
)
check('static floor collider', !!floor)

// 5. events + gravity integration ---------------------------------------------
const eq = new RAPIER.EventQueue(false)
let startedEvent = false
for (let i = 0; i < 240; i++) {
  world.step(eq)
  eq.drainCollisionEvents((h1, h2, started) => {
    if (started) startedEvent = true
  })
}
const t = body.translation()
check('gravity integration (fell to floor)', t.y < 1.0, `y=${t.y.toFixed(2)}`)
check('collision events received', startedEvent)

// 6. locked rotations stay locked ---------------------------------------------
body.setRotation({ x: 0, y: 0.7071067811865476, z: 0, w: 0.7071067811865476 }, true)
world.step(eq)
eq.drainCollisionEvents(() => {})
const r = body.rotation()
check('rotation preserved while locked',
  Math.abs(r.y - 0.70710678) < 1e-3 && Math.abs(r.x) < 1e-3,
  `r=(${r.x.toFixed(3)},${r.y.toFixed(3)},${r.z.toFixed(3)})`)

// 7. raycast with rigid-body exclusion ------------------------------------------
// Ray starts above the resting missile and points DOWN at the floor.
// Without exclusion it would hit the missile's own collider first.
const ray = new RAPIER.Ray({ x: 0, y: 12, z: 0 }, { x: 0, y: -1, z: 0 })
const hit = world.castRay(ray, 100, true, undefined, undefined, undefined, body)
const toi = hit ? (hit.toi !== undefined ? hit.toi : hit.timeOfImpact) : null
check('castRay + exclusion hits floor',
  !!hit && typeof toi === 'number' && Math.abs(toi - 12) < 0.6,
  `toi=${toi}`)

// 8. velocity / impulse APIs ------------------------------------------------------
body.setLinvel({ x: 5, y: 0, z: 0 }, true)
body.applyImpulse({ x: 110, y: 0, z: 0 }, true) // +1 m/s for mass 110
world.step(eq)
eq.drainCollisionEvents(() => {})
const v = body.linvel()
check('setLinvel + applyImpulse', v.x > 5.5, `vx=${v.x.toFixed(2)}`)

// 9. setLinearDamping (drag chute) -------------------------------------------------
body.setLinearDamping(3.0)
check('setLinearDamping', typeof body.setLinearDamping === 'function')

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
