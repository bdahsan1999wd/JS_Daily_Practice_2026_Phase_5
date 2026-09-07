// 🧩 PROBLEM–08: buildFullStackPipeline()

//  Logic: Full stack pipeline. Middleware chain (LOGGER, RATE_LIMIT, AUTH,
//  VALIDATION) then model operations (CRUD) on in-memory entity store.


function buildFullStackPipeline(pipelineBlueprint) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof pipelineBlueprint !== "object" ||
        pipelineBlueprint === null ||
        Array.isArray(pipelineBlueprint) ||
        typeof pipelineBlueprint.modelConfig !== "object" ||
        pipelineBlueprint.modelConfig === null ||
        Array.isArray(pipelineBlueprint.modelConfig) ||
        !Array.isArray(pipelineBlueprint.middlewares) ||
        !Array.isArray(pipelineBlueprint.requests)
    ) {
        return "Invalid Input";
    }

    const entityName = pipelineBlueprint.modelConfig.entityName;
    const modelSchema = pipelineBlueprint.modelConfig.schema;
    const middlewares = pipelineBlueprint.middlewares;

    // --- STEP 2: INTERNAL STATE ---

    const entityStore = [];
    let autoIndex = 0;
    const rateLimitCounts = {}; // clientId -> count

    function applyMiddlewareValidation(body) {
        const errors = [];

        for (const [field, rule] of Object.entries(modelSchema)) {
            const value = body == null ? undefined : body[field];

            if (rule.required === true && (value === undefined || value === null)) {
                errors.push(field + " is required");
                continue;
            }

            if (value !== undefined && value !== null) {
                if (rule.type === "number" && typeof value !== "number") {
                    errors.push(field + " must be a " + rule.type);
                } else if (rule.type === "string" && typeof value !== "string") {
                    errors.push(field + " must be a " + rule.type);
                }
            }
        }

        return errors;
    }

    // --- STEP 3: PROCESS REQUESTS ---

    const requestLog = [];

    for (const req of pipelineBlueprint.requests) {

        let blockedAt = null;

        for (const mw of middlewares) {

            if (blockedAt) break;

            if (mw.type === "RATE_LIMIT") {
                const clientId = req.requestId.slice(0, 2);
                if (!rateLimitCounts[clientId]) rateLimitCounts[clientId] = 0;
                rateLimitCounts[clientId]++;

                const maxRequests = mw.config.maxRequests;
                if (rateLimitCounts[clientId] > maxRequests) {
                    blockedAt = mw.name;
                }
            } else if (mw.type === "AUTH") {
                const header = req.headers && req.headers["Authorization"];
                const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : null;
                const validTokens = Array.isArray(mw.config.validTokens) ? mw.config.validTokens : [];
                if (!validTokens.includes(token)) {
                    blockedAt = mw.name;
                }
            } else if (mw.type === "VALIDATION") {
                const errors = applyMiddlewareValidation(req.body);
                if (errors.length > 0) {
                    blockedAt = mw.name;
                }
            } else if (mw.type === "LOGGER") {
                // no block
            }
        }

        let modelResult = null;

        if (!blockedAt && req.operation) {
            const op = req.operation;

            if (op.type === "CREATE") {
                autoIndex++;
                const id = entityName + "_" + autoIndex;
                const record = { id, ...(op.data || {}) };
                entityStore.push(record);
                modelResult = { success: true, result: { ...record } };
            } else if (op.type === "READ") {
                const record = entityStore.find(r => r.id === op.id) || null;
                modelResult = { success: record !== null, result: record ? { ...record } : null };
            } else if (op.type === "UPDATE") {
                const record = entityStore.find(r => r.id === op.id);
                if (record) {
                    Object.assign(record, op.data || {});
                    modelResult = { success: true, result: { ...record } };
                } else {
                    modelResult = { success: false, result: null };
                }
            } else if (op.type === "DELETE") {
                const idx = entityStore.findIndex(r => r.id === op.id);
                if (idx !== -1) {
                    const record = entityStore[idx];
                    entityStore.splice(idx, 1);
                    modelResult = { success: true, result: { ...record } };
                } else {
                    modelResult = { success: false, result: null };
                }
            }
        }

        requestLog.push({
            requestId: req.requestId,
            passed: blockedAt === null,
            blockedAt,
            modelResult
        });
    }

    // --- STEP 4: SUMMARY ---

    const passedCount = requestLog.filter(r => r.passed).length;

    return {
        requestLog,
        summary: {
            totalRequests: requestLog.length,
            passedCount,
            blockedCount: requestLog.length - passedCount
        },
        entityStore
    };
}


// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(buildFullStackPipeline({
    modelConfig: {
        entityName: "Product",
        schema: { name: { type: "string", required: true, default: null }, price: { type: "number", required: true, default: null } }
    },
    middlewares: [
        { name: "logger", type: "LOGGER", config: {} },
        { name: "auth", type: "AUTH", config: { validTokens: ["token-123"] } }
    ],
    requests: [
        { requestId: "R1", method: "POST", path: "/products", headers: { "Authorization": "Bearer token-123" }, body: { name: "JS Book", price: 500 }, operation: { type: "CREATE", id: null, data: { name: "JS Book", price: 500 } } },
        { requestId: "R2", method: "GET", path: "/products/Product_1", headers: {}, body: null, operation: { type: "READ", id: "Product_1", data: null } }
    ]
}), null, 2));


// --- INVALID ---
console.log(buildFullStackPipeline(null));