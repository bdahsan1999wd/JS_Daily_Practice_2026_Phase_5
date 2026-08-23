// 🧩 PROBLEM–02: createRequestPipeline()

// Logic: Returns a request pipeline object.
//   process(request)       — run a request through the full pipeline
//   processMany(requests)  — process multiple requests
//   getStats()             — pipeline statistics

// Pipeline stages (in order):
//   1. LOGGING    (if enableLogging)      → { logged: true }
//   2. RATE_LIMIT (if enableRateLimit)    → fixed window per clientId
//   3. AUTH       (if enableAuth)         → Bearer token in validTokens
//   4. HANDLER                            → { result: "processed_" + requestId }


function createRequestPipeline(pipelineConfig) {

    // --- STEP 1: VALIDATE pipelineConfig ---

    if (
        typeof pipelineConfig !== "object" || pipelineConfig === null || Array.isArray(pipelineConfig) ||
        typeof pipelineConfig.pipelineId !== "string" || pipelineConfig.pipelineId.trim() === "" ||
        typeof pipelineConfig.enableAuth !== "boolean" ||
        typeof pipelineConfig.enableRateLimit !== "boolean" ||
        typeof pipelineConfig.enableLogging !== "boolean" ||
        typeof pipelineConfig.rateLimit !== "object" || pipelineConfig.rateLimit === null ||
        !Number.isInteger(pipelineConfig.rateLimit.maxRequests) || pipelineConfig.rateLimit.maxRequests < 1 ||
        !Number.isInteger(pipelineConfig.rateLimit.windowMs) || pipelineConfig.rateLimit.windowMs < 1 ||
        !Array.isArray(pipelineConfig.validTokens)
    ) {
        return "Invalid Input";
    }

    const { pipelineId, enableAuth, enableRateLimit, enableLogging, validTokens } = pipelineConfig;
    const { maxRequests, windowMs } = pipelineConfig.rateLimit;

    // --- STEP 2: INTERNAL STATE ---

    // Fixed-window counters per clientId: { windowStart, count }
    const windows = {};

    const stats = { totalProcessed: 0, completedCount: 0, blockedCount: 0, blockReasons: { AUTH: 0, RATE_LIMIT: 0 } };

    // --- STEP 3: PIPELINE STAGES ---

    function runStages(request) {

        const stages = [];

        // 1. LOGGING

        if (enableLogging) {
            stages.push({ stage: "LOGGING", logged: true });
        }

        // 2. RATE_LIMIT

        if (enableRateLimit) {

            const clientId = request.clientId;
            const now = request.timestampMs;

            const win = windows[clientId];

            if (!win || now - win.windowStart >= windowMs) {
                windows[clientId] = { windowStart: now, count: 1 };
                stages.push({ stage: "RATE_LIMIT", blocked: false, requestCount: 1 });
            } else if (win.count < maxRequests) {
                win.count++;
                stages.push({ stage: "RATE_LIMIT", blocked: false, requestCount: win.count });
            } else {
                stats.blockedCount++;
                stats.blockReasons.RATE_LIMIT++;
                stages.push({ stage: "RATE_LIMIT", blocked: true, reason: "Rate limit exceeded" });
                return { stages, finalStatus: "BLOCKED", blockedAt: "RATE_LIMIT" };
            }
        }

        // 3. AUTH

        if (enableAuth) {

            const header = request.headers["Authorization"] || "";
            const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

            if (!token || !validTokens.includes(token)) {
                stats.blockedCount++;
                stats.blockReasons.AUTH++;
                stages.push({ stage: "AUTH", blocked: true, reason: "Unauthorized" });
                return { stages, finalStatus: "BLOCKED", blockedAt: "AUTH" };
            }

            stages.push({ stage: "AUTH", blocked: false, userId: "USER_" + token });
        }

        // 4. HANDLER

        stages.push({ stage: "HANDLER", result: "processed_" + request.requestId });

        return { stages, finalStatus: "COMPLETED", blockedAt: null };
    }

    // --- STEP 4: RETURN PIPELINE OBJECT ---

    return {

        process(request) {

            if (
                typeof request !== "object" || request === null || Array.isArray(request) ||
                typeof request.requestId !== "string" ||
                typeof request.clientId !== "string" ||
                typeof request.headers !== "object" || request.headers === null
            ) {
                return "Invalid Input";
            }

            stats.totalProcessed++;

            const result = runStages(request);

            if (result.finalStatus === "COMPLETED") stats.completedCount++;

            return { requestId: request.requestId, ...result };
        },

        processMany(requests) {

            if (!Array.isArray(requests)) return "Invalid Input";

            const results = requests.map(r => this.process(r));

            return {
                results,
                completedCount: results.filter(r => r.finalStatus === "COMPLETED").length,
                blockedCount: results.filter(r => r.finalStatus === "BLOCKED").length
            };
        },

        getStats() {
            return { ...stats, blockReasons: { ...stats.blockReasons } };
        }
    };
}



// ------ EXAMPLE USAGE ------

const pipeline = createRequestPipeline({
    pipelineId: "PIPE-01",
    enableAuth: true,
    enableRateLimit: true,
    rateLimit: { maxRequests: 2, windowMs: 1000 },
    enableLogging: true,
    validTokens: ["token-123", "token-456"]
});

console.log(pipeline.process({
    requestId: "REQ-1", clientId: "C1", method: "GET", path: "/users",
    headers: { "Authorization": "Bearer token-123" }, timestampMs: 100
}));


console.log(pipeline.process({
    requestId: "REQ-2", clientId: "C1", method: "GET", path: "/users",
    headers: {}, timestampMs: 200
}));


console.log(pipeline.getStats());


// --- processMany ---
console.log(pipeline.processMany([
    { requestId: "R1", clientId: "C2", method: "GET", path: "/", headers: {}, timestampMs: 300 },
    { requestId: "R2", clientId: "C2", method: "GET", path: "/", headers: {}, timestampMs: 400 }
]));


// --- INVALID ---
console.log(createRequestPipeline({ pipelineId: "", enableAuth: true, enableRateLimit: true, rateLimit: { maxRequests: 0, windowMs: 0 }, enableLogging: true, validTokens: [] }));