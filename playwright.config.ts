import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '__tests__',
  timeout: 10_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',   // 📸 capture screenshot on failure
    video: 'retain-on-failure',      // 🎥 keep video only if test fails
    trace: 'retain-on-failure'      // 🧭 record trace (network, console, DOM)
  
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