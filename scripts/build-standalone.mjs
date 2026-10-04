/**
 * build-standalone.mjs — regenerate the single-file dumbfire.html.
 *
 * Bundles src/main.js (plus three + rapier, WASM inlined as base64 in the
 * compat build) into ONE self-contained HTML — no CDN, no network, works
 * from file://.
 *
 *   node scripts/build-standalone.mjs
 *
 * Output: dist-standalone/dumbfire.html
 */
import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'dist-standalone')
mkdirSync(outDir, { recursive: true })

// 1) Bundle the JS (iife, minified). CSS imports produce a sibling css file.
const result = await build({
  entryPoints: [join(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  outdir: outDir,
  entryNames: 'bundle',
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'none',
  logLevel: 'warning'
})

let js = ''
let css = ''
for (const f of result.outputFiles) {
  if (f.path.endsWith('.js')) js = f.text
  else if (f.path.endsWith('.css')) css = f.text
}
if (!js) throw new Error('esbuild produced no JS output')

// Inline-safety: a literal "</script>" inside the bundle would terminate the
// outer tag early — escape it (and HTML comment openers) inside the JS.
js = js.replace(/<\/script>/gi, '<\\/script>').replace(/<!--/g, '<\\!--')

// 2) Inline everything into the Vite index.html template.
//    NOTE: replacement STRINGS would interpret $& / $' / $` patterns found in
//    the minified bundle — always use the function form of replace().
const template = readFileSync(join(root, 'index.html'), 'utf8')
const html = template
  .replace(
    '<script type="module" src="/src/main.js"></script>',
    () => `<script>\n${js}\n</script>`
  )
  .replace('</head>', () => `<style>\n${css}\n</style>\n</head>`)

const out = join(outDir, 'dumbfire.html')
writeFileSync(out, html)
console.log(`standalone written: ${out} (${(html.length / 1024 / 1024).toFixed(2)} MB)`)
