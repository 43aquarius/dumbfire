/**
 * InputManager — pointer lock, keyboard state and mouse edge events.
 *
 * Responsibilities:
 *  - own the browser event listeners (keyboard, mouse, pointer lock)
 *  - expose level-style queries: isDown / wasPressed / wasButtonPressed
 *  - accumulate raw mouse deltas while the pointer is locked
 *  - clear all "edge" state once per frame via endFrame()
 *
 * Mouse buttons: 0 = left (grapple), 2 = right (bullet-time toggle).
 * Button edges are only recorded while the pointer is locked, so the very
 * click that acquires pointer lock never fires the grapple by accident.
 */
/**
 * Fallback map for environments that report an empty KeyboardEvent.code
 * (some layouts / synthetic events). We prefer .code, fall back to .key.
 */
const CODE_ALIASES = {
  ' ': 'Space',
  Shift: 'ShiftLeft',
  s: 'KeyS', S: 'KeyS',
  r: 'KeyR', R: 'KeyR'
}

const normCode = (e) => e.code || CODE_ALIASES[e.key] || e.key

export class InputManager {
  /** @param {HTMLCanvasElement} element canvas that owns pointer lock */
  constructor (element) {
    this.element = element

    /** Currently held key codes (KeyboardEvent.code). */
    this.keys = new Set()
    /** Keys pressed since the last endFrame() — edge detection. */
    this.pressed = new Set()
    /** Keys released since the last endFrame(). */
    this.released = new Set()

    /** Held mouse buttons (0/1/2). */
    this.buttons = new Set()
    /** Buttons pressed since the last endFrame() — only while locked. */
    this.buttonPressed = new Set()

    /** Accumulated mouse movement while locked. */
    this.mouse = { dx: 0, dy: 0 }

    this.locked = false
    /** Optional callback, fired with (locked:boolean) on pointerlockchange. */
    this.onLockChange = null

    this._bound = false
  }

  /** Attach all DOM listeners. Call once after construction. */
  attach () {
    if (this._bound) return
    this._bound = true
    const el = this.element

    el.addEventListener('click', () => this.requestLock())

    window.addEventListener('keydown', (e) => {
      const code = normCode(e)
      // Stop SPACE from scrolling the page mid-flight
      if (code === 'Space') e.preventDefault()
      if (e.repeat) return
      this.keys.add(code)
      this.pressed.add(code)
    })

    window.addEventListener('keyup', (e) => {
      const code = normCode(e)
      this.keys.delete(code)
      this.released.add(code)
    })

    window.addEventListener('mousedown', (e) => {
      if (!this.locked) return
      this.buttons.add(e.button)
      this.buttonPressed.add(e.button)
    })

    window.addEventListener('mouseup', (e) => this.buttons.delete(e.button))

    window.addEventListener('mousemove', (e) => {
      if (!this.locked) return
      this.mouse.dx += e.movementX
      this.mouse.dy += e.movementY
    })

    // Right mouse button must never open the context menu
    window.addEventListener('contextmenu', (e) => e.preventDefault())

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.element
      if (!this.locked) {
        // Losing focus of any kind should never leave ghost key state behind
        this.keys.clear()
        this.buttons.clear()
      }
      if (this.onLockChange) this.onLockChange(this.locked)
    })

    window.addEventListener('blur', () => {
      this.keys.clear()
      this.buttons.clear()
    })
  }

  /** Request pointer lock (ignores the browser's re-lock cooldown errors). */
  requestLock () {
    if (this.locked) return
    try {
      const p = this.element.requestPointerLock()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch (_) { /* browser may throttle re-locking right after Esc */ }
  }

  /** Is a key currently held? */
  isDown (code) { return this.keys.has(code) }

  /** Was a key pressed since the last endFrame()? */
  wasPressed (code) { return this.pressed.has(code) }

  /** Was a mouse button pressed since the last endFrame()? */
  wasButtonPressed (button) { return this.buttonPressed.has(button) }

  /**
   * Drain the accumulated mouse delta and reset it to zero.
   * Returns {dx, dy} in pixels.
   */
  consumeMouseDelta () {
    const d = { dx: this.mouse.dx, dy: this.mouse.dy }
    this.mouse.dx = 0
    this.mouse.dy = 0
    return d
  }

  /** Clear per-frame edge state. Call once at the end of every frame. */
  endFrame () {
    this.pressed.clear()
    this.released.clear()
    this.buttonPressed.clear()
  }
}
