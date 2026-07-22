import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local for tests that need Supabase credentials
try {
  const envFile = readFileSync(resolve(__dirname, ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]!]) {
      process.env[match[1]!] = match[2];
    }
  }
} catch {
  // .env.local not found; tests that need it will fail with clear errors
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
