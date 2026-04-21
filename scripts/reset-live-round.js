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
  { name: "Lisa", init: "LI", color: "#F4B400", won: 0, loss: 0, winRate: 0, isActive: true },
  { name: "Bart", init: "BA", color: "#FF6D01", won: 0, loss: 0, winRate: 0, isActive: true },
  { name: "Homer", init: "HO", color: "#34A853", won: 0, loss: 0, winRate: 0, isActive: true },
  { name: "Marge", init: "MA", color: "#4285F4", won: 0, loss: 0, winRate: 0, isActive: true },
  { name: "Maggie", init: "MG", color: "#00ACC1", won: 0, loss: 0, winRate: 0, isActive: true },
  { name: "Mr Burns", init: "MB", color: "#A142F4", won: 0, loss: 0, winRate: 0, isActive: true },
  { name: "Milhouse", init: "MI", color: "#7CB342", won: 0, loss: 0, winRate: 0, isActive: true },
  { name: "Nelson", init: "NE", color: "#EF5350", won: 0, loss: 0, winRate: 0, isActive: true },
];

async function clearCollection(id) {
  const res = await databases.listDocuments(dbId, id, [Query.limit(200)]);
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

  console.log("Cleared seeded battle data and reset agents for one live paper round.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
