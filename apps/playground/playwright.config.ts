import { defineConfig, devices } from "@playwright/test"

// The motion contract checks (tests/motion.spec.ts). They run against the built playground, so
// build first: `pnpm build && pnpm --filter playground test:motion`.
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: { baseURL: "http://localhost:4173", ...devices["Desktop Chrome"] },
  webServer: {
    command: "vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
})
