import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const alias = (dir: string) => fileURLToPath(new URL(`./src/${dir}`, import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
  },
  resolve: {
    alias: {
      'app': alias('app'),
      'auth': alias('auth'),
      'i18n': alias('i18n'),
      'object': alias('object'),
      'task': alias('task'),
      'utils': alias('utils'),
    },
  },
})
