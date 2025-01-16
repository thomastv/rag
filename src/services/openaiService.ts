import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { tools } from '../tools';
import { zodFunction } from 'openai/helpers/zod'
import { runTool } from '../tools/toolRunner';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!;
const EMBEDDING_MODEL = "text-embedding-ada-002";
const COMPLETION_MODEL = "gpt-4o-mini";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pinecone.index(PINECONE_INDEX_NAME);

// In-memory database for storing conversations
const conversations: { [sessionId: string]: OpenAI.Chat.Completions.ChatCompletionMessageParam[] } = {};


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

async function generateAnswer(question: string, context: string, sessionId: string): Promise<string> {
    try {
        const conversationHistory : OpenAI.Chat.Completions.ChatCompletionMessageParam[] = conversations[sessionId] || [];
        const messages : OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: "You are a helpful assistant. Answer the question based on the provided context. If the answer cannot be found in the context, say so."
            },
            ...conversationHistory,
            {
                role: "user",
                content: `Context: ${context}\n\nQuestion: ${question}`
            }
        ];
        // console.log(messages);

        const formattedTools = tools.map(zodFunction)

        const completion = await openai.chat.completions.create({
            model: COMPLETION_MODEL,
            messages: messages,
            temperature: 0.5,
            ...(formattedTools.length > 0 && {
                tools: formattedTools,
                tool_choice: 'auto',
                parallel_tool_calls: false,
            }),

        });
        const response = completion.choices[0].message;
        let answer = response.content || "I cannot answer that question.";

        conversationHistory.push({ role: "user", content: question });
        conversationHistory.push({ role: "assistant", content: answer });
        
        if(response.tool_calls){
            console.log("Tool call detected")
            console.log(response.tool_calls)

            const toolCall = response.tool_calls[0]

            const toolResponse = await runTool(toolCall, question);
            answer = toolResponse || "Tool was not able to generate an answer.";
           // conversationHistory.push({role: 'tool', content: toolResponse, tool_call_id: toolCall.id })
        }

        // Update the conversation history with the new question and answer

        if (conversationHistory.length > 10) {
            conversationHistory.splice(0, 2); // Keep only the last 5 pairs of question and answer
        }

        conversations[sessionId] = conversationHistory;

        return answer;
    } catch (error) {
        console.error('Error generating answer:', error);
        throw new Error('Failed to generate answer');
    }
}

//Function to query the alarm list
async function queryAlarmList(): Promise<string[]> {
    return ["Alarm 1", "Alarm 2"];
}

export const querryModel = async (question: string, sessionId: string) => {
    try {
        console.log("Got question to answer: ", question);
        const questionEmbedding = await createEmbedding(question);
        const matches = await queryPinecone(questionEmbedding);
        const context = matches
            .map(match => match.metadata?.text)
            .filter(text => text !== undefined)
            .join('\n\n');

        // Add the current question to the session's conversation history
        if (!conversations[sessionId]) {
            conversations[sessionId] = [];
        }

        const answer = await generateAnswer(question, context, sessionId);
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

// Start a new conversation and return a session ID
export const startConversation = () => {
    let sessionId = uuidv4();

    while (conversations[sessionId]) {
        sessionId = uuidv4();
        console.log("Creating new session id");
    }

    conversations[sessionId] = [];
    return { sessionId };
}

// End a conversation and delete the session data
export const endConversation = (sessionId: string) => {
    if (conversations[sessionId]) {
        delete conversations[sessionId];
        return { message: 'Conversation ended successfully' };
    } else {
        return { error: 'Invalid session ID' };
    }
}