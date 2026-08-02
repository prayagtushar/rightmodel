import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, expect, it } from "vitest";
import { findOnPath } from "../src/path-lookup.js";

const isWindows = process.platform === "win32";

describe("findOnPath", () => {
  it("finds an executable in a PATH-like string", () => {
    const dir = mkdtempSync(join(tmpdir(), "rm-path-"));

    // Windows cannot execute an extensionless file, so findOnPath only tries
    // names suffixed with a PATHEXT entry. Writing a bare "fakebin" there
    // would be testing something the platform cannot do. npm installed CLIs
    // land as .cmd on Windows, which is the case worth asserting.
    const name = isWindows ? "fakebin.cmd" : "fakebin";
    const bin = join(dir, name);
    writeFileSync(bin, isWindows ? "@echo off\r\nexit /b 0\r\n" : "#!/bin/sh\nexit 0\n");
    if (!isWindows) chmodSync(bin, 0o755);

    expect(findOnPath("fakebin", `${dir + delimiter}/nonexistent`)).toBe(bin);
  });

  it("returns null when missing", () => {
    expect(findOnPath("definitely-not-a-real-binary-xyz", "/nonexistent")).toBeNull();
  });

  it.skipIf(isWindows)("ignores a file without the execute bit", () => {
    const dir = mkdtempSync(join(tmpdir(), "rm-path-"));
    const bin = join(dir, "notexec");
    writeFileSync(bin, "#!/bin/sh\nexit 0\n");
    chmodSync(bin, 0o644);

    expect(findOnPath("notexec", dir)).toBeNull();
  });
});
