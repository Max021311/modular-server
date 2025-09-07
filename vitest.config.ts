import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: '.env' });

export default defineConfig({
  resolve: {
    alias: {
      '#src': resolve('./src'),
      '#test': resolve('./test'),
    }
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.{test,spec}.{ts,mts,cts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/**/*.d.ts']
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  esbuild: {
    target: 'node22'
  },
  ssr: {
    noExternal: ['@fastify/cors']
  }
});
