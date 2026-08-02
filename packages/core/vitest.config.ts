import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      // golden.ts is data, not logic. cli.ts is covered by test/cli.test.ts,
      // but those tests spawn the built CLI as a child process and v8 coverage
      // does not follow child processes, so it reports as zero. There is no
      // threshold here for that reason: the headline number understates what
      // is actually tested.
      exclude: ["src/golden.ts", "src/cli.ts"],
    },
  },
});
