import { describe, expect, it } from "vitest";
import { scoreTask } from "../src/scorer.js";

describe("scoreTask", () => {
  it("routes a short question to easy", () => {
    const r = scoreTask("What does HTTP 304 mean?");
    expect(r.tier).toBe("easy");
  });

  it("routes a scoped small verb to easy even with a file reference", () => {
    const r = scoreTask("Rename the variable temp to userCount in utils.py");
    expect(r.tier).toBe("easy");
  });

  it("routes a single concrete fix to medium", () => {
    const r = scoreTask(
      "Fix the failing test in test_auth.py, it started failing after the token refactor"
    );
    expect(r.tier).toBe("medium");
  });

  it("detects stack traces as a signal", () => {
    const r = scoreTask(
      "Fix this crash:\nTraceback (most recent call last):\n  File app.py line 3\nKeyError: 'user'"
    );
    expect(r.signals.map((s) => s.name)).toContain("stack trace");
  });

  it("routes ambition verbs with multiple files to hard", () => {
    const r = scoreTask(
      "Refactor the payment module in src/pay.ts, src/stripe.ts and src/razorpay.ts to support multiple providers, then migrate the tests"
    );
    expect(r.tier).toBe("hard");
  });

  it("routes multi-step numbered plans to hard", () => {
    const r = scoreTask(
      "Implement optimistic updates: 1. update the local store 2. sync to the server 3. roll back on failure and show a toast"
    );
    expect(r.tier).toBe("hard");
  });

  it("counts code blocks as a signal", () => {
    const r = scoreTask("Why does this fail?\n```ts\nconst a = b.c;\n```");
    expect(r.signals.map((s) => s.name)).toContain("code block");
  });

  it("treats a late ambition mention weaker than a leading ambition verb", () => {
    const late = scoreTask("Fix the button color after the refactor");
    const early = scoreTask("Refactor the whole rendering layer for the buttons");
    const lateAmbition = late.signals.find((s) => s.name === "ambition mentioned");
    const earlyAmbition = early.signals.find((s) => s.name === "ambition verb");
    expect(lateAmbition?.weight).toBe(1);
    expect(earlyAmbition?.weight).toBe(3);
  });

  it("returns confidence in (0, 1]", () => {
    for (const text of ["hi", "Refactor everything then migrate the database"]) {
      const c = scoreTask(text).confidence;
      expect(c).toBeGreaterThan(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });

  it("always returns a human readable reason", () => {
    expect(scoreTask("What is a closure?").reason).toMatch(/^easy: /);
    expect(
      scoreTask(
        "Refactor the auth module then update all call sites and migrate the sessions table"
      ).reason
    ).toMatch(/^hard: /);
  });
});
