// 🧩 PROBLEM–01: createOriginValidator()

// Logic: Origin allow-listing with exact + wildcard patterns.
//   "*" in host segment → [^.]+ ; "*" as port → any digits.
//   getEffectiveOrigin() — echo origin when credentials used, "*" only if allowAllOrigins.


function createOriginValidator(validatorConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof validatorConfig !== "object" ||
        validatorConfig === null ||
        Array.isArray(validatorConfig) ||
        !Array.isArray(validatorConfig.allowedOrigins) ||
        !Array.isArray(validatorConfig.allowedPatterns) ||
        typeof validatorConfig.allowCredentials !== "boolean" ||
        typeof validatorConfig.allowAllOrigins !== "boolean"
    ) {
        return "Invalid Input";
    }

    let allowedOrigins = [...validatorConfig.allowedOrigins];
    let allowedPatterns = [...validatorConfig.allowedPatterns];
    const allowCredentials = validatorConfig.allowCredentials;
    let allowAllOrigins = validatorConfig.allowAllOrigins;

    // --- STEP 2: HELPERS ---
    function patternToRegex(pattern) {

        const escaped = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, (ch) => {
                if (ch === "*") return ch;
                return "\\" + ch;
            })
            .replace(/\*/g, "[^.]+");

        return new RegExp("^" + escaped + "$");
    }

    function matchPattern(origin, pattern) {

        try {
            const re = patternToRegex(pattern);
            return re.test(origin);
        } catch (e) {
            return false;
        }
    }

    function validateOrigin(origin) {

        if (typeof origin !== "string" || origin.length === 0) {
            return { allowed: false, origin, matchType: "NONE", matchedRule: null };
        }

        if (allowAllOrigins && !allowCredentials) {
            return { allowed: true, origin, matchType: "WILDCARD_ALL", matchedRule: "*" };
        }

        if (allowedOrigins.includes(origin)) {
            return { allowed: true, origin, matchType: "EXACT", matchedRule: origin };
        }

        for (const pattern of allowedPatterns) {
            if (matchPattern(origin, pattern)) {
                return { allowed: true, origin, matchType: "PATTERN", matchedRule: pattern };
            }
        }

        return { allowed: false, origin, matchType: "NONE", matchedRule: null };
    }

    // --- STEP 3: PUBLIC API ---
    return {

        validate(origin) {

            if (typeof origin !== "string" || origin.length === 0) return "Invalid Input";

            return validateOrigin(origin);
        },

        matchPattern(origin, pattern) {

            if (typeof origin !== "string" || origin.length === 0 || typeof pattern !== "string" || pattern.length === 0) {
                return "Invalid Input";
            }

            return { matches: matchPattern(origin, pattern), pattern, origin };
        },

        getEffectiveOrigin(origin) {

            if (typeof origin !== "string" || origin.length === 0) return "Invalid Input";

            const result = validateOrigin(origin);

            if (!result.allowed) {
                return { effectiveOrigin: null, varyHeader: false };
            }

            if (allowAllOrigins && !allowCredentials) {
                return { effectiveOrigin: "*", varyHeader: false };
            }

            return { effectiveOrigin: origin, varyHeader: true };
        },

        listAllowedOrigins() {
            return {
                exact: [...allowedOrigins],
                patterns: [...allowedPatterns],
                allowAllOrigins,
                allowCredentials
            };
        },

        addOrigin(origin) {

            if (typeof origin !== "string" || origin.length === 0) return "Invalid Input";

            if (allowedOrigins.includes(origin)) {
                return { added: false, reason: "Already exists" };
            }

            allowedOrigins.push(origin);

            return { added: true, origin };
        },

        removeOrigin(origin) {

            if (typeof origin !== "string" || origin.length === 0) return "Invalid Input";

            const idx = allowedOrigins.indexOf(origin);

            if (idx === -1) return { error: "Origin not found" };

            allowedOrigins.splice(idx, 1);

            return { removed: true, origin };
        }
    };
}


// ------ EXAMPLE USAGE ------
const ov = createOriginValidator({
    allowedOrigins: ["https://myapp.com", "https://admin.myapp.com"],
    allowedPatterns: ["https://*.staging.myapp.com", "http://localhost:*"],
    allowCredentials: true,
    allowAllOrigins: false
});


console.log(ov.validate("https://myapp.com"));

console.log(ov.validate("https://feature.staging.myapp.com"));

console.log(ov.validate("http://localhost:3000"));

console.log(ov.validate("https://evil.com"));

console.log(ov.getEffectiveOrigin("https://myapp.com"));

console.log(ov.matchPattern("https://feature.staging.myapp.com", "https://*.staging.myapp.com"));


// --- INVALID ---
console.log(createOriginValidator({ allowedOrigins: [], allowedPatterns: [], allowCredentials: "yes", allowAllOrigins: false }));