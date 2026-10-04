/**
 * DUMBFIRE — playable web prototype.
 * Inertia-heavy missile flight + grapple-hook slinging across three courses.
 *
 * Stack: Vite + three.js (rendering) + Rapier3D (physics, compat build).
 *
 * Entry point: boots Rapier's WASM, wires every module together and hands
 * control to the Game loop. Touch devices get the on-screen controls
 * (force-enable on desktop with ?touch=1 for testing).
 */
import { PhysicsWorld } from './physics/PhysicsWorld.js'
import { GameScene } from './scene/GameScene.js'
import { InputManager } from './input/InputManager.js'
import { TouchControls } from './input/TouchControls.js'
import { Missile } from './entities/Missile.js'
import { GrappleHook } from './abilities/GrappleHook.js'
import { Boost } from './abilities/Boost.js'
import { BulletTime } from './abilities/BulletTime.js'
import { DragChute } from './abilities/DragChute.js'
import { Effects } from './scene/Effects.js'
import { CameraRig } from './scene/CameraRig.js'
import { HUD } from './ui/HUD.js'
import { Game } from './game/Game.js'
import { CFG } from './config.js'
import { LEVEL_1 } from './scene/levels/level1.js'
import { LEVEL_2 } from './scene/levels/level2.js'
import { LEVEL_3 } from './scene/levels/level3.js'

const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3]

// ---- device profile ---------------------------------------------------------
// Coarse pointer and no fine pointer => touch-first device. Force with ?touch=1.
const params = new URLSearchParams(location.search)
const isTouch = params.has('touch') ||
  (window.matchMedia('(pointer: coarse)').matches &&
   !window.matchMedia('(pointer: fine)').matches)
CFG.quality.mobile = isTouch
CFG.quality.fxScale = isTouch ? 0.5 : 1

// Body class drives ALL touch-specific CSS (chips/hint hidden, bigger tap
// targets). Width-based media queries used to leak the desktop HUD onto
// landscape phones — 844px wide > 760px breakpoint.
if (isTouch) document.body.classList.add('is-touch')

// iOS Safari pinch-zoom / double-tap guards (it ignores user-scalable=no)
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  window.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
}

// ---- best-run persistence ---------------------------------------------------
const bestKey = (id) => `dumbfire_best_v1_${id}`
const getBest = (id) => {
  const v = parseFloat(localStorage.getItem(bestKey(id)))
  return Number.isFinite(v) ? v : null
}
const setBest = (id, t) => localStorage.setItem(bestKey(id), String(t))

async function main () {
  // Rapier (compat) ships its WASM inlined as base64 — must init before use
  const physics = await PhysicsWorld.create()

  // Rendering scene graph (with the procedural sky/mountains/clouds)
  const scene = new GameScene(document.getElementById('app'), { mobile: isTouch })

  // Input — pointer lock + keys on desktop, virtual keys from touch UI
  const input = new InputManager(scene.canvas)
  input.touchMode = isTouch
  input.attach()

  // Player entity + abilities
  const missile = new Missile(physics, scene.scene, { mobile: isTouch })
  const grapple = new GrappleHook(physics, missile, scene.scene)
  const boost = new Boost()
  const bulletTime = new BulletTime()
  const chute = new DragChute(missile, scene.scene)

  // Presentation layer
  const effects = new Effects(scene)
  const cameraRig = new CameraRig(scene.camera, missile, { mobile: isTouch })
  // Portrait phones get extra vertical FOV so the horizontal view stays flyable
  scene.onResize(() => { cameraRig.fovMul = scene.fovMul })

  // HUD first — its callbacks close over `game`, which is assigned right
  // after; they only ever run on user interaction, by which time it exists.
  let game
  const hud = new HUD({
    mobile: isTouch,
    levels: LEVELS,
    getBest,
    onSelectLevel: (i) => game.selectLevel(i),
    onNext: () => game.nextLevel(),
    onRetry: () => game.restart(),
    onMenu: () => game.toMenu()
  })

  // The game loop owns everything from here on (levels load inside it)
  game = new Game({
    physics, scene, input, hud, effects, cameraRig,
    missile, grapple, boost, bulletTime, chute,
    levels: LEVELS, getBest, setBest, touch: null
  })

  // On-screen controls for touch devices (hidden on desktop unless ?touch=1).
  // Hidden at boot — the menu overlays the screen; selectLevel() shows them.
  let touch = null
  if (isTouch) {
    touch = new TouchControls(input, {
      onGrapple: () => game.grappleToggle(),
      onBulletTime: () => game.bulletTimeToggle(),
      onReset: () => game.restart(),
      onMenu: () => game.toMenu()
    })
    game.touch = touch
  }

  // Pointer lock drives pause / menu / ready panel text
  input.onLockChange = (locked) => {
    hud.setPointerLocked(locked)
    game.onLockChange(locked)
  }

  // Debug hook — inspect live state from the devtools console, e.g.
  //   __game.state            -> 'menu' | 'ready' | 'flying' | 'crashed' | 'complete'
  //   __game.missile.position -> current position
  window.__game = game
}

main().catch((err) => {
  console.error('[DUMBFIRE] fatal:', err)
  const app = document.getElementById('app')
  if (app) {
    app.innerHTML =
      `<div style="color:#ff6b57;font-family:monospace;padding:24px;">` +
      `Failed to start DUMBFIRE: ${err.message}</div>`
  }
})
