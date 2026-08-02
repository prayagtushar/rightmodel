import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { expect, test } from "@playwright/test";
import { _electron as electron } from "playwright";

const appRoot = join(__dirname, "..");
const fixtures = join(__dirname, "fixtures");

test("launches, routes a task with the stub agent, and spawns a session", async () => {
  const stateDir = mkdtempSync(join(tmpdir(), "rm-smoke-"));
  const app = await electron.launch({
    args: [appRoot],
    env: {
      ...process.env,
      RIGHTMODEL_DIR: stateDir,
      PATH: fixtures + delimiter + (process.env.PATH ?? ""),
    },
  });

  const window = await app.firstWindow();
  await expect(window.locator(".prompt-input")).toBeVisible();

  await window.fill(".prompt-input", "What is a closure?");
  await expect(window.locator(".routing-chip")).toContainText("easy", { timeout: 10000 });

  await window.fill(
    ".prompt-input",
    "Refactor the payment module in src/pay.ts and src/stripe.ts then migrate the tests"
  );
  await expect(window.locator(".routing-chip")).toContainText("hard", { timeout: 10000 });

  await window.click(".launch-button");
  await expect(window.locator(".tab")).toHaveCount(1);
  await expect(window.locator(".terminal-pane").first()).toBeVisible();

  await app.close();
});
