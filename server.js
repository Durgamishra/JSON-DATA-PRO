require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Debug check
console.log("API KEY LOADED:", API_KEY ? "YES" : "NO");

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({
            error: "Prompt is required"
        });
    }

    const systemPrompt = `
You are an expert JSON data generator.

Convert the user's natural language request into valid JSON.

Rules:
- ONLY return valid JSON
- No markdown
- No explanations
- No extra text
`;

    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Json Data Pro"
                },
                body: JSON.stringify({
                    model: "openai/gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.1
                })
            }
        );

        // OpenRouter error handling
        if (!response.ok) {
            const errorText = await response.text();

            console.error("OpenRouter Error:", errorText);

            return res.status(500).json({
                error: errorText
            });
        }

        const data = await response.json();

        let aiText = data.choices[0].message.content.trim();

        // Remove accidental markdown
        aiText = aiText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        // Validate JSON
        const parsedJSON = JSON.parse(aiText);

        // Send JSON
        res.json(parsedJSON);

    } catch (error) {

        console.error("SERVER ERROR:", error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
