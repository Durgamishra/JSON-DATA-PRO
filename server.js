require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Environment Variables
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.API_KEY;

// Debug Check
console.log("API KEY LOADED:", API_KEY ? "YES" : "NO");

// Root Route
app.get("/", (req, res) => {
    res.send("Backend Running Successfully 🚀");
});

// Generate Route
app.post("/api/generate", async (req, res) => {

    try {

        const { prompt } = req.body;

        // Validate Prompt
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: "Prompt is required"
            });
        }

        // AI System Prompt
        const systemPrompt = `
You are an expert JSON data generator.

Convert the user's natural language request into valid JSON.

Rules:
- ONLY return valid JSON
- No markdown
- No explanations
- No extra text
`;

        // API Request
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://your-github-pages-url.github.io",
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

        // Handle API Errors
        if (!response.ok) {

            const errorText = await response.text();

            console.error("OpenRouter Error:", errorText);

            return res.status(500).json({
                success: false,
                error: errorText
            });
        }

        // Parse API Response
        const data = await response.json();

        let aiText = data.choices[0].message.content.trim();

        // Remove Markdown
        aiText = aiText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        // Validate JSON
        let parsedJSON;

        try {
            parsedJSON = JSON.parse(aiText);
        } catch (jsonError) {

            console.error("Invalid JSON:", aiText);

            return res.status(500).json({
                success: false,
                error: "AI returned invalid JSON",
                raw: aiText
            });
        }

        // Send Valid JSON
        res.json(parsedJSON);

    } catch (error) {

        console.error("SERVER ERROR:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 404 Route
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route Not Found"
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
