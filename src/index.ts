import express from 'express';
import config from './config/config';
import { indexPdfFiles } from './services/pineconeService'
import { querryModel, startConversation, endConversation } from './services/openaiService';


const app = express();
const PORT = config.port || 3000;

app.use(express.json());


app.get('/', (req, res) => {
    res.send('Welcome to the TypeScript Application!');
});

app.post('/indexfiles', async (req, res) => {
    try {
        const result = await indexPdfFiles();
        res.json(result);
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: "Indexing failed" });
    }
});

app.post('/startConversation', (req, res) => {
    const response = startConversation();
    res.json(response);
});

app.post('/endConversation', (req, res) => {
    const { sessionId } = req.body;
    const response = endConversation(sessionId);
    res.json(response);
});

app.post('/query', async (req, res) => {
    try {        
        const { question, sessionId } = req.body;
        const response = await querryModel(question, sessionId);
        res.status(200).json(response);
    }
    catch (error: any) {
        console.log(error);
        res.status(500).json({ error: "Query failed" });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});