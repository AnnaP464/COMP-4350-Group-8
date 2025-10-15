import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 10_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      // API server
      command: 'npm run dev:api',
      url: 'http://localhost:4000/health',
      reuseExistingServer: true
    },
    {
      // Front-end dev server
      command: 'npm run dev:web',
      url: 'http://localhost:5173',
      reuseExistingServer: true
    }
  ],
});