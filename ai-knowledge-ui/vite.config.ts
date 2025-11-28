/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],

  // Build optimizations
  build: {
    // Target modern browsers for smaller bundles
    target: 'esnext',

    // Minification
    minify: 'esbuild',

    // Source maps for production debugging (disabled for smaller bundles)
    sourcemap: false,

    // Chunk size warnings
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunk for React and related libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Storybook dependencies (if building with storybook)
          if (id.includes('node_modules/@storybook')) {
            return 'vendor-storybook';
          }
          // Other large vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },

        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // CSS code splitting
    cssCodeSplit: true,

    // Reduce bundle size by removing unused code
    reportCompressedSize: true,

    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  test: {
    projects: [
      {
        extends: true,
        plugins: [
        // The plugin will run tests for the stories defined in your Storybook config
        // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
        storybookTest({
          configDir: path.join(dirname, '.storybook')
        })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          },
          setupFiles: ['.storybook/vitest.setup.ts']
        }
      },
      {
        // RTL unit tests configuration
        test: {
          name: 'unit',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
              'node_modules/',
              'src/test/',
              '**/*.stories.tsx',
              '**/*.config.ts',
              '**/dist/',
              '.storybook/'
            ],
            thresholds: {
              lines: 90,
              functions: 90,
              branches: 85,
              statements: 90
            }
          }
        }
      }
    ]
  }
});