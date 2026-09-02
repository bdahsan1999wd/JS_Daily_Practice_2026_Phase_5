// 🧩 PROBLEM–05: runPasswordSecurityOrchestrator()

// Logic: Full password-security workflow.
//   1. Setup inline salt gen (P1), hasher (P2), policy (P3), breach detection (P4)
//   2. Process passwordOperations (REGISTER / CHANGE_PASSWORD / VERIFY / AUDIT)
//   3. Track per-user stored hashes; build failure breakdown

function runPasswordSecurityOrchestrator(securityConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof securityConfig !== "object" ||
        securityConfig === null ||
        Array.isArray(securityConfig) ||
        typeof securityConfig.orchestratorId !== "string" ||
        securityConfig.orchestratorId.length === 0 ||
        typeof securityConfig.hasherConfig !== "object" || securityConfig.hasherConfig === null ||
        typeof securityConfig.policyConfig !== "object" || securityConfig.policyConfig === null ||
        typeof securityConfig.breachConfig !== "object" || securityConfig.breachConfig === null ||
        typeof securityConfig.saltConfig !== "object" || securityConfig.saltConfig === null ||
        !Array.isArray(securityConfig.passwordOperations)
    ) {
        return "Invalid Input";
    }

    const orchestratorId = securityConfig.orchestratorId;

    const hc = securityConfig.hasherConfig;
    const pc = securityConfig.policyConfig;
    const bc = securityConfig.breachConfig;
    const sc = securityConfig.saltConfig;

    if (
        !["bcrypt-sim", "argon2-sim", "pbkdf2-sim"].includes(hc.algorithm) ||
        typeof hc.costFactor !== "number" || !Number.isInteger(hc.costFactor) ||
        hc.costFactor < 4 || hc.costFactor > 14 ||
        typeof hc.saltLength !== "number" || !Number.isInteger(hc.saltLength) ||
        hc.saltLength < 8 || hc.saltLength > 32 ||
        typeof pc.minLength !== "number" || pc.minLength < 1 ||
        typeof pc.maxLength !== "number" || pc.maxLength < pc.minLength ||
        typeof pc.requireUppercase !== "boolean" ||
        typeof pc.requireLowercase !== "boolean" ||
        typeof pc.requireNumbers !== "boolean" ||
        typeof pc.requireSpecialChars !== "boolean" ||
        typeof pc.specialChars !== "string" ||
        !Array.isArray(pc.forbiddenPatterns) ||
        typeof pc.minUniqueChars !== "number" || pc.minUniqueChars < 1 ||
        !Array.isArray(bc.knownBreachedPasswords) ||
        !Array.isArray(bc.knownBreachedHashes) ||
        typeof bc.hibpSimulation !== "boolean" ||
        typeof sc.saltLength !== "number" || !Number.isInteger(sc.saltLength) ||
        sc.saltLength < 8 || sc.saltLength > 32 ||
        !["alphanumeric", "hex", "base64"].includes(sc.charset)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: SETUP inline components (self-contained) ---

    // Salt generator (Problem-01 logic, hex charset as used by hasher).

    const HEX_CHARSET = "0123456789abcdef";
    let saltAutoSeed = 0;

    function generateSalt() {
        saltAutoSeed++;
        let salt = "";
        for (let i = 0; i < hc.saltLength; i++) {
            const charIndex = (saltAutoSeed * 7 + i * 13) % HEX_CHARSET.length;
            salt += HEX_CHARSET[charIndex];
        }
        return salt;
    }

    // Hasher (Problem-02 logic).

    const ALGO_PREFIX = { "bcrypt-sim": "bc", "argon2-sim": "ar", "pbkdf2-sim": "pb" };
    const algoPrefix = ALGO_PREFIX[hc.algorithm];

    function computeHashValue(password, salt) {
        const combined = password + salt;
        const reversed = combined.split("").reverse().join("");
        let sum = 0;
        for (const ch of combined) sum += ch.charCodeAt(0);
        return algoPrefix + "_" + reversed + "_" + sum.toString(16) + "_" + hc.costFactor;
    }

    function buildHashString(password, salt) {
        return "$" + hc.algorithm + "$" + hc.costFactor + "$" + salt + "$" + computeHashValue(password, salt);
    }

    function parseHash(storedHash) {
        if (typeof storedHash !== "string") return null;
        const parts = storedHash.split("$");
        if (parts.length !== 5) return null;
        const [, alg, cost, salt, hashValue] = parts;
        if (!alg || !/^\d+$/.test(cost) || !salt || !hashValue) return null;
        return { algorithm: alg, costFactor: Number(cost), salt, hashValue };
    }

    // Policy (Problem-03 logic).

    function validatePassword(password) {
        const violations = [];
        const passedChecks = [];

        if (password.length >= pc.minLength) passedChecks.push("Length OK");
        else violations.push("Too short: minimum " + pc.minLength + " characters");

        if (password.length <= pc.maxLength) passedChecks.push("Max length OK");
        else violations.push("Too long: maximum " + pc.maxLength + " characters");

        if (pc.requireUppercase) {
            if (/[A-Z]/.test(password)) passedChecks.push("Has uppercase");
            else violations.push("Missing uppercase letter");
        }
        if (pc.requireLowercase) {
            if (/[a-z]/.test(password)) passedChecks.push("Has lowercase");
            else violations.push("Missing lowercase letter");
        }
        if (pc.requireNumbers) {
            if (/[0-9]/.test(password)) passedChecks.push("Has numbers");
            else violations.push("Missing number");
        }
        if (pc.requireSpecialChars) {
            if (password.split("").some(ch => pc.specialChars.includes(ch))) passedChecks.push("Has special chars");
            else violations.push("Missing special character");
        }

        let forbidden = null;
        for (const pattern of pc.forbiddenPatterns) {
            if (password.toLowerCase().includes(pattern.toLowerCase())) { forbidden = pattern; break; }
        }
        if (forbidden) violations.push("Contains forbidden pattern: " + forbidden);
        else passedChecks.push("No forbidden patterns");

        const uniqueCount = new Set(password.split("")).size;
        if (uniqueCount >= pc.minUniqueChars) passedChecks.push("Sufficient unique chars");
        else violations.push("Not enough unique characters: minimum " + pc.minUniqueChars);

        return { valid: violations.length === 0, violations, passedChecks };
    }

    // Breach detection (Problem-04 logic).

    function passwordBreached(password) {
        const lower = password.toLowerCase();
        return bc.knownBreachedPasswords.some(p => p.toLowerCase() === lower);
    }

    function checkBreach(password) {
        const breached = passwordBreached(password);
        return {
            breached,
            password: "***",
            matchType: breached ? "EXACT" : "NONE",
            riskLevel: breached ? "CRITICAL" : "SAFE"
        };
    }

    // --- STEP 3: PROCESS OPERATIONS ---

    const operationLog = [];
    const storedHashes = {};

    const failureBreakdown = {
        policyViolations: 0,
        breachDetected: 0,
        historyReused: 0,
        verificationFailed: 0
    };

    let successCount = 0;
    let failureCount = 0;

    for (const op of securityConfig.passwordOperations) {

        const { operationId, type, userId } = op;

        let result;

        if (type === "REGISTER") {

            const policyResult = validatePassword(op.password);
            const breachResult = checkBreach(op.password);

            if (!policyResult.valid || breachResult.breached) {

                if (!policyResult.valid) failureBreakdown.policyViolations++;
                if (breachResult.breached) failureBreakdown.breachDetected++;

                failureCount++;

                result = {
                    success: false,
                    userId,
                    hash: null,
                    policyResult,
                    breachResult
                };

            } else {

                const salt = generateSalt();
                const hash = buildHashString(op.password, salt);

                storedHashes[userId] = hash;
                successCount++;

                result = {
                    success: true,
                    userId,
                    hash,
                    policyResult,
                    breachResult
                };
            }

        } else if (type === "CHANGE_PASSWORD") {

            const policyResult = validatePassword(op.newPassword);
            const breachResult = checkBreach(op.newPassword);

            let historyResult = { isReused: false, matchedIndex: null, reason: null };

            const prevHashes = Array.isArray(op.previousHashes) ? op.previousHashes : [];

            for (let i = 0; i < prevHashes.length; i++) {
                const parsed = parseHash(prevHashes[i]);
                if (parsed && buildHashString(op.newPassword, parsed.salt) === prevHashes[i]) {
                    historyResult = { isReused: true, matchedIndex: i, reason: "PASSWORD_PREVIOUSLY_USED" };
                    break;
                }
            }

            if (!policyResult.valid || breachResult.breached || historyResult.isReused) {

                if (!policyResult.valid) failureBreakdown.policyViolations++;
                if (breachResult.breached) failureBreakdown.breachDetected++;
                if (historyResult.isReused) failureBreakdown.historyReused++;

                failureCount++;

                result = {
                    success: false,
                    userId,
                    newHash: null,
                    policyResult,
                    breachResult,
                    historyResult
                };

            } else {

                const salt = generateSalt();
                const newHash = buildHashString(op.newPassword, salt);

                storedHashes[userId] = newHash;
                successCount++;

                result = {
                    success: true,
                    userId,
                    newHash,
                    policyResult,
                    breachResult,
                    historyResult
                };
            }

        } else if (type === "VERIFY") {

            const storedHash = op.storedHash !== null && op.storedHash !== undefined
                ? op.storedHash
                : (storedHashes[userId] || null);

            if (!storedHash) {
                failureCount++;
                failureBreakdown.verificationFailed++;
                result = { success: false, userId, verified: false };
                continue;
            }

            const parsed = parseHash(storedHash);
            let verified = false;

            if (parsed) {
                verified = buildHashString(op.password, parsed.salt) === storedHash;
            }

            if (verified) {
                successCount++;
                result = { success: true, userId, verified: true };
            } else {
                failureCount++;
                failureBreakdown.verificationFailed++;
                result = { success: false, userId, verified: false };
            }

        } else if (type === "AUDIT") {

            const storedHash = op.storedHash !== null && op.storedHash !== undefined
                ? op.storedHash
                : (storedHashes[userId] || null);

            if (!storedHash) {
                failureCount++;
                result = { success: false, userId, hashInfo: null, needsRehash: false, recommendation: null };
                continue;
            }

            const parsed = parseHash(storedHash);

            if (!parsed) {
                failureCount++;
                result = { success: false, userId, hashInfo: { error: "Invalid hash format" }, needsRehash: false, recommendation: null };
                continue;
            }

            const hashInfo = {
                algorithm: parsed.algorithm,
                costFactor: parsed.costFactor,
                saltLength: parsed.salt.length,
                hashLength: parsed.hashValue.length
            };

            let needsRehash = false;
            let recommendation = null;

            if (parsed.algorithm !== hc.algorithm || parsed.costFactor < hc.costFactor) {
                needsRehash = true;
                recommendation = "Upgrade hash to current algorithm and cost factor " + hc.costFactor;
            }

            successCount++;

            result = { success: true, userId, hashInfo, needsRehash, recommendation };

        } else {
            failureCount++;
            result = { error: "UNKNOWN_OPERATION_TYPE" };
        }

        operationLog.push({ operationId, type, userId, result });
    }

    // --- STEP 4: BUILD SUMMARY ---

    return {
        orchestratorId,
        operationLog,
        summary: {
            totalOperations: operationLog.length,
            successCount,
            failureCount,
            failureBreakdown
        }
    };
}


// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(runPasswordSecurityOrchestrator({
    orchestratorId: "PWD-ORCH-01",
    hasherConfig: { algorithm: "bcrypt-sim", costFactor: 10, saltLength: 16 },
    policyConfig: {
        minLength: 8, maxLength: 128,
        requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true,
        specialChars: "!@#$%^&*", forbiddenPatterns: ["password", "123456"], minUniqueChars: 6
    },
    breachConfig: { knownBreachedPasswords: ["password", "123456"], knownBreachedHashes: [], hibpSimulation: false },
    saltConfig: { saltLength: 16, charset: "hex" },
    passwordOperations: [
        { operationId: "OP-1", type: "REGISTER", userId: "U1", password: "Secure@Pass123", newPassword: null, storedHash: null, previousHashes: null },
        { operationId: "OP-2", type: "REGISTER", userId: "U2", password: "password", newPassword: null, storedHash: null, previousHashes: null },
        { operationId: "OP-3", type: "VERIFY", userId: "U1", password: "Secure@Pass123", newPassword: null, storedHash: null, previousHashes: null },
        { operationId: "OP-4", type: "AUDIT", userId: "U1", password: null, newPassword: null, storedHash: null, previousHashes: null }
    ]
}), null, 2));


// --- INVALID ---
console.log(runPasswordSecurityOrchestrator({ orchestratorId: "", hasherConfig: null, policyConfig: null, breachConfig: null, saltConfig: null, passwordOperations: [] }));