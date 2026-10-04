/**
 * TouchControls — on-screen mobile input.
 *
 * Left half of the screen: a floating virtual joystick (appears wherever
 * the thumb lands) steering yaw/pitch. Right side: a thumb-cluster of
 * round buttons — layout is an ergonomic arc with NO overlaps:
 *
 *   [ CHUTE ] [ SLO-MO ]
 *        [ HOOK ]
 *   [BOOST]      [ THRUST ]
 *
 * THRUST is the special one: a quick tap LATCHES the engine on (so one
 * thumb can fly), tapping again releases it; a long press behaves as a
 * classic hold (released = off). Buttons write into the InputManager's
 * virtual key layer, so the Game code never cares where an input came
 * from. Edge actions (hook, slow-mo, reset, menu) fire on pointer-DOWN
 * for snappy response.
 *
 * Uses Pointer Events (works for real touch AND mouse — handy for testing
 * with ?touch=1 on a desktop). Everything is display:none on desktop
 * unless force-enabled.
 */
import { CFG } from '../config.js'

export class TouchControls {
  /**
   * @param {import('../input/InputManager.js').InputManager} input
   * @param {object} actions { onGrapple, onBulletTime, onReset, onMenu }
   */
  constructor (input, actions) {
    this.input = input
    this.actions = actions

    /** Joystick state: origin + current offset (px), raw + smoothed axes. */
    this.stick = {
      id: null, ox: 0, oy: 0,
      x: 0, y: 0,          // raw -1..1
      sx: 0, sy: 0,         // smoothed -1..1 (used for steering)
      active: false
    }
    this.RADIUS = 64
    /** True while the engine is latched ON by a short tap. */
    this.thrustLatched = false

    /** Are the flight controls currently shown at all (not in menu)? */
    this._visible = true

    this._build()
  }

