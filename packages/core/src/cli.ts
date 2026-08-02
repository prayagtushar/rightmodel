#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_CONFIG, configDir, loadConfig, saveConfig } from "./config.js";
import { DecisionLog } from "./log.js";
import { route } from "./router.js";
import { runBench, formatBench } from "./bench.js";
import { getAdapter } from "./adapters/index.js";
import type { RouteDecision, Tier } from "./types.js";

const USAGE = `switchtower - route each coding task to the cheapest capable model

usage:
  switchtower "<task>"                  route the task and launch the agent
  switchtower --dry-run "<task>"        print the decision without launching
  switchtower --model <model> "<task>"  override the model (logged as a disagreement)
  switchtower init                      write a default config file
  switchtower bench                     run the golden set benchmark
  switchtower wrong                     mark the last decision wrong (logged)

options:
  -h, --help                            show this help
  -v, --version                         show the version

config:
  ${join(configDir(), "config.json")}`;

function packageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(here, "..", "package.json"), "utf8");
  return (JSON.parse(raw) as { version: string }).version;
}

function printDecision(d: RouteDecision): void {
  console.log(`tier       ${d.tier} (score ${d.score}, confidence ${d.confidence.toFixed(2)})`);
  console.log(`reason     ${d.reason}`);
  console.log(`agent      ${d.target.agent}`);
  console.log(`model      ${d.target.model}`);
  if (d.launch) console.log(`command    ${d.launch.binary} ${d.launch.args.join(" ")}`);
}

function runInit(): void {
  const path = join(configDir(), "config.json");
  if (existsSync(path)) {
    console.log(`config already exists at ${path}`);
    return;
  }
  saveConfig(DEFAULT_CONFIG);
  console.log(`wrote default config to ${path}`);
}

function runWrong(): void {
  const log = new DecisionLog();
  const last = log.lastDecision();
  if (!last || !last.proposed || !last.tier) {
    console.error("no logged decision to mark wrong");
    process.exitCode = 1;
    return;
  }
  const { config } = loadConfig();
  const up: Record<Tier, Tier> = { easy: "medium", medium: "hard", hard: "hard" };
  const chosen = config.tiers[up[last.tier]];
  log.logOverride(last.taskPreview, last.proposed, chosen);
  console.log(`logged: ${last.tier} proposal marked wrong, suggested ${up[last.tier]}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv[0] === "bench") {
    console.log(formatBench(runBench()));
    return;
  }
  if (argv[0] === "init") {
    runInit();
    return;
  }
  if (argv[0] === "wrong") {
    runWrong();
    return;
  }
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return;
  }
  if (argv.includes("--version") || argv.includes("-v")) {
    console.log(packageVersion());
    return;
  }

  let dryRun = false;
  let modelOverride: string | undefined;
  const taskParts: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") dryRun = true;
    else if (argv[i] === "--model") {
      const value = argv[++i];
      if (value === undefined) {
        console.error("--model needs a model name");
        process.exitCode = 1;
        return;
      }
      modelOverride = value;
    } else taskParts.push(argv[i]);
  }
  const task = taskParts.join(" ").trim();
  if (!task) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const decision = await route(task);
  const adapter = getAdapter(decision.target.agent);

  if (modelOverride && adapter) {
    const models = adapter.capabilities({ installed: decision.agentInstalled }).models;
    if (!models.some((m) => m.id === modelOverride)) {
      console.error(
        `unknown model "${modelOverride}" for ${adapter.id}. ` +
          `available: ${models.map((m) => m.id).join(", ")}`
      );
      process.exitCode = 1;
      return;
    }
  }

  printDecision(decision);

  if (dryRun) return;
  if (!decision.agentInstalled || !decision.launch) {
    console.error(
      `\n${decision.target.agent} is not installed.` +
        (adapter ? ` Install it with: ${adapter.installHint}` : "")
    );
    process.exitCode = 1;
    return;
  }

  let launch = decision.launch;
  const log = new DecisionLog();
  if (modelOverride && modelOverride !== decision.target.model) {
    if (!adapter) throw new Error(`unknown agent ${decision.target.agent}`);
    launch = adapter.launchSpec(task, modelOverride);
    log.logOverride(task, decision.target, { agent: decision.target.agent, model: modelOverride });
  }
  log.logLaunch(task, { agent: decision.target.agent, model: modelOverride ?? decision.target.model });

  console.log("");
  const child = spawn(launch.binary, launch.args, { stdio: "inherit" });
  child.on("error", (err) => {
    console.error(`failed to launch ${launch.binary}: ${err.message}`);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
