import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import pdf from 'pdf-parse';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize Pinecone
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

async function createEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text
    });
    return response.data[0].embedding;
}

async function processPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

async function splitIntoChunks(text: string, chunkSize: number = 1000): Promise<string[]> {
    const words = text.split(' ');
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const word of words) {
        if (currentLength + word.length > chunkSize) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
            currentLength = 0;
        }
        currentChunk.push(word);
        currentLength += word.length + 1; // +1 for the space
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }
    return chunks;
}

export async function indexPdfFiles() {
    try {
        // Get the index
        const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

        // Process all PDFs in the specified folder
        console.log('Processing PDF files...');
        const folderPath = path.join(__dirname, '..', '..', 'pdfData'); // Updated to pdfData folder in the root
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.pdf'));

        for (const file of files) {
            console.log(`Processing ${file}...`);
            const filePath = path.join(folderPath, file);
            
            // Extract text from PDF
            const text = await processPDF(filePath);
            
            // Split text into chunks
            const chunks = await splitIntoChunks(text);
            
            // Process each chunk
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                // Create embedding
                const embedding = await createEmbedding(chunk);
                
                // Store in Pinecone
                await index.upsert([{
                    id: `${file}-chunk-${i}`,
                    values: embedding,
                    metadata: {
                        text: chunk,
                        source: file,
                        chunk: i
                    }
                }]);
                
                console.log(`Processed chunk ${i + 1}/${chunks.length} of ${file}`);
            }
        }
        
        console.log('Processing completed successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}