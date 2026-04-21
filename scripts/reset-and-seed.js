import { Client, Databases, ID, Query } from "node-appwrite";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "http://localhost/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
  .setKey(process.env.APPWRITE_API_KEY || "");

const databases = new Databases(client);
const dbId = "arena";

const agents = [
  { name: "Lisa", init: "LI", color: "#F4B400", won: 7, loss: 3, winRate: 70, isActive: true },
  { name: "Bart", init: "BA", color: "#FF6D01", won: 6, loss: 4, winRate: 60, isActive: true },
  { name: "Homer", init: "HO", color: "#34A853", won: 4, loss: 6, winRate: 40, isActive: true },
  { name: "Marge", init: "MA", color: "#4285F4", won: 6, loss: 4, winRate: 60, isActive: true },
  { name: "Maggie", init: "MG", color: "#00ACC1", won: 5, loss: 5, winRate: 50, isActive: true },
  { name: "Mr Burns", init: "MB", color: "#A142F4", won: 8, loss: 2, winRate: 80, isActive: true },
  { name: "Milhouse", init: "MI", color: "#7CB342", won: 5, loss: 5, winRate: 50, isActive: true },
  { name: "Nelson", init: "NE", color: "#EF5350", won: 3, loss: 7, winRate: 30, isActive: true },
];

async function clearCollection(id) {
  const res = await databases.listDocuments(dbId, id, [Query.limit(100)]);
  for (const doc of res.documents) {
    await databases.deleteDocument(dbId, id, doc.$id);
  }
}

async function main() {
  await clearCollection("trades");
  await clearCollection("rounds");
  await clearCollection("agents");

  for (const agent of agents) {
    await databases.createDocument(dbId, "agents", ID.unique(), agent);
  }

  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(now.getMinutes() - (now.getMinutes() % 15));
  const end = new Date(start);
  end.setMinutes(start.getMinutes() + 15);

  const roundId = `btc-15m-${start.getTime()}`;
  await databases.createDocument(dbId, "rounds", ID.unique(), {
    roundId,
    asset: "BTC-15M",
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    entryPrice: 93500,
    status: "active",
  });

  const trades = [
    ["Lisa", "Volume Surge", "UP"],
    ["Bart", "Momentum Break", "UP"],
    ["Homer", "RSI Reversal", "DOWN"],
    ["Marge", "VWAP Reclaim", "UP"],
    ["Maggie", "Range Fade", "DOWN"],
    ["Mr Burns", "Trend Ride", "UP"],
    ["Milhouse", "Trend Pullback", "UP"],
    ["Nelson", "Liquidity Sweep Reversal", "DOWN"],
  ];

  const seeded = await databases.listDocuments(dbId, "agents", [Query.limit(100)]);

  for (const [name, strategyName, signal] of trades) {
    const agent = seeded.documents.find((a) => a.name === name);
    if (!agent) continue;
    await databases.createDocument(dbId, "trades", ID.unique(), {
      agentId: agent.$id,
      roundId,
      strategyName,
      signal,
      entry: 93500,
      result: "pending",
    });
  }

  console.log("Reset complete and BTC-15m battle seeded.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
