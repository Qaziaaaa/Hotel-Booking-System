import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    pool: 'forks',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
