require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// ==========================================
// ⚙️ CONFIG
// ==========================================
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.API_KEY;

// ==========================================
// 🚨 STARTUP VALIDATION
// ==========================================
if (!API_KEY) {
    console.error("❌ API_KEY missing in environment variables");
    process.exit(1);
}

// ==========================================
// ⚡ MIDDLEWARE
// ==========================================
app.disable("x-powered-by");

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json({
    limit: "1mb"
}));

// ==========================================
// 🏠 ROOT ROUTE
// ==========================================
app.get("/", (_, res) => {
    res.status(200).send("🚀 Backend Running Successfully");
});

// ==========================================
// ❤️ HEALTH CHECK
// ==========================================
app.get("/health", (_, res) => {
    res.status(200).json({
        success: true,
        status: "OK"
    });
});

// ==========================================
// 🧠 GENERATE ROUTE
// ==========================================
app.post("/api/generate", async (req, res) => {

    try {

        const prompt = req.body?.prompt?.trim();

        // ==========================================
        // VALIDATION
        // ==========================================
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: "Prompt is required"
            });
        }

        if (prompt.length > 3000) {
            return res.status(400).json({
                success: false,
                error: "Prompt too large"
            });
        }

        // ==========================================
        // SYSTEM PROMPT
        // ==========================================
        const systemPrompt = `
You are an expert JSON generator.

Rules:
- Return ONLY valid JSON
- No markdown
- No explanations
- No comments
- Output must be parseable
`;

        // ==========================================
        // REQUEST TIMEOUT
        // ==========================================
        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 25000);

        // ==========================================
        // OPENROUTER API CALL
        // ==========================================
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                signal: controller.signal,
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
                    temperature: 0,
                    max_tokens: 1000
                })
            }
        );

        clearTimeout(timeout);

        // ==========================================
        // HANDLE API ERRORS
        // ==========================================
        if (!response.ok) {

            const errorText = await response.text();

            console.error("❌ OpenRouter Error:", errorText);

            return res.status(response.status).json({
                success: false,
                error: "AI API request failed"
            });
        }

        // ==========================================
        // PARSE RESPONSE
        // ==========================================
        const data = await response.json();

        const aiContent =
            data?.choices?.[0]?.message?.content?.trim();

        if (!aiContent) {
            return res.status(500).json({
                success: false,
                error: "Empty AI response"
            });
        }

        // ==========================================
        // CLEAN MARKDOWN
        // ==========================================
        const cleanedText = aiContent
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        // ==========================================
        // SAFE JSON PARSE
        // ==========================================
        let parsedJSON;

        try {

            parsedJSON = JSON.parse(cleanedText);

        } catch {

            console.error("❌ Invalid JSON:", cleanedText);

            return res.status(500).json({
                success: false,
                error: "AI returned invalid JSON"
            });
        }

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================
        return res.status(200).json(parsedJSON);

    } catch (error) {

        console.error("❌ SERVER ERROR:", error);

        // Timeout
        if (error.name === "AbortError") {
            return res.status(408).json({
                success: false,
                error: "Request timeout"
            });
        }

        return res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }
});

// ==========================================
// ❌ 404 HANDLER
// ==========================================
app.use((_, res) => {
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
