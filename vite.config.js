import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/models/**', '**/*.tga', '**/*.psd'],
        // Não interceptar /api/*: deixar o navegador ir ao backend (ex.: login Steam)
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(cdn\.akamai\.steamstatic\.com|avatars\.steamstatic\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'steam-avatars',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const host = req.headers.host;
            if (host) {
              proxyReq.setHeader('X-Forwarded-Host', host);
              proxyReq.setHeader('Host', host);
            }
            const proto = req.headers['x-forwarded-proto'] || (host && host.includes('ngrok') ? 'https' : 'http');
            proxyReq.setHeader('X-Forwarded-Proto', proto);
          });
        },
      },
      '/admin': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
      '/azure-api': {
        target: 'https://management.azure.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/azure-api/, ''),
      },
      '/azure-token': {
        target: 'https://login.microsoftonline.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/azure-token/, ''),
      }
    }
  }
})