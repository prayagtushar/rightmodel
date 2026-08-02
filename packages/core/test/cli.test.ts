import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(packageRoot, "dist", "cli.js");

interface Run {
  stdout: string;
  stderr: string;
  code: number;
}

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "swt-cli-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

async function run(...args: string[]): Promise<Run> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [cli, ...args], {
      env: { ...process.env, SWITCHTOWER_DIR: dir },
      timeout: 30000,
    });
    return { stdout, stderr, code: 0 };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", code: e.code ?? 1 };
  }
}

describe("cli", () => {
  it("prints usage for --help and -h", async () => {
    const long = await run("--help");
    expect(long.code).toBe(0);
    expect(long.stdout).toContain("usage:");
    expect(long.stdout).toContain("switchtower init");

    const short = await run("-h");
    expect(short.stdout).toBe(long.stdout);
  });

  it("prints the package version for --version", async () => {
    const pkg = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as {
      version: string;
    };
    const result = await run("--version");
    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe(pkg.version);
  });

  it("init writes a config file and does not clobber an existing one", async () => {
    const path = join(dir, "config.json");
    expect(existsSync(path)).toBe(false);

    const first = await run("init");
    expect(first.code).toBe(0);
    expect(first.stdout).toContain("wrote default config");
    expect(existsSync(path)).toBe(true);

    const config = JSON.parse(readFileSync(path, "utf8")) as {
      mode: string;
      tiers: Record<string, { model: string }>;
    };
    expect(config.mode).toBe("heuristic");
    expect(config.tiers.easy.model).toBe("haiku");

    const second = await run("init");
    expect(second.code).toBe(0);
    expect(second.stdout).toContain("already exists");
  });

  it("routes a short question to the easy tier under --dry-run", async () => {
    const result = await run("--dry-run", "What is a closure?");
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("tier       easy");
    expect(result.stdout).toContain("model      haiku");
  });

  it("rejects an unknown model and lists the valid ones", async () => {
    const result = await run("--dry-run", "--model", "hiaku", "What is a closure?");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('unknown model "hiaku"');
    expect(result.stderr).toContain("haiku, sonnet, opus, fable");
  });

  it("accepts a valid model override", async () => {
    const result = await run("--dry-run", "--model", "fable", "What is a closure?");
    expect(result.code).toBe(0);
  });

  it("rejects --model with no value", async () => {
    const result = await run("--dry-run", "What is a closure?", "--model");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("--model needs a model name");
  });

  it("prints usage and exits non-zero with no task", async () => {
    const result = await run();
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("usage:");
  });

  it("reports no logged decision for wrong on an empty log", async () => {
    const result = await run("wrong");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("no logged decision");
  });
});
