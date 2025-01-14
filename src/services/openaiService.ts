import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!;
const EMBEDDING_MODEL = "text-embedding-ada-002";
const COMPLETION_MODEL = "gpt-4o-mini";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pinecone.index(PINECONE_INDEX_NAME);

interface QueryRequest {
    question: string;
}

interface QueryResponse {
    answer: string;
    sources: Array<{
        source: string;
        chunk: number;
    }>;
}

async function createEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error creating embedding:', error);
        throw new Error('Failed to create embedding');
    }
}

async function queryPinecone(embedding: number[], topK: number = 3) {
    try {
        const queryResponse = await index.query({
            vector: embedding,
            topK,
            includeMetadata: true
        });
        return queryResponse.matches;
    } catch (error) {
        console.error('Error querying Pinecone:', error);
        throw new Error('Failed to query Pinecone');
    }
}

async function generateAnswer(question: string, context: string): Promise<string> {
    try {
        const completion = await openai.chat.completions.create({
            model: COMPLETION_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Answer the question based on the provided context. If the answer cannot be found in the context, say so."
                },
                {
                    role: "user",
                    content: `Context: ${context}\n\nQuestion: ${question}`
                }
            ],
            temperature: 0.5,
            max_tokens: 500
        });
        return completion.choices[0].message.content || "I cannot answer that question.";
    } catch (error) {
        console.error('Error generating answer:', error);
        throw new Error('Failed to generate answer');
    }
}

export const querryModel = async (question: string) => {
    try {
        console.log("Got question to answer: ", question);
        const questionEmbedding = await createEmbedding(question);
        const matches = await queryPinecone(questionEmbedding);
        const context = matches
            .map(match => match.metadata?.text)
            .filter(text => text !== undefined)
            .join('\n\n');
        const answer = await generateAnswer(question, context);
        return {
            answer,
            sources: matches.map(match => ({
                source: match.metadata?.source || 'unknown',
                chunk: match.metadata?.chunk || 0
            }))
        };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Internal server error' };
    }
}