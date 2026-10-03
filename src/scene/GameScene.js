/**
 * GameScene — renderer, scene, lights, fog, camera + window resize plumbing.
 *
 * Keeps the WebGL specifics in one place; everything else in the game only
 * ever sees a THREE.Scene, a camera and a render() call.
 *
 * The directional "sun" follows the missile so a modest 2048px shadow map
 * stays crisp along the whole 300 m course.
 */
import * as THREE from 'three'

export class GameScene {
  /** @param {HTMLElement} container element that hosts the canvas */
  constructor (container) {
    this.container = container

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xc6d0da)
    this.scene.fog = new THREE.Fog(0xc6d0da, 60, 560) // depth cue for fast flight

    this.camera = new THREE.PerspectiveCamera(
      74, window.innerWidth / window.innerHeight, 0.1, 1600
    )
    this.camera.position.set(0, 10, 70)

    // Soft sky/ground bounce
    const hemi = new THREE.HemisphereLight(0xe9f2fb, 0x606468, 0.9)
    this.scene.add(hemi)

    // Sun with missile-following shadows
    const sun = new THREE.DirectionalLight(0xfff1de, 2.6)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
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

    this._resizeCbs = []
    window.addEventListener('resize', () => this._onResize())
    this._onResize()
  }

  get canvas () { return this.renderer.domElement }

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

  /** Keep the sun (and its shadow frustum) centred on the action. */
  update (followPos) {
    this.sun.position.set(followPos.x + 55, followPos.y + 85, followPos.z + 35)
    this.sun.target.position.copy(followPos)
    this.sun.target.updateMatrixWorld()
  }

  render () {
    this.renderer.render(this.scene, this.camera)
  }
}
