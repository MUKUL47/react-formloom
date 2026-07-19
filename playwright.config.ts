import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 0,
  expect: { timeout: 1000 },
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "npx vite preview --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
