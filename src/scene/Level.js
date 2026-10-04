/**
 * Level — data-driven course builder.
 *
 * A Level instance builds ALL of one course from its definition object
 * (see src/scene/levels/*.js): colliders + visuals from the same primitive
 * list, so what you see is exactly what you collide with. `props` are
 * decoration-only geometry with no colliders — flush-mounted or clearly
 * off-path so they never mislead.
 *
 * Levels are disposable: loadLevel() swaps them at runtime (dispose()
 * removes colliders, meshes and GPU resources).
 */
import * as THREE from 'three'
import { RAPIER } from '../physics/PhysicsWorld.js'
import { buildTextures, tiledClone } from './textures.js'
import { addBuildings } from './buildings.js'

const _euler = new THREE.Euler()
const _quat = new THREE.Quaternion()

/** Yaw-only rotation as a Rapier quaternion object. */
function quatYaw (rot) {
  _euler.set(0, rot || 0, 0)
  _quat.setFromEuler(_euler)
  return { x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w }
}

export class Level {
  /**
   * @param {import('../physics/PhysicsWorld.js').PhysicsWorld} physics
   * @param {THREE.Scene} scene
   * @param {object} def level definition (levels/levelN.js)
   * @param {{mobile?: boolean}} opts quality downgrades
   */
  constructor (physics, scene, def, opts = {}) {
    this.physics = physics
    this.scene = scene
    this.def = def
    this.mobile = !!opts.mobile

    /** Shared fixed body that owns every static collider. */
    this.staticBody = physics.createFixedBody()

    this.targetPosition = new THREE.Vector3(...def.target.p)
    this._t = 0
    this._beacons = []
    this._rings = []
    this._colliders = []

    // Everything visual hangs off one group for cheap disposal.
    this.root = new THREE.Group()
    scene.add(this.root)

    this._disposables = { geos: [], mats: [], texs: [] }

    this._buildMaterials()
    this._buildBoxes()
    if (def.buildings) addBuildings(this, def.buildings)
    this._buildProps()
    this._buildTarget()
  }

  // ------------------------------------------------------------ materials

  /** Palette-tinted materials sharing the procedural texture set. */
  _buildMaterials () {
    const tex = buildTextures()
    const p = this.def.palette

    /** Base material factory (tint colour, texture, finish). */
    const make = (color, map, extra = {}) => {
      const m = new THREE.MeshStandardMaterial({
        color, map, flatShading: true, roughness: 0.92, metalness: 0.04, ...extra
      })
      this._disposables.mats.push(m)
      return m
    }

    this.mat = {
      concrete: make(p.concrete, tex.concrete),
      dark: make(p.dark, tex.dark, { roughness: 0.95 }),
      girder: make(p.girder, tex.girder, { roughness: 0.5, metalness: 0.55 }),
      accent: make(p.accent, tex.accent, { roughness: 0.8 }),
      hazard: make(0xffffff, tex.hazard, { roughness: 0.75, emissive: 0x332200, emissiveIntensity: 0.35 })
    }
    this._texSet = tex
  }

  /**
   * Clone a base material with a per-box tiled texture clone so panel scale
   * stays ~constant regardless of box size. Shares GPU texture sources.
   */
  _tiledMat (key, sx, sy, sz) {
    const m = this.mat[key].clone()
    m.map = tiledClone(this._texSet[key === 'dark' ? 'dark' : key], sx, sy, sz)
    this._disposables.mats.push(m)
    this._disposables.texs.push(m.map)
    return m
  }

  // ------------------------------------------------------------ primitives

