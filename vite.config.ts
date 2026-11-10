import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
        watch: {
          ignored: ['**/data/**', '**/obsidian_vault/**', '**/dist/**', '**/temp_uploads/**']
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          workbox: {
            maximumFileSizeToCacheInBytes: 15000000
          },
          manifest: {
            name: 'Ez-Zel Shadow',
            short_name: 'Shadow',
            description: 'The Ultimate AI Assistant',
            theme_color: '#000000',
            background_color: '#000000',
            display: 'standalone',
            icons: [
              {
                src: 'icon-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'icon-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
        dedupe: ['react', 'react-dom', 'react-is']
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react/jsx-runtime', 'react-is']
      },
      build: {
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: false,
        reportCompressedSize: false,
        chunkSizeWarningLimit: 3000,
        rollupOptions: {
          maxParallelFileOps: 2,
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react/') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
                if (id.includes('firebase')) return 'vendor-firebase';
                if (id.includes('@xenova') || id.includes('onnxruntime-web')) return 'vendor-ai';
                if (id.includes('@mlc-ai') || id.includes('web-llm')) return 'vendor-web-llm';
                if (id.includes('@ffmpeg')) return 'vendor-ffmpeg';
                if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
                if (id.includes('@google/genai')) return 'vendor-gemini';
                if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
                if (id.includes('ethers')) return 'vendor-ethers';
                if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
                if (id.includes('lucide-react')) return 'vendor-lucide';
                if (id.includes('motion')) return 'vendor-motion';
                if (id.includes('crypto-js')) return 'vendor-crypto';
              }
            }
          }
        }
      }
    };
});
