import { defineConfig } from "vitest/config"

// Same shape as Lockdown's desktop app: jsdom, Testing Library, jest-dom matchers.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Both spellings: a hook's or a helper's tests are plain .ts (use-viewport.test.ts), and a
    // pattern that named only .tsx left them out of `pnpm test` and CI.
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
})
