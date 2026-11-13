import { defineConfig, devices } from "@playwright/test"

// The browser checks: the motion contracts (tests/motion.spec.ts), the playground shell
// (tests/shell.spec.ts) and the foundations (tests/foundations.spec.ts). They run against the
// built playground, so build first: `pnpm build && pnpm --filter playground test:motion`.
//
// PW_EXECUTABLE_PATH points Playwright at a Chromium that is already on the machine, for a
// sandbox where `playwright install` cannot run and the installed build is not the one this
// Playwright version asks for:
//   PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium pnpm --filter playground test:motion
// Without it nothing changes: Playwright launches its own browser, as CI does.
const executablePath = process.env.PW_EXECUTABLE_PATH

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://localhost:4173",
    ...devices["Desktop Chrome"],
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: "vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
})
