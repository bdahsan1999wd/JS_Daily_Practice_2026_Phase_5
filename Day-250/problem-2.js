// 🧩 PROBLEM–02: buildAPIGateway()

// Logic: API gateway pipeline: CORS → RATE_LIMIT → AUTH → ROUTE → HANDLER.
//   Processes requests sequentially; rate limit state carries over.

function buildAPIGateway(gatewayConfig) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof gatewayConfig !== "object" ||
        gatewayConfig === null ||
        Array.isArray(gatewayConfig) ||
        !Array.isArray(gatewayConfig.validAPIKeys) ||
        !Array.isArray(gatewayConfig.allowedOrigins) ||
        typeof gatewayConfig.rateLimitConfig !== "object" ||
        gatewayConfig.rateLimitConfig === null ||
        Array.isArray(gatewayConfig.rateLimitConfig) ||
        typeof gatewayConfig.rateLimitConfig.maxRequests !== "number" ||
        typeof gatewayConfig.rateLimitConfig.windowMs !== "number" ||
        !Array.isArray(gatewayConfig.routes) ||
        !Array.isArray(gatewayConfig.requests)
    ) {
        return "Invalid Input";
    }

    const validAPIKeys = gatewayConfig.validAPIKeys;
    const allowedOrigins = gatewayConfig.allowedOrigins;
    const maxRequests = gatewayConfig.rateLimitConfig.maxRequests;
    const windowMs = gatewayConfig.rateLimitConfig.windowMs;
    const routes = gatewayConfig.routes;

    function findRoute(method, path) {
        return routes.find(r => r.method === method && r.path === path);
    }

    // --- STEP 2: PROCESS REQUESTS SEQUENTIALLY ---

    const clientHistory = {}; // clientId -> [timestampMs]

    const requestLog = [];
    const blockCounts = { CORS: 0, RATE_LIMIT: 0, AUTH: 0, ROUTE: 0 };

    for (const req of gatewayConfig.requests) {

        let blockedStage = null;

        // 1. CORS
        if (req.origin != null) {
            if (!allowedOrigins.includes(req.origin)) {
                blockedStage = "CORS";
                blockCounts.CORS++;
            }
        }

        // 2. RATE_LIMIT (state carries over)
        if (!blockedStage) {
            if (!clientHistory[req.clientId]) clientHistory[req.clientId] = [];
            clientHistory[req.clientId].push(req.timestampMs);

            const windowStart = req.timestampMs - windowMs;
            const countInWindow = clientHistory[req.clientId].filter(t => t >= windowStart).length;

            if (countInWindow > maxRequests) {
                blockedStage = "RATE_LIMIT";
                blockCounts.RATE_LIMIT++;
            }
        }

        // 3. AUTH
        if (!blockedStage) {
            const route = findRoute(req.method, req.path);
            if (route && route.requiresAuth === true && !validAPIKeys.includes(req.apiKey)) {
                blockedStage = "AUTH";
                blockCounts.AUTH++;
            }
        }

        // 4. ROUTE
        if (!blockedStage) {
            const route = findRoute(req.method, req.path);
            if (!route) {
                blockedStage = "ROUTE";
                blockCounts.ROUTE++;
            }
        }

        if (blockedStage) {
            requestLog.push({ requestId: req.requestId, passed: false, blockedAt: blockedStage, stage: blockedStage });
        } else {
            requestLog.push({ requestId: req.requestId, passed: true, blockedAt: null, stage: "HANDLER" });
        }
    }

    // --- STEP 3: SUMMARY ---

    const passedCount = requestLog.filter(r => r.passed).length;

    return {
        requestLog,
        summary: {
            totalRequests: requestLog.length,
            passedCount,
            blockedCount: requestLog.length - passedCount,
            blockBreakdown: { ...blockCounts }
        }
    };
}


// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(buildAPIGateway({
    validAPIKeys: ["key-abc"],
    allowedOrigins: ["https://myapp.com"],
    rateLimitConfig: { maxRequests: 2, windowMs: 60000 },
    routes: [
        { method: "GET", path: "/users", requiresAuth: true },
        { method: "POST", path: "/users", requiresAuth: true }
    ],
    requests: [
        { requestId: "R1", method: "GET", path: "/users", origin: "https://myapp.com", apiKey: "key-abc", clientId: "C1", timestampMs: 1000 },
        { requestId: "R2", method: "GET", path: "/users", origin: "https://evil.com", apiKey: "key-abc", clientId: "C2", timestampMs: 2000 },
        { requestId: "R3", method: "GET", path: "/users", origin: "https://myapp.com", apiKey: null, clientId: "C3", timestampMs: 3000 }
    ]
}), null, 2));


// --- INVALID ---
console.log(buildAPIGateway(null));