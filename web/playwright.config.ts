import { defineConfig, devices } from "@playwright/test";

const headed = process.env.HEADED === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    ["./e2e/reporters/final-report.ts"],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8081",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "on",
    screenshot: "on",
    video: "on",
    headless: !headed,
    launchOptions: headed ? { slowMo: 250 } : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
