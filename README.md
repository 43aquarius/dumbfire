# DUMBFIRE

An inertia-heavy missile flight prototype with grapple-hook traversal.
**Stack: Vite + Three.js + Rapier3D** (`@dimforge/rapier3d-compat`).

You are the missile. You have enormous momentum, no brakes and no regrets:
steer with the mouse (or your thumb), burn the engine to build speed,
grapple-hook through gaps you cannot survive otherwise, and hit the red
target sphere at the end of the course. Touch anything solid and you
explode — then you fly again.

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

Regenerate the standalone single-file build (fully offline, no CDN):

```bash
node scripts/build-standalone.mjs   # -> dist-standalone/dumbfire.html
```

Smoke-test the physics API usage (no browser needed):

```bash
npm run test:physics
```

## Levels

Six courses, selected from the in-game menu (click a card or press 1-6).
Each keeps its own best time in `localStorage`.

1. **PILLAR RUN** — day-lit industrial grounds: girder gate, pillar
   slalom, window wall, half pyramid, slope + arch, kicker, then the
   industrial-district extension: cooling towers, a container yard,
   pipeline bridge, twin windows, gantry cranes, a helix ramp and the
   final pillar canyon to the target tower. City towers flank the run.
2. **RED CANYON** — sunset serpentine slot: rock fins, a narrow slot,
   a tunnel, an open bowl with a grapple spire, a natural arch, a dive
   into the pit, then the climb onto the high plateau: mesa forest,
   twin slots, a giant natural bridge, a hoodoo garden and the final
   amphitheater.
3. **SKY GAUNTLET** — dusk chain of floating islands over an abyss:
   hop chain, beam bridge, central monolith swing, pumphouse
   fly-through, stepping stones, a suspension bridge you can fly under,
   split-path islands, a collidable hoop-gate gauntlet, a helix climb
   and the final sky citadel. Falling is a crash; the grapple is not
   optional.
4. **NEON HARBOR** — midnight metropolis: lit-window skyscrapers,
   gantry cranes with hanging hooks, an elevated highway to dive under,
   a skyscraper slalom, neon hoop gates, rooftop hops and a mega
   billboard wall, with the target hanging inside the final harbor
   crane. Night facades use an emissive window texture.
5. **GLACIER RUN** — arctic noon on a glacier tongue: frozen gates,
   crevasse leaps, an ice cave, a frozen arch with icicles, a bowl with
   a grapple monolith, a glowing shard forest and the ice caldera.
6. **MAGMA CORE** — volcanic night through basalt corridors: hex gates,
   lava-lake crossings on stone pillars, obsidian shard slaloms, a
   magma chamber, the lava-fall wall window, a hex terrace climb and
   the volcanic amphitheater.

## Controls — desktop

| Input | Action |
|---|---|
| Mouse move | steer (pitch / yaw) |
| SPACE | main thrust / launch |
| LMB | grapple fire / release |
| SHIFT | super boost (0.6 s burn, 3.2 s cooldown) |
| RMB | bullet-time toggle |
| S | drag chute (hold) |
| R | restart level |
| ESC | pause mid-flight / back to the level menu |
| 1 / 2 / 3 | pick level (menu) |
| N / M | next level / menu (after completion) |

## Controls — mobile (touch devices, auto-detected)

- **Left thumb**: floating virtual joystick — steer
- **Right thumb cluster**: THRUST (hold), BOOST, HOOK, CHUTE (hold), SLO-MO
- **Top right**: RESET / MENU
- Force touch mode on desktop for testing: append `?touch=1` to the URL

Mobile also gets an automatic quality profile (capped pixel ratio, 1024px
shadow map, halved particle pools, reduced decoration props).

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
- **Feel.** Speed-based camera pull-back and FOV, roll-lean into turns,
  boost ignition kick + rumble, cinematic slow-mo fireball after a crash,
  pause-on-Esc (pointer lock loss freezes the sim and the clock).
- **Crash / complete.** Rapier collision events are routed by collider tag;
  `missile × level` → explosion + auto-restart after 1.8 s, `missile × target`
  → level complete with the run time, best time and next-level button.

## Project structure

```
dumbfire/
├── index.html
├── vite.config.js
├── scripts/rapier-smoke.mjs      # node smoke test for the Rapier API usage
├── scripts/build-standalone.mjs  # esbuild single-file generator
└── src/
    ├── main.js                  # boot: init Rapier, wire modules, start Game
    ├── config.js                # EVERY tuning constant lives here
    ├── physics/PhysicsWorld.js  # Rapier wrapper: fixed step + time scaling + events + raycast
    ├── input/InputManager.js    # pointer lock, key/mouse state, virtual keys
    ├── input/TouchControls.js   # on-screen joystick + button cluster (mobile)
    ├── entities/Missile.js      # rigid body, steering, thrust, detailed model
    ├── abilities/
    │   ├── GrappleHook.js       # raycast attach + rope constraint
    │   ├── Boost.js             # timed burst state machine
    │   ├── BulletTime.js        # smoothed global time scale
    │   └── DragChute.js         # damping brake + chute visual
    ├── scene/
    │   ├── GameScene.js         # renderer / lights / fog / per-level palette
    │   ├── Skybox.js             # shader sky dome + mountains + drifting clouds
    │   ├── textures.js           # procedural canvas textures (concrete/girder/hazard/
    │   │                         #   windows day+night/metal panel/lava)
    │   ├── buildings.js          # procedural composite buildings (towers/slabs/
    │   │                         #   hangars/stacks, window facades, rooftop clutter)
    │   ├── Level.js              # data-driven course builder (disposeable)
    │   ├── levels/level1.js      # PILLAR RUN
    │   ├── levels/level2.js      # RED CANYON
    │   ├── levels/level3.js      # SKY GAUNTLET
    │   ├── levels/level4.js      # NEON HARBOR
    │   ├── levels/level5.js      # GLACIER RUN
    │   ├── levels/level6.js      # MAGMA CORE
    │   ├── CameraRig.js          # chase cam, FOV/pull-back/roll-lean, trauma shake
    │   ├── Effects.js            # exhaust / explosions / fireworks facade
    │   └── particles.js           # pooled THREE.Points with a tiny shader
    ├── ui/HUD.js + hud.css       # DOM overlay: menu, timer, chips, touch UI
    └── game/Game.js              # state machine + level loading + main loop
```

## Standalone single-file build

`standalone/dumbfire.html` is the whole game (engine included, Rapier WASM
inlined) flattened into one HTML file. Save it anywhere and open it in a
browser — no build step, no server, no internet needed. Regenerate after
source changes with `node scripts/build-standalone.mjs`.

## Tuning

All gameplay feel lives in `src/config.js` — thrust, boost, rope recovery,
camera lag, particle rates, restart delay, touch-stick response. Level
layout, palette and bounds live in `src/scene/levels/*.js`. Change a number,
save, and Vite hot-reloads.
