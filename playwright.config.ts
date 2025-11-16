import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '__tests__',
  timeout: 10_000,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  
  },
  webServer: [
    {
      // backend server
      command: 'npm run dev:backend',
      url: 'http://localhost:4000/health',
      reuseExistingServer: true
    },
    {
      // Frontend dev server
      command: 'npm run dev:web',
      url: 'http://localhost:5173',
      reuseExistingServer: true
    }
  ],
});