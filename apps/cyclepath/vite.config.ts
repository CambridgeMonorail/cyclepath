/// <reference types='vitest' />
import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'path';
import type { PreRenderedAsset } from 'rollup';

export default defineConfig((): UserConfig => ({
  root: __dirname,
  base: '/cyclepath/',  // For GitHub Pages deployment
  cacheDir: '../../node_modules/.vite/apps/cyclepath',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [react(), nxViteTsPaths()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        assetFileNames: (assetInfo: PreRenderedAsset): string => {
          // Safety check for undefined asset name
          if (!assetInfo.name) {
            return 'assets/unknown-[hash][extname]';
          }

          // Preserve the original path structure for asset files
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];

          // Handle image assets - preserve directory structure for textures
          if (/png|jpe?g|svg|gif|tiff|bmp|webp|ico/i.test(extType)) {
            // Special handling for road textures
            if (assetInfo.name.includes('textures/road/')) {
              return 'assets/textures/road/[name][extname]';
            }
            // For other images
            return 'assets/images/[name][extname]';
          }

          // Handle font assets
          if (/ttf|otf|woff|woff2/i.test(extType)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }

          // Default handling for other assets
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
  publicDir: 'public',
}))
