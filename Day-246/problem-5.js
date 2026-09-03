// 🧩 PROBLEM–05: runAPIKeyLifecycleOrchestrator()

// Logic: End-to-end API key lifecycle.
//   1. Setup inline generator (P1), store (P2), scope manager (P3), usage tracker (P4)
//   2. Process keyOperations (CREATE / VALIDATE / USE / REVOKE / ROTATE)
//   3. Build summary counts


function runAPIKeyLifecycleOrchestrator(lifecycleConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof lifecycleConfig !== "object" ||
        lifecycleConfig === null ||
        Array.isArray(lifecycleConfig) ||
        typeof lifecycleConfig.orchestratorId !== "string" ||
        lifecycleConfig.orchestratorId.length === 0 ||
        typeof lifecycleConfig.generatorConfig !== "object" || lifecycleConfig.generatorConfig === null ||
        typeof lifecycleConfig.storeConfig !== "object" || lifecycleConfig.storeConfig === null ||
        typeof lifecycleConfig.scopeConfig !== "object" || lifecycleConfig.scopeConfig === null ||
        typeof lifecycleConfig.trackerConfig !== "object" || lifecycleConfig.trackerConfig === null ||
        !Array.isArray(lifecycleConfig.keyOperations)
    ) {
        return "Invalid Input";
    }

    const orchestratorId = lifecycleConfig.orchestratorId;

    const gc = lifecycleConfig.generatorConfig;
    const sc = lifecycleConfig.storeConfig;
    const spc = lifecycleConfig.scopeConfig;
    const tc = lifecycleConfig.trackerConfig;

    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    if (
        typeof gc.prefix !== "string" || gc.prefix.length === 0 ||
        typeof gc.keyLength !== "number" || !Number.isInteger(gc.keyLength) ||
        gc.keyLength < 16 || gc.keyLength > 64 ||
        !["live", "test"].includes(gc.environment) ||
        typeof sc.defaultExpiryMs !== "number" || sc.defaultExpiryMs <= 0 ||
        typeof sc.maxKeysPerOwner !== "number" || sc.maxKeysPerOwner < 1 ||
        typeof spc.availableScopes !== "object" || spc.availableScopes === null || !Array.isArray(spc.availableScopes) ||
        typeof spc.scopeHierarchy !== "object" || spc.scopeHierarchy === null ||
        typeof tc.rateLimits !== "object" || tc.rateLimits === null ||
        typeof tc.trackingWindowMs !== "number" || tc.trackingWindowMs <= 0
    ) {
        return "Invalid Input";
    }


    // --- STEP 2: SETUP inline components (self-contained) ---


    // Generator (Problem-01 logic).

    let keyAutoSeed = 0;
    let keyAutoIndex = 0;

    function generateKey(ownerId) {
        keyAutoSeed++;
        let part = "";
        for (let i = 0; i < gc.keyLength; i++) {
            const charIndex = (keyAutoSeed * 7 + i * 13) % CHARSET.length;
            part += CHARSET[charIndex];
        }
        keyAutoIndex++;
        const key = gc.prefix + "_" + gc.environment + "_" + part;
        return { key, keyId: "KEY-" + keyAutoIndex };
    }


    // Store (Problem-02 logic).

    const storeKeys = [];

    function storeKey(key, keyId, ownerId, scopes, expiresAt) {
        if (storeKeys.filter(k => k.ownerId === ownerId && k.status === "ACTIVE").length >= sc.maxKeysPerOwner) {
            return { stored: false, reason: "Max keys reached for owner" };
        }
        const record = {
            key,
            keyId,
            ownerId,
            scopes: Array.isArray(scopes) ? scopes : [],
            expiresAt: expiresAt !== null && expiresAt !== undefined ? expiresAt : 1000000 + sc.defaultExpiryMs,
            status: "ACTIVE",
            revokedReason: null,
            createdAt: "2025-01-01T00:00:00Z",
            lastUsedAt: null,
            usageCount: 0
        };
        storeKeys.push(record);
        return { stored: true, keyId, expiresAt: record.expiresAt };
    }

    function findStoredKey(keyId) {
        return storeKeys.find(k => k.keyId === keyId);
    }

    function validateKey(keyId, currentTimeMs) {
        const entry = findStoredKey(keyId);
        if (!entry) return { valid: false, reason: "KEY_NOT_FOUND" };
        if (entry.status === "REVOKED") return { valid: false, reason: "KEY_REVOKED", revokedReason: entry.revokedReason };
        if (entry.expiresAt !== null && currentTimeMs > entry.expiresAt) {
            entry.status = "EXPIRED";
            return { valid: false, reason: "KEY_EXPIRED" };
        }
        entry.lastUsedAt = currentTimeMs;
        entry.usageCount++;
        return { valid: true, keyId, ownerId: entry.ownerId, scopes: entry.scopes, key: entry.key };
    }

    function revokeKey(keyId, reason) {
        const entry = findStoredKey(keyId);
        if (!entry) return { revoked: false };
        entry.status = "REVOKED";
        entry.revokedReason = reason || null;
        return { revoked: true, keyId };
    }


    // Scope manager (Problem-03 logic).

    const scopeMap = {};

    for (const entry of spc.availableScopes) {
        if (entry && typeof entry.scope === "string") {
            scopeMap[entry.scope] = entry;
        }
    }

    function expandScopes(scopes) {
        const result = [];
        for (const scope of scopes) {
            if (!result.includes(scope)) result.push(scope);
            const children = spc.scopeHierarchy[scope];
            if (Array.isArray(children)) {
                for (const child of children) {
                    if (!result.includes(child)) result.push(child);
                }
            }
        }
        return result;
    }

    function validateScopes(scopes) {
        if (!Array.isArray(scopes)) return { valid: false, invalidScopes: [] };
        const invalidScopes = [];
        for (const scope of scopes) {
            if (!scopeMap.hasOwnProperty(scope)) invalidScopes.push(scope);
        }
        return { valid: invalidScopes.length === 0, invalidScopes };
    }

    function hasScope(keyScopes, requiredScope) {
        return expandScopes(keyScopes).includes(requiredScope);
    }


    // Usage tracker (Problem-04 logic).

    const usage = {};

    function countRequests(keyId, windowMs, currentTimeMs) {
        const record = usage[keyId];
        if (!record) return 0;
        const cutoff = currentTimeMs - windowMs;
        return record.requestLog.filter(req => req.timestamp > cutoff).length;
    }

    function getLimit(scope) {
        if (tc.rateLimits.hasOwnProperty(scope)) return tc.rateLimits[scope];
        if (tc.rateLimits.hasOwnProperty("default")) return tc.rateLimits["default"];
        return { requestsPerMinute: Infinity, requestsPerDay: Infinity };
    }

    function checkRateLimit(keyId, scope, currentTimeMs) {
        const limit = getLimit(scope);
        const minuteCount = countRequests(keyId, 60000, currentTimeMs);
        const dailyCount = countRequests(keyId, 86400000, currentTimeMs);

        if (minuteCount >= limit.requestsPerMinute) {
            const record = usage[keyId];
            const oldest = record.requestLog
                .filter(req => req.timestamp > currentTimeMs - 60000)
                .map(req => req.timestamp)
                .sort((a, b) => a - b)[0];
            const retryAfterMs = Math.max(0, oldest + 60000 - currentTimeMs);
            return { allowed: false, reason: "RATE_LIMIT_MINUTE", retryAfterMs };
        }

        if (dailyCount >= limit.requestsPerDay) {
            return { allowed: false, reason: "RATE_LIMIT_DAY" };
        }

        return { allowed: true, minuteCount, dailyCount };
    }

    function recordUsage(keyId, scope, currentTimeMs) {
        if (!usage[keyId]) usage[keyId] = { totalRequests: 0, requestLog: [] };
        usage[keyId].totalRequests++;
        usage[keyId].requestLog.push({ scope, timestamp: currentTimeMs });
        return { recorded: true, keyId, scope, currentTimeMs };
    }

    function resetUsage(keyId) {
        if (!usage[keyId]) return { reset: false, keyId, previousTotal: 0 };
        const previousTotal = usage[keyId].totalRequests;
        usage[keyId].totalRequests = 0;
        usage[keyId].requestLog = [];
        return { reset: true, keyId, previousTotal };
    }


    // --- STEP 3: PROCESS KEY OPERATIONS ---
    const operationLog = [];

    // Map operationId -> keyId for keyRef resolution.

    const opKeyId = {};

    let keysCreated = 0;
    let keysRevoked = 0;
    let keysRotated = 0;
    let validationsPassed = 0;
    let validationsFailed = 0;
    let usageAllowed = 0;
    let usageBlocked = 0;

    for (const op of lifecycleConfig.keyOperations) {

        const { operationId, type, ownerId, keyRef, currentTimeMs } = op;

        let result;

        if (type === "CREATE") {

            const scopes = Array.isArray(op.scopes) ? op.scopes : [];

            const scopeResult = validateScopes(scopes);

            const { key, keyId } = generateKey(ownerId);

            const storeResult = storeKey(key, keyId, ownerId, scopes, null);

            opKeyId[operationId] = storeResult.stored ? keyId : null;

            if (storeResult.stored) keysCreated++;

            result = {
                keyId: storeResult.stored ? keyId : null,
                key,
                scopes,
                expiresAt: storeResult.expiresAt,
                scopeValid: scopeResult.valid,
                invalidScopes: scopeResult.invalidScopes
            };

        } else if (type === "VALIDATE") {

            const refKeyId = opKeyId[keyRef];

            if (!refKeyId) {
                validationsFailed++;
                result = { valid: false, ownerId, scopes: null, permitted: null, reason: "KEY_NOT_FOUND" };
            } else {

                const vResult = validateKey(refKeyId, currentTimeMs);

                if (vResult.valid) {

                    let permitted = null;

                    if (op.requiredScope) {
                        permitted = hasScope(vResult.scopes, op.requiredScope);
                    }

                    validationsPassed++;

                    result = { valid: true, ownerId, scopes: vResult.scopes, permitted };
                } else {
                    validationsFailed++;
                    result = { valid: false, ownerId, scopes: null, permitted: null, reason: vResult.reason };
                }
            }

        } else if (type === "USE") {

            const refKeyId = opKeyId[keyRef];

            if (!refKeyId) {
                usageBlocked++;
                result = { allowed: false, reason: "KEY_NOT_FOUND", usageRecorded: false };
            } else {

                const vResult = validateKey(refKeyId, currentTimeMs);

                if (!vResult.valid) {
                    usageBlocked++;
                    result = { allowed: false, reason: vResult.reason, usageRecorded: false };
                } else if (op.requiredScope && !hasScope(vResult.scopes, op.requiredScope)) {
                    usageBlocked++;
                    result = { allowed: false, reason: "SCOPE_NOT_GRANTED", usageRecorded: false };
                } else {

                    const rlResult = checkRateLimit(refKeyId, op.requiredScope || "default", currentTimeMs);

                    if (!rlResult.allowed) {
                        usageBlocked++;
                        result = { allowed: false, reason: rlResult.reason, usageRecorded: false };
                    } else {
                        recordUsage(refKeyId, op.requiredScope || "default", currentTimeMs);
                        usageAllowed++;
                        result = { allowed: true, reason: null, usageRecorded: true };
                    }
                }
            }

        } else if (type === "REVOKE") {

            const refKeyId = opKeyId[keyRef];

            if (refKeyId) {
                const revokeResult = revokeKey(refKeyId, op.metadata && op.metadata.reason ? op.metadata.reason : "Revoked by owner");
                keysRevoked++;
                resetUsage(refKeyId);
                result = { revoked: revokeResult.revoked, keyId: refKeyId };
            } else {
                result = { revoked: false, keyId: null };
            }

        } else if (type === "ROTATE") {

            const refKeyId = opKeyId[keyRef];

            const scopes = Array.isArray(op.scopes) ? op.scopes : [];

            let newKeyId = null;
            let newKey = null;

            if (refKeyId) {
                revokeKey(refKeyId, "Rotated");
                resetUsage(refKeyId);
                keysRevoked++;
            }

            const generated = generateKey(ownerId);
            const storeResult = storeKey(generated.key, generated.keyId, ownerId, scopes, null);

            if (storeResult.stored) {
                newKeyId = generated.keyId;
                newKey = generated.key;
                opKeyId[operationId] = newKeyId;
                keysRotated++;
            }

            result = {
                oldKeyId: refKeyId,
                newKeyId,
                newKey,
                rotatedAt: "2025-01-01T00:00:00Z"
            };

        } else {
            result = { error: "UNKNOWN_OPERATION_TYPE" };
        }

        operationLog.push({ operationId, type, ownerId, result });
    }


    // --- STEP 4: BUILD SUMMARY ---
    return {
        orchestratorId,
        operationLog,
        summary: {
            totalOperations: operationLog.length,
            keysCreated,
            keysRevoked,
            keysRotated,
            validationsPassed,
            validationsFailed,
            usageAllowed,
            usageBlocked
        }
    };
}



// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(runAPIKeyLifecycleOrchestrator({
    orchestratorId: "KEY-ORCH-01",
    generatorConfig: { prefix: "sk", keyLength: 24, environment: "live" },
    storeConfig: { defaultExpiryMs: 2592000000, maxKeysPerOwner: 5 },
    scopeConfig: {
        availableScopes: [
            { scope: "read:data", description: "Read data", riskLevel: "LOW" },
            { scope: "write:data", description: "Write data", riskLevel: "MEDIUM" }
        ],
        scopeHierarchy: {}
    },
    trackerConfig: {
        rateLimits: { "default": { requestsPerMinute: 2, requestsPerDay: 100 } },
        trackingWindowMs: 60000
    },
    keyOperations: [
        { operationId: "OP-1", type: "CREATE", ownerId: "U1", keyRef: null, scopes: ["read:data", "write:data"], metadata: { name: "Main Key" }, currentTimeMs: 1000000, requiredScope: null },
        { operationId: "OP-2", type: "USE", ownerId: "U1", keyRef: "OP-1", scopes: null, metadata: null, currentTimeMs: 1001000, requiredScope: "read:data" },
        { operationId: "OP-3", type: "USE", ownerId: "U1", keyRef: "OP-1", scopes: null, metadata: null, currentTimeMs: 1002000, requiredScope: "read:data" },
        { operationId: "OP-4", type: "USE", ownerId: "U1", keyRef: "OP-1", scopes: null, metadata: null, currentTimeMs: 1003000, requiredScope: "read:data" },
        { operationId: "OP-5", type: "ROTATE", ownerId: "U1", keyRef: "OP-1", scopes: ["read:data", "write:data"], metadata: null, currentTimeMs: 1004000, requiredScope: null }
    ]
}), null, 2));


// --- INVALID ---
console.log(runAPIKeyLifecycleOrchestrator({ orchestratorId: "", generatorConfig: null, storeConfig: null, scopeConfig: null, trackerConfig: null, keyOperations: [] }));