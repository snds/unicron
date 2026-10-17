import { defineConfig } from "vitest/config"

// Same shape as Lockdown's desktop app: jsdom, Testing Library, jest-dom matchers.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.tsx"],
    css: false,
  },
})
