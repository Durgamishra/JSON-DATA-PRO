require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// ==========================================
// ⚙️ MIDDLEWARE (FIXED FOR GITHUB + MOBILE)
// ==========================================
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ==========================================
// 🔐 ENV VARIABLES
// ==========================================
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.API_KEY;

// Debug
console.log("API KEY LOADED:", API_KEY ? "YES" : "NO");

// ==========================================
// 🏠 ROOT ROUTE
// ==========================================
app.get("/", (req, res) => {
    res.send("Backend Running Successfully 🚀");
});

// ==========================================
// 🧠 GENERATE ROUTE
// ==========================================
app.post("/api/generate", async (req, res) => {

    try {

        const { prompt } = req.body;

        // Validate prompt
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: "Prompt is required"
            });
        }

        // Validate API key
        if (!API_KEY) {
            return res.status(500).json({
                success: false,
                error: "API_KEY missing in Render environment variables"
            });
        }

        // System prompt
        const systemPrompt = `
You are an expert JSON data generator.

Convert the user's request into STRICT valid JSON only.

Rules:
- ONLY JSON output
- NO markdown
- NO explanation
- NO extra text
`;

        // OpenRouter request (FIXED HEADERS + SAFETY)
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://json-data-pro.onrender.com",
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

        // API error handling
        if (!response.ok) {

            const errorText = await response.text();

            console.error("OpenRouter Error:", errorText);

            return res.status(response.status).json({
                success: false,
                error: errorText
            });
        }

        const data = await response.json();

        // Safety check
        if (!data?.choices?.[0]?.message?.content) {
            return res.status(500).json({
                success: false,
                error: "Invalid AI response structure"
            });
        }

        let aiText = data.choices[0].message.content.trim();

        // Clean markdown
        aiText = aiText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        // Parse JSON safely
        let parsedJSON;

        try {
            parsedJSON = JSON.parse(aiText);
        } catch (err) {

            console.error("JSON Parse Error:", aiText);

            return res.status(500).json({
                success: false,
                error: "AI returned invalid JSON",
                raw: aiText
            });
        }

        return res.json(parsedJSON);

    } catch (error) {

        console.error("SERVER ERROR:", error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==========================================
// ❌ 404 HANDLER
// ==========================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route Not Found"
    });
});

// ==========================================
// 🚀 START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
