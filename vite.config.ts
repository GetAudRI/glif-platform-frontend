import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'

const gitBranch = (() => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  } catch {
    return undefined
  }
})()

// Dev server and the Vercel build share this repo. The tab title follows
// which one is running, so a local label is not what gets deployed.
const tabTitle = (command: string) =>
  command === 'serve' ? 'AudRI-Local' : 'AudRI Audit Oversight'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: 'env-tab-title',
      transformIndexHtml(html) {
        return html.replace(
          /<title>[\s\S]*?<\/title>/,
          `<title>${tabTitle(command)}</title>`,
        )
      },
    },
  ],
  define: {
    __BRANCH__: JSON.stringify(gitBranch || 'unknown'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    sourcemapIgnoreListSource: false,
  },
  build: {
    sourcemap: true, // Enable source maps for production debugging
  },
}))
