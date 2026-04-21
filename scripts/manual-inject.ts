import { Client, Databases, ID, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'http://localhost/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const dbId = 'arena';

async function inject() {
    const agents = await databases.listDocuments(dbId, 'agents');
    const rounds = await databases.listDocuments(dbId, 'rounds', [Query.equal('status', 'active')]);
    const round = rounds.documents[0];

    const predictions = [
        { name: 'Lisa', signal: 'UP', strategy: 'Volume Surge' },
        { name: 'Marcus', signal: 'DOWN', strategy: 'RSI Reversal' },
        { name: 'Nova', signal: 'UP', strategy: 'Momentum Break' }
    ];

    for (const p of predictions) {
        const agent = agents.documents.find(a => a.name === p.name);
        if (agent && round) {
            await databases.createDocument(dbId, 'trades', ID.unique(), {
                agentId: agent.$id,
                roundId: round.roundId,
                strategyName: p.strategy,
                signal: p.signal,
                entry: round.entryPrice,
                result: 'pending'
            });
            console.log(`✅ Injected ${p.signal} for ${p.name}`);
        }
    }
}
inject();
