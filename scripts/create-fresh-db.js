import { Client, Databases, Permission, Role } from "node-appwrite";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "http://localhost/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
  .setKey(process.env.APPWRITE_API_KEY || "");

const databases = new Databases(client);
const dbId = "dextrip_btc15";
const publicRead = [Permission.read(Role.any())];

async function ensureCollection(id, name, attributes) {
  try {
    await databases.getCollection(dbId, id);
  } catch {
    await databases.createCollection(dbId, id, name, publicRead);
    for (const attr of attributes) {
      if (attr.type === "string") await databases.createStringAttribute(dbId, id, attr.key, attr.size, attr.required, undefined, attr.array ?? false);
      else if (attr.type === "float") await databases.createFloatAttribute(dbId, id, attr.key, attr.required);
      else if (attr.type === "integer") await databases.createIntegerAttribute(dbId, id, attr.key, attr.required);
      else if (attr.type === "boolean") await databases.createBooleanAttribute(dbId, id, attr.key, attr.required);
    }
  }
}

async function main() {
  try {
    await databases.get(dbId);
  } catch {
    await databases.create(dbId, "Dextrip BTC 15m");
  }

  await ensureCollection("agents", "Agents", [
    { key: "name", type: "string", size: 100, required: true },
    { key: "won", type: "integer", required: true },
    { key: "loss", type: "integer", required: true },
    { key: "winRate", type: "float", required: true },
    { key: "init", type: "string", size: 10, required: true },
    { key: "color", type: "string", size: 20, required: true },
    { key: "timeframe", type: "string", size: 10, required: true },
    { key: "promoted", type: "boolean", required: true },
    { key: "strategyCards", type: "string", size: 100, required: false, array: true },
    { key: "isActive", type: "boolean", required: true },
  ]);

  await ensureCollection("rounds", "Rounds", [
    { key: "roundId", type: "string", size: 100, required: true },
    { key: "asset", type: "string", size: 50, required: true },
    { key: "timeframe", type: "string", size: 10, required: true },
    { key: "startTime", type: "string", size: 50, required: true },
    { key: "endTime", type: "string", size: 50, required: true },
    { key: "entryPrice", type: "float", required: false },
    { key: "exitPrice", type: "float", required: false },
    { key: "status", type: "string", size: 20, required: true },
  ]);

  await ensureCollection("trades", "Trades", [
    { key: "agentId", type: "string", size: 255, required: true },
    { key: "roundId", type: "string", size: 255, required: true },
    { key: "strategyName", type: "string", size: 100, required: true },
    { key: "signal", type: "string", size: 20, required: true },
    { key: "entry", type: "float", required: false },
    { key: "exit", type: "float", required: false },
    { key: "result", type: "string", size: 20, required: true },
  ]);

  await ensureCollection("strategies", "Strategies", [
    { key: "name", type: "string", size: 100, required: true },
    { key: "description", type: "string", size: 1000, required: true },
  ]);

  console.log(`Fresh database ready: ${dbId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
