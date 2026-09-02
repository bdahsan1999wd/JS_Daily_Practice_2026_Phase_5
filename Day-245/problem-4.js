// 🧩 PROBLEM–04: createBreachDetectionEngine()

// Logic: Breach detection via password/hash lists + HIBP-style prefix check.
//   checkPassword() — case-insensitive exact match
//   checkHash() — hibpSimulation prefix match (first 5 chars) or exact
//   checkPasswordStrength() — combined check via hasher
//   getBatchBreachReport() / getBreachStats()

function createBreachDetectionEngine(breachConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof breachConfig !== "object" ||
        breachConfig === null ||
        Array.isArray(breachConfig) ||
        !Array.isArray(breachConfig.knownBreachedPasswords) ||
        !Array.isArray(breachConfig.knownBreachedHashes) ||
        typeof breachConfig.hibpSimulation !== "boolean"
    ) {
        return "Invalid Input";
    }

    const knownBreachedPasswords = breachConfig.knownBreachedPasswords;
    const knownBreachedHashes = breachConfig.knownBreachedHashes;
    const hibpSimulation = breachConfig.hibpSimulation;

    // --- STEP 2: HELPERS ---
    function passwordInList(password) {
        const lower = password.toLowerCase();
        return knownBreachedPasswords.some(p => p.toLowerCase() === lower);
    }

    // --- STEP 3: PUBLIC API ---
    return {

        checkPassword(password) {

            if (typeof password !== "string" || password.length === 0) return "Invalid Input";

            const breached = passwordInList(password);

            return {
                breached,
                password: "***",
                matchType: breached ? "EXACT" : "NONE",
                riskLevel: breached ? "CRITICAL" : "SAFE"
            };
        },

        checkHash(hashValue) {

            if (typeof hashValue !== "string" || hashValue.length === 0) return "Invalid Input";

            if (hibpSimulation) {

                const prefix = hashValue.slice(0, 5);

                const matchCount = knownBreachedHashes.filter(h => h.startsWith(prefix)).length;

                return {
                    breached: matchCount > 0,
                    prefix,
                    matchCount,
                    matchType: matchCount > 0 ? "PREFIX" : "NONE",
                    riskLevel: matchCount > 0 ? "CRITICAL" : "SAFE"
                };
            }

            // Exact hash comparison.

            const breached = knownBreachedHashes.includes(hashValue);

            return {
                breached,
                matchType: breached ? "EXACT" : "NONE",
                riskLevel: breached ? "CRITICAL" : "SAFE"
            };
        },

        checkPasswordStrength(password, hasher) {

            if (typeof password !== "string" || password.length === 0) return "Invalid Input";

            if (hasher === null || hasher === undefined || typeof hasher.hash !== "function") {
                return "Invalid Input";
            }

            const passwordBreached = passwordInList(password);

            const hashResult = hasher.hash(password);
            const hashValue = hashResult.hash;

            let hashBreached = false;

            if (hibpSimulation) {
                const prefix = hashValue.slice(0, 5);
                hashBreached = knownBreachedHashes.some(h => h.startsWith(prefix));
            } else {
                hashBreached = knownBreachedHashes.includes(hashValue);
            }

            let combinedRisk;
            let recommendation;

            if (passwordBreached || hashBreached) {
                combinedRisk = "CRITICAL";
                recommendation = "Password or its hash is in a known breach database. Choose a new unique password.";
            } else if (password.length < 8) {
                combinedRisk = "HIGH";
                recommendation = "Password is short. Use at least 12 characters with mixed character types.";
            } else {
                combinedRisk = "LOW";
                recommendation = "Password is not breached and meets minimum length requirements.";
            }

            return { breached: passwordBreached, hashBreached, combinedRisk, recommendation };
        },

        getBatchBreachReport(passwords) {

            if (!Array.isArray(passwords)) return "Invalid Input";

            const results = passwords.map((pw, index) => {
                const breached = typeof pw === "string" && passwordInList(pw);
                return {
                    index,
                    breached,
                    riskLevel: breached ? "CRITICAL" : "SAFE"
                };
            });

            const breachedCount = results.filter(r => r.breached).length;

            return {
                total: passwords.length,
                breachedCount,
                safeCount: passwords.length - breachedCount,
                results
            };
        },

        getBreachStats() {
            return {
                totalKnownPasswords: knownBreachedPasswords.length,
                totalKnownHashes: knownBreachedHashes.length,
                lastUpdated: "2025-01-01T00:00:00Z"
            };
        }
    };
}


// ------ EXAMPLE USAGE ------

const bde = createBreachDetectionEngine({
    knownBreachedPasswords: ["password", "123456", "qwerty", "admin", "letmein"],
    knownBreachedHashes: ["5baa61e4c9b93f3f0682250b6cf8331b", "7c4a8d09ca3762af61e59520943dc264"],
    hibpSimulation: true
});


console.log(bde.checkPassword("password"));

console.log(bde.checkPassword("MySecureP@ss123"));

console.log(bde.checkHash("5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8"));

console.log(bde.getBatchBreachReport(["password", "securePa$$1", "123456", "MyStr0ng!"]));

console.log(bde.getBreachStats());


// --- INVALID ---
console.log(createBreachDetectionEngine({ knownBreachedPasswords: "password", knownBreachedHashes: [], hibpSimulation: "yes" }));