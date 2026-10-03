# DUMBFIRE

An inertia-heavy missile flight prototype with grapple-hook traversal.
**Stack: Vite + Three.js + Rapier3D** (`@dimforge/rapier3d-compat`).

You are the missile. You have enormous momentum, no brakes and no regrets:
steer with the mouse, burn the engine to build speed, grapple-hook through
gaps you cannot survive otherwise, and hit the red target sphere at the end
of the course. Touch anything solid and you explode — then you fly again.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build (output is fully static — host it anywhere):

```bash
npm run build      # -> dist/
npm run preview
```

Smoke-test the physics API usage (no browser needed):

```bash
npm run test:physics
```

## Controls

| Input | Action |
|---|---|
| Mouse move | steer (pitch / yaw) |
| SPACE | main thrust |
| LMB | grapple fire / release |
| SHIFT | super boost (0.6 s burn, 3.2 s cooldown) |
| RMB | bullet-time toggle |
| S | drag chute (hold) |
| R | restart run |

## The single test level

A linear course flown toward −Z:

1. **Launch pad** — missile spawns here, first SPACE press releases it
2. **Girder gate** — two towers and a beam wall with a centre gap
3. **Pillar slalom** — staggered concrete pillars + cross girders (grapple rails)
4. **The window wall** — full-width wall with a 6×6 m hole to thread
5. **Half pyramid** — stacked blocks: thread, climb or sling around it
6. **Slope + arch** — steep ramp you can surf with the grapple, fly under the arch
7. **Kicker ramp** — launches you upward toward the finish
8. **Target tower** — red glowing sphere on top; hit it to stop the clock

## Mechanics notes

- **No auto-braking.** The missile rigid body has zero linear damping —
  velocity only changes through thrust, the grapple rope, the drag chute,
  or a wall (fatal).
- **Grapple rope.** Instant raycast attach, then a constraint that cancels
  only the *outward radial* velocity component while taut. Momentum is
  preserved tangentially, which is what makes swings loss-less slingshots.
- **Bullet-time.** The world keeps stepping at 60 Hz, but every step is
  multiplied by a smoothed time scale (~0.28×). The run timer always counts
  real seconds — slow motion buys control, never a better time.
- **Crash / complete.** Rapier collision events are routed by collider tag;
  `missile × level` → explosion + auto-restart after 1.8 s, `missile × target`
  → level complete with the run time.

## Project structure

```
dumbfire/
├── index.html
├── vite.config.js
├── scripts/rapier-smoke.mjs      # node smoke test for the Rapier API usage
└── src/
    ├── main.js                  # boot: init Rapier, wire modules, start Game
    ├── config.js                # EVERY tuning constant lives here
    ├── physics/PhysicsWorld.js  # Rapier wrapper: fixed step + time scaling + events + raycast
    ├── input/InputManager.js    # pointer lock, key/mouse state and edges
    ├── entities/Missile.js      # rigid body, mouse-look steering, thrust impulses
    ├── abilities/
    │   ├── GrappleHook.js       # raycast attach + rope constraint
    │   ├── Boost.js             # timed burst state machine
    │   ├── BulletTime.js        # smoothed global time scale
    │   └── DragChute.js         # damping brake + chute visual
    ├── scene/
    │   ├── GameScene.js         # renderer / lights / fog / resize
    │   ├── Level.js             # the course: meshes + colliders from one box list
    │   ├── CameraRig.js         # chase cam, FOV kicks, trauma shake
    │   ├── Effects.js           # exhaust / explosions / fireworks facade
    │   └── particles.js         # pooled THREE.Points with a tiny shader
    ├── ui/HUD.js + hud.css      # DOM overlay: timer, chips, crosshair, overlays
    └── game/Game.js             # state machine + main loop
```

## Standalone single-file build

`standalone/dumbfire.html` is the same game flattened into one HTML file
(all modules inlined, three.js and Rapier3D loaded from a CDN import map).
Save it anywhere and open it in a browser — no build step, no server needed
(requires internet access for the CDN).

## Tuning

All gameplay feel lives in `src/config.js` — thrust, boost, rope recovery,
camera lag, particle rates, bounds, restart delay. Change a number, save,
and Vite hot-reloads.
