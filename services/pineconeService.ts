import { shadowDB } from "./dbService";
import { generateEmbedding } from "./geminiService";

export const queryPinecone = async (queryEmbedding: number[], userId: string, topK: number = 5): Promise<string[]> => {
    try {
        const keys = await shadowDB.getSystemKeys();
        if (!keys || !keys.pineconeApiKey || !keys.pineconeHost) {
            return []; // Fallback down the line
        }

        const host = keys.pineconeHost.replace(/\/$/, '');
        const res = await fetch(`${host}/query`, {
            method: 'POST',
            headers: {
                'Api-Key': keys.pineconeApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vector: queryEmbedding,
                topK,
                filter: { userId: { "$eq": userId } },
                includeMetadata: true
            })
        });

        if (!res.ok) {
            console.error("Pinecone Query failed:", await res.text());
            return [];
        }

        const data = await res.json();
        const matches = data.matches || [];
        return matches.map((m: any) => m.metadata?.text || "").filter((t: string) => t.length > 0);
    } catch (e) {
        console.error("Pinecone API Error:", e);
        return [];
    }
};

export const syncFactToPinecone = async (factId: number | string, text: string, embedding: number[], userId: string) => {
    try {
        const keys = await shadowDB.getSystemKeys();
        if (!keys || !keys.pineconeApiKey || !keys.pineconeHost) return;

        const host = keys.pineconeHost.replace(/\/$/, '');
        await fetch(`${host}/vectors/upsert`, {
            method: 'POST',
            headers: {
                'Api-Key': keys.pineconeApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vectors: [
                    {
                        id: `fact_${userId}_${factId}`,
                        values: embedding,
                        metadata: {
                            text,
                            userId
                        }
                    }
                ],
                namespace: "" // default namespace
            })
        });
    } catch (e) {
        console.error("Pinecone Upsert Error:", e);
    }
};
