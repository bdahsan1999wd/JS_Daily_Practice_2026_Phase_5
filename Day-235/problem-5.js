// 🧩 PROBLEM–05: runFullStackApp()

// Logic: Full Stack App Orchestrator — composes Problems 01–04.
// 1. Bootstrap the app (P-01)
// 2. Setup request pipeline (P-02)
// 3. Setup data layer + seed (P-03)
// 4. Setup business layer (P-04)
// 5. Process each request: pipeline → business op → data fetch → final response
// 6. Build app report (appStatus, pipelineStats, dataStats, businessStats)


function runFullStackApp(appBlueprint) {

    // --- STEP 1: VALIDATE appBlueprint ---

    if (
        typeof appBlueprint !== "object" || appBlueprint === null || Array.isArray(appBlueprint) ||
        typeof appBlueprint.appId !== "string" || appBlueprint.appId.trim() === "" ||
        typeof appBlueprint.appConfig !== "object" || appBlueprint.appConfig === null ||
        typeof appBlueprint.pipelineConfig !== "object" || appBlueprint.pipelineConfig === null ||
        typeof appBlueprint.dataConfig !== "object" || appBlueprint.dataConfig === null ||
        typeof appBlueprint.businessConfig !== "object" || appBlueprint.businessConfig === null ||
        typeof appBlueprint.seedData !== "object" || appBlueprint.seedData === null ||
        !Array.isArray(appBlueprint.requests)
    ) {
        return "Invalid Input";
    }

    const { appId, appConfig, pipelineConfig, dataConfig, businessConfig, seedData, requests } = appBlueprint;

    // --- STEP 2: PROBLEM-01 APP BOOTSTRAP (self-contained) ---

    const modules = {};

    const app = {
        getConfig() {
            return {
                appName: appConfig.appName, version: appConfig.version,
                environment: appConfig.environment, port: appConfig.port,
                features: appConfig.features, startedAt: "2025-01-01T00:00:00Z"
            };
        },
        isFeatureEnabled(f) {
            if (!(f in appConfig.features)) return { error: "Unknown feature" };
            return { feature: f, enabled: appConfig.features[f] };
        },
        getStatus() {
            return {
                status: "RUNNING", appName: appConfig.appName, version: appConfig.version,
                environment: appConfig.environment, uptime: "0s", moduleCount: Object.keys(modules).length
            };
        },
        registerModule(name, cfg) {
            if (modules[name]) return { registered: false, reason: "Module already registered" };
            modules[name] = { cfg, registeredAt: "2025-01-01T00:00:00Z" };
            return { registered: true, moduleName: name };
        },
        listModules() { return Object.keys(modules).map(n => ({ moduleName: n, registeredAt: modules[n].registeredAt })); },
        shutdown() {
            const n = Object.keys(modules).length;
            for (const k of Object.keys(modules)) delete modules[k];
            return { shutdown: true, appName: appConfig.appName, modulesUnloaded: n };
        }
    };

    // --- STEP 3: PROBLEM-02 REQUEST PIPELINE (self-contained) ---

    const windows = {};
    const pStats = { totalProcessed: 0, completedCount: 0, blockedCount: 0, blockReasons: { AUTH: 0, RATE_LIMIT: 0 } };

    function processRequest(request) {

        const stages = [];

        if (pipelineConfig.enableLogging) {
            stages.push({ stage: "LOGGING", logged: true });
        }

        if (pipelineConfig.enableRateLimit) {
            const cid = request.clientId;
            const now = request.timestampMs;
            const win = windows[cid];
            const { maxRequests, windowMs } = pipelineConfig.rateLimit;
            if (!win || now - win.windowStart >= windowMs) {
                windows[cid] = { windowStart: now, count: 1 };
                stages.push({ stage: "RATE_LIMIT", blocked: false, requestCount: 1 });
            } else if (win.count < maxRequests) {
                win.count++;
                stages.push({ stage: "RATE_LIMIT", blocked: false, requestCount: win.count });
            } else {
                pStats.blockedCount++;
                pStats.blockReasons.RATE_LIMIT++;
                stages.push({ stage: "RATE_LIMIT", blocked: true, reason: "Rate limit exceeded" });
                return { requestId: request.requestId, stages, finalStatus: "BLOCKED", blockedAt: "RATE_LIMIT" };
            }
        }

        if (pipelineConfig.enableAuth) {
            const header = request.headers["Authorization"] || "";
            const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
            if (!token || !pipelineConfig.validTokens.includes(token)) {
                pStats.blockedCount++;
                pStats.blockReasons.AUTH++;
                stages.push({ stage: "AUTH", blocked: true, reason: "Unauthorized" });
                return { requestId: request.requestId, stages, finalStatus: "BLOCKED", blockedAt: "AUTH" };
            }
            stages.push({ stage: "AUTH", blocked: false, userId: "USER_" + token });
        }

        stages.push({ stage: "HANDLER", result: "processed_" + request.requestId });

        pStats.completedCount++;

        return { requestId: request.requestId, stages, finalStatus: "COMPLETED", blockedAt: null };
    }

    // --- STEP 4: PROBLEM-03 DATA LAYER (self-contained) ---

    const entityStore = {};

    for (const e of dataConfig.entities) {
        entityStore[e.name] = { relations: e.relations || [], records: [] };
    }

    function getRepository(entityName) {
        return {
            create(record) { entityStore[entityName].records.push({ ...record }); return { created: true, id: record.id }; },
            findById(id) {
                const r = entityStore[entityName].records.find(x => x.id === id);
                return r ? { found: true, record: { ...r } } : { found: false };
            },
            findAll() { return entityStore[entityName].records.map(x => ({ ...x })); },
            update(id, changes) {
                const idx = entityStore[entityName].records.findIndex(x => x.id === id);
                if (idx === -1) return { updated: false };
                entityStore[entityName].records[idx] = { ...entityStore[entityName].records[idx], ...changes };
                return { updated: true, id };
            },
            delete(id) {
                const idx = entityStore[entityName].records.findIndex(x => x.id === id);
                if (idx === -1) return { deleted: false };
                entityStore[entityName].records.splice(idx, 1);
                return { deleted: true, id };
            }
        };
    }

    function seedDataFn(entityName, records) {
        for (const r of records) entityStore[entityName].records.push({ ...r });
        return { entityName, seeded: records.length };
    }

    function getDataStats() {
        const entities = {};
        for (const name of Object.keys(entityStore)) entities[name] = entityStore[name].records.length;
        return { entities };
    }

    for (const entityName of Object.keys(seedData)) {
        if (entityStore[entityName]) seedDataFn(entityName, seedData[entityName]);
    }

    // --- STEP 5: PROBLEM-04 BUSINESS LAYER (self-contained) ---

    const services = {};

    for (const s of businessConfig.services) {
        services[s.serviceName] = {};
        for (const op of s.operations) services[s.serviceName][op.operationName] = op;
    }

    const bStats = { totalExecutions: 0, successCount: 0, failureCount: 0, operationBreakdown: {} };

    function validateInput(input, rules) {
        const errors = [];
        for (const v of rules) {
            const val = input[v.field];
            let bad = false;
            switch (v.rule) {
                case "required": bad = val === undefined || val === null || val === ""; break;
                case "min": bad = typeof val !== "number" || val < v.value; break;
                case "max": bad = typeof val !== "number" || val > v.value; break;
                case "minLength": bad = typeof val !== "string" || val.length < v.value; break;
                case "maxLength": bad = typeof val !== "string" || val.length > v.value; break;
                case "pattern":
                    bad = v.value === "email"
                        ? !(typeof val === "string" && val.includes("@") && val.includes("."))
                        : false;
                    break;
                default: bad = false;
            }
            if (bad) errors.push({ field: v.field, message: v.message });
        }
        return errors;
    }

    function executeBusinessOp(serviceName, operationName, input, context) {

        const op = services[serviceName] && services[serviceName][operationName];

        if (!op) return { success: false, error: "Operation not found: " + serviceName + "." + operationName };

        const validationErrors = validateInput(input, op.inputRules);

        if (validationErrors.length > 0) {
            bStats.totalExecutions++;
            bStats.failureCount++;
            const key = serviceName + "." + operationName;
            bStats.operationBreakdown[key] = (bStats.operationBreakdown[key] || 0) + 1;
            return { success: false, validationErrors };
        }

        if (op.shouldFail) {
            bStats.totalExecutions++;
            bStats.failureCount++;
            const key = serviceName + "." + operationName;
            bStats.operationBreakdown[key] = (bStats.operationBreakdown[key] || 0) + 1;
            return { success: false, error: "Operation execution failed" };
        }

        const result = op.execute(input, context);

        bStats.totalExecutions++;
        bStats.successCount++;
        const key = serviceName + "." + operationName;
        bStats.operationBreakdown[key] = (bStats.operationBreakdown[key] || 0) + 1;

        return { success: true, result, serviceName, operationName };
    }

    function getBusinessStats() {
        return { ...bStats, operationBreakdown: { ...bStats.operationBreakdown } };
    }

    // --- STEP 6: PROCESS REQUESTS ---

    const requestLog = [];
    let successCount = 0;
    let blockedCount = 0;

    for (const req of requests) {

        const pipelineResult = processRequest(req);

        if (pipelineResult.finalStatus === "BLOCKED") {
            blockedCount++;
            const blockedStage = pipelineResult.blockedAt;
            const reason = blockedStage === "AUTH" ? "Unauthorized" : "Rate limit exceeded";
            requestLog.push({
                requestId: req.requestId,
                pipelineStatus: "BLOCKED",
                businessResult: null,
                finalResponse: { status: "ERROR", reason, blockedAt: blockedStage }
            });
            continue;
        }

        // Pipeline COMPLETED → execute business operation (if provided).

        let businessResult = null;

        if (req.businessOperation) {
            const op = req.businessOperation;
            businessResult = executeBusinessOp(op.serviceName, op.operationName, op.input, { requestId: req.requestId });
        }

        // Build final response.

        let finalResponse;

        if (businessResult && businessResult.success === true) {
            successCount++;
            finalResponse = { status: "SUCCESS", data: businessResult.result };
        } else if (businessResult && businessResult.success === false) {
            finalResponse = { status: "ERROR", reason: businessResult.error || "Validation failed", validationErrors: businessResult.validationErrors || null };
        } else {
            successCount++;
            finalResponse = { status: "SUCCESS", data: null };
        }

        requestLog.push({
            requestId: req.requestId,
            pipelineStatus: "COMPLETED",
            businessResult,
            finalResponse
        });
    }

    // --- STEP 7: BUILD APP REPORT ---

    const appReport = {
        appStatus: app.getStatus(),
        pipelineStats: { ...pStats, blockReasons: { ...pStats.blockReasons } },
        dataStats: getDataStats(),
        businessStats: getBusinessStats(),
        totalRequests: requests.length,
        successCount,
        blockedCount
    };

    return { appId, requestLog, appReport };
}



