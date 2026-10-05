/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // List every engine file, including the ones at 100%.
      reporter: [['text', { skipFull: false }], 'html'],
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/__tests__/**', 'src/engine/types.ts'],
    },
  },
});
