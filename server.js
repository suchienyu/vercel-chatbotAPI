const express = require('express');
const { OpenAI } = require("openai");
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
console.log("process.env.NODE_ENV:",process.env.NODE_ENV)
if ((process.env.NODE_ENV || 'local') === 'local') {
    // 如果是 'local'，则加载 .local 文件
    dotenv.config({ path: './.local' });
  } else {
    // 否则，加载 .env 文件
    dotenv.config();
  }
//const tf = require('@tensorflow/tfjs-node');

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(cors({
    origin: '*',  // 允許所有來源
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
// 增加請求超時設置
app.use((req, res, next) => {
    req.setTimeout(30000);
    res.setTimeout(30000);
    next();
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
console.log('!!',{
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
})
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

pool.connect()
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection error:', err));

console.log(process.env.NODE_ENV)
app.get('/health', (req, res) => {
    // 立即響應
    res.status(200).json({ 
        status: 'ok',
        message: '伺服器運作正常',
        timestamp: new Date().toISOString()
    });
});
app.post('/api/add-question', async (req, res) => {
    const { message, response } = req.body;

    if (!message || !response) {
        return res.status(400).json({ error: 'Message and response are required' });
    }

    try {
        const embedding = await getEmbedding(message);
        if (embedding.length !== 1536) {
            throw new Error(`Expected 1536 dimensions, but got ${embedding.length}`);
        }

        // 将 embedding 数组转换为 JSON 字符串
        const embeddingString = JSON.stringify(embedding);

        await pool.query(`
            INSERT INTO chatbot (message, response, embedding)
            VALUES ($1, $2, $3);
        `, [message, response, embeddingString]);

        res.status(201).json({ message: 'Question successfully added to database' });
    } catch (err) {
        console.error('Error adding question to database:', err);
        res.status(500).json({ error: 'An error occurred while adding the question' });
    }
});

async function translateResponse(userQuery, response) {
    // 先處理圖片標籤，添加樣式
    const completion = await openai.chat.completions.create({
        model: "gpt-4",  // 或其他適合的模型
        messages: [
            {
                role: "system",
                content: `You are a translator. Follow these steps:
                1. Identify the language of the user's query.
                2. Identify the language of the response to be translated.
                3. Translate the response into the language of the user's query.
                4. Do NOT translate any Markdown syntax, URLs, or text within backticks or square brackets.
                5. Preserve all formatting, including newlines, bold, italic, and list structures.
                6. If the user's query and the response are already in the same language, return the original response without translation.
                7. If the user's language is Chinese, use Traditional Chinese (zh-tw) for the translation, not Simplified Chinese.
                8. Ensure that the final output is in the same language as the user's query, regardless of the original response language.
                9. Output ONLY the translated or original text without any explanations, summaries, or metadata about the translation process.`
            },
            {
                role: "user",
                content: `User query: "${userQuery}"\n\nResponse to translate: ${response}`
            }
        ],
        temperature: 0.3,  // 低溫度以獲得更一致的翻譯
    });

    return completion.choices[0].message.content;
}

async function getEmbedding(text) {
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
    });
    const embedding = response.data[0].embedding;
    if (embedding.length !== 1536) {
        throw new Error(`Expected 1536 dimensions, but got ${embedding.length}`);
    }
    return embedding;
}
app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;
    const queryMessage = messages[messages.length - 1].content;
    console.log('Received message:', queryMessage);
    try {
        const queryVector = await getEmbedding(queryMessage);
        
        if (queryVector.length !== 1536) {
            throw new Error(`Expected 1536 dimensions, but got ${queryVector.length}`);
        }

        const vectorString = `[${queryVector.join(',')}]`;
        console.log('Vector string:', vectorString);


        const result = await pool.query(`
            SELECT response, 1 - (embedding <-> $1::vector(1536)) AS similarity
            FROM chatbot
            ORDER BY similarity DESC
            LIMIT 1;
        `, [vectorString]);

        console.log('Query result:', result.rows);

        if (result.rows.length > 0 ) {  // 設置一個相似度閾值 && result.rows[0].similarity > 0.8
            const originalResponse = result.rows[0].response;
            const translatedResponse = await translateResponse(queryMessage, originalResponse);
            res.json({ response: translatedResponse.trim() });
        } else {
            res.json({ response: 'I do not have a relevant response for that message.' });
        }
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, '0.0.0.0',() => {
    console.log(`Server running at http://localhost:${port}`);
});