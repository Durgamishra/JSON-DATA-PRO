document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 📦 DOM ELEMENTS
    // ==========================================
    const generateBtn = document.getElementById("generate-btn");
    const promptInput = document.getElementById("prompt-input");
    const jsonOutput = document.getElementById("json-output");
    const copyBtn = document.getElementById("copy-btn");
    const lineNumbers = document.querySelector(".line-numbers");

    // ==========================================
    // 🌐 API CONFIG
    // ==========================================
    const API_URL = "https://json-data-pro.onrender.com/api/generate";

    // ==========================================
    // 🚀 GENERATE JSON
    // ==========================================
    generateBtn.addEventListener("click", generateJSON);

    async function generateJSON() {

        const prompt = promptInput.value.trim();

        if (!prompt) {
            renderError("Please enter a prompt.");
            return;
        }

        setLoadingState(true);

        try {

            const result = await fetchFromAI(prompt);

            const jsonString = JSON.stringify(result, null, 2);

            updateLineNumbers(jsonString);

            const highlightedHTML = syntaxHighlight(jsonString);

            await typeHTML(highlightedHTML, jsonOutput);

        } catch (error) {

            console.error("AI Fetch Error:", error);

            renderError(error.message || "Something went wrong.");

        } finally {

            setLoadingState(false);
        }
    }

    // ==========================================
    // 📡 FETCH FROM BACKEND
    // ==========================================
    async function fetchFromAI(prompt) {

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("Invalid JSON response from server.");
        }

        if (!response.ok) {
            throw new Error(data.error || `Server Error ${response.status}`);
        }

        return data;
    }

    // ==========================================
    // 🔢 LINE NUMBERS
    // ==========================================
    function updateLineNumbers(text) {

        const lines = text.split("\n").length;

        lineNumbers.innerHTML = Array.from(
            { length: lines },
            (_, i) => i + 1
        ).join("<br>");
    }

    // ==========================================
    // 🎨 JSON SYNTAX HIGHLIGHTER
    // ==========================================
    function syntaxHighlight(jsonString) {

        const escaped = jsonString
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        return escaped.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+\-]?\d+)?)/g,
            (match) => {

                let cls = "json-number";

                if (/^"/.test(match)) {

                    if (/:$/.test(match)) {
                        return `<span class="json-key">${match.slice(0, -1)}</span>:`;
                    }

                    cls = "json-string";
                }

                else if (/true|false/.test(match)) {
                    cls = "json-boolean";
                }

                else if (/null/.test(match)) {
                    cls = "json-null";
                }

                return `<span class="${cls}">${match}</span>`;
            }
        );
    }

    // ==========================================
    // ⌨️ TYPEWRITER EFFECT
    // ==========================================
    function typeHTML(html, element, speed = 3) {

        return new Promise((resolve) => {

            let i = 0;
            let output = "";

            function type() {

                if (i >= html.length) {
                    resolve();
                    return;
                }

                if (html[i] === "<") {

                    const closeIndex = html.indexOf(">", i);

                    if (closeIndex !== -1) {

                        output += html.slice(i, closeIndex + 1);
                        i = closeIndex + 1;

                        element.innerHTML = output;

                        requestAnimationFrame(type);

                        return;
                    }
                }

                output += html[i];
                i++;

                element.innerHTML = output;

                setTimeout(() => {
                    requestAnimationFrame(type);
                }, speed);
            }

            type();
        });
    }

    // ==========================================
    // 📋 COPY JSON
    // ==========================================
    copyBtn.addEventListener("click", copyJSON);

    async function copyJSON() {

        try {

            await navigator.clipboard.writeText(jsonOutput.innerText);

            copyBtn.innerHTML =
                '<i class="ph ph-check text-neon-blue"></i>';

            setTimeout(() => {
                copyBtn.innerHTML =
                    '<i class="ph ph-copy"></i>';
            }, 1500);

        } catch (error) {

            console.error("Clipboard Error:", error);

            renderError("Failed to copy JSON.");
        }
    }

    // ==========================================
    // ⚡ LOADING UI
    // ==========================================
    function setLoadingState(isLoading) {

        generateBtn.disabled = isLoading;

        if (isLoading) {

            generateBtn.innerHTML =
                '<i class="ph ph-spinner ph-spin"></i> Generating...';

            jsonOutput.innerHTML =
                '<span class="json-comment">// Generating JSON...</span>';

        } else {

            generateBtn.innerHTML =
                '<i class="ph ph-stars"></i> Generate JSON';
        }
    }

    // ==========================================
    // ❌ ERROR RENDER
    // ==========================================
    function renderError(message) {

        jsonOutput.innerHTML = `
            <span class="json-comment" style="color:#ff5555;">
            // ERROR:
            // ${message}
            </span>
        `;
    }

});
