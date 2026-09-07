// 🧩 PROBLEM–04: buildInputSecurity()

//  Logic: Threat detection + sanitization. Modes: ESCAPE / STRIP / BLOCK.
//  Detects XSS, SQLI, PATH_TRAVERSAL, COMMAND_INJECTION patterns.

const __THREAT_PATTERNS = {
    XSS: ["<script>", "javascript:", "onerror=", "alert(", "eval("],
    SQLI: ["' OR", "UNION SELECT", "DROP TABLE", "--", "; SELECT"],
    PATH_TRAVERSAL: ["../", "/etc/passwd", "C:\\Windows"],
    COMMAND_INJECTION: ["; ls", "| cat", "&& rm", "$(", "`"]
};

function __escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

function __detectThreats(value, enabledDetectors) {
    const threats = [];

    for (const detector of enabledDetectors) {
        const patterns = __THREAT_PATTERNS[detector];
        if (!patterns) continue;
        for (const pattern of patterns) {
            if (value.includes(pattern)) {
                threats.push({ type: detector, pattern });
            }
        }
    }

    return threats;
}

function __sanitizeByMode(value, threats, mode) {
    if (mode === "ESCAPE") {
        return __escapeHTML(value);
    }

    if (mode === "STRIP") {
        let sanitized = value;
        for (const threat of threats) {
            sanitized = sanitized.split(threat.pattern).join("");
        }
        return sanitized;
    }

    return value;
}


function buildInputSecurity(securityConfig) {

    // --- STEP 1: VALIDATE ---
    if (
        typeof securityConfig !== "object" ||
        securityConfig === null ||
        Array.isArray(securityConfig) ||
        !["ESCAPE", "STRIP", "BLOCK"].includes(securityConfig.mode) ||
        !Array.isArray(securityConfig.enabledDetectors) ||
        !Array.isArray(securityConfig.inputs)
    ) {
        return "Invalid Input";
    }

    const mode = securityConfig.mode;
    const enabledDetectors = securityConfig.enabledDetectors;

    // --- STEP 2: PROCESS INPUTS ---
    const inputLog = [];

    let cleanInputs = 0;
    let threatenedInputs = 0;
    const threatBreakdown = {};

    for (const input of securityConfig.inputs) {
        const fields = [];
        let threatsFound = 0;
        let blockedFields = 0;

        let inputHasThreat = false;

        for (const [field, original] of Object.entries(input.data)) {
            const value = typeof original === "string" ? original : String(original);
            const threats = __detectThreats(value, enabledDetectors);

            if (threats.length > 0) {
                threatsFound++;
                inputHasThreat = true;
                for (const threat of threats) {
                    if (!threatBreakdown[threat.type]) threatBreakdown[threat.type] = 0;
                    threatBreakdown[threat.type]++;
                }
            }

            if (mode === "BLOCK") {
                if (threats.length > 0) {
                    blockedFields++;
                    fields.push({ field, original: value, blocked: true, threats });
                } else {
                    fields.push({ field, original: value, blocked: false, sanitized: value, threats: [] });
                }
            } else {
                const sanitized = __sanitizeByMode(value, threats, mode);
                fields.push({ field, original: value, sanitized, threats });
            }
        }

        if (inputHasThreat) {
            threatenedInputs++;
        } else {
            cleanInputs++;
        }

        const summary = { totalFields: fields.length, threatsFound };

        if (mode === "BLOCK") {
            summary.blocked = blockedFields;
        }

        inputLog.push({ inputId: input.inputId, fields, summary });
    }

    // --- STEP 3: OVERALL SUMMARY ---
    return {
        inputLog,
        overallSummary: {
            totalInputs: inputLog.length,
            cleanInputs,
            threatenedInputs,
            threatBreakdown
        }
    };
}


// ------ EXAMPLE USAGE ------
console.log(JSON.stringify(buildInputSecurity({
    mode: "ESCAPE",
    enabledDetectors: ["XSS", "SQLI"],
    inputs: [
        { inputId: "I1", data: { name: "Rahim", comment: "<script>alert(1)</script>" } },
        { inputId: "I2", data: { query: "' OR 1=1 --", page: "1" } }
    ]
}), null, 2));


// --- INVALID ---
console.log(buildInputSecurity(null));