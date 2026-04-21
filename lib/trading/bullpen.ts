import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ExecutedTrade, ExecutionPlan } from "./types";

const execFileAsync = promisify(execFile);

async function runBullpen(args: string[]): Promise<unknown> {
  const { stdout } = await execFileAsync("bullpen", args, { maxBuffer: 1024 * 1024 });
  return stdout ? JSON.parse(stdout) : null;
}

export async function executeBullpenTrade(plan: ExecutionPlan, dryRun: boolean): Promise<ExecutedTrade> {
  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      raw: plan,
    };
  }

  const payload = await runBullpen([
    "polymarket",
    "buy",
    plan.marketSlug,
    plan.outcome,
    plan.stakeUsd.toFixed(2),
    "--yes",
    "--output",
    "json",
  ]);

  return {
    ok: true,
    dryRun: false,
    raw: payload,
  };
}