// ------ EXAMPLE USAGE ------

console.log(runFullStackApp({
    appId: "SHOP-APP-01",
    appConfig: {
        appName: "ShopAPI", version: "1.0.0", environment: "production", port: 8080,
        features: { auth: true, rateLimit: true, logging: true, errorHandling: true }
    },
    pipelineConfig: {
        enableAuth: true, enableRateLimit: true,
        rateLimit: { maxRequests: 5, windowMs: 60000 },
        enableLogging: true,
        validTokens: ["token-admin", "token-user"]
    },
    dataConfig: {
        entities: [
            { name: "Product", fields: { id: { type: "string", required: true, default: null }, name: { type: "string", required: true, default: null }, price: { type: "number", required: true, default: null } }, relations: null }
        ]
    },
    businessConfig: {
        services: [
            {
                serviceName: "ProductService",
                operations: [
                    {
                        operationName: "getProduct",
                        inputRules: [{ field: "id", rule: "required", value: null, message: "id is required" }],
                        execute: (input) => ({ id: input.id, name: "JS Book", price: 500 }),
                        shouldFail: false
                    }
                ]
            }
        ]
    },
    seedData: {
        Product: [
            { id: "P1", name: "JS Book", price: 500 },
            { id: "P2", name: "CSS Guide", price: 300 }
        ]
    },
    requests: [
        {
            requestId: "REQ-1", clientId: "C1", method: "GET", path: "/products/P1",
            headers: { "Authorization": "Bearer token-admin" }, body: null, timestampMs: 100,
            businessOperation: { serviceName: "ProductService", operationName: "getProduct", input: { id: "P1" } }
        },
        {
            requestId: "REQ-2", clientId: "C2", method: "GET", path: "/products/P2",
            headers: {}, body: null, timestampMs: 200,
            businessOperation: { serviceName: "ProductService", operationName: "getProduct", input: { id: "P2" } }
        }
    ]
}));



// --- INVALID ---
console.log(runFullStackApp({ appId: "", appConfig: {}, pipelineConfig: {}, dataConfig: {}, businessConfig: {}, seedData: {}, requests: [] }));