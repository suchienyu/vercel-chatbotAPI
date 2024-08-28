const express = require('express');
const { OpenAI } = require("openai");
const { Pool } = require('pg');
require('dotenv').config();
const tf = require('@tensorflow/tfjs-node');

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});


// async function addQuestionToDatabase(message, response) {
//     try {
//         const embedding = await getEmbedding(message);
//         if (embedding.length !== 1536) {
//             throw new Error(`Expected 1536 dimensions, but got ${embedding.length}`);
//         }
//         const embeddingString = `[${embedding.join(', ')}]`;
//         await pool.query(`
//             INSERT INTO chatbot (message, response, embedding)
//             VALUES ($1, $2, $3::vector(1536));
//         `, [message, response, embeddingString]);
//         console.log('Successfully added question to database.');
//     } catch (err) {
//         console.error('Error adding question to database:', err);
//     }
// }
// addQuestionToDatabase(
//     "How do I log in to my account? - Facebook", 
//     "Please click the 'Log in with Facebook' button.\n\n![pic](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+log+in+to+my+account%3F+-+Facebook1.png)\n\nClick the continue button, you'll be redirected back to the website\n\n![pic](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+log+in+to+my+account%3F+-+Facebook2.png)\n\nYou're in! Start your Mandarin learning journey with BaoDao Talk.\n\n![pic](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+log+in+to+my+account%3F+-+Facebook3.png)"
// );

async function translateResponse(userQuery, response) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4",  // 或其他適合的模型
        messages: [
            {
                role: "system",
                content: `You are a translator. Follow these steps:
                1. Identify the language of the user's query.
                2. If the user's query is not in English, translate the response into that language.
                3. Do NOT translate any Markdown syntax, URLs, or text within backticks or square brackets.
                4. Preserve all formatting, including newlines, bold, italic, and list structures.
                5. If the user's query is in English, do not translate, return the original response.
                6. If the user's language is Chinese, use Traditional Chinese (zh-tw) for the translation, not Simplified Chinese.
                7. Output the translated content directly, without adding any extra explanations or labels.`
                
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
            res.json({ response: translatedResponse });
        } else {
            res.json({ response: 'I do not have a relevant response for that message.' });
        }
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});