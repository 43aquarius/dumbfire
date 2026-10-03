/**
 * GameScene — renderer, scene, lights, fog, camera + window resize plumbing.
 *
 * Keeps the WebGL specifics in one place. Owns the Skybox (procedural sky
 * dome, mountains, clouds) and re-tints the whole environment per level via
 * applyPalette(). The directional "sun" follows the missile so a modest
 * shadow map stays crisp along the whole course.
 */
import * as THREE from 'three'
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 2))
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

    // Soft sky/ground bounce
    this.hemi = new THREE.HemisphereLight(0xe9f2fb, 0x606468, 0.9)
    this.scene.add(this.hemi)

    // Sun with missile-following shadows
    const sun = new THREE.DirectionalLight(0xfff1de, 2.6)
    sun.castShadow = true
    sun.shadow.mapSize.set(this.mobile ? 1024 : 2048, this.mobile ? 1024 : 2048)
    sun.shadow.camera.left = -75
    sun.shadow.camera.right = 75
    sun.shadow.camera.top = 75
    sun.shadow.camera.bottom = -75
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

    this._resizeCbs = []
    window.addEventListener('resize', () => this._onResize())
    window.addEventListener('orientationchange', () => setTimeout(() => this._onResize(), 250))
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
    this.camera.updateProjectionMatrix()
    for (const cb of this._resizeCbs) cb(this.renderer.domElement.height)
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
    this.renderer.render(this.scene, this.camera)
  }
}
