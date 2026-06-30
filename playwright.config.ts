import { defineConfig } from "@playwright/test";

const testPort = process.env.PAIRVIEW_E2E_PORT ?? "3001";
const baseURL = `http://localhost:${testPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${testPort}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      PAIRVIEW_E2E_MODE: "1",
      NEXT_PUBLIC_PAIRVIEW_E2E_MODE: "1",
    },
  },
});
