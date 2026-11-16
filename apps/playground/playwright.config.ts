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
//
// Three engines (Unicron 107): Chromium; WebKit, the engine of the Mac apps' web view and of Safari;
// and Firefox. PW_PROJECT picks one (`PW_PROJECT=webkit`); `--project webkit` does too. A check
// that needs Chrome's own debugging protocol (the slowed clock of motion.spec.ts, the real touch
// drags) says so where it is and runs in Chromium only.
const executablePath = process.env.PW_EXECUTABLE_PATH
// PW_PORT moves the preview server off 4173, for a machine where two checkouts run these checks
// at once: with the same port the second run would test the first one's build.
const port = Number(process.env.PW_PORT ?? 4173)

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: `http://localhost:${port}`,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(executablePath ? { launchOptions: { executablePath } } : {}) },
    },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ].filter((project) => !process.env.PW_PROJECT || project.name === process.env.PW_PROJECT),
  webServer: {
    command: `vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
  },
})
