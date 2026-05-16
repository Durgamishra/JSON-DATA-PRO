document.addEventListener("DOMContentLoaded", () => {
    // 1. Get all DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const promptInput = document.getElementById('prompt-input');
    const jsonOutput = document.getElementById('json-output');
    const copyBtn = document.getElementById('copy-btn');
    const demoTerminal = document.getElementById('demo-output');
    const termLoading = document.querySelector('.term-loading');
    const apiKey = process.env.API_KEY;
    // ==========================================
    // 🚀 MAIN GENERATE BUTTON LOGIC
    // ==========================================
    generateBtn.addEventListener('click', async () => {
        const promptText = promptInput.value.trim();
        
        if (!promptText) {
            jsonOutput.innerHTML = `<span class="json-comment">// Error: Please enter a prompt on the left first.</span>`;
            return;
        }

        // Update UI to Loading State
        const originalBtnText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Generating...';
        generateBtn.disabled = true;
        jsonOutput.innerHTML = '<span class="json-comment">// Connecting to OpenRouter AI Engine...\n// Analyzing structure...</span>';

        try {
            // Fetch from OpenRouter
            const jsonResult = await fetchFromAI(promptText);

            // Highlight and Format Output
            const formattedHTML = syntaxHighlight(jsonResult);
            
            // Render with Typewriter effect
            jsonOutput.innerHTML = '';
            typeHTML(formattedHTML, jsonOutput, 10); // 10ms speed

        } catch (error) {
            console.error("Full error:", error);
            jsonOutput.innerHTML = `<span class="json-comment" style="color: #ff5555;">// AI Error: \n// ${error.message}\n// Check console for details.</span>`;
        } finally {
            // Restore Button State
            generateBtn.innerHTML = originalBtnText;
            generateBtn.disabled = false;
        }
    });

    // ==========================================
    // 📋 COPY TO CLIPBOARD LOGIC
    // ==========================================
    copyBtn.addEventListener('click', () => {
        const rawText = jsonOutput.innerText;
        navigator.clipboard.writeText(rawText);
        
        copyBtn.innerHTML = '<i class="ph ph-check text-neon-blue"></i>';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="ph ph-copy"></i>';
        }, 2000);
    });

    // ==========================================
    // 🧠 REAL AI FETCH FUNCTION (OpenRouter)
    // ==========================================
    async function fetchFromAI(prompt) {
        const systemPrompt = `You are an expert JSON data generator. Convert the user's natural language request into a valid JSON object or array. ONLY output valid JSON. Do not include markdown formatting like \`\`\`json. Do not include any explanations before or after the JSON.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // Fixed: Using the updated valid Llama 3.1 free model
                model: "GPT-3.5-Turbo", 
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`API Error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        let aiText = data.choices[0].message.content.trim();

        // Cleanup markdown if AI accidentally includes it
        if (aiText.startsWith("```")) {
            aiText = aiText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
        }

        // Ensure we parse it safely
        try {
            return JSON.parse(aiText);
        } catch (parseError) {
            console.error("Raw AI Output was:", aiText);
            throw new Error("AI did not return valid JSON. Try rephrasing your prompt.");
        }
    }

    // ==========================================
    // 🎨 SYNTAX HIGHLIGHTER FUNCTION
    // ==========================================
    function syntaxHighlight(jsonObj) {
        let jsonStr = typeof jsonObj !== 'string' ? JSON.stringify(jsonObj, null, 2) : jsonObj;
        jsonStr = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return jsonStr.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    return `<span class="json-key">${match.slice(0, -1)}</span>:`;
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-string'; 
            } else if (/null/.test(match)) {
                cls = 'json-comment';
            }
            return `<span class="${cls}">${match}</span>`;
        });
    }

    // ==========================================
    // ⌨️ ROBUST TYPEWRITER EFFECT
    // ==========================================
    function typeHTML(htmlString, element, speed) {
        let i = 0;
        let currentHTML = '';
        
        function type() {
            if (i < htmlString.length) {
                if (htmlString.charAt(i) === '<') {
                    let closingIndex = htmlString.indexOf('>', i);
                    if (closingIndex !== -1) {
                        currentHTML += htmlString.substring(i, closingIndex + 1);
                        i = closingIndex + 1;
                    } else {
                        currentHTML += htmlString.charAt(i);
                        i++;
                    }
                    element.innerHTML = currentHTML;
                    type(); 
                } else {
                    currentHTML += htmlString.charAt(i);
                    element.innerHTML = currentHTML;
                    i++;
                    setTimeout(type, speed);
                }
            }
        }
        type();
    }

    // ==========================================
    // 📜 DEMO TERMINAL SCROLL OBSERVER
    // ==========================================
    let demoPlayed = false;
    const demoJson = `{
  <span class="json-key">"server"</span>: {
    <span class="json-key">"port"</span>: <span class="json-number">8080</span>,
    <span class="json-key">"dev_mode"</span>: <span class="json-number">true</span>
  }
}`;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !demoPlayed && demoTerminal && termLoading) {
                demoPlayed = true;
                setTimeout(() => {
                    termLoading.style.display = 'block';
                    setTimeout(() => {
                        termLoading.style.display = 'none';
                        typeHTML(demoJson, demoTerminal, 15);
                    }, 1200);
                }, 500);
            }
        });
    }, { threshold: 0.5 });

    const terminalElement = document.querySelector('.demo-terminal');
    if (terminalElement) observer.observe(terminalElement);

});
