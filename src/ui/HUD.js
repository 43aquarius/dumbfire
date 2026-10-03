/**
 * HUD — minimal DOM overlay: run timer, speed, ability chips, crosshair,
 * state messages (ready / crashed / complete) and the bullet-time vignette.
 *
 * Everything is pointer-events: none so clicks always reach the canvas
 * (pointer lock).
 */
import './hud.css'
import { CFG } from '../config.js'

const fmtTime = (t) => {
  if (t < 60) return t.toFixed(2)
  const m = Math.floor(t / 60)
  return `${m}:${(t - m * 60).toFixed(2).padStart(5, '0')}`
}

const CONTROLS_HTML = `
  <div class="k">MOUSE</div><div>steer missile</div>
  <div class="k">SPACE</div><div>main thrust</div>
  <div class="k">LMB</div><div>grapple / release</div>
  <div class="k">SHIFT</div><div>super boost</div>
  <div class="k">RMB</div><div>bullet-time</div>
  <div class="k">S</div><div>drag chute</div>
  <div class="k">R</div><div>restart level</div>
`

export class HUD {
  constructor () {
    const root = document.createElement('div')
    root.id = 'hud'
    root.innerHTML = `
      <div class="hud-topleft">
        <div id="hud-timer">0.00</div>
        <div id="hud-speed">0 m/s</div>
      </div>
      <div class="hud-topright">
        <div class="chip" id="chip-thrust"><span>THRUST</span><span class="key">SPACE</span></div>
        <div class="chip" id="chip-boost"><span>BOOST</span><span class="bar"><span id="boost-fill"></span></span><span class="key">SHIFT</span></div>
        <div class="chip" id="chip-slowmo"><span>SLOW-MO</span><span class="key">RMB</span></div>
        <div class="chip" id="chip-chute"><span>CHUTE</span><span class="key">S</span></div>
        <div class="chip" id="chip-hook"><span>HOOK</span><span id="hook-state">READY</span><span class="key">LMB</span></div>
      </div>
      <div id="crosshair"><div class="ring"></div><div class="dot"></div></div>
      <div id="hint">MOUSE steer&ensp;&middot;&ensp;SPACE thrust&ensp;&middot;&ensp;LMB grapple&ensp;&middot;&ensp;SHIFT boost&ensp;&middot;&ensp;RMB slow-mo&ensp;&middot;&ensp;S chute&ensp;&middot;&ensp;R restart</div>
      <div id="vignette"></div>
      <div id="overlay">
        <div id="overlay-title"></div>
        <div id="overlay-time"></div>
        <div id="overlay-sub"></div>
        <div id="overlay-controls">${CONTROLS_HTML}</div>
      </div>
    `
    document.body.appendChild(root)

    this.el = {
      timer: document.getElementById('hud-timer'),
      speed: document.getElementById('hud-speed'),
      thrust: document.getElementById('chip-thrust'),
      boost: document.getElementById('chip-boost'),
      boostFill: document.getElementById('boost-fill'),
      slowmo: document.getElementById('chip-slowmo'),
      chute: document.getElementById('chip-chute'),
      hook: document.getElementById('chip-hook'),
      hookState: document.getElementById('hook-state'),
      crosshair: document.getElementById('crosshair'),
      hint: document.getElementById('hint'),
      vignette: document.getElementById('vignette'),
      overlay: document.getElementById('overlay'),
      overlayTitle: document.getElementById('overlay-title'),
      overlaySub: document.getElementById('overlay-sub'),
      overlayTime: document.getElementById('overlay-time'),
      overlayControls: document.getElementById('overlay-controls')
    }

    this._state = 'ready'
    this._locked = false
    this._hintT = 0
    this._refreshOverlay()
  }

  /** Pointer lock changed — rework the READY panel. */
  setPointerLocked (v) {
    this._locked = v
    if (this._state === 'ready') this._refreshOverlay()
  }

  // ------------------------------------------------ state transitions

  reset () {
    this._state = 'ready'
    this._hintT = 0
    this.el.hint.classList.remove('faded', 'attention')
    this._refreshOverlay()
  }

  launch () {
    this._state = 'flying'
    this._refreshOverlay()
  }

  crash () {
    this._state = 'crashed'
    this._refreshOverlay()
  }

  complete (time) {
    this._state = 'complete'
    this._time = time
    this._refreshOverlay()
  }

  _refreshOverlay () {
    const e = this.el
    const show = (v) => { e.overlay.classList.toggle('show', v) }

    if (this._state === 'flying') {
      // Never cover the screen mid-flight — the hint line asks for the
      // pointer back if lock was lost (e.g. after Esc)
      show(false)
    } else if (this._state === 'ready') {
      show(true)
      e.overlay.classList.remove('crash', 'win')
      if (this._locked) {
        e.overlayTitle.textContent = 'READY'
        e.overlaySub.textContent = 'SPACE TO LAUNCH'
        e.overlayControls.classList.remove('show')
      } else {
        e.overlayTitle.textContent = 'DUMBFIRE'
        e.overlaySub.textContent = 'CLICK TO TAKE CONTROL'
        e.overlayControls.classList.add('show')
      }
    } else if (this._state === 'crashed') {
      show(true)
      e.overlay.classList.add('crash')
      e.overlay.classList.remove('win')
      e.overlayTitle.textContent = 'WRECKED'
      e.overlaySub.textContent = 'RESTARTING\u2026'
    } else if (this._state === 'complete') {
      show(true)
      e.overlay.classList.add('win')
      e.overlay.classList.remove('crash')
      e.overlayTitle.textContent = 'TARGET DESTROYED'
      e.overlayTime.textContent = `${fmtTime(this._time)} s`
      e.overlaySub.textContent = 'PRESS R TO FLY AGAIN'
    }

    // While flying without pointer lock, nudge the hint line
    e.hint.classList.toggle('attention', this._state === 'flying' && !this._locked)
  }

  // ------------------------------------------------ per-frame update

  /**
   * @param {number} dt real dt
   * @param {object} s {
   *   state, time, speed, thrust, boostRatio, boostActive,
   *   slowmo, chute, hooked, hookLen, hookStatus, canHook, locked }
   */
  update (dt, s) {
    const e = this.el

    e.timer.textContent = fmtTime(s.time)
    e.speed.textContent = `${Math.round(s.speed)} m/s`

    e.thrust.classList.toggle('on', s.thrust)
    e.boost.classList.toggle('on', s.boostActive)
    e.boostFill.style.width = `${Math.round(s.boostRatio * 100)}%`
    e.slowmo.classList.toggle('on', s.slowmo)
    e.chute.classList.toggle('on', s.chute)

    // Hook chip
    e.hook.classList.toggle('on', s.hooked)
    const outOfRange = s.hookStatus === 'OUT_OF_RANGE' && !s.hooked
    e.hook.classList.toggle('warn', outOfRange)
    e.hookState.textContent = s.hooked
      ? `${s.hookLen} m`
      : (outOfRange ? 'OUT OF RANGE' : 'READY')

    // Crosshair feedback
    e.crosshair.classList.toggle('hit', s.canHook && !s.hooked)
    e.crosshair.classList.toggle('attached', s.hooked)

    // Controls hint fade (but not while we need attention)
    this._hintT += dt
    if (this._hintT > CFG.ui.hintFadeAfter) e.hint.classList.add('faded')
  }

  setVignette (on) {
    this.el.vignette.classList.toggle('on', on)
  }
}
