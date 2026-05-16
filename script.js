document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 📦 DOM ELEMENTS
    // ==========================================
    const generateBtn = document.getElementById('generate-btn');
    const promptInput = document.getElementById('prompt-input');
    const jsonOutput = document.getElementById('json-output');
    const copyBtn = document.getElementById('copy-btn');

    // ==========================================
    // 🚀 GENERATE BUTTON EVENT
    // ==========================================
    generateBtn.addEventListener('click', async () => {

        const promptText = promptInput.value.trim();

        // Empty input
        if (!promptText) {

            jsonOutput.innerHTML =
                '<span class="json-comment">// Please enter a prompt.</span>';

            return;
        }

        // Loading state
        const originalBtnHTML = generateBtn.innerHTML;

        generateBtn.disabled = true;

        generateBtn.innerHTML =
            '<i class="ph ph-spinner ph-spin"></i> Generating...';

        jsonOutput.innerHTML =
            '<span class="json-comment">// Generating JSON...</span>';

        try {

            // Fetch AI response
            const result = await fetchFromAI(promptText);

            // Generate line numbers
            updateLineNumbers(JSON.stringify(result, null, 2));

            // Syntax highlight
            const formattedHTML = syntaxHighlight(result);

            // Typewriter render
            jsonOutput.innerHTML = '';

            typeHTML(formattedHTML, jsonOutput, 5);

        } catch (error) {

            console.error(error);

            jsonOutput.innerHTML =
                `<span class="json-comment" style="color:#ff5555;">
                // ERROR:
                // ${error.message}
                </span>`;

        } finally {

            generateBtn.disabled = false;

            generateBtn.innerHTML = originalBtnHTML;
        }
    });

    // ==========================================
    // 📋 COPY BUTTON
    // ==========================================
    copyBtn.addEventListener('click', async () => {

        try {

            await navigator.clipboard.writeText(jsonOutput.innerText);

            copyBtn.innerHTML =
                '<i class="ph ph-check text-neon-blue"></i>';

            setTimeout(() => {

                copyBtn.innerHTML =
                    '<i class="ph ph-copy"></i>';

            }, 2000);

        } catch (error) {

            console.error("Copy failed:", error);
        }
    });

    // ==========================================
    // 🧠 FETCH AI FROM BACKEND
    // ==========================================
    async function fetchFromAI(prompt) {

        const response = await fetch(
            "const response = await fetch(
    "https://JSON-DATA-PRO.onrender.com/api/generate",",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prompt: prompt
                })
            }
        );

        // Server errors
        if (!response.ok) {

            let errorMessage = `Server Error ${response.status}`;

            try {

                const errorData = await response.json();

                if (errorData.error) {
                    errorMessage = errorData.error;
                }

            } catch {

                errorMessage = await response.text();
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    }

    // ==========================================
    // 🔢 UPDATE LINE NUMBERS
    // ==========================================
    function updateLineNumbers(text) {

        const lineNumbers =
            document.querySelector('.line-numbers');

        const lines = text.split('\n').length;

        let numbersHTML = '';

        for (let i = 1; i <= lines; i++) {

            numbersHTML += i + '<br>';
        }

        lineNumbers.innerHTML = numbersHTML;
    }

    // ==========================================
    // 🎨 SYNTAX HIGHLIGHTER
    // ==========================================
    function syntaxHighlight(jsonObj) {

        let jsonString =
            typeof jsonObj !== 'string'
                ? JSON.stringify(jsonObj, null, 2)
                : jsonObj;

        // Escape HTML
        jsonString = jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return jsonString.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+\-]?\d+)?)/g,
            function (match) {

                let cls = 'json-number';

                // Keys
                if (/^"/.test(match)) {

                    if (/:$/.test(match)) {

                        return '<span class="json-key">' +
                            match.slice(0, -1) +
                            '</span>:';
                    }

                    cls = 'json-string';
                }

                // Boolean
                else if (/true|false/.test(match)) {

                    cls = 'json-boolean';
                }

                // Null
                else if (/null/.test(match)) {

                    cls = 'json-null';
                }

                return '<span class="' +
                    cls +
                    '">' +
                    match +
                    '</span>';
            }
        );
    }

    // ==========================================
    // ⌨️ TYPEWRITER EFFECT
    // ==========================================
    function typeHTML(htmlString, element, speed = 5) {

        let i = 0;

        let currentHTML = '';

        function type() {

            if (i >= htmlString.length) return;

            // Handle HTML tags
            if (htmlString.charAt(i) === '<') {

                const closingIndex =
                    htmlString.indexOf('>', i);

                if (closingIndex !== -1) {

                    currentHTML +=
                        htmlString.substring(i, closingIndex + 1);

                    i = closingIndex + 1;

                    element.innerHTML = currentHTML;

                    type();

                    return;
                }
            }

            // Add character
            currentHTML += htmlString.charAt(i);

            element.innerHTML = currentHTML;

            i++;

            setTimeout(type, speed);
        }

        type();
    }

});
