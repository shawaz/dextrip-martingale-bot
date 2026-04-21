import * as dotenv from "dotenv";
import { runTradingEngine } from "../lib/trading/engine";

dotenv.config({ path: ".env.local" });

runTradingEngine(process.argv.slice(2)).catch((error) => {
  console.error("Fatal bot error:", error);
  process.exitCode = 1;
});
