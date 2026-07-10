#!/usr/bin/env node
import { spawn } from "node:child_process";
import { loadConfig } from "./config.js";
import { DecisionLog } from "./log.js";
import { route } from "./router.js";
import { runBench, formatBench } from "./bench.js";
import { getAdapter } from "./adapters/index.js";
import type { RouteDecision, Tier } from "./types.js";

function printDecision(d: RouteDecision): void {
  console.log(`tier       ${d.tier} (score ${d.score}, confidence ${d.confidence.toFixed(2)})`);
  console.log(`reason     ${d.reason}`);
  console.log(`agent      ${d.target.agent}`);
  console.log(`model      ${d.target.model}`);
  if (d.launch) console.log(`command    ${d.launch.binary} ${d.launch.args.join(" ")}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv[0] === "bench") {
    console.log(formatBench(runBench()));
    return;
  }

  if (argv[0] === "wrong") {
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
    return;
  }

  let dryRun = false;
  let modelOverride: string | undefined;
  const taskParts: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") dryRun = true;
    else if (argv[i] === "--model") modelOverride = argv[++i];
    else taskParts.push(argv[i]);
  }
  const task = taskParts.join(" ").trim();
  if (!task) {
    console.error('usage: switchtower [--dry-run] [--model <model>] "<task>"');
    console.error("       switchtower bench | wrong");
    process.exitCode = 1;
    return;
  }

  const decision = await route(task);
  printDecision(decision);

  if (dryRun) return;
  if (!decision.agentInstalled || !decision.launch) {
    const adapter = getAdapter(decision.target.agent);
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
    const adapter = getAdapter(decision.target.agent);
    if (!adapter) throw new Error(`unknown agent ${decision.target.agent}`);
    launch = adapter.launchSpec(task, modelOverride);
    log.logOverride(task, decision.target, { agent: decision.target.agent, model: modelOverride });
  }
  log.logLaunch(task, { agent: decision.target.agent, model: modelOverride ?? decision.target.model });

  console.log("");
  const child = spawn(launch.binary, launch.args, { stdio: "inherit" });
  child.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
