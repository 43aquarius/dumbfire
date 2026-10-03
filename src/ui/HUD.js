/**
 * HUD — DOM overlay: run timer, speed, ability chips, crosshair, level
 * select menu, state messages (ready / paused / crashed / complete) and
 * the bullet-time vignette.
 *
 * The HUD itself is pointer-events: none so gameplay clicks always reach
 * the canvas (pointer lock) — only the menu cards and the end-of-run
 * buttons opt back in to pointer events.
 */
import './hud.css'
import { CFG } from '../config.js'

const fmtTime = (t) => {
  if (t < 60) return t.toFixed(2)
  const m = Math.floor(t / 60)
  return `${m}:${(t - m * 60).toFixed(2).padStart(5, '0')}`
}

const DIFF_DOTS = (n) => {
  let s = ''
  for (let i = 0; i < 3; i++) s += `<span class="dot${i < n ? ' full' : ''}"></span>`
  return `<span class="dots">${s}</span>`
}

export class HUD {
  /**
   * @param {object} opts {
   *   mobile: boolean,
   *   levels: array of level defs (id/name/subtitle/difficulty),
   *   getBest: (levelId) => number|null,
   *   onSelectLevel: (index) => void,
   *   onNext, onRetry, onMenu }
   */
  constructor (opts) {
    this.mobile = !!opts.mobile
    this.levels = opts.levels
    this._getBest = opts.getBest
    this._cb = {
      selectLevel: opts.onSelectLevel, next: opts.onNext,
      retry: opts.onRetry, menu: opts.onMenu
    }

    const root = document.createElement('div')
    root.id = 'hud'
    root.innerHTML = `
      <div class="hud-topleft">
        <div id="hud-level"></div>
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
      <div id="hint"></div>
      <div id="vignette"></div>
      <div id="overlay">
        <div id="menu">
          <div id="menu-title">DUMB<span>FIRE</span></div>
          <div id="menu-sub">惯性导弹 · 抓钩摆荡 · 选择关卡</div>
          <div id="menu-cards"></div>
          <div id="menu-foot"></div>
        </div>
        <div id="panel">
          <div id="overlay-title"></div>
          <div id="overlay-time"></div>
          <div id="overlay-sub"></div>
          <div id="overlay-controls"></div>
          <div id="win-buttons"></div>
        </div>
      </div>
    `
    document.body.appendChild(root)

    this.el = {
      root,
      level: document.getElementById('hud-level'),
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
      menu: document.getElementById('menu'),
      menuCards: document.getElementById('menu-cards'),
      menuFoot: document.getElementById('menu-foot'),
      panel: document.getElementById('panel'),
      overlayTitle: document.getElementById('overlay-title'),
      overlaySub: document.getElementById('overlay-sub'),
      overlayTime: document.getElementById('overlay-time'),
      overlayControls: document.getElementById('overlay-controls'),
      winButtons: document.getElementById('win-buttons')
    }

    this._state = 'menu'
    this._locked = false
    this._hintT = 0
    this._time = 0
    this._renderMenu()
    this._refreshOverlay()
  }

  // ------------------------------------------------ level select menu

