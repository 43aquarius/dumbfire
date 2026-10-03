/**
 * DUMBFIRE — playable web prototype.
 * Inertia-heavy missile flight + grapple-hook slinging.
 *
 * Stack: Vite + three.js (rendering) + Rapier3D (physics, compat build).
 *
 * Entry point: boots Rapier's WASM, wires every module together and hands
 * control to the Game loop.
 */
import { PhysicsWorld } from './physics/PhysicsWorld.js'
import { GameScene } from './scene/GameScene.js'
import { Level } from './scene/Level.js'
import { InputManager } from './input/InputManager.js'
import { Missile } from './entities/Missile.js'
import { GrappleHook } from './abilities/GrappleHook.js'
import { Boost } from './abilities/Boost.js'
import { BulletTime } from './abilities/BulletTime.js'
import { DragChute } from './abilities/DragChute.js'
import { Effects } from './scene/Effects.js'
import { CameraRig } from './scene/CameraRig.js'
import { HUD } from './ui/HUD.js'
import { Game } from './game/Game.js'

async function main () {
  // Rapier (compat) ships its WASM inlined as base64 — must init before use
  const physics = await PhysicsWorld.create()

  // Rendering scene graph
  const scene = new GameScene(document.getElementById('app'))

  // Static test level (visuals + colliders + target)
  const level = new Level(physics, scene.scene)

  // Input with pointer lock
  const input = new InputManager(scene.canvas)
  input.attach()

  // Player entity + abilities
  const missile = new Missile(physics, scene.scene)
  const grapple = new GrappleHook(physics, missile, scene.scene)
  const boost = new Boost()
  const bulletTime = new BulletTime()
  const chute = new DragChute(missile, scene.scene)

  // Presentation layer
  const effects = new Effects(scene)
  const cameraRig = new CameraRig(scene.camera, missile)
  const hud = new HUD()

  // Pointer lock drives the READY panel text
  input.onLockChange = (locked) => hud.setPointerLocked(locked)

  // The game loop owns everything from here on
  const game = new Game({
    physics, scene, level, input, hud, effects, cameraRig,
    missile, grapple, boost, bulletTime, chute
  })

  // Debug hook — inspect live state from the devtools console, e.g.
  //   __game.state            -> 'ready' | 'flying' | 'crashed' | 'complete'
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
