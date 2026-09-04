// 🧩 PROBLEM–05: runInputSecurityOrchestrator()

// Logic: Full input-security pipeline per request.
//   1. Setup inline XSS (P1), SQLI (P2), validator (P3), threat engine (P4)
//   2. Per request: threat scan → block if configured → XSS/SQLI sanitize → validate
//   3. Build summary with threat breakdown


function runInputSecurityOrchestrator(securityConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof securityConfig !== "object" ||
        securityConfig === null ||
        Array.isArray(securityConfig) ||
        typeof securityConfig.orchestratorId !== "string" ||
        securityConfig.orchestratorId.length === 0 ||
        typeof securityConfig.xssConfig !== "object" || securityConfig.xssConfig === null ||
        typeof securityConfig.sqliConfig !== "object" || securityConfig.sqliConfig === null ||
        typeof securityConfig.validatorConfig !== "object" || securityConfig.validatorConfig === null ||
        typeof securityConfig.threatConfig !== "object" || securityConfig.threatConfig === null ||
        !Array.isArray(securityConfig.inputRequests)
    ) {
        return "Invalid Input";
    }

    const orchestratorId = securityConfig.orchestratorId;

    const xc = securityConfig.xssConfig;
    const qc = securityConfig.sqliConfig;
    const vc = securityConfig.validatorConfig;
    const tc = securityConfig.threatConfig;

    const VALID_DETECTORS = ["XSS", "SQLI", "PATH_TRAVERSAL", "COMMAND_INJECTION", "LDAP_INJECTION", "XML_INJECTION"];

    if (
        !Array.isArray(xc.allowedTags) ||
        typeof xc.allowedAttributes !== "object" || xc.allowedAttributes === null ||
        !["STRIP", "ESCAPE", "ENCODE"].includes(xc.mode) ||
        typeof qc.strictMode !== "boolean" ||
        !Array.isArray(qc.allowedKeywords) ||
        typeof vc.strictTypes !== "boolean" ||
        typeof vc.maxStringLength !== "number" || vc.maxStringLength < 1 ||
        typeof vc.allowNull !== "boolean" ||
        !Array.isArray(vc.customRules) ||
        !Array.isArray(tc.enabledDetectors) ||
        tc.enabledDetectors.some(d => !VALID_DETECTORS.includes(d)) ||
        typeof tc.blockOnThreat !== "boolean" ||
        typeof tc.logThreats !== "boolean"
    ) {
        return "Invalid Input";
    }


    // --- STEP 2: SETUP inline components (self-contained) ---

    // XSS sanitizer (Problem-01 logic).

    const ENTITY_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "/": "&#x2F;" };

    const DANGEROUS_PATTERNS = ["<script>", "javascript:", "onerror=", "onload=", "onclick=", "eval(", "alert(", "document.cookie"];

    function xssFindThreats(input) {
        const threats = [];
        for (const pattern of DANGEROUS_PATTERNS) {
            let idx = input.toLowerCase().indexOf(pattern.toLowerCase());
            while (idx !== -1) {
                const lower = pattern.toLowerCase();
                let severity = "MEDIUM";
                if (lower === "<script>" || lower === "eval(") severity = "CRITICAL";
                else if (["javascript:", "onerror=", "onload=", "onclick=", "document.cookie"].includes(lower)) severity = "HIGH";
                threats.push({ pattern, location: idx, severity });
                idx = input.toLowerCase().indexOf(pattern.toLowerCase(), idx + 1);
            }
        }
        return threats;
    }

    function xssSanitize(input) {
        return input.split("").map(ch => ENTITY_MAP[ch] || ch).join("");
    }

    // SQLI preventer (Problem-02 logic).

    function sqliSanitize(input) {
        let s = input.replace(/\\/g, "\\\\").replace(/'/g, "''");
        s = s.split("--").join("").split(";").join("");
        return s;
    }

    // Validator (Problem-03 logic).

    function validateValue(value, schema) {

        if (typeof schema !== "object" || schema === null) return { valid: false, value, errors: ["Invalid schema"] };

        const errors = [];

        const isNullish = value === null || value === undefined;

        if (schema.required && isNullish) {
            return { valid: false, value, errors: ["Value is required"] };
        }

        if (isNullish) {
            return vc.allowNull ? { valid: true, value, errors: [] } : { valid: false, value, errors: ["Value must not be null"] };
        }

        const type = schema.type || "string";

        if (!vc.strictTypes) {
            if (type === "number" && typeof value === "string") {
                const n = Number(value);
                if (!isNaN(n) && value.trim() !== "") value = n;
            }
            if (type === "boolean" && typeof value === "string") {
                if (value === "true" || value === "1") value = true;
                else if (value === "false" || value === "0") value = false;
            }
        }

        if (type === "email") {
            const at = value.indexOf("@");
            const dot = value.indexOf(".", at + 1);
            if (!(typeof value === "string" && at > 0 && dot > at + 1)) errors.push("Invalid email format");
        } else if (type === "url") {
            if (typeof value !== "string" || (!value.startsWith("http://") && !value.startsWith("https://"))) {
                errors.push("Invalid URL format");
            }
        } else if (type === "date") {
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) errors.push("Invalid date format");
        }

        if (errors.length === 0) {
            if (schema.min !== null && schema.min !== undefined) {
                if (type === "number" && value < schema.min) errors.push("Value must be at least " + schema.min);
                else if (type === "string" && value.length < schema.min) errors.push("Must be at least " + schema.min + " characters");
            }
            if (schema.max !== null && schema.max !== undefined) {
                if (type === "number" && value > schema.max) errors.push("Value must be at most " + schema.max);
                else if (type === "string" && value.length > schema.max) errors.push("Must be at most " + schema.max + " characters");
            }
            if (schema.enum && Array.isArray(schema.enum) && !schema.enum.includes(value)) {
                errors.push("Value not in allowed set");
            }
        }

        return { valid: errors.length === 0, value, errors };
    }

    // Threat engine (Problem-04 logic).

    const DETECTORS = {
        XSS: { severity: "MEDIUM", patterns: ["<script>", "javascript:", "onerror=", "alert(", "eval("] },
        SQLI: { severity: "HIGH", patterns: ["' OR", "UNION SELECT", "DROP TABLE", "--", "; SELECT"] },
        PATH_TRAVERSAL: { severity: "HIGH", patterns: ["../", "..\\", "%2e%2e", "/etc/passwd", "C:\\Windows"] },
        COMMAND_INJECTION: { severity: "CRITICAL", patterns: ["; ls", "| cat", "&& rm", "`", "$(", "> /dev/null"] },
        LDAP_INJECTION: { severity: "MEDIUM", patterns: ["*)(uid=", ")(|(", "\\2a", "\\28", "\\29"] },
        XML_INJECTION: { severity: "LOW", patterns: ["<!ENTITY", "<!DOCTYPE", "]]>", "<![CDATA["] }
    };

    function threatScan(input) {
        const threats = [];
        for (const detector of tc.enabledDetectors) {
            const config = DETECTORS[detector];
            for (const pattern of config.patterns) {
                let idx = input.indexOf(pattern);
                while (idx !== -1) {
                    threats.push({ type: detector, pattern, severity: config.severity, location: idx });
                    idx = input.indexOf(pattern, idx + 1);
                }
            }
        }
        threats.sort((a, b) => a.location - b.location);
        return threats;
    }

    function collectThreatsFromData(data) {

        const allThreats = [];

        function walk(node) {
            if (typeof node === "string") {
                allThreats.push(...threatScan(node));
            } else if (Array.isArray(node)) {
                node.forEach(walk);
            } else if (typeof node === "object" && node !== null) {
                for (const k of Object.keys(node)) walk(node[k]);
            }
        }

        walk(data);

        return allThreats;
    }


    // --- STEP 3: PROCESS INPUT REQUESTS ---

    const requestLog = [];

    const summaryCounts = {
        totalRequests: securityConfig.inputRequests.length,
        blocked: 0,
        sanitized: 0,
        validationPassed: 0,
        validationFailed: 0,
        threatBreakdown: {}
    };

    for (const req of securityConfig.inputRequests) {

        const { requestId, source, data, schema, sanitizationMode } = req;

        // 1. Threat detection.

        const threats = collectThreatsFromData(data);

        for (const t of threats) {
            if (!summaryCounts.threatBreakdown[t.type]) summaryCounts.threatBreakdown[t.type] = 0;
            summaryCounts.threatBreakdown[t.type]++;
        }

        const blocked = tc.blockOnThreat && threats.length > 0;

        if (blocked) {
            summaryCounts.blocked++;
            requestLog.push({
                requestId,
                source,
                blocked: true,
                threatCount: threats.length,
                sanitized: null,
                validationResult: null
            });
            continue;
        }

        // 2. Sanitization.

        let sanitizedData = { ...data };

        for (const field of Object.keys(sanitizedData)) {

            const value = sanitizedData[field];

            if (typeof value !== "string") continue;

            let processed = value;

            if (sanitizationMode === "XSS_ONLY" || sanitizationMode === "FULL") {
                processed = xssSanitize(processed);
            }

            if (sanitizationMode === "SQLI_ONLY" || sanitizationMode === "FULL") {
                processed = sqliSanitize(processed);
            }

            processed = processed.trim();

            if (processed.length > vc.maxStringLength) {
                processed = processed.slice(0, vc.maxStringLength);
            }

            sanitizedData[field] = processed;
        }

        summaryCounts.sanitized++;

        // 3. Validation.

        const results = [];
        let invalidCount = 0;

        for (const field of Object.keys(schema)) {

            const value = sanitizedData[field];
            const result = validateValue(value, schema[field]);

            results.push({ field, valid: result.valid, errors: result.errors });

            if (!result.valid) invalidCount++;
        }

        const validationResult = {
            allValid: invalidCount === 0,
            invalidCount,
            results
        };

        if (validationResult.allValid) summaryCounts.validationPassed++;
        else summaryCounts.validationFailed++;

        requestLog.push({
            requestId,
            source,
            blocked: false,
            threatCount: threats.length,
            sanitized: sanitizedData,
            validationResult
        });
    }

    // --- STEP 4: BUILD RESULT ---

    return {
        orchestratorId,
        requestLog,
        summary: summaryCounts
    };
}


// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(runInputSecurityOrchestrator({
    orchestratorId: "INPUT-SEC-01",
    xssConfig: { allowedTags: [], allowedAttributes: {}, mode: "ESCAPE" },
    sqliConfig: { strictMode: false, allowedKeywords: [] },
    validatorConfig: { strictTypes: false, maxStringLength: 255, allowNull: false, customRules: [] },
    threatConfig: { enabledDetectors: ["XSS", "SQLI"], blockOnThreat: true, logThreats: true },
    inputRequests: [
        {
            requestId: "REQ-1",
            source: "WEB_FORM",
            data: { name: "Rahim", email: "rahim@mail.com", age: "25" },
            schema: {
                name: { type: "string", required: true, min: 2, max: 50, pattern: null, enum: null, customRule: null },
                email: { type: "email", required: true, min: null, max: null, pattern: null, enum: null, customRule: null },
                age: { type: "number", required: true, min: 18, max: 120, pattern: null, enum: null, customRule: null }
            },
            sanitizationMode: "FULL"
        },
        {
            requestId: "REQ-2",
            source: "API",
            data: { username: "<script>alert(1)</script>", query: "' OR 1=1 --" },
            schema: {
                username: { type: "string", required: true, min: 3, max: 30, pattern: null, enum: null, customRule: null },
                query: { type: "string", required: true, min: 1, max: 100, pattern: null, enum: null, customRule: null }
            },
            sanitizationMode: "FULL"
        }
    ]
}), null, 2));


// --- INVALID ---
console.log(runInputSecurityOrchestrator({ orchestratorId: "", xssConfig: null, sqliConfig: null, validatorConfig: null, threatConfig: null, inputRequests: [] }));