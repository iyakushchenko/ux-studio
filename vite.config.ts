import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')
)

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  // GitHub Pages project site: /ux-studio/
  base: process.env.VITE_BASE_PATH ?? '/',
  define: {
    // Single source: package.json → chrome version chip (studioRelease.ts)
    __STUDIO_PACKAGE_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    // Studio shows build/HMR errors via ProtoFatalErrorScreen — avoid duplicate Vite overlay.
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react({
      babel: {
        // The generated Figma import exceeds Babel's default 500 KB compact
        // threshold, triggering a deopt warning. Raising the limit silences it.
        compact: false,
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