  /**
   * Box: physics collider + visual mesh from one record.
   * record = [x, y, z, sx, sy, sz, matKey, [rotX, rotY, rotZ]?]
   */
  _addBox (rec) {
    const [x, y, z, sx, sy, sz, matKey, rot] = rec
    let quat = null
    if (rot) {
      _euler.set(rot[0] || 0, rot[1] || 0, rot[2] || 0)
      _quat.setFromEuler(_euler)
      quat = { x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w }
    }

    let desc = RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2)
      .setTranslation(x, y, z)
      .setFriction(0.8)
    if (quat) desc = desc.setRotation(quat)
    const collider = this.physics.world.createCollider(desc, this.staticBody)
    this.physics.tag(collider, 'level')
    this._colliders.push(collider)

    const geo = new THREE.BoxGeometry(sx, sy, sz)
    const mesh = new THREE.Mesh(geo, this._tiledMat(matKey, sx, sy, sz))
    mesh.position.set(x, y, z)
    if (quat) mesh.quaternion.set(quat.x, quat.y, quat.z, quat.w)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.root.add(mesh)
    this._disposables.geos.push(geo)
  }

  /** Small helper mesh (visual only). */
  _propMesh (geo, mat, x, y, z, rot) {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0)
    m.castShadow = true
    m.receiveShadow = true
    this.root.add(m)
    this._disposables.geos.push(geo)
    return m
  }

  // ------------------------------------------------------------ props

  /** Decoration-only geometry — never a collider. */
  _addProp (pr) {
    const p = pr.p
    switch (pr.t) {
      case 'pipe': {
        // horizontal cylinder riding a girder
        const geo = new THREE.CylinderGeometry(0.34, 0.34, pr.len, 8)
        const m = this._propMesh(geo, this.mat.girder, p[0], p[1], p[2])
        m.rotation.z = Math.PI / 2 // default along X
        if (pr.axis === 'z') m.rotation.y = Math.PI / 2
        m.castShadow = false
        break
      }
      case 'crate': {
        const geo = new THREE.BoxGeometry(1.6, 1.3, 1.3)
        this._propMesh(geo, this._tiledMat('girder', 1.6, 1.3, 1.3), p[0], p[1], p[2])
        break
      }
      case 'barrier': {
        const geo = new THREE.BoxGeometry(2.4, 1.05, 0.32)
        this._propMesh(geo, this._tiledMat('hazard', 2.4, 1, 0.32), p[0], p[1], p[2])
        break
      }
      case 'vent': {
        const geo = new THREE.BoxGeometry(2.1, 1.4, 0.5)
        this._propMesh(geo, this.mat.dark, p[0], p[1], p[2])
        break
      }
      case 'antenna': {
        const mast = this._propMesh(
          new THREE.CylinderGeometry(0.1, 0.16, 6.5, 6),
          this.mat.girder, p[0], p[1] + 3.25, p[2]
        )
        mast.castShadow = false
        // blinking beacon on top
        const beaconMat = new THREE.MeshStandardMaterial({
          color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 2, flatShading: true
        })
        this._disposables.mats.push(beaconMat)
        const beacon = this._propMesh(
          new THREE.SphereGeometry(0.28, 8, 6), beaconMat, p[0], p[1] + 6.6, p[2]
        )
        beacon.castShadow = false
        this._beacons.push({ mat: beaconMat, phase: Math.random() * Math.PI * 2 })
        break
      }
      case 'rock': {
        const [r, h] = pr.s
        const geo = new THREE.ConeGeometry(r, h, 6)
        const m = this._propMesh(geo, this.mat.dark, p[0], p[1] + (pr.flip ? -0 : h / 2), p[2])
        m.rotation.y = Math.random() * Math.PI
        if (pr.flip) {
          m.rotation.x = Math.PI // apex down — hanging rock under islands
          m.position.y = p[1] - h / 2
        }
        break
      }
      case 'ring': {
        // glowing guidance ring — visual only
        const geo = new THREE.TorusGeometry(6, 0.32, 8, 30)
        const ringMat = new THREE.MeshStandardMaterial({
          color: this.def.palette.accent,
          emissive: this.def.palette.accent,
          emissiveIntensity: 1.6,
          flatShading: true
        })
        this._disposables.mats.push(ringMat)
        const ring = this._propMesh(geo, ringMat, p[0], p[1], p[2])
        ring.castShadow = false
        // default torus lies in the XY plane — its hole faces the flight path (Z)
        this._rings.push(ring)
        break
      }
      case 'hoop': {
        // RING GATE — torus frame + compound cuboid colliders. Fly through the
        // hole; clipping the frame is a crash like any other geometry.
        const R = pr.r || 6
        const tube = 0.45
        const segs = this.mobile ? 8 : 12
        const geo = new THREE.TorusGeometry(R, tube, 8, segs + 4)
        const hoopMat = new THREE.MeshStandardMaterial({
          color: this.def.palette.accent,
          emissive: this.def.palette.accent,
          emissiveIntensity: 1.1,
          flatShading: true, roughness: 0.5
        })
        this._disposables.mats.push(hoopMat)
        const hoop = this._propMesh(geo, hoopMat, p[0], p[1], p[2])
        // default torus = XY plane = hole along Z, matching the colliders
        hoop.castShadow = false
        this._rings.push(hoop)
        // colliders: cuboid segments around the circumference
        for (let s = 0; s < segs; s++) {
          const a = (s / segs) * Math.PI * 2
          const cx = p[0] + Math.cos(a) * R
          const cy = p[1] + Math.sin(a) * R
          const segLen = 2 * Math.PI * R / segs * 0.62
          const q = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, 0, a + Math.PI / 2))
          const col = this.physics.world.createCollider(
            RAPIER.ColliderDesc.cuboid(segLen / 2, tube * 1.7, tube * 1.7)
              .setTranslation(cx, cy, p[2])
              .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
              .setFriction(0.8),
            this.staticBody)
          this.physics.tag(col, 'level')
          this._colliders.push(col)
        }
        break
      }
      case 'coolingtower': {
        // hyperboloid shell (visual) + waist cylinder collider
        const R = pr.r || 10
        const H = pr.h || 34
        const pts = []
        for (let i = 0; i <= 10; i++) {
          const t = i / 10
          // waist at ~65% height, flare at both ends
          const rad = R * (0.62 + 0.38 * Math.pow(Math.abs(t - 0.66) / 0.66, 1.4))
          pts.push(new THREE.Vector2(Math.max(rad, R * 0.6), t * H))
        }
        const geo = new THREE.LatheGeometry(pts, 16)
        const m = this._propMesh(geo, this.mat.concrete, p[0], p[1], p[2])
        m.material = m.material // lathe keeps the concrete tint
        const band = new THREE.Mesh(
          new THREE.CylinderGeometry(R * 0.68, R * 0.72, 1.6, 16), this.mat.hazard)
        band.position.set(p[0], p[1] + H - 0.8, p[2])
        this.root.add(band)
        this._disposables.geos.push(band.geometry)
        const col = this.physics.world.createCollider(
          RAPIER.ColliderDesc.cylinder(H / 2, R * 0.74)
            .setTranslation(p[0], p[1] + H / 2, p[2]).setFriction(0.8),
          this.staticBody)
        this.physics.tag(col, 'level')
        this._colliders.push(col)
        break
      }
      case 'crane': {
        // gantry portal crane: two legs + top beam + trolley + hook cable
        const W = pr.w || 26
        const H = pr.h || 24
        const legW = 2.2
        const group = new THREE.Group()
        group.position.set(p[0], p[1], p[2])
        group.rotation.y = pr.rot || 0
        this.root.add(group)
        const mk = (sx, sy, sz, x2, y2, z2, mat) => {
          const mm = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat)
          mm.position.set(x2, y2, z2)
          mm.castShadow = mm.receiveShadow = true
          group.add(mm)
          this._disposables.geos.push(mm.geometry)
          return mm
        }
        for (const lx of [-W / 2 + legW / 2, W / 2 - legW / 2]) {
          mk(legW, H, legW * 1.4, lx, H / 2, 0, this._tiledMat('girder', legW, H, legW))
        }
        mk(W, 2.2, 2.6, 0, H + 1.1, 0, this._tiledMat('girder', W, 2.2, 2.6))
        mk(W, 0.9, 1.2, 0, H - 0.4, 0, this._tiledMat('hazard', W, 1, 1.2))
        // trolley + hanging hook
        const tx = (pr.tx !== undefined ? pr.tx : 0) * W * 0.3
        mk(3.2, 1.6, 3.2, tx, H - 1.6, 0, this.mat.dark)
        const cable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, H * 0.52, 6), this.mat.girder)
        cable.position.set(tx, H * 0.48, 0)
        group.add(cable)
        this._disposables.geos.push(cable.geometry)
        const hook = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 2.4, 1.6), this.mat.accent)
        hook.position.set(tx, H * 0.2, 0)
        group.add(hook)
        this._disposables.geos.push(hook.geometry)
        // colliders (legs + beam) in world space — honour yaw
        const rot = pr.rot || 0
        for (const lx of [-W / 2 + legW / 2, W / 2 - legW / 2]) {
          const wx = p[0] + Math.cos(rot) * lx
          const wz = p[2] - Math.sin(rot) * lx
          const col = this.physics.world.createCollider(
            RAPIER.ColliderDesc.cuboid(legW / 2, H / 2, legW * 0.7)
              .setTranslation(wx, p[1] + H / 2, wz)
              .setRotation(quatYaw(rot)).setFriction(0.8),
            this.staticBody)
          this.physics.tag(col, 'level')
          this._colliders.push(col)
        }
        const col = this.physics.world.createCollider(
          RAPIER.ColliderDesc.cuboid(W / 2, 1.1, 1.3)
            .setTranslation(p[0], p[1] + H + 1.1, p[2])
            .setRotation(quatYaw(rot)).setFriction(0.8),
          this.staticBody)
        this.physics.tag(col, 'level')
        this._colliders.push(col)
        break
      }
      case 'containers': {
        // shipping-container stacks — colour-banded boxes, one collider/stack
        const cols = [0xa84b32, 0x3f7a6c, 0xb08c2e, 0x50607a, 0x7a4a56, 0x777c82]
        const boxMat = new THREE.MeshStandardMaterial({
          map: tiledClone(this._texSet.girder, 2, 1, 6),
          flatShading: true, roughness: 0.7, metalness: 0.3
        })
        this._disposables.mats.push(boxMat)
        this._disposables.texs.push(boxMat.map)
        const stackCols = []
        for (const c of cols) {
          stackCols.push(new THREE.Color(c))
        }
        const cw = 2.6, ch = 2.6, cl = 6.2
        const stacks = pr.stacks || 2
        for (let s = 0; s < stacks; s++) {
          const ox = p[0] + (pr.gap || 9) * s * Math.cos(pr.rot || 0)
          const oz = p[2] - (pr.gap || 9) * s * Math.sin(pr.rot || 0)
          const n = 1 + ((Math.random() * 3) | 0)
          for (let i = 0; i < n; i++) {
            const mat = boxMat.clone()
            mat.color = stackCols[(Math.random() * stackCols.length) | 0]
            this._disposables.mats.push(mat)
            const m = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cl), mat)
            m.position.set(ox, p[1] + ch / 2 + i * ch, oz)
            m.rotation.y = pr.rot || 0
            m.castShadow = m.receiveShadow = true
            this.root.add(m)
            this._disposables.geos.push(m.geometry)
          }
          const col = this.physics.world.createCollider(
            RAPIER.ColliderDesc.cuboid(cw / 2, n * ch / 2, cl / 2)
              .setTranslation(ox, p[1] + n * ch / 2, oz)
              .setRotation(quatYaw(pr.rot || 0)).setFriction(0.8),
            this.staticBody)
          this.physics.tag(col, 'level')
          this._colliders.push(col)
        }
        break
      }
      case 'shard': {
        // ice / crystal shard — stretched octahedron
        const [r, h] = pr.s
        const shardMat = new THREE.MeshStandardMaterial({
          color: pr.c || this.def.palette.accent,
          emissive: pr.c || this.def.palette.accent,
          emissiveIntensity: pr.glow ? 1.4 : 0.12,
          flatShading: true, roughness: 0.25, metalness: 0.15
        })
        this._disposables.mats.push(shardMat)
        const geo = new THREE.OctahedronGeometry(r, 0)
        const m = this._propMesh(geo, shardMat, p[0], p[1], p[2])
        m.scale.set(0.42, h / (r * 2), 0.42)
        m.rotation.y = Math.random() * Math.PI
        if (pr.tilt) m.rotation.z = pr.tilt
        if (pr.col) {
          const col = this.physics.world.createCollider(
            RAPIER.ColliderDesc.cuboid(r * 0.42, h / 2, r * 0.42)
              .setTranslation(p[0], p[1], p[2]).setFriction(0.8),
            this.staticBody)
          this.physics.tag(col, 'level')
          this._colliders.push(col)
        }
        break
      }
      case 'neon': {
        // emissive billboard / neon sign slab
        const [w, h] = pr.s
        const neonMat = new THREE.MeshStandardMaterial({
          color: pr.c || 0x27d8c8, emissive: pr.c || 0x27d8c8,
          emissiveIntensity: 2.2, flatShading: true, roughness: 0.4
        })
        this._disposables.mats.push(neonMat)
        const m = this._propMesh(new THREE.BoxGeometry(w, h, 0.5), neonMat, p[0], p[1], p[2])
        m.rotation.y = pr.rot || 0
        m.castShadow = false
        if (pr.col) {
          const col = this.physics.world.createCollider(
            RAPIER.ColliderDesc.cuboid(w / 2, h / 2, 0.25)
              .setTranslation(p[0], p[1], p[2])
              .setRotation(quatYaw(pr.rot || 0)).setFriction(0.8),
            this.staticBody)
          this.physics.tag(col, 'level')
          this._colliders.push(col)
        }
        break
      }
      case 'lightpole': {
        const H = pr.h || 9
        const pole = this._propMesh(
          new THREE.CylinderGeometry(0.12, 0.18, H, 6), this.mat.girder, p[0], p[1] + H / 2, p[2])
        pole.castShadow = false
        const headMat = new THREE.MeshStandardMaterial({
          color: 0xfff2cc, emissive: 0xffe9b0, emissiveIntensity: 2.4, flatShading: true
        })
        this._disposables.mats.push(headMat)
        const head = this._propMesh(
          new THREE.BoxGeometry(1.4, 0.32, 0.5), headMat, p[0], p[1] + H, p[2])
        head.castShadow = false
        break
      }
      case 'lavarock': {
        // dark rock with glowing fault lines (volcanic level dressing)
        const [r, h] = pr.s
        const rockMat = new THREE.MeshStandardMaterial({
          color: 0x2a2422, map: tiledClone(this._texSet.lava, 1, 1, 1),
          emissive: 0xff5a1e, emissiveMap: tiledClone(this._texSet.lava, 1, 1, 1),
          emissiveIntensity: 1.3, flatShading: true, roughness: 0.9
        })
        this._disposables.mats.push(rockMat)
        this._disposables.texs.push(rockMat.map, rockMat.emissiveMap)
        const geo = new THREE.ConeGeometry(r, h, 6)
        const m = this._propMesh(geo, rockMat, p[0], p[1] + (pr.flip ? 0 : h / 2), p[2])
        m.rotation.y = Math.random() * Math.PI
        if (pr.flip) {
          m.rotation.x = Math.PI
          m.position.y = p[1] - h / 2
        }
        break
      }
    }
  }

  // ------------------------------------------------------------ target

  _buildTarget () {
    const { p, r } = this.def.target

    this._targetMat = new THREE.MeshStandardMaterial({
      color: 0xff2a1a, emissive: 0xff2200, emissiveIntensity: 2.0,
      flatShading: true, roughness: 0.4
    })
    this._disposables.mats.push(this._targetMat)
    const target = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), this._targetMat)
    target.position.set(p[0], p[1], p[2])
    target.castShadow = true
    this.root.add(target)
    this._disposables.geos.push(target.geometry)
    this.target = target

    // orbiting glow rings around the target
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff5030, transparent: true, opacity: 0.85
    })
    this._disposables.mats.push(ringMat)
    this._targetRings = []
    for (const [axis, rad, speed] of [['x', r + 1.1, 0.9], ['y', r + 2.0, -0.6]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.09, 6, 40), ringMat)
      ring.position.set(p[0], p[1], p[2])
      ring.rotation.z = Math.PI / 2
      this.root.add(ring)
      this._disposables.geos.push(ring.geometry)
      this._targetRings.push({ mesh: ring, axis, speed })
    }

    // Physics: ball collider tagged 'target'
    const targetCollider = this.physics.world.createCollider(
      RAPIER.ColliderDesc.ball(r)
        .setTranslation(p[0], p[1], p[2])
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      this.staticBody
    )
    this.physics.tag(targetCollider, 'target')
    this._colliders.push(targetCollider)

    // vertical light beam so the goal is visible from spawn
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 90, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xff3322, transparent: true, opacity: 0.16,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      })
    )
    beam.position.set(p[0], p[1] + 45 - r, p[2])
    beam.frustumCulled = false
    this.root.add(beam)
    this._disposables.geos.push(beam.geometry)
    this._disposables.mats.push(beam.material)
  }

  // ------------------------------------------------------------ build

  _buildBoxes () {
    for (const rec of this.def.boxes) this._addBox(rec)
  }

  _buildProps () {
    // small decorations are skipped entirely on weak devices
    if (this.mobile && this.def.props.length > 10) {
      // keep only landmarks (antennas + rings) on mobile
      for (const pr of this.def.props) {
        if (pr.t === 'antenna' || pr.t === 'ring') this._addProp(pr)
      }
      return
    }
    for (const pr of this.def.props) this._addProp(pr)
  }

  // ------------------------------------------------------------ frame

  /** Idle animations: target pulse, beacon blink, ring spin. */
  update (dt) {
    this._t += dt
    this._targetMat.emissiveIntensity = 1.8 + Math.sin(this._t * 4) * 0.7
    this.target.rotation.y += dt * 0.8

    for (const b of this._beacons) {
      const s = 0.5 + 0.5 * Math.sin(this._t * 3.4 + b.phase)
      b.mat.emissiveIntensity = 0.4 + s * s * 2.6
    }
    for (const r of this._rings) {
      r.rotation.z += dt * 0.35
    }
    for (const { mesh, axis, speed } of this._targetRings) {
      if (axis === 'x') mesh.rotation.x += dt * speed
      else mesh.rotation.y += dt * speed
    }
  }

  // ------------------------------------------------------------ teardown

  /** Remove every collider, mesh and GPU resource owned by this level. */
  dispose () {
    // drop this level's tags first (the missile keeps its own)
    for (const c of this._colliders) this.physics.tags.delete(c.handle)
    for (const c of this._colliders) {
      try { this.physics.world.removeCollider(c, false) } catch (_) { /* already gone */ }
    }
    this._colliders.length = 0

    this.scene.remove(this.root)
    for (const g of this._disposables.geos) g.dispose()
    for (const m of this._disposables.mats) m.dispose()
    for (const t of this._disposables.texs) t.dispose()
    this._disposables.geos.length = 0
    this._disposables.mats.length = 0
    this._disposables.texs.length = 0
  }
}
