import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      LOG_LEVEL: "silent",
      NODE_ENV: "test",
      API_KEY: process.env.API_KEY ?? "dev-events-api-key",
    },
  },
});
