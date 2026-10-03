/**
 * TouchControls — on-screen mobile input.
 *
 * Left half of the screen: a floating virtual joystick (appears wherever
 * the thumb lands) steering yaw/pitch. Right side: thumb-cluster buttons
 * for THRUST / BOOST / HOOK / SLOW-MO / CHUTE + a small RESET.
 *
 * Buttons write into the InputManager's virtual key layer, so the Game
 * code never cares where an input came from. Edge actions (hook, slow-mo,
 * reset, menu) call straight into Game methods.
 *
 * Uses Pointer Events (works for real touch AND mouse — handy for testing
 * with ?touch=1 on a desktop). Everything is display:none on desktop
 * unless force-enabled.
 */
export class TouchControls {
  /**
   * @param {import('../input/InputManager.js').InputManager} input
   * @param {object} actions { onGrapple, onBulletTime, onReset, onMenu }
   */
  constructor (input, actions) {
    this.input = input
    this.actions = actions

    /** Joystick state: origin + current offset (px). */
    this.stick = { id: null, ox: 0, oy: 0, x: 0, y: 0, active: false }
    this.RADIUS = 64

    this._build()
  }

  _build () {
    const root = document.createElement('div')
    root.id = 'touch-ui'
    root.innerHTML = `
      <div id="joy-zone"></div>
      <div id="joy-base"><div id="joy-knob"></div></div>
      <div id="touch-buttons">
        <div class="tbtn" id="tb-hook">HOOK</div>
        <div class="tbtn" id="tb-boost">BOOST</div>
        <div class="tbtn big" id="tb-thrust">THRUST</div>
        <div class="tbtn" id="tb-chute">CHUTE</div>
        <div class="tbtn" id="tb-slowmo">SLO-MO</div>
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
      this.stick.x = 0
      this.stick.y = 0
      this.el.base.style.left = `${e.clientX}px`
      this.el.base.style.top = `${e.clientY}px`
      this.el.base.classList.add('on')
      zone.setPointerCapture(e.pointerId)
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
      this.stick.id = null
      this.stick.active = false
      this.stick.x = 0
      this.stick.y = 0
      this.el.base.classList.remove('on')
      this.el.knob.style.transform = 'translate(-50%, -50%)'
    }
    zone.addEventListener('pointerup', endStick)
    zone.addEventListener('pointercancel', endStick)

    // ---- hold buttons (virtual keys) ----
    const hold = (btn, code) => {
      btn.addEventListener('pointerdown', (e) => {
        this.input.vDown(code)
        btn.classList.add('on')
        btn.setPointerCapture(e.pointerId)
        e.preventDefault()
      })
      const up = () => {
        this.input.vUp(code)
        btn.classList.remove('on')
      }
      btn.addEventListener('pointerup', up)
      btn.addEventListener('pointercancel', up)
    }
    hold(this.el.thrust, 'Space')
    hold(this.el.boost, 'ShiftLeft')
    hold(this.el.chute, 'KeyS')

    // ---- tap buttons (edge actions) ----
    const tap = (btn, fn) => {
      btn.addEventListener('pointerdown', (e) => {
        btn.classList.add('on')
        e.preventDefault()
      })
      btn.addEventListener('pointerup', (e) => {
        btn.classList.remove('on')
        fn()
        e.preventDefault()
      })
    }
    tap(this.el.hook, () => this.actions.onGrapple())
    tap(this.el.slowmo, () => this.actions.onBulletTime())
    tap(this.el.reset, () => this.actions.onReset())
    tap(this.el.menu, () => this.actions.onMenu())
  }

  /**
   * Per-frame steering delta from the stick (radians), applying the
   * deadzone + expo response curve. Call once per frame from the Game.
   * Returns { yaw, pitch } radians to apply this frame.
   */
  lookDelta (dt, cfg) {
    if (!this.stick.active) return null
    let x = this.stick.x
    let y = this.stick.y
    const dead = cfg.touchDeadzone
    const mag = Math.hypot(x, y)
    if (mag < dead) return null
    if (mag > 1) { x /= mag; y /= mag }

    // rescale past the deadzone so full response is still reachable
    const rescale = (v) => {
      const s = Math.sign(v)
      const a = Math.min(1, (Math.abs(v) - dead) / (1 - dead))
      return s * Math.pow(a, cfg.touchExpo) // expo — finer near the centre
    }
    return {
      yaw: rescale(x) * cfg.touchYawRate * dt,
      pitch: rescale(y) * cfg.touchPitchRate * dt
    }
  }

  /** Show/hide depending on game state (menu hides the flight cluster). */
  setVisible (v) { this.root.classList.toggle('on', v) }
}
