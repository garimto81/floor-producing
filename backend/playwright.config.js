module.exports = {
  testDir: './admin',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3003',
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] }
    }
  ]
};
