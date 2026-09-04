// 🧩 PROBLEM–02: createSQLInjectionPreventer()

// Logic: SQL injection prevention.
//   sanitize() — escape quotes/backslashes, strip comments and terminators
//   detectInjection() — scan patterns with severity + risk score
//   buildParameterizedQuery() — safe ? substitution
//   validateQueryInput() — per-field risk checks


function createSQLInjectionPreventer(preventerConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof preventerConfig !== "object" ||
        preventerConfig === null ||
        Array.isArray(preventerConfig) ||
        typeof preventerConfig.strictMode !== "boolean" ||
        !Array.isArray(preventerConfig.allowedKeywords)
    ) {
        return "Invalid Input";
    }

    const strictMode = preventerConfig.strictMode;
    const allowedKeywords = preventerConfig.allowedKeywords;

    // --- STEP 2: PATTERN TABLE ---
    const PATTERNS = [
        { pattern: "DROP TABLE", severity: "CRITICAL" },
        { pattern: "TRUNCATE", severity: "CRITICAL" },
        { pattern: "xp_cmdshell", severity: "CRITICAL" },
        { pattern: "EXEC(", severity: "CRITICAL" },
        { pattern: "EXECUTE(", severity: "CRITICAL" },
        { pattern: "UNION SELECT", severity: "HIGH" },
        { pattern: "INSERT INTO", severity: "HIGH" },
        { pattern: "DELETE FROM", severity: "HIGH" },
        { pattern: "OR '1'='1", severity: "MEDIUM" },
        { pattern: "WAITFOR DELAY", severity: "MEDIUM" },
        { pattern: "--", severity: "MEDIUM" },
        { pattern: "0x", severity: "LOW" }
    ];

    const SEVERITY_WEIGHT = { CRITICAL: 40, HIGH: 20, MEDIUM: 10, LOW: 5 };

    // --- STEP 3: HELPERS ---
    function detectPatterns(input) {

        const upper = input.toUpperCase();
        const found = [];

        for (const entry of PATTERNS) {

            let idx = upper.indexOf(entry.pattern.toUpperCase());

            while (idx !== -1) {
                found.push({ pattern: entry.pattern, severity: entry.severity, location: idx });
                idx = upper.indexOf(entry.pattern.toUpperCase(), idx + 1);
            }
        }

        // "OR '1'='1" style and "; KEYWORD" general checks.

        const orPattern = /'?\s*OR\s*'\s*1\s*'\s*=\s*'/i;

        const orMatch = orPattern.exec(input);

        if (orMatch) {
            found.push({ pattern: "OR '1'='1", severity: "MEDIUM", location: orMatch.index });
        }

        const semiKeyword = /;\s*([A-Za-z]+)/g;

        let m;

        while ((m = semiKeyword.exec(input)) !== null) {
            found.push({ pattern: "; " + m[1], severity: "MEDIUM", location: m.index });
        }

        return found;
    }

    // --- STEP 4: PUBLIC API ---
    return {

        sanitize(input) {

            if (typeof input !== "string") return "Invalid Input";

            let sanitized = input;
            const removedPatterns = [];

            let escapedChars = 0;

            // Escape backslashes first, then quotes.

            const quoteCount = (sanitized.match(/'/g) || []).length;
            const backslashCount = (sanitized.match(/\\/g) || []).length;

            escapedChars = quoteCount + backslashCount;

            sanitized = sanitized.replace(/\\/g, "\\\\").replace(/'/g, "''");

            if (sanitized.includes("--")) {
                removedPatterns.push("--");
                sanitized = sanitized.split("--").join("");
            }

            if (sanitized.includes(";")) {
                removedPatterns.push(";");
                sanitized = sanitized.split(";").join("");
            }

            return {
                original: input,
                sanitized,
                escapedChars,
                removedPatterns
            };
        },

        detectInjection(input) {

            if (typeof input !== "string") return "Invalid Input";

            let patterns = detectPatterns(input);

            if (strictMode) {

                // Reject ANY SQL keyword beyond allowed set.

                const keywords = [
                    "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE",
                    "UNION", "WHERE", "FROM", "JOIN", "CREATE", "ALTER", "TABLE",
                    "OR", "AND", "EXEC", "EXECUTE", "HAVING", "GROUP", "ORDER"
                ];

                for (const kw of keywords) {

                    if (allowedKeywords.includes(kw)) continue;

                    const re = new RegExp("\\b" + kw + "\\b", "gi");

                    let m;

                    while ((m = re.exec(input)) !== null) {
                        const exists = patterns.some(p => p.pattern === kw);
                        if (!exists) {
                            patterns.push({ pattern: kw, severity: "LOW", location: m.index });
                        }
                    }
                }
            }

            const riskScore = Math.min(100, patterns.reduce((sum, p) => sum + SEVERITY_WEIGHT[p.severity], 0));

            return { hasInjection: patterns.length > 0, patterns, riskScore };
        },

        buildParameterizedQuery(template, params) {

            if (typeof template !== "string" || !Array.isArray(params)) return "Invalid Input";

            const sanitizedParams = params.map(p => {
                if (typeof p !== "string") return String(p);
                let s = p.replace(/\\/g, "\\\\").replace(/'/g, "''");
                s = s.split("--").join("");
                return s;
            });

            let query = template;
            let paramIndex = 0;

            query = query.replace(/\?/g, () => {
                const value = sanitizedParams[paramIndex];
                paramIndex++;
                return "'" + value + "'";
            });

            return {
                query,
                paramCount: params.length,
                sanitizedParams
            };
        },

        validateQueryInput(inputs) {

            if (typeof inputs !== "object" || inputs === null || Array.isArray(inputs)) {
                return "Invalid Input";
            }

            const fieldResults = {};
            let overallRisk = "LOW";

            for (const field of Object.keys(inputs)) {

                const value = inputs[field];

                if (typeof value !== "string") {
                    fieldResults[field] = { safe: true, riskScore: 0 };
                    continue;
                }

                const detection = this.detectInjection(value);

                fieldResults[field] = {
                    safe: !detection.hasInjection,
                    riskScore: detection.riskScore
                };

                if (detection.hasInjection) {
                    const risk = detection.patterns.reduce((max, p) => {
                        const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                        return Math.max(max, order[p.severity]);
                    }, 0);

                    const riskLabel = { 4: "CRITICAL", 3: "HIGH", 2: "MEDIUM", 1: "LOW" }[risk];

                    const currentOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
                    const newOrder = currentOrder[riskLabel];

                    if (newOrder > currentOrder[overallRisk]) {
                        overallRisk = riskLabel;
                    }
                }
            }

            const valid = Object.values(fieldResults).every(r => r.safe);

            return { valid, fieldResults, overallRisk };
        }
    };
}


// ------ EXAMPLE USAGE ------

const sqli = createSQLInjectionPreventer({ strictMode: false, allowedKeywords: [] });


console.log(sqli.detectInjection("' OR '1'='1' --"));

console.log(sqli.detectInjection("'; DROP TABLE users; --"));

console.log(sqli.sanitize("Robert'); DROP TABLE students; --"));

console.log(sqli.buildParameterizedQuery(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    ["admin' --", "pass123"]
));


// --- INVALID ---
console.log(createSQLInjectionPreventer({ strictMode: "yes", allowedKeywords: "SELECT" }));