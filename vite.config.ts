/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

/**
 * Passed-test count for the landing badge. `npm run build` runs the suite first and writes
 * src/generated/test-stats.json, so the number is always the real one (null if missing).
 */
function passedTests(): number | null {
  try {
    const stats = JSON.parse(readFileSync('src/generated/test-stats.json', 'utf8'));
    return stats.numFailedTests === 0 && stats.numPassedTests > 0 ? stats.numPassedTests : null;
  } catch {
    return null;
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __TEST_COUNT__: JSON.stringify(passedTests()),
  },
  build: {
    // react-pdf (~1.2 MB) loads only on "Download PDF"; Recharts only on /report.
    chunkSizeWarningLimit: 1300,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    // Tests never depend on a developer's local .env; individual tests stub what they need.
    env: { VITE_SITE_URL: '', VITE_GHL_FORM_ID: '', VITE_GHL_CALENDAR_ID: '' },
    coverage: {
      provider: 'v8',
      // List every engine file, including the ones at 100%.
      reporter: [['text', { skipFull: false }], 'html'],
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/__tests__/**', 'src/engine/types.ts'],
    },
  },
});
