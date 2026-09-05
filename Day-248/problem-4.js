// 🧩 PROBLEM–04: createCORSProcessor()

// Logic: Process cross-origin requests against a CORS policy.
//   processRequest() — same-origin / origin check / preflight / simple
//   processRequestBatch() / getAccessLog() / getBlockedRequests() / generateCORSReport()

function createCORSProcessor(corsPolicy) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof corsPolicy !== "object" ||
        corsPolicy === null ||
        Array.isArray(corsPolicy) ||
        !Array.isArray(corsPolicy.allowedOrigins) ||
        !Array.isArray(corsPolicy.allowedPatterns) ||
        typeof corsPolicy.allowAllOrigins !== "boolean" ||
        !Array.isArray(corsPolicy.allowedMethods) ||
        !Array.isArray(corsPolicy.allowedHeaders) ||
        !Array.isArray(corsPolicy.exposedHeaders) ||
        typeof corsPolicy.allowCredentials !== "boolean" ||
        typeof corsPolicy.maxAgeSeconds !== "number"
    ) {
        return "Invalid Input";
    }

    const policy = corsPolicy;

    const accessLog = [];

    // --- STEP 2: HELPERS ---
    function patternToRegex(pattern) {
        const escaped = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, (ch) => (ch === "*" ? ch : "\\" + ch))
            .replace(/\*/g, "[^.]+");
        return new RegExp("^" + escaped + "$");
    }

    function originAllowed(origin) {

        if (policy.allowAllOrigins && !policy.allowCredentials) return true;

        if (policy.allowedOrigins.includes(origin)) return true;

        for (const pattern of policy.allowedPatterns) {
            if (patternToRegex(pattern).test(origin)) return true;
        }

        return false;
    }

    function effectiveOrigin(origin) {
        if (policy.allowAllOrigins && !policy.allowCredentials) return "*";
        return origin;
    }

    function buildCorsHeaders(origin) {

        const headers = {
            "Access-Control-Allow-Origin": effectiveOrigin(origin)
        };

        if (policy.exposedHeaders.length > 0) {
            headers["Access-Control-Expose-Headers"] = policy.exposedHeaders.join(", ");
        }

        if (policy.allowCredentials) {
            headers["Access-Control-Allow-Credentials"] = "true";
        }

        return headers;
    }

    function buildPreflightHeaders(origin) {

        const headers = {
            "Access-Control-Allow-Origin": effectiveOrigin(origin),
            "Access-Control-Allow-Methods": policy.allowedMethods.join(", ")
        };

        if (policy.allowedHeaders.length > 0) {
            headers["Access-Control-Allow-Headers"] = policy.allowedHeaders.join(", ");
        }

        headers["Access-Control-Max-Age"] = policy.maxAgeSeconds.toString();

        if (policy.allowCredentials) {
            headers["Access-Control-Allow-Credentials"] = "true";
        }

        return headers;
    }

    function processOne(request) {

        const hasOrigin = typeof request.origin === "string" && request.origin.length > 0;

        // 1. No Origin → same-origin request.

        if (!hasOrigin) {
            return { requestId: request.requestId, allowed: true, reason: "SAME_ORIGIN", corsHeaders: {}, statusCode: 200 };
        }

        // 2. Validate origin.

        if (!originAllowed(request.origin)) {
            return { requestId: request.requestId, allowed: false, reason: "ORIGIN_BLOCKED", corsHeaders: {}, statusCode: 403 };
        }

        // 3. Preflight?

        const isPreflight = request.isPreflight === true || request.method === "OPTIONS";

        if (isPreflight) {

            const reqMethod = request.headers && request.headers["Access-Control-Request-Method"];

            if (reqMethod && !policy.allowedMethods.includes(reqMethod)) {
                return { requestId: request.requestId, allowed: false, reason: "METHOD_BLOCKED", corsHeaders: {}, statusCode: 405 };
            }

            const reqHeadersRaw = request.headers && request.headers["Access-Control-Request-Headers"];
            const reqHeaders = reqHeadersRaw ? reqHeadersRaw.split(",").map(h => h.trim()) : [];

            for (const header of reqHeaders) {
                if (!policy.allowedHeaders.includes(header)) {
                    return { requestId: request.requestId, allowed: false, reason: "HEADER_BLOCKED", corsHeaders: {}, statusCode: 403 };
                }
            }

            return {
                requestId: request.requestId,
                allowed: true,
                reason: "PREFLIGHT_OK",
                corsHeaders: buildPreflightHeaders(request.origin),
                statusCode: 204
            };
        }

        // 4. Method check for actual requests.

        if (!policy.allowedMethods.includes(request.method)) {
            return { requestId: request.requestId, allowed: false, reason: "METHOD_BLOCKED", corsHeaders: {}, statusCode: 405 };
        }

        return {
            requestId: request.requestId,
            allowed: true,
            reason: "ORIGIN_ALLOWED",
            corsHeaders: buildCorsHeaders(request.origin),
            statusCode: 200
        };
    }

    // --- STEP 3: PUBLIC API ---
    return {

        processRequest(request) {

            if (typeof request !== "object" || request === null || Array.isArray(request)) {
                return "Invalid Input";
            }

            const result = processOne(request);

            accessLog.push({
                requestId: result.requestId,
                origin: typeof request.origin === "string" ? request.origin : null,
                method: request.method,
                allowed: result.allowed,
                reason: result.reason,
                processedAt: "2025-01-01T00:00:00Z"
            });

            return result;
        },

        processRequestBatch(requests) {

            if (!Array.isArray(requests)) return "Invalid Input";

            const results = [];

            for (const req of requests) {
                const result = this.processRequest(req);
                results.push(result);
            }

            return {
                results,
                allowedCount: results.filter(r => r.allowed).length,
                blockedCount: results.filter(r => !r.allowed).length
            };
        },

        getAccessLog() {
            return accessLog.map(entry => ({ ...entry }));
        },

        getBlockedRequests() {
            return accessLog.filter(entry => !entry.allowed).map(entry => ({ ...entry }));
        },

        generateCORSReport() {

            const totalRequests = accessLog.length;
            const allowedCount = accessLog.filter(e => e.allowed).length;
            const blockedCount = totalRequests - allowedCount;

            const blockRate = totalRequests > 0
                ? Math.round((blockedCount / totalRequests) * 10000) / 100
                : 0;

            const originCounts = {};
            const blockedOriginCounts = {};

            for (const entry of accessLog) {
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
                totalRequests,
                allowedCount,
                blockedCount,
                blockRate,
                topOrigins,
                topBlockedOrigins
            };
        }
    };
}


// ------ EXAMPLE USAGE ------

const policy = {
    allowedOrigins: ["https://myapp.com"],
    allowedPatterns: [],
    allowAllOrigins: false,
    allowedMethods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    exposedHeaders: [],
    allowCredentials: true,
    maxAgeSeconds: 3600,
    isValid: true
};

const processor = createCORSProcessor(policy);

console.log(processor.processRequest({ requestId: "R1", method: "GET", origin: "https://myapp.com", headers: {}, path: "/api/users", isPreflight: false }));

console.log(processor.processRequest({ requestId: "R2", method: "GET", origin: "https://evil.com", headers: {}, path: "/api/data", isPreflight: false }));

console.log(processor.processRequest({ requestId: "R3", method: "OPTIONS", origin: "https://myapp.com", headers: { "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Content-Type" }, path: "/api/users", isPreflight: true }));

console.log(processor.generateCORSReport());


// --- INVALID ---
console.log(createCORSProcessor(null));