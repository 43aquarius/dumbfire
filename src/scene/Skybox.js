/**
 * Skybox — procedural environment dressing.
 *
 *  - a shader sky dome (zenith->horizon gradient + sun disc + ground haze)
 *  - a ring of low-poly mountains at the horizon (non-collidable)
 *  - drifting cloud puffs (horizontal alpha planes, tinted per level)
 *  - a huge ground disc that extends the terrain to the horizon
 *
 * The dome follows the camera so it can never be flown through, and the
 * whole thing re-tints itself per level via applyPalette().
 */
import * as THREE from 'three'
import { buildTextures } from './textures.js'

const DOME_VERT = /* glsl */ `
  varying vec3 vDir;
  void main () {
    vDir = position;
    // dome is attached at origin of its own group, which tracks the camera
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const DOME_FRAG = /* glsl */ `
  varying vec3 vDir;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunSize;
  void main () {
    vec3 d = normalize(vDir);
    float h = d.y;
    // sky gradient above the horizon, hazy floor below it
    vec3 col = mix(uHorizon, uZenith, smoothstep(0.0, 0.42, max(h, 0.0)));
    col = mix(col, uGround, smoothstep(0.0, -0.12, h));
    // sun disc + wide warm glow
    float s = distance(d, normalize(uSunDir));
    float disc = smoothstep(uSunSize, uSunSize * 0.55, s);
    float glow = pow(max(0.0, 1.0 - s * 0.55), 6.0) * 0.5;
    col += uSunColor * (disc + glow);
    gl_FragColor = vec4(col, 1.0);
  }
`

const rnd = (a, b) => a + Math.random() * (b - a)

export class Skybox {
  /** @param {THREE.Scene} scene @param {{mobile?: boolean}} opts */
  constructor (scene, opts = {}) {
    this.scene = scene
    this.group = new THREE.Group() // follows the camera every frame
    scene.add(this.group)

    // ---- sky dome ----
    this.uniforms = {
      uZenith: { value: new THREE.Color(0x89b7e8) },
      uHorizon: { value: new THREE.Color(0xdbe7ef) },
      uGround: { value: new THREE.Color(0x6a6f66) },
      uSunDir: { value: new THREE.Vector3(0.45, 0.62, 0.3).normalize() },
      uSunColor: { value: new THREE.Color(0xfff1de) },
      uSunSize: { value: 0.035 }
    }
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1400, 40, 20),
      new THREE.ShaderMaterial({
        vertexShader: DOME_VERT,
        fragmentShader: DOME_FRAG,
        uniforms: this.uniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false
      })
    )
    dome.renderOrder = -10
    dome.frustumCulled = false
    this.group.add(dome)

    // ---- mountain ring ----
    this.mountains = new THREE.Group()
    this.group.add(this.mountains)
    const count = opts.mobile ? 26 : 42
    this._mountainMat = new THREE.MeshStandardMaterial({
      color: 0x7c8894, flatShading: true, roughness: 1, metalness: 0
    })
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rnd(-0.08, 0.08)
      const dist = rnd(520, 950)
      const h = rnd(55, 190)
      const r = rnd(70, 170)
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5 + ((Math.random() * 3) | 0)), this._mountainMat)
      m.position.set(Math.cos(angle) * dist, h / 2 - 24, Math.sin(angle) * dist)
      m.rotation.y = rnd(0, Math.PI * 2)
      this.mountains.add(m)
    }

    // ---- stars (night palettes) ----
    const starPos = new Float32Array(420 * 3)
    for (let i = 0; i < 420; i++) {
      // random upper-hemisphere directions at dome radius
      const a = rnd(0, Math.PI * 2)
      const y = rnd(0.06, 0.98)
      const rXZ = Math.sqrt(1 - y * y)
      starPos[i * 3] = Math.cos(a) * rXZ * 1320
      starPos[i * 3 + 1] = y * 1320
      starPos[i * 3 + 2] = Math.sin(a) * rXZ * 1320
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    this._starMat = new THREE.PointsMaterial({
      color: 0xdfe8ff, size: 2.2, sizeAttenuation: false,
      transparent: true, opacity: 0, depthWrite: false, fog: false
    })
    this._stars = new THREE.Points(starGeo, this._starMat)
    this._stars.frustumCulled = false
    this._stars.renderOrder = -9
    this.group.add(this._stars)

    // ---- drifting cloud puffs ----
    this.clouds = new THREE.Group()
    this.group.add(this.clouds)
    this._cloudMat = new THREE.MeshBasicMaterial({
      map: buildTextures().puff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      fog: true,
      color: 0xffffff
    })
    this._cloudMat.fog = false // keep clouds readable at distance
    const nClouds = opts.mobile ? 14 : 26
    this._cloudData = []
    for (let i = 0; i < nClouds; i++) {
      const size = rnd(120, 320)
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size * rnd(0.5, 0.9)), this._cloudMat)
      mesh.rotation.x = -Math.PI / 2 // lie flat — always seen from below
      mesh.rotation.z = rnd(0, Math.PI * 2)
      const data = {
        mesh,
        vx: rnd(1.2, 4.0),
        radius: rnd(180, 700),
        angle: rnd(0, Math.PI * 2),
        y: rnd(110, 190)
      }
      this._cloudData.push(data)
      this.clouds.add(mesh)
    }
    this._cloudT = 0
  }

  /**
   * Re-tint the whole environment for a level.
   * @param {object} p level palette {
   *   skyZenith, skyHorizon, skyGround, sunColor, sunOffset,
   *   mountainColor, cloudColor, cloudOpacity }
   */
  applyPalette (p) {
    this.uniforms.uZenith.value.set(p.skyZenith)
    this.uniforms.uHorizon.value.set(p.skyHorizon)
    this.uniforms.uGround.value.set(p.skyGround)
    this.uniforms.uSunColor.value.set(p.sunColor)
    this.uniforms.uSunDir.value.set(p.sunOffset[0], p.sunOffset[1], p.sunOffset[2]).normalize()
    this._mountainMat.color.set(p.mountainColor)
    this._cloudMat.color.set(p.cloudColor)
    this._cloudMat.opacity = p.cloudOpacity
    this._starMat.opacity = p.stars || 0
  }

  /** Dome tracks the camera; clouds drift. @param {THREE.Vector3} camPos */
  update (dt, camPos) {
    this.group.position.copy(camPos)
    this._cloudT += dt
    for (const c of this._cloudData) {
      c.angle += (c.vx / c.radius) * dt
      c.mesh.position.set(Math.cos(c.angle) * c.radius, c.y, Math.sin(c.angle) * c.radius)
    }
  }
}
