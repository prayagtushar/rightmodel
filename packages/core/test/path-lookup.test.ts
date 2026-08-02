import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, expect, it } from "vitest";
import { findOnPath } from "../src/path-lookup.js";

describe("findOnPath", () => {
  it("finds an executable in a PATH-like string", () => {
    const dir = mkdtempSync(join(tmpdir(), "swt-path-"));
    const bin = join(dir, "fakebin");
    writeFileSync(bin, "#!/bin/sh\nexit 0\n");
    chmodSync(bin, 0o755);
    expect(findOnPath("fakebin", `${dir + delimiter}/nonexistent`)).toBe(bin);
  });

  it("returns null when missing", () => {
    expect(findOnPath("definitely-not-a-real-binary-xyz", "/nonexistent")).toBeNull();
  });
});
