/**
 * buildings.js — procedural composite buildings.
 *
 * Turns compact records into detailed structures: setback towers with
 * window-banded facades, parapet trims and rooftop clutter (water tanks,
 * HVAC units, antenna masts with blinking beacons), long slabs, hangars
 * with curved roofs and industrial chimney stacks.
 *
 * Record format (def.buildings):
 *   [x, z, w, d, h, style, opts?]
 *     style: 0 tower | 1 slab | 2 hangar | 3 stack
 *     opts: { y: baseY (default 0), rot: yaw rad, tiers: n, noCol: bool,
 *             far: bool (skyline dressing — cheap), tall: bool }
 *
 * Colliders are exact per tier (static bodies, so no perf concern).
 * Desktop gets full detail; mobile collapses each building to a single
 * window-textured box (+ beacon on the tallest).
 *
 * Deterministic: roof clutter is placed from a seed hashed off the level
 * id, so a course looks identical on every reload.
 */
import * as THREE from 'three'
import { RAPIER } from '../physics/PhysicsWorld.js'
import { buildTextures } from './textures.js'

/** FNV-1a string hash -> uint32 seed. */
function hashStr (s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — tiny deterministic PRNG. */
function mulberry32 (a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Build every building record of a level.
 * @param {import('./Level.js').Level} level owning Level instance
 * @param {Array} records def.buildings
 */
export function addBuildings (level, records) {
  const p = level.def.palette
  const tex = buildTextures()
  const night = !!p.windowsNight
  const mobile = level.mobile
  const facadeColor = p.facade !== undefined ? p.facade : p.concrete

  // ---- shared materials (per level) ----
  const roofMat = level.mat.concrete // roofs / plinths reuse the course concrete
  const trimMat = new THREE.MeshStandardMaterial({
    color: p.trim !== undefined ? p.trim : 0x4c5157,
    map: tiled(tex.metalPanel, 2, 2), flatShading: true, roughness: 0.55, metalness: 0.45
  })
  level._disposables.mats.push(trimMat)
  level._disposables.texs.push(trimMat.map)

  const beaconShared = mobile ? null : new THREE.MeshStandardMaterial({
    color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 2, flatShading: true
  })
  if (beaconShared) level._disposables.mats.push(beaconShared)

  // facade material buckets — buildings of similar size share one material
  // (each clone is one small GPU texture upload, freed on level dispose)
  const buckets = new Map()
  const facadeMat = (rx, ry) => {
    const key = `${rx}|${ry}`
    if (buckets.has(key)) return buckets.get(key)
    const map = tiled(night ? tex.windowsNight : tex.windowsDay, rx, ry)
    const m = new THREE.MeshStandardMaterial({
      color: facadeColor, map, roughness: night ? 0.6 : 0.75, metalness: 0.12,
      flatShading: false
    })
    if (night) {
      m.emissive = new THREE.Color(0xffd2a0)
      m.emissiveMap = map
      m.emissiveIntensity = 0.95
    }
    level._disposables.mats.push(m)
    level._disposables.texs.push(map)
    buckets.set(key, m)
    return m
  }
  // mobile: one shared facade for every building (windows slightly off-scale
  // on the outliers — invisible at phone DPI and saves texture uploads)
  const mobileFacade = mobile ? facadeMat(2, 4) : null

  const rng = mulberry32(hashStr(level.def.id || 'seed') ^ 0x9e3779b9)

  // ---- helpers -----------------------------------------------------------

  /** Collider-only box with yaw rotation (three.js-side transform parity). */
  function addBoxC (x, y, z, sx, sy, sz, rotY) {
    let quat = null
    if (rotY) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0))
      quat = { x: q.x, y: q.y, z: q.z, w: q.w }
    }
    let desc = RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2)
      .setTranslation(x, y, z).setFriction(0.8)
    if (quat) desc = desc.setRotation(quat)
    const col = level.physics.world.createCollider(desc, level.staticBody)
    level.physics.tag(col, 'level')
    level._colliders.push(col)
  }

  function addCylC (x, y, z, halfH, r) {
    const col = level.physics.world.createCollider(
      RAPIER.ColliderDesc.cylinder(halfH, r).setTranslation(x, y, z).setFriction(0.8),
      level.staticBody
    )
    level.physics.tag(col, 'level')
    level._colliders.push(col)
  }

  /** Facade box with per-face materials (front/back vs sides vs roof). */
  function facadeBox (group, cx, cy, cz, sx, sy, sz) {
    let mat
    if (mobile) {
      mat = mobileFacade
    } else {
      const rf = Math.max(1, Math.min(8, Math.round(sx / 9)))
      const rs = Math.max(1, Math.min(8, Math.round(sz / 9)))
      const ry = Math.max(1, Math.min(12, Math.round(sy / 13)))
      const front = facadeMat(rf, ry)
      const side = facadeMat(rs, ry)
      mat = [side, side, roofMat, roofMat, front, front]
    }
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat)
    mesh.position.set(cx, cy, cz)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    level._disposables.geos.push(mesh.geometry)
    return mesh
  }

  /** Thin trim ring (parapet) around a box top. */
  function parapet (group, cx, cy, cz, sx, sz) {
    const t = 0.35
    const h = 0.55
    for (const [ox, oz, px, pz] of [
      [0, sz / 2 - t / 2, sx, t], [0, -sz / 2 + t / 2, sx, t],
      [sx / 2 - t / 2, 0, t, sz], [-sx / 2 + t / 2, 0, t, sz]
    ]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(px, h, pz), trimMat)
      m.position.set(cx + ox, cy + h / 2, cz + oz)
      m.castShadow = true
      group.add(m)
      level._disposables.geos.push(m.geometry)
    }
  }

  /** Rooftop clutter — deterministic per building. */
  function roofProps (group, topY, sx, sz, idx, h) {
    const put = (mesh, lx, lz) => {
      mesh.position.set(lx, topY, lz)
      group.add(mesh)
    }
    // water tank
    if (rng() < 0.4) {
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.05, 1.9, 10), trimMat)
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(1.12, 0.65, 10), trimMat)
      tank.castShadow = true
      const lx = (rng() - 0.5) * (sx - 4)
      const lz = (rng() - 0.5) * (sz - 4)
      put(tank, lx, lz)
      cap.position.set(lx, topY + 1.9 + 0.32, lz)
      group.add(cap)
      level._disposables.geos.push(tank.geometry, cap.geometry)
    }
    // HVAC units
    const nAc = 1 + ((rng() * 2.4) | 0)
    for (let i = 0; i < nAc; i++) {
      const w = 1.2 + rng() * 1.4
      const d = 1.0 + rng() * 1.2
      const ac = new THREE.Mesh(new THREE.BoxGeometry(w, 0.85, d), trimMat)
      put(ac, (rng() - 0.5) * (sx - 3), (rng() - 0.5) * (sz - 3))
      level._disposables.geos.push(ac.geometry)
    }
    // antenna + beacon (always on the tallest)
    if (rng() < 0.45 || h > 52) {
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.13, 6.5, 6), trimMat)
      const lx = (rng() - 0.5) * (sx - 3)
      const lz = (rng() - 0.5) * (sz - 3)
      put(mast, lx, lz)
      mast.position.y = topY + 3.25
      let beaconMat = beaconShared
      if (!beaconMat) {
        beaconMat = new THREE.MeshStandardMaterial({
          color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 2, flatShading: true
        })
        level._disposables.mats.push(beaconMat)
      }
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), beaconMat)
      beacon.position.set(lx, topY + 6.7, lz)
      group.add(beacon)
      level._disposables.geos.push(mast.geometry, beacon.geometry)
      if (level._beacons) {
        level._beacons.push({ mat: beaconMat, phase: rng() * Math.PI * 2 })
      }
    }
  }

  // ---- per-building builders ---------------------------------------------

  function buildTower (x, z, w, d, h, opts) {
    const y0 = opts.y || 0
    const rot = opts.rot || 0
    const far = !!opts.far
    const tiers = mobile || far ? 1 : (opts.tiers || (h > 46 ? 3 : 2))

    const group = new THREE.Group()
    group.position.set(x, 0, z)
    group.rotation.y = rot
    level.root.add(group)

    // plinth
    if (!mobile && !far) {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(w + 1.6, 2.4, d + 1.6), roofMat)
      pl.position.set(0, y0 + 1.2, 0)
      pl.castShadow = pl.receiveShadow = true
      group.add(pl)
      level._disposables.geos.push(pl.geometry)
    }

    let yb = y0
    for (let t = 0; t < tiers; t++) {
      const shrink = 1 - (t * 0.82) / (tiers * 2.4)
      const sw = Math.max(3, w * shrink)
      const sd = Math.max(3, d * shrink)
      const th = t === tiers - 1 ? h - (yb - y0) : (h / tiers) * (t % 2 === 0 ? 1.06 : 0.94)
      facadeBox(group, 0, yb + th / 2, 0, sw, th, sd)
      if (!opts.noCol) addBoxC(x, yb + th / 2, z, sw, th, sd, rot)
      if (!mobile && !far) parapet(group, 0, yb + th, 0, sw, sd)
      yb += th
    }
    if (!mobile && !far) roofProps(group, yb, Math.max(4, w * (1 - 0.8 / 2.4)), Math.max(4, d * (1 - 0.8 / 2.4)), 0, h)
  }

  function buildSlab (x, z, w, d, h, opts) {
    buildTower(x, z, w, d, h, { ...opts, tiers: 1 })
  }

  function buildHangar (x, z, w, d, h, opts) {
    const y0 = opts.y || 0
    const rot = opts.rot || 0
    const bodyH = h * 0.68
    const group = new THREE.Group()
    group.position.set(x, 0, z)
    group.rotation.y = rot
    level.root.add(group)

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, bodyH, d), level.mat.dark)
    body.position.set(0, y0 + bodyH / 2, 0)
    body.castShadow = body.receiveShadow = true
    group.add(body)
    level._disposables.geos.push(body.geometry)

    // curved roof (half-pipe along Z)
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(w / 2, w / 2, d, 12, 1, false, 0, Math.PI),
      level.mat.girder
    )
    roof.geometry.rotateZ(Math.PI / 2)
    roof.geometry.rotateY(Math.PI / 2)
    roof.position.set(0, y0 + bodyH, 0)
    roof.castShadow = true
    group.add(roof)
    level._disposables.geos.push(roof.geometry)

    // big door + trim on the front face
    const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, bodyH * 0.8, 0.4), trimMat)
    door.position.set(0, y0 + bodyH * 0.42, -d / 2 - 0.12)
    group.add(door)
    level._disposables.geos.push(door.geometry)

    // side service pipes
    if (!mobile) {
      for (const px of [w / 2 + 0.3, -w / 2 - 0.3]) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, d * 0.92, 8), trimMat)
        pipe.rotation.x = Math.PI / 2
        pipe.position.set(px, y0 + bodyH * 0.35, 0)
        group.add(pipe)
        level._disposables.geos.push(pipe.geometry)
      }
    }

    if (!opts.noCol) {
      addBoxC(x, y0 + bodyH / 2, z, w, bodyH, d, rot)
      addBoxC(x, y0 + bodyH + h * 0.16, z, w * 0.94, h * 0.32, d * 0.96, rot)
    }
  }

  function buildStack (x, z, w, d, h, opts) {
    const y0 = opts.y || 0
    const r = w / 2
    const group = new THREE.Group()
    group.position.set(x, 0, z)
    level.root.add(group)

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.68, r, h, 12, 1), level.mat.concrete)
    shaft.position.set(0, y0 + h / 2, 0)
    shaft.castShadow = shaft.receiveShadow = true
    group.add(shaft)
    level._disposables.geos.push(shaft.geometry)

    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.72, r * 0.74, 1.4, 12), level.mat.hazard)
    band.position.set(0, y0 + h - 0.7, 0)
    group.add(band)
    level._disposables.geos.push(band.geometry)

    if (!mobile) {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.5, r * 0.62, 0.5, 12), trimMat)
      cap.position.set(0, y0 + h + 0.25, 0)
      group.add(cap)
      level._disposables.geos.push(cap.geometry)
    }
    if (!opts.noCol) addCylC(x, y0 + h / 2, z, h / 2, r * 0.92)
  }

  // ---- run ----------------------------------------------------------------

  for (let i = 0; i < records.length; i++) {
    const [x, z, w, d, h, style, opts] = records[i]
    const o = opts || {}
    if (mobile) {
      // collapse to one window-textured box; keep collider exact
      if (style === 3) { buildStack(x, z, w, d, h, o); continue }
      const group = new THREE.Group()
      group.position.set(x, 0, z)
      group.rotation.y = o.rot || 0
      level.root.add(group)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mobileFacade)
      mesh.position.set(0, (o.y || 0) + h / 2, 0)
      mesh.castShadow = mesh.receiveShadow = true
      group.add(mesh)
      level._disposables.geos.push(mesh.geometry)
      if (!o.noCol) addBoxC(x, (o.y || 0) + h / 2, z, w, h, d, o.rot)
      if (h > 46) { // beacon on tall towers so the skyline still blinks
        const bm = new THREE.MeshStandardMaterial({
          color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 2, flatShading: true
        })
        level._disposables.mats.push(bm)
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bm)
        beacon.position.set(x, (o.y || 0) + h + 0.5, z)
        level.root.add(beacon)
        level._disposables.geos.push(beacon.geometry)
        level._beacons.push({ mat: bm, phase: rng() * Math.PI * 2 })
      }
      continue
    }
    switch (style) {
      case 1: buildSlab(x, z, w, d, h, o); break
      case 2: buildHangar(x, z, w, d, h, o); break
      case 3: buildStack(x, z, w, d, h, o); break
      default: buildTower(x, z, w, d, h, o)
    }
  }
}

/** Clone a base texture with a fixed repeat (shares the canvas source). */
function tiled (base, rx, ry) {
  const t = base.clone()
  t.needsUpdate = true
  t.repeat.set(rx, ry)
  return t
}
