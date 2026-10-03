/**
 * ParticleSystem — pooled THREE.Points with a tiny custom shader.
 *
 * One CPU-updated ring buffer of particles rendered as an additive point
 * cloud. Cheap (a few thousand particles max), flexible enough for exhaust
 * trails, explosions and smoke puffs. Per-particle color, size and fade.
 */
import * as THREE from 'three'

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aFade;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vFade;
  uniform float uScale;

  void main () {
    vColor = aColor;
    vFade = aFade;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Perspective size attenuation: bigger near, smaller far
    gl_PointSize = aSize * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vFade;

  void main () {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d) * vFade; // soft round particle
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor * a, a); // additive-friendly premultiplied look
  }
`

export class ParticleSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {number} count pool capacity
   * @param {{gravity?: number, drag?: number}} opts per-second world forces
   */
  constructor (scene, count, { gravity = 0, drag = 0 } = {}) {
    this.count = count
    this.gravity = gravity
    this.drag = drag
    this.cursor = 0

    this.pos = new Float32Array(count * 3)
    this.vel = new Float32Array(count * 3)
    this.col = new Float32Array(count * 3)
    this.size = new Float32Array(count)
    this.fade = new Float32Array(count)
    this.age = new Float32Array(count).fill(1e9) // everything starts dead
    this.life = new Float32Array(count).fill(1)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aFade', new THREE.BufferAttribute(this.fade, 1).setUsage(THREE.DynamicDrawUsage))

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uScale: { value: 600 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    this.points = new THREE.Points(geo, this.material)
    this.points.frustumCulled = false // particles move everywhere
    this.points.renderOrder = 5
    scene.add(this.points)
  }

  /** Set the point-size scale from the canvas pixel height (resize aware). */
  setScale (pixelHeight) {
    this.material.uniforms.uScale.value = Math.max(1, pixelHeight * 0.85)
  }

  /** Spawn one particle (overwrites the oldest slot when the pool wraps). */
  spawn (px, py, pz, vx, vy, vz, life, size, r, g, b) {
    const i = this.cursor
    this.cursor = (this.cursor + 1) % this.count

    const i3 = i * 3
    this.pos[i3] = px; this.pos[i3 + 1] = py; this.pos[i3 + 2] = pz
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz
    this.col[i3] = r; this.col[i3 + 1] = g; this.col[i3 + 2] = b
    this.size[i] = size
    this.age[i] = 0
    this.life[i] = life
    this.fade[i] = 1
  }

  /** Integrate all live particles. Called once per frame. */
  update (dt) {
    if (dt <= 0) return
    const dragF = Math.exp(-this.drag * dt)
    const { pos, vel, age, life, fade } = this

    for (let i = 0; i < this.count; i++) {
      if (age[i] >= life[i]) {
        if (fade[i] !== 0) fade[i] = 0
        continue
      }
      age[i] += dt
      const t = age[i] / life[i]

      // quick attack, quadratic-ish decay
      let f = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88
      if (f < 0) f = 0
      fade[i] = f * f

      const i3 = i * 3
      vel[i3] *= dragF
      vel[i3 + 1] = vel[i3 + 1] * dragF + this.gravity * dt
      vel[i3 + 2] *= dragF

      pos[i3] += vel[i3] * dt
      pos[i3 + 1] += vel[i3 + 1] * dt
      pos[i3 + 2] += vel[i3 + 2] * dt
    }

    const g = this.points.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.aColor.needsUpdate = true
    g.attributes.aSize.needsUpdate = true
    g.attributes.aFade.needsUpdate = true
  }

  /** Kill every particle instantly. */
  clear () {
    this.age.fill(1e9)
    this.fade.fill(0)
    this.points.geometry.attributes.aFade.needsUpdate = true
  }
}
