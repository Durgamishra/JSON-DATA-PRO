// ==========================================
// 🚀 VERCEL SERVERLESS API
// File: /api/generate.js
// ==========================================

module.exports = async function handler(req, res) {

    // ==========================================
    // ✅ ALLOW ONLY POST
    // ==========================================
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method Not Allowed"
        });
    }

    try {

        // ==========================================
        // 📦 GET PROMPT
        // ==========================================
        const prompt = req.body?.prompt?.trim();

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: "Prompt is required"
            });
        }

        // ==========================================
        // 🔐 ENV VARIABLE
        // ==========================================
        const API_KEY = process.env.API_KEY;

        if (!API_KEY) {
            return res.status(500).json({
                success: false,
                error: "API_KEY is missing"
            });
        }

        // ==========================================
        // 🧠 SYSTEM PROMPT
        // ==========================================
        const systemPrompt = `
You are an expert JSON data generator.

Rules:
- Return ONLY valid JSON
- No markdown
- No explanations
- No comments
- Output must be parseable JSON
`;

        // ==========================================
        // ⏱️ REQUEST TIMEOUT
        // ==========================================
        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 25000);

        // ==========================================
        // 🌐 OPENROUTER REQUEST
        // ==========================================
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://json-data-pro.vercel.app",
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
        // ❌ API ERROR
        // ==========================================
        if (!response.ok) {

            const errorText = await response.text();

            console.error("OpenRouter Error:", errorText);

            return res.status(response.status).json({
                success: false,
                error: "AI request failed"
            });
        }

        // ==========================================
        // 📦 PARSE RESPONSE
        // ==========================================
        const data = await response.json();

        let aiText =
            data?.choices?.[0]?.message?.content?.trim();

        if (!aiText) {
            return res.status(500).json({
                success: false,
                error: "Empty AI response"
            });
        }

        // ==========================================
        // 🧹 CLEAN MARKDOWN
        // ==========================================
        aiText = aiText
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        // ==========================================
        // ✅ SAFE JSON PARSE
        // ==========================================
        let parsedJSON;

        try {

            parsedJSON = JSON.parse(aiText);

        } catch {

            console.error("Invalid JSON:", aiText);

            return res.status(500).json({
                success: false,
                error: "AI returned invalid JSON",
                raw: aiText
            });
        }

        // ==========================================
        // 🚀 SUCCESS
        // ==========================================
        return res.status(200).json(parsedJSON);

    } catch (error) {

        console.error("SERVER ERROR:", error);

        // Timeout error
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
}
