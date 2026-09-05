// 🧩 PROBLEM–05: runCORSOrchestrator()

// Logic: Full CORS pipeline.
//   1. Build each policy from config (P3 builder logic inline)
//   2. Select active policy by environment
//   3. Validate origins (P1 logic inline)
//   4. Handle preflights (P2 logic inline)
//   5. Process all requests (P4 logic inline), build report


function runCORSOrchestrator(corsConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof corsConfig !== "object" ||
        corsConfig === null ||
        Array.isArray(corsConfig) ||
        typeof corsConfig.orchestratorId !== "string" ||
        corsConfig.orchestratorId.length === 0 ||
        !Array.isArray(corsConfig.policies) ||
        typeof corsConfig.activeEnvironment !== "string" ||
        corsConfig.activeEnvironment.length === 0 ||
        !Array.isArray(corsConfig.incomingRequests)
    ) {
        return "Invalid Input";
    }

    const orchestratorId = corsConfig.orchestratorId;
    const activeEnvironment = corsConfig.activeEnvironment;

    // --- STEP 2: BUILD POLICIES (Problem-03 builder logic inline) ---
    const builtPolicies = [];

    for (const p of corsConfig.policies) {

        const cfg = p.policyConfig;

        const validationErrors = [];

        if (cfg.allowAllOrigins && cfg.allowCredentials) {
            validationErrors.push("Cannot use wildcard origin with credentials");
        }

        if (cfg.allowedMethods.length === 0) {
            validationErrors.push("At least one method must be allowed");
        }

        builtPolicies.push({
            policyId: p.policyId,
            name: p.name,
            environment: p.environment,
            policy: {
                allowedOrigins: [...cfg.allowedOrigins],
                allowedPatterns: [...cfg.allowedPatterns],
                allowAllOrigins: cfg.allowAllOrigins,
                allowedMethods: [...cfg.allowedMethods],
                allowedHeaders: [...cfg.allowedHeaders],
                exposedHeaders: [...cfg.exposedHeaders],
                allowCredentials: cfg.allowCredentials,
                maxAgeSeconds: cfg.maxAgeSeconds,
                isValid: validationErrors.length === 0,
                validationErrors
            }
        });
    }

    // --- STEP 3: SELECT ACTIVE POLICY ---
    const activeEntry = builtPolicies.find(p => p.environment === activeEnvironment);

    if (!activeEntry) {
        return {
            orchestratorId,
            activePolicyId: null,
            requestLog: [],
            report: {
                activePolicyId: null,
                policyValidation: { isValid: false, validationErrors: ["No policy for environment " + activeEnvironment] },
                requestSummary: { totalRequests: 0, allowedCount: 0, blockedCount: 0, blockRate: 0, topOrigins: [], topBlockedOrigins: [] },
                preflightCount: 0,
                credentialRequests: 0
            }
        };
    }

    const activePolicy = activeEntry.policy;

    // --- STEP 4: HELPERS (P1 + P2 + P4 logic inline) ---
    function patternToRegex(pattern) {
        const escaped = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, (ch) => (ch === "*" ? ch : "\\" + ch))
            .replace(/\*/g, "[^.]+");
        return new RegExp("^" + escaped + "$");
    }

    function originAllowed(origin) {

        if (activePolicy.allowAllOrigins && !activePolicy.allowCredentials) return true;

        if (activePolicy.allowedOrigins.includes(origin)) return true;

        for (const pattern of activePolicy.allowedPatterns) {
            if (patternToRegex(pattern).test(origin)) return true;
        }

        return false;
    }

    function effectiveOrigin(origin) {
        if (activePolicy.allowAllOrigins && !activePolicy.allowCredentials) return "*";
        return origin;
    }

    function buildCorsHeaders(origin) {

        const headers = {
            "Access-Control-Allow-Origin": effectiveOrigin(origin)
        };

        if (activePolicy.exposedHeaders.length > 0) {
            headers["Access-Control-Expose-Headers"] = activePolicy.exposedHeaders.join(", ");
        }

        if (activePolicy.allowCredentials) {
            headers["Access-Control-Allow-Credentials"] = "true";
        }

        return headers;
    }

    function buildPreflightHeaders(origin) {

        const headers = {
            "Access-Control-Allow-Origin": effectiveOrigin(origin),
            "Access-Control-Allow-Methods": activePolicy.allowedMethods.join(", ")
        };

        if (activePolicy.allowedHeaders.length > 0) {
            headers["Access-Control-Allow-Headers"] = activePolicy.allowedHeaders.join(", ");
        }

        headers["Access-Control-Max-Age"] = activePolicy.maxAgeSeconds.toString();

        if (activePolicy.allowCredentials) {
            headers["Access-Control-Allow-Credentials"] = "true";
        }

        return headers;
    }

    // --- STEP 5: PROCESS REQUESTS (P4 logic inline) ---
    const requestLog = [];
    let preflightCount = 0;
    let credentialRequests = 0;

    const processedEntries = []; // { origin, allowed, method }

    for (const req of corsConfig.incomingRequests) {

        const hasOrigin = typeof req.origin === "string" && req.origin.length > 0;

        let result;

        if (!hasOrigin) {

            result = { requestId: req.requestId, allowed: true, reason: "SAME_ORIGIN", corsHeaders: {}, statusCode: 200 };

        } else if (!originAllowed(req.origin)) {

            result = { requestId: req.requestId, allowed: false, reason: "ORIGIN_BLOCKED", corsHeaders: {}, statusCode: 403 };

        } else {

            const isPreflight = req.isPreflight === true || req.method === "OPTIONS";

            if (isPreflight) {

                preflightCount++;

                const reqMethod = req.headers && req.headers["Access-Control-Request-Method"];

                if (reqMethod && !activePolicy.allowedMethods.includes(reqMethod)) {

                    result = { requestId: req.requestId, allowed: false, reason: "METHOD_BLOCKED", corsHeaders: {}, statusCode: 405 };

                } else {

                    const reqHeadersRaw = req.headers && req.headers["Access-Control-Request-Headers"];
                    const reqHeaders = reqHeadersRaw ? reqHeadersRaw.split(",").map(h => h.trim()) : [];

                    let headerBlocked = false;

                    for (const header of reqHeaders) {
                        if (!activePolicy.allowedHeaders.includes(header)) {
                            headerBlocked = true;
                            break;
                        }
                    }

                    if (headerBlocked) {

                        result = { requestId: req.requestId, allowed: false, reason: "HEADER_BLOCKED", corsHeaders: {}, statusCode: 403 };

                    } else {

                        if (activePolicy.allowCredentials) credentialRequests++;

                        result = {
                            requestId: req.requestId,
                            allowed: true,
                            reason: "PREFLIGHT_OK",
                            corsHeaders: buildPreflightHeaders(req.origin),
                            statusCode: 204
                        };
                    }
                }

            } else {

                if (!activePolicy.allowedMethods.includes(req.method)) {

                    result = { requestId: req.requestId, allowed: false, reason: "METHOD_BLOCKED", corsHeaders: {}, statusCode: 405 };

                } else {

                    if (activePolicy.allowCredentials) credentialRequests++;

                    result = {
                        requestId: req.requestId,
                        allowed: true,
                        reason: "ORIGIN_ALLOWED",
                        corsHeaders: buildCorsHeaders(req.origin),
                        statusCode: 200
                    };
                }
            }
        }

        processedEntries.push({
            origin: hasOrigin ? req.origin : null,
            method: req.method,
            allowed: result.allowed
        });

        requestLog.push({
            requestId: result.requestId,
            allowed: result.allowed,
            reason: result.reason,
            statusCode: result.statusCode,
            corsHeaders: result.corsHeaders
        });
    }

    // --- STEP 6: BUILD REPORT ---
    const totalRequests = requestLog.length;
    const allowedCount = requestLog.filter(r => r.allowed).length;
    const blockedCount = totalRequests - allowedCount;

    const blockRate = totalRequests > 0
        ? Math.round((blockedCount / totalRequests) * 10000) / 100
        : 0;

    const originCounts = {};
    const blockedOriginCounts = {};

    for (const entry of processedEntries) {
        if (entry.origin === null) continue;
        if (!originCounts[entry.origin]) originCounts[entry.origin] = 0;
        originCounts[entry.origin]++;
        if (!entry.allowed) {
            if (!blockedOriginCounts[entry.origin]) blockedOriginCounts[entry.origin] = 0;
            blockedOriginCounts[entry.origin]++;
        }
    }

    const topOrigins = Object.entries(originCounts)
        .map(([origin, count]) => ({ origin, count }))
        .sort((a, b) => b.count - a.count);

    const topBlockedOrigins = Object.entries(blockedOriginCounts)
        .map(([origin, count]) => ({ origin, count }))
        .sort((a, b) => b.count - a.count);

    return {
        orchestratorId,
        activePolicyId: activeEntry.policyId,
        requestLog,
        report: {
            activePolicyId: activeEntry.policyId,
            policyValidation: {
                isValid: activePolicy.isValid,
                validationErrors: activePolicy.validationErrors
            },
            requestSummary: {
                totalRequests,
                allowedCount,
                blockedCount,
                blockRate,
                topOrigins,
                topBlockedOrigins
            },
            preflightCount,
            credentialRequests
        }
    };
}


// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(runCORSOrchestrator({
    orchestratorId: "CORS-ORCH-01",
    policies: [
        {
            policyId: "POL-DEV",
            name: "Development Policy",
            environment: "development",
            policyConfig: {
                allowedOrigins: [], allowedPatterns: [],
                allowAllOrigins: true, allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allowedHeaders: ["Content-Type", "Authorization"],
                exposedHeaders: [], allowCredentials: false, maxAgeSeconds: 0
            }
        },
        {
            policyId: "POL-PROD",
            name: "Production Policy",
            environment: "production",
            policyConfig: {
                allowedOrigins: ["https://myapp.com", "https://admin.myapp.com"],
                allowedPatterns: [],
                allowAllOrigins: false, allowedMethods: ["GET", "POST"],
                allowedHeaders: ["Content-Type", "Authorization"],
                exposedHeaders: ["X-Request-Id"], allowCredentials: true, maxAgeSeconds: 86400
            }
        }
    ],
    activeEnvironment: "production",
    incomingRequests: [
        { requestId: "REQ-1", method: "GET", origin: "https://myapp.com", headers: {}, path: "/api/users", isPreflight: false },
        { requestId: "REQ-2", method: "OPTIONS", origin: "https://myapp.com", headers: { "Access-Control-Request-Method": "POST" }, path: "/api/users", isPreflight: true },
        { requestId: "REQ-3", method: "GET", origin: "https://evil.com", headers: {}, path: "/api/data", isPreflight: false },
        { requestId: "REQ-4", method: "DELETE", origin: "https://myapp.com", headers: {}, path: "/api/users/1", isPreflight: false }
    ]
}), null, 2));


// --- INVALID ---
console.log(runCORSOrchestrator({ orchestratorId: "", policies: [], activeEnvironment: "", incomingRequests: [] }));