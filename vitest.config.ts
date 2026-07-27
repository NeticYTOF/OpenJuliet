/// <reference types='vitest' />
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/renderer/src/test-setup.ts'],
    pool: 'forks',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      'out',
      'dist',
      'dist_electron',
      'src/main/__tests__'
    ],
    clearMocks: true,
    globals: true,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/renderer/src/**/*.{ts,tsx}'],
      exclude: [
        'src/renderer/src/**/__tests__/**',
        'src/renderer/src/**/*.d.ts',
        'src/renderer/src/main.tsx'
      ]
    }
  }
})
