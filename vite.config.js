import { defineConfig } from 'vite'

// Minimal Vite config.
// We use @dimforge/rapier3d-compat, which embeds its WASM binary as
// base64 inside plain JS — no special WASM/worker config required.
export default defineConfig({
  base: './',
  // Plain CSS only — an inline (empty) PostCSS config also stops Vite from
  // walking up the directory tree and picking up an unrelated parent config.
  css: { postcss: { plugins: [] } },
  server: {
    port: 5173,
    open: false
  },
  build: {
    target: 'es2022',
    // rapier-compat is a large single JS module (~1.5 MB) — silence the chunk warning
    chunkSizeWarningLimit: 1800
  }
})
