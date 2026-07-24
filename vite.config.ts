import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')
)

const packageJsonPath = path.resolve(__dirname, 'package.json')

/** When package.json bumps while `npm run dev` is running, restart so define + chip stay honest. */
function packageJsonVersionReload() {
  return {
    name: 'studio-package-json-version-reload',
    configureServer(server) {
      server.watcher.add(packageJsonPath)
      server.watcher.on('change', (file) => {
        if (path.resolve(file) === packageJsonPath) {
          server.restart()
        }
      })
    },
  }
}

export default defineConfig({
  // GitHub Pages project site: /ux-studio/
  base: process.env.VITE_BASE_PATH ?? '/',
  define: {
    // Fallback inject; chip prefers live JSON import in studioRelease.ts
    __STUDIO_PACKAGE_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    // Canonical prove URL: http://127.0.0.1:5173/ (also http://localhost:5173/).
    // Bind IPv4+IPv6 — default Node listen can be [::1]-only on Windows (127.0.0.1 refused).
    // Agents MUST use port 5173 only (Auto-Rule fixed-localhost-reuse-tab).
    host: true,
    port: 5173,
    strictPort: true,
    // Studio shows build/HMR errors via ProtoFatalErrorScreen — avoid duplicate Vite overlay.
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    packageJsonVersionReload(),
    // Tailwind utility classes are used directly across real project/app
    // files (HubPage, AvailabilityTool, LoginPopup, App.tsx, etc.) — both
    // plugins are load-bearing, not scaffold-only.
    react(),
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