  _renderMenu () {
    const cards = this.levels.map((lv, i) => {
      const best = this._getBest(lv.id)
      return `
        <div class="card" data-i="${i}">
          <div class="card-head">
            <span class="card-idx">${i + 1}</span>
            <span class="card-name">${lv.name}</span>
            ${DIFF_DOTS(lv.difficulty)}
          </div>
          <div class="card-sub">${lv.subtitle}</div>
          <div class="card-best">${best !== null ? `BEST ${fmtTime(best)} s` : '未挑战'}</div>
        </div>`
    }).join('')
    this.el.menuCards.innerHTML = cards
    this.el.menuFoot.textContent = this.mobile
      ? '点击卡片开始 · 左侧摇杆转向'
      : '点击卡片或按 1 / 2 / 3 选择关卡'

    this.el.menuCards.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', () => {
        this._cb.selectLevel(parseInt(card.dataset.i, 10))
      })
    })
  }

  /** Refresh best-time labels (after a new record). */
  refreshMenu () { this._renderMenu() }

  // ------------------------------------------------ state transitions

  /** Pointer lock changed — rework the READY panel. */
  setPointerLocked (v) {
    this._locked = v
    if (this._state === 'ready') this._refreshOverlay()
  }

  menu () {
    this._state = 'menu'
    this._refreshOverlay()
  }

  /** Ready panel for a freshly loaded level. */
  reset (levelName) {
    this._state = 'ready'
    this._hintT = 0
    this.el.level.textContent = levelName
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

  /**
   * @param {number} time final run time
   * @param {number|null} best previous best (null if none)
   * @param {boolean} isNew true when `time` just beat `best`
   * @param {boolean} hasNext next level available?
   */
  complete (time, best, isNew, hasNext) {
    this._state = 'complete'
    this._time = time
    this._best = best
    this._isNew = isNew
    this._hasNext = hasNext
    this.refreshMenu()
    this._refreshOverlay()
  }

  paused (v) {
    this._paused = v
    if (this._state === 'flying') this._refreshOverlay()
  }

  _refreshOverlay () {
    const e = this.el
    const inMenu = this._state === 'menu'
    e.menu.style.display = inMenu ? 'flex' : 'none'
    e.panel.style.display = inMenu ? 'none' : 'flex'
    e.overlay.classList.toggle('show', inMenu || this._state !== 'flying' || !!this._paused)

    if (inMenu) return

    e.overlay.classList.remove('crash', 'win')
    e.winButtons.innerHTML = ''
    e.overlayControls.classList.remove('show')

    if (this._state === 'ready') {
      if (this.mobile) {
        e.overlayTitle.textContent = 'READY'
        e.overlaySub.textContent = '按住右侧 THRUST 起飞'
      } else if (this._locked) {
        e.overlayTitle.textContent = 'READY'
        e.overlaySub.textContent = 'SPACE TO LAUNCH · ESC 返回选关'
      } else {
        e.overlayTitle.textContent = 'DUMBFIRE'
        e.overlaySub.textContent = 'CLICK TO TAKE CONTROL'
        e.overlayControls.classList.add('show')
        e.overlayControls.innerHTML = this._controlsHtml()
      }
    } else if (this._state === 'crashed') {
      e.overlay.classList.add('crash')
      e.overlayTitle.textContent = 'WRECKED'
      e.overlaySub.textContent = this.mobile ? '重新装填中…' : 'RESTARTING…'
    } else if (this._state === 'complete') {
      e.overlay.classList.add('win')
      e.overlayTitle.textContent = 'TARGET DESTROYED'
      e.overlayTime.textContent = `${fmtTime(this._time)} s` +
        (this._isNew ? ' · NEW BEST' : '')
      if (this._best !== null && !this._isNew) {
        e.overlaySub.textContent = `BEST ${fmtTime(this._best)} s`
      } else {
        e.overlaySub.textContent = this.mobile ? '' : 'PRESS R TO FLY AGAIN'
      }
      e.winButtons.innerHTML =
        (this._hasNext ? '<div class="obtn primary" data-act="next">下一关 NEXT</div>' : '') +
        '<div class="obtn" data-act="retry">重试 RETRY</div>' +
        '<div class="obtn" data-act="menu">选关 MENU</div>'
      e.winButtons.querySelectorAll('.obtn').forEach((b) => {
        b.addEventListener('click', () => {
          const act = b.dataset.act
          if (act === 'next') this._cb.next()
          else if (act === 'retry') this._cb.retry()
          else this._cb.menu()
        })
      })
    } else if (this._state === 'flying') {
      if (this._paused) {
        e.overlayTitle.textContent = 'PAUSED'
        e.overlaySub.textContent = 'CLICK TO RESUME'
      } else {
        e.overlay.classList.remove('show')
      }
    }

    // While flying without pointer lock, nudge the hint line (desktop only)
    e.hint.classList.toggle(
      'attention', this._state === 'flying' && !this._locked && !this.mobile && !this._paused
    )
  }

  _controlsHtml () {
    return `
      <div class="k">MOUSE</div><div>steer missile</div>
      <div class="k">SPACE</div><div>main thrust</div>
      <div class="k">LMB</div><div>grapple / release</div>
      <div class="k">SHIFT</div><div>super boost</div>
      <div class="k">RMB</div><div>bullet-time</div>
      <div class="k">S</div><div>drag chute</div>
      <div class="k">R</div><div>restart level</div>
      <div class="k">ESC</div><div>pause / menu</div>
    `
  }

  // ------------------------------------------------ per-frame update

  /**
   * @param {number} dt real dt
   * @param {object} s {
   *   state, time, speed, thrust, boostRatio, boostActive,
   *   slowmo, chute, hooked, hookLen, hookStatus, canHook }
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

  /** Per-state hint line text. */
  setHint (text) {
    this.el.hint.textContent = text
    this.el.hint.classList.remove('faded')
    this._hintT = 0
  }
}
