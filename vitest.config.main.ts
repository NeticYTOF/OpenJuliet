import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/main/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'out', 'dist', 'dist_electron'],
    clearMocks: true,
    globals: true,
    testTimeout: 10000
  }
})
