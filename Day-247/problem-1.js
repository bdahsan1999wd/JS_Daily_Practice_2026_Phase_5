// 🧩 PROBLEM–01: createXSSSanitizer()

// Logic: XSS sanitization with STRIP / ESCAPE / ENCODE modes.
//   HTML entities: < &lt;  > &gt;  & &amp;  " &quot;  ' &#x27;  / &#x2F;
//   detectThreats() — find dangerous patterns with severity + location


function createXSSSanitizer(sanitizerConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof sanitizerConfig !== "object" ||
        sanitizerConfig === null ||
        Array.isArray(sanitizerConfig) ||
        !Array.isArray(sanitizerConfig.allowedTags) ||
        typeof sanitizerConfig.allowedAttributes !== "object" ||
        sanitizerConfig.allowedAttributes === null ||
        !["STRIP", "ESCAPE", "ENCODE"].includes(sanitizerConfig.mode)
    ) {
        return "Invalid Input";
    }

    const allowedTags = sanitizerConfig.allowedTags;
    const allowedAttributes = sanitizerConfig.allowedAttributes;
    const mode = sanitizerConfig.mode;

    const ENTITY_MAP = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;"
    };

    const DANGEROUS_PATTERNS = [
        "<script>",
        "javascript:",
        "onerror=",
        "onload=",
        "onclick=",
        "eval(",
        "alert(",
        "document.cookie"
    ];


    // --- STEP 2: HELPERS ---
    function escapeHtml(str) {
        return str.split("").map(ch => ENTITY_MAP[ch] || ch).join("");
    }

    function findThreats(input) {

        const threats = [];

        for (const pattern of DANGEROUS_PATTERNS) {

            let idx = input.toLowerCase().indexOf(pattern.toLowerCase());

            while (idx !== -1) {

                const lower = pattern.toLowerCase();

                let severity = "MEDIUM";

                if (lower === "<script>" || lower === "eval(") severity = "CRITICAL";
                else if (lower === "javascript:" || lower === "onerror=" || lower === "onload=" || lower === "onclick=") severity = "HIGH";
                else if (lower === "alert(") severity = "MEDIUM";
                else if (lower === "document.cookie") severity = "HIGH";

                threats.push({ pattern, location: idx, severity });

                idx = input.toLowerCase().indexOf(pattern.toLowerCase(), idx + 1);
            }
        }

        return threats;
    }


    // STRIP mode: remove non-allowed tags and dangerous attributes.
    function stripHtml(input) {

        let result = input;

        // Remove dangerous tags entirely.

        const dangerTags = ["script", "style", "iframe", "object", "embed", "link", "meta"];

        for (const tag of dangerTags) {
            result = result.replace(new RegExp("<\\/?" + tag + "[^>]*>", "gi"), "");
        }

        // Remove attributes not allowed for each tag.

        result = result.replace(/<([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName, attrs) => {

            if (!allowedTags.includes(tagName.toLowerCase())) return "";

            const allowed = allowedAttributes[tagName.toLowerCase()] || [];

            const attrPattern = /([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;

            const keptAttrs = [];

            let m;

            while ((m = attrPattern.exec(attrs)) !== null) {
                if (allowed.includes(m[1].toLowerCase())) {
                    keptAttrs.push(m[0]);
                }
            }

            return "<" + tagName + (keptAttrs.length > 0 ? " " + keptAttrs.join(" ") : "") + ">";
        });

        return result;
    }

    // --- STEP 3: PUBLIC API ---
    return {

        sanitize(input) {

            if (typeof input !== "string") return "Invalid Input";

            const threats = findThreats(input);

            let sanitized;

            if (mode === "ESCAPE") {
                sanitized = escapeHtml(input);
            } else if (mode === "ENCODE") {
                sanitized = escapeHtml(input);
            } else {
                sanitized = stripHtml(input);
            }

            return {
                original: input,
                sanitized,
                threatsDetected: threats.length > 0,
                threatCount: threats.length,
                mode
            };
        },

        sanitizeObject(obj) {

            if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
                return "Invalid Input";
            }

            let totalFieldsSanitized = 0;
            let threatsFound = 0;

            function walk(node) {

                if (typeof node === "string") {

                    const result = findThreats(node);

                    if (result.length > 0) threatsFound++;

                    if (mode === "ESCAPE" || mode === "ENCODE") {
                        totalFieldsSanitized++;
                        return escapeHtml(node);
                    }

                    const stripped = stripHtml(node);

                    if (stripped !== node) totalFieldsSanitized++;

                    return stripped;
                }

                if (Array.isArray(node)) {
                    return node.map(walk);
                }

                if (typeof node === "object" && node !== null) {
                    const out = {};
                    for (const key of Object.keys(node)) {
                        out[key] = walk(node[key]);
                    }
                    return out;
                }

                return node;
            }

            const sanitized = walk(obj);

            return { sanitized, totalFieldsSanitized, threatsFound };
        },

        detectThreats(input) {

            if (typeof input !== "string") return "Invalid Input";

            const threats = findThreats(input);

            return { hasThreats: threats.length > 0, threats };
        },

        getBatchReport(inputs) {

            if (!Array.isArray(inputs)) return "Invalid Input";

            const results = [];
            let threatsDetected = 0;
            let cleanInputs = 0;

            inputs.forEach((input, index) => {

                if (typeof input !== "string") {
                    results.push({ index, sanitized: null, threatsDetected: false });
                    cleanInputs++;
                    return;
                }

                const result = this.sanitize(input);

                results.push({
                    index,
                    sanitized: result.sanitized,
                    threatsDetected: result.threatsDetected
                });

                if (result.threatsDetected) threatsDetected++;
                else cleanInputs++;
            });

            return { total: inputs.length, threatsDetected, cleanInputs, results };
        }
    };
}



// ------ EXAMPLE USAGE ------

const xss = createXSSSanitizer({
    allowedTags: ["b", "i", "p"],
    allowedAttributes: { "a": ["href"] },
    mode: "ESCAPE"
});


console.log(xss.sanitize('<script>alert("XSS")</script><b>Hello</b>'));

console.log(xss.detectThreats('Hello <script>document.cookie</script> world'));

console.log(xss.sanitizeObject({
    name: "Rahim",
    comment: '<img onerror="alert(1)" src="x">',
    nested: { bio: "<script>evil()</script>" }
}));


// --- INVALID ---
console.log(createXSSSanitizer({ allowedTags: [], allowedAttributes: null, mode: "NOPE" }));