  _build () {
    const root = document.createElement('div')
    root.id = 'touch-ui'
    root.innerHTML = `
      <div id="joy-zone"></div>
      <div id="joy-idle"><div class="ji-ring"></div><div class="ji-dot"></div></div>
      <div id="joy-base"><div id="joy-knob"></div></div>
      <div id="touch-buttons">
        <div class="tbtn" id="tb-chute">CHUTE</div>
        <div class="tbtn" id="tb-slowmo">SLO-MO</div>
        <div class="tbtn" id="tb-hook">HOOK</div>
        <div class="tbtn" id="tb-boost">BOOST</div>
        <div class="tbtn big" id="tb-thrust">THRUST</div>
      </div>
      <div id="tb-corner">
        <div class="tbtn mini" id="tb-reset">RESET</div>
        <div class="tbtn mini" id="tb-menu">MENU</div>
      </div>
    `
    document.body.appendChild(root)
    this.root = root

    this.el = {
      zone: root.querySelector('#joy-zone'),
      idle: root.querySelector('#joy-idle'),
      base: root.querySelector('#joy-base'),
      knob: root.querySelector('#joy-knob'),
      thrust: root.querySelector('#tb-thrust'),
      boost: root.querySelector('#tb-boost'),
      hook: root.querySelector('#tb-hook'),
      chute: root.querySelector('#tb-chute'),
      slowmo: root.querySelector('#tb-slowmo'),
      reset: root.querySelector('#tb-reset'),
      menu: root.querySelector('#tb-menu')
    }

    // ---- joystick (left half of the screen) ----
    const zone = this.el.zone
    zone.addEventListener('pointerdown', (e) => {
      if (this.stick.id !== null) return
      this.stick.id = e.pointerId
      this.stick.active = true
      this.stick.ox = e.clientX
      this.stick.oy = e.clientY
      this.stick.x = 0; this.stick.y = 0
      this.stick.sx = 0; this.stick.sy = 0
      this.el.base.style.left = `${e.clientX}px`
      this.el.base.style.top = `${e.clientY}px`
      this.el.base.classList.add('on')
      this.el.idle.classList.add('off')
      try { zone.setPointerCapture(e.pointerId) } catch (_) {}
      e.preventDefault()
    })
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.stick.id) return
      let dx = e.clientX - this.stick.ox
      let dy = e.clientY - this.stick.oy
      const len = Math.hypot(dx, dy)
      if (len > this.RADIUS) { dx *= this.RADIUS / len; dy *= this.RADIUS / len }
      this.stick.x = dx / this.RADIUS   // -1..1
      this.stick.y = dy / this.RADIUS
      this.el.knob.style.transform =
        `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
      e.preventDefault()
    })
    const endStick = (e) => {
      if (e.pointerId !== this.stick.id) return
      this._endStick()
    }
    zone.addEventListener('pointerup', endStick)
    zone.addEventListener('pointercancel', endStick)
    zone.addEventListener('lostpointercapture', endStick)

    // ---- hold buttons (virtual keys) ----
    const hold = (btn, code) => {
      btn.addEventListener('pointerdown', (e) => {
        this.input.vDown(code)
        btn.classList.add('on')
        this._buzz(10)
        try { btn.setPointerCapture(e.pointerId) } catch (_) {}
        e.preventDefault()
      })
      const up = () => {
        this.input.vUp(code)
        btn.classList.remove('on')
      }
      btn.addEventListener('pointerup', up)
      btn.addEventListener('pointercancel', up)
    }
    hold(this.el.boost, 'ShiftLeft')
    hold(this.el.chute, 'KeyS')

    // ---- THRUST: tap-to-latch + hold-to-momentary ----
    this._wireThrust()

    // ---- tap buttons (edge actions, fire on pointer-DOWN) ----
    const tap = (btn, fn) => {
      btn.addEventListener('pointerdown', (e) => {
        btn.classList.add('on')
        this._buzz(12)
        fn()
        e.preventDefault()
      })
      const off = () => btn.classList.remove('on')
      btn.addEventListener('pointerup', off)
      btn.addEventListener('pointercancel', off)
      btn.addEventListener('pointerleave', off)
    }
    tap(this.el.hook, () => this.actions.onGrapple())
    tap(this.el.slowmo, () => this.actions.onBulletTime())
    tap(this.el.reset, () => this.actions.onReset())
    tap(this.el.menu, () => this.actions.onMenu())

    // Stuck-input safety: backgrounding the app may swallow pointerup
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAll()
    })
  }

  /**
   * THRUST semantics:
   *  - press              -> engine on immediately (held)
   *  - release after a LONG press (> touchTapMs) -> engine off (classic hold)
   *  - release after a SHORT tap  -> engine stays ON (latched) — tap again to
   *    turn it off. Lets one thumb steer while the other only taps once.
   */
  _wireThrust () {
    const btn = this.el.thrust
    let t0 = 0
    let moved = false
    let wasDown = false
    let anchor = null

    btn.addEventListener('pointerdown', (e) => {
      t0 = performance.now()
      moved = false
      anchor = { x: e.clientX, y: e.clientY }
      wasDown = this.input.isDown('Space')  // latched from a previous tap?
      this.input.vDown('Space')
      btn.classList.add('on')
      btn.classList.remove('lock')
      this._buzz(10)
      try { btn.setPointerCapture(e.pointerId) } catch (_) {}
      e.preventDefault()
    })
    btn.addEventListener('pointermove', (e) => {
      if (!anchor) return
      if (Math.hypot(e.clientX - anchor.x, e.clientY - anchor.y) > 16) moved = true
    })
    const up = () => {
      if (!anchor) return
      anchor = null
      const held = performance.now() - t0
      if (held < CFG.missile.touchTapMs && !moved) {
        // short tap — toggle the latch
        if (wasDown) {
          this.input.vUp('Space')
          this.thrustLatched = false
        } else {
          this.thrustLatched = true   // keep the engine on
          btn.classList.add('lock')
        }
      } else {
        // long press = momentary hold
        this.input.vUp('Space')
        this.thrustLatched = false
      }
      btn.classList.remove('on')
    }
    btn.addEventListener('pointerup', up)
    btn.addEventListener('pointercancel', up)
  }

  /** CFG import is avoided (circular-free file); read tap threshold lazily. */
  _endStick () {
    this.stick.id = null
    this.stick.active = false
    this.stick.x = 0; this.stick.y = 0
    this.el.base.classList.remove('on')
    this.el.knob.style.transform = 'translate(-50%, -50%)'
    this.el.idle.classList.remove('off')
  }

  /**
   * Kill every held/latched input (crash, complete, menu, app hidden).
   * Prevents a latched engine from auto-launching the next run.
   */
  releaseAll () {
    this._endStick()
    this.input.vUp('Space')
    this.input.vUp('ShiftLeft')
    this.input.vUp('KeyS')
    this.thrustLatched = false
    this.el.thrust.classList.remove('on', 'lock')
    this.el.boost.classList.remove('on')
    this.el.chute.classList.remove('on')
  }

  /** Light haptic tick where the platform supports it. */
  _buzz (ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms) } catch (_) { /* iOS: no-op */ }
  }

  /**
   * Per-frame steering delta from the stick (radians), applying the
   * deadzone + expo response curve to the SMOOTHED stick axes. Call once
   * per frame from the Game. Returns { yaw, pitch } radians this frame.
   */
  lookDelta (dt, cfg) {
    if (!this.stick.active) return null
    // low-pass the raw axes — cheap de-jitter without visible latency
    const k = 1 - Math.exp(-cfg.touchSmooth * dt)
    this.stick.sx += (this.stick.x - this.stick.sx) * k
    this.stick.sy += (this.stick.y - this.stick.sy) * k

    let x = this.stick.sx
    let y = this.stick.sy
    const dead = cfg.touchDeadzone
    const mag = Math.hypot(x, y)
    if (mag < dead) return null
    if (mag > 1) { x /= mag; y /= mag }

    // rescale past the deadzone so full response is still reachable.
    // NOTE: `a` must be clamped >= 0 — pow() of a negative base with a
    // fractional exponent is NaN, which would poison yaw/pitch forever
    // (this bit real devices on pure horizontal / vertical drags).
    const rescale = (v) => {
      const s = Math.sign(v)
      const a = Math.min(1, Math.max(0, (Math.abs(v) - dead) / (1 - dead)))
      return s * Math.pow(a, cfg.touchExpo) // expo — finer near the centre
    }
    return {
      yaw: rescale(x) * cfg.touchYawRate * dt,
      pitch: rescale(y) * cfg.touchPitchRate * dt
    }
  }

  /** Show/hide depending on game state (menu hides the flight cluster). */
  setVisible (v) {
    this._visible = v
    this.root.classList.toggle('on', v)
  }
}
