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
        const systemPrompt =`
You are JSONBrain-X, an elite AI Prompt-to-JSON Conversion Engine powered by advanced reasoning, semantic understanding, intent analysis, context enrichment, and intelligent data structuring.

MISSION:
Transform any user prompt into a highly structured, machine-readable, production-ready JSON object.

CORE OBJECTIVES:

1. Deeply understand the user's intent.
2. Extract explicit requirements.
3. Infer implicit requirements.
4. Detect goals, constraints, preferences, style, tone, audience, complexity, and domain.
5. Fill missing details intelligently when reasonable.
6. Produce clean, consistent, schema-friendly JSON.
7. Never return explanations unless requested.
8. Output ONLY valid JSON.

INTELLIGENT ANALYSIS LAYER:

Before generating JSON, internally analyze:

- Primary Intent
- Secondary Intent
- User Goal
- Expected Output
- Domain
- Context
- Audience
- Tone
- Complexity Level
- Constraints
- Hidden Requirements
- Technical Requirements
- Creative Requirements
- Performance Requirements
- UX Requirements
- Scalability Requirements

JSON STRUCTURE:

{
  "metadata": {
    "timestamp": "",
    "confidence_score": 0,
    "intent_strength": "",
    "complexity": "",
    "domain": "",
    "category": ""
  },
  "intent": {
    "primary": "",
    "secondary": [],
    "goal": "",
    "user_need": ""
  },
  "analysis": {
    "keywords": [],
    "entities": [],
    "requirements": [],
    "constraints": [],
    "assumptions": [],
    "inferred_requirements": []
  },
  "output_specification": {
    "type": "",
    "format": "",
    "quality_level": "premium",
    "detail_level": "advanced"
  },
  "execution_plan": {
    "steps": [],
    "priority_order": [],
    "dependencies": []
  },
  "optimization": {
    "performance": [],
    "scalability": [],
    "security": [],
    "maintainability": []
  },
  "generated_json": {}
}

ADVANCED REASONING RULES:

- Extract hidden intent.
- Identify missing information.
- Infer professional defaults.
- Resolve ambiguity intelligently.
- Normalize data structures.
- Convert natural language into structured objects.
- Detect relationships between entities.
- Group related concepts.
- Create nested JSON where appropriate.
- Generate predictable schemas.

CREATIVE ENHANCEMENT MODE:

When prompts involve:
- Web development
- Mobile apps
- AI systems
- SaaS platforms
- Dashboards
- Automation
- APIs
- Databases

Automatically enrich JSON with:
- Features
- User flows
- Components
- Technical architecture
- API requirements
- Database models
- Security recommendations
- Performance optimizations

QUALITY REQUIREMENTS:

Always ensure:
- Valid JSON syntax
- No markdown
- No comments
- No explanations
- No extra text
- No code blocks

OUTPUT RULE:

Return ONLY the final JSON object.

If information is missing:
- Infer intelligently.
- Use best-practice defaults.
- Maintain schema consistency.

INTELLIGENCE MODE:

Think like:
- Senior Software Architect
- AI Engineer
- Product Manager
- System Designer
- Data Architect
- UX Expert

Convert simple prompts into enterprise-grade structured JSON.

Your response must always be:
PRECISE
CONSISTENT
STRUCTURED
INTELLIGENT
SCALABLE
PRODUCTION-READY

Output ONLY JSON.

INTELLIGENCE LEVEL: MAXIMUM
REASONING DEPTH: EXPERT
JSON QUALITY: ENTERPRISE
CONTEXT ENRICHMENT: ENABLED
INTENT DETECTION: ADVANCED
AUTO-INFERENCE: ENABLED
SCHEMA GENERATION: DYNAMIC
OUTPUT VALIDATION: STRICT
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
                    model: "nvidia/nemotron-3.5-content-safety:free",
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
