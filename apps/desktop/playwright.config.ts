import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test",
  timeout: 60000,
  workers: 1,
  reporter: [["list"]],
});
