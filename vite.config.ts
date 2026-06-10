import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectManifest: {
        swSrc: 'src/sw.ts',
        swDest: 'dist/sw.js',
      },
      manifest: {
        name: 'CyberSecureIMS',
        short_name: 'CyberSecure',
        description: 'GRC Platform for Seacom',
        theme_color: '#0057B8',
        background_color: '#f9fafb',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    hmr: {
      overlay: true,
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
})
