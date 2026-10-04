import { execFileSync } from 'node:child_process'
import build from '@hono/vite-build/cloudflare-workers'
import adapter from '@hono/vite-dev-server/cloudflare'
import honox from 'honox/vite'
import { defineConfig } from 'vite'

const appVersion = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
const hasUncommittedChanges = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim().length > 0
const buildTime = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12)
const displayedVersion = `${appVersion}${hasUncommittedChanges ? '-dirty' : ''}-${buildTime}`

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(displayedVersion) },
  server: { host: '0.0.0.0' },
  plugins: [
    honox({
      devServer: { adapter },
      client: { input: ['/app/client.ts'] },
    }),
    build(),
  ],
})
