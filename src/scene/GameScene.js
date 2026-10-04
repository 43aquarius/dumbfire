/**
 * GameScene — renderer, scene, lights, fog, camera + window resize plumbing.
 *
 * Keeps the WebGL specifics in one place. Owns the Skybox (procedural sky
 * dome, mountains, clouds) and re-tints the whole environment per level via
 * applyPalette(). The directional "sun" follows the missile so a modest
 * shadow map stays crisp along the whole course.
 *
 * Mobile extras:
 *  - DYNAMIC RESOLUTION: render frame times are monitored (EMA); when the
 *    device can't keep up, the internal pixel ratio steps down (0.7 floor),
 *    and slowly climbs back when there is head-room again. Result: a
 *    steady frame budget instead of stutter on weaker GPUs.
 *  - PORTRAIT FOV COMPENSATION: phones held upright get extra vertical FOV
 *    (capped) so the horizontal view stays usable; `this.fovMul` is consumed
 *    by the CameraRig.
 *  - visualViewport is watched in addition to window resize (iOS toolbars).
 */
import * as THREE from 'three'
import { CFG } from '../config.js'
import { Skybox } from './Skybox.js'

export class GameScene {
  /**
   * @param {HTMLElement} container element that hosts the canvas
   * @param {{mobile?: boolean}} opts quality profile
   */
  constructor (container, opts = {}) {
    this.container = container
    this.mobile = !!opts.mobile

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    })
    // mobile GPUs choke on 3x pixel ratios — cap them, keep crispness on desktop
    this._prBase = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.75 : 2)
    this._prScale = 1 // dynamic-resolution factor (0.7..1, mobile only)
    this.renderer.setPixelRatio(this._prBase)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.background = null // sky dome covers everything
    this.scene.fog = new THREE.Fog(0xc6d0da, 60, 560) // re-tinted per level

    this.camera = new THREE.PerspectiveCamera(
      74, window.innerWidth / window.innerHeight, 0.1, 2000
    )
    this.camera.position.set(0, 10, 70)

    /**
     * FOV multiplier for portrait phones — the CameraRig multiplies its
     * target FOV by this so the HORIZONTAL view stays wide enough to fly.
     */
    this.fovMul = 1

    // Soft sky/ground bounce
    this.hemi = new THREE.HemisphereLight(0xe9f2fb, 0x606468, 0.9)
    this.scene.add(this.hemi)

    // Sun with missile-following shadows (tighter frustum on mobile)
    const sun = new THREE.DirectionalLight(0xfff1de, 2.6)
    sun.castShadow = true
    sun.shadow.mapSize.set(this.mobile ? 1024 : 2048, this.mobile ? 1024 : 2048)
    const fr = this.mobile ? 60 : 75
    sun.shadow.camera.left = -fr
    sun.shadow.camera.right = fr
    sun.shadow.camera.top = fr
    sun.shadow.camera.bottom = -fr
    sun.shadow.camera.near = 5
    sun.shadow.camera.far = 320
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.6
    this.scene.add(sun)
    this.scene.add(sun.target)
    this.sun = sun
    this.sunOffset = new THREE.Vector3(55, 85, 35)

    // ---- procedural environment ----
    this.skybox = new Skybox(this.scene, { mobile: this.mobile })
    this._buildGround()

    // ---- dynamic-resolution state ----
    this._frameMs = 16.7   // EMA of render frame time
    this._lastRenderT = 0
    this._resCheckT = 0
    this._resCooldown = 2 // settle time after boot before scaling starts

    this._resizeCbs = []
    window.addEventListener('resize', () => this._onResize())
    window.addEventListener('orientationchange', () => setTimeout(() => this._onResize(), 250))
    // iOS Safari fires this when the toolbars collapse/expand
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this._onResize())
    }
    this._onResize()
  }

  get canvas () { return this.renderer.domElement }

  /** Big visual-only ground disc extending the terrain to the horizon. */
  _buildGround () {
    const geo = new THREE.CircleGeometry(2400, 48)
    this._groundMat = new THREE.MeshStandardMaterial({
      color: 0x8a8f85, roughness: 1, metalness: 0
    })
    this._ground = new THREE.Mesh(geo, this._groundMat)
    this._ground.rotation.x = -Math.PI / 2
    this._ground.position.y = -2.05
    this._ground.receiveShadow = true
    this.scene.add(this._ground)
  }

  /**
   * Apply a level palette: fog, lights, sky, mountains, clouds, ground.
   * @param {object} p see levels/*.js `palette`
   */
  applyPalette (p) {
    this.scene.fog.color.set(p.fogColor)
    this.scene.fog.near = p.fogNear
    this.scene.fog.far = p.fogFar

    this.hemi.color.set(p.hemiSky)
    this.hemi.groundColor.set(p.hemiGround)
    this.hemi.intensity = p.hemiIntensity

    this.sun.color.set(p.sunColor)
    this.sun.intensity = p.sunIntensity
    this.sunOffset.set(p.sunOffset[0], p.sunOffset[1], p.sunOffset[2])

    this.skybox.applyPalette(p)
    this._groundMat.color.set(p.ground)
    this._ground.position.y = p.groundY
  }

  /** Subscribe to resize events (e.g. particle systems rescaling). */
  onResize (cb) {
    this._resizeCbs.push(cb)
    cb(this.renderer.domElement.height) // fire immediately with current size
  }

  _onResize () {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this._updateFovMul()
    this.camera.updateProjectionMatrix()
    this._notifyResize()
  }

  /** Keep particle point-sizes and dependents in sync with the new canvas. */
  _notifyResize () {
    for (const cb of this._resizeCbs) cb(this.renderer.domElement.height)
  }

  /**
   * Portrait compensation: widen the vertical FOV (capped) so the
   * horizontal FOV doesn't collapse on tall screens. Aspect >= 1 -> 1.
   */
  _updateFovMul () {
    const a = this.camera.aspect
    if (a >= 1 || !isFinite(a)) { this.fovMul = 1; return }
    const cap = CFG.camera.portraitFovCap / CFG.camera.fovBase
    this.fovMul = THREE.MathUtils.clamp(Math.pow(1 / a, 0.75), 1, cap)
  }

  /**
   * Keep the sun (and its shadow frustum) centred on the action,
   * drift the skybox along with the camera.
   */
  update (dt, followPos) {
    this.sun.position.copy(followPos).add(this.sunOffset)
    this.sun.target.position.copy(followPos)
    this.sun.target.updateMatrixWorld()
    this.skybox.update(dt, this.camera.position)
  }

  render () {
    this._trackFrameTime()
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Dynamic resolution: EMA of inter-render time, evaluated twice a second.
   * If we can't hold ~45 fps, drop the internal resolution a step; when
   * there's head-room again, climb back slowly. Mobile only.
   */
  _trackFrameTime () {
    const now = performance.now()
    if (this._lastRenderT) {
      const dt = now - this._lastRenderT
      if (dt < 250) this._frameMs += (dt - this._frameMs) * 0.1 // clamp spikes
    }
    this._lastRenderT = now

    if (!this.mobile) return
    this._resCheckT += this._frameMs / 1000
    if (this._resCooldown > 0) {
      this._resCooldown -= this._frameMs / 1000
      return
    }
    if (this._resCheckT < 0.6) return
    this._resCheckT = 0

    let s = this._prScale
    if (this._frameMs > 22.5 && s > 0.7) {
      s = Math.max(0.7, s - 0.15) // struggling — shed pixels quickly
    } else if (this._frameMs < 14 && s < 1) {
      s = Math.min(1, s + 0.1) // comfortable — recover gently
    } else {
      return // steady state, no churn
    }
    this._prScale = s
    this.renderer.setPixelRatio(this._prBase * s)
    this._notifyResize()
  }
}
