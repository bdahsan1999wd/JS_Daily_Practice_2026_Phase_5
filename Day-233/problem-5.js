// 🧩 PROBLEM–05: runErrorHandlingOrchestrator()

// Logic: Full Error Handling Orchestrator — composes Problems 01–04.

// 1. Setup — classifier, boundary, global handler, recovery engine
// 2. Process each scenario: classify → (boundary wrap) → handle → recover
// 3. Final Report — classificationSummary, handlingSummary, recoverySummary


function runErrorHandlingOrchestrator(orchestratorConfig) {

    // --- STEP 1: VALIDATE orchestratorConfig ---

    if (
        typeof orchestratorConfig !== "object" || orchestratorConfig === null || Array.isArray(orchestratorConfig) ||
        typeof orchestratorConfig.orchestratorId !== "string" || orchestratorConfig.orchestratorId.trim() === "" ||
        !["development", "staging", "production"].includes(orchestratorConfig.environment) ||
        typeof orchestratorConfig.boundaryConfig !== "object" || orchestratorConfig.boundaryConfig === null ||
        typeof orchestratorConfig.globalHandlerConfig !== "object" || orchestratorConfig.globalHandlerConfig === null ||
        typeof orchestratorConfig.recoveryConfig !== "object" || orchestratorConfig.recoveryConfig === null ||
        !Array.isArray(orchestratorConfig.errorScenarios)
    ) {
        return "Invalid Input";
    }

    const { orchestratorId, environment, errorScenarios } = orchestratorConfig;

    // --- STEP 2: PROBLEM-01 CLASSIFIER (self-contained) ---

    const errorTypes = {
        VALIDATION_ERROR: { severity: "LOW", httpStatus: 400, retryable: false },
        AUTH_ERROR: { severity: "MEDIUM", httpStatus: 401, retryable: false },
        FORBIDDEN_ERROR: { severity: "MEDIUM", httpStatus: 403, retryable: false },
        NOT_FOUND_ERROR: { severity: "LOW", httpStatus: 404, retryable: false },
        CONFLICT_ERROR: { severity: "MEDIUM", httpStatus: 409, retryable: false },
        RATE_LIMIT_ERROR: { severity: "MEDIUM", httpStatus: 429, retryable: true },
        SERVER_ERROR: { severity: "HIGH", httpStatus: 500, retryable: true },
        DB_ERROR: { severity: "HIGH", httpStatus: 503, retryable: true },
        NETWORK_ERROR: { severity: "HIGH", httpStatus: 503, retryable: true },
        UNKNOWN_ERROR: { severity: "HIGH", httpStatus: 500, retryable: false }
    };

    function classify(error) {

        if (error.type && errorTypes[error.type]) return error.type;

        const msg = String(error.message).toLowerCase();

        if (msg.includes("validation") || msg.includes("invalid")) return "VALIDATION_ERROR";
        if (msg.includes("unauthorized") || msg.includes("auth")) return "AUTH_ERROR";
        if (msg.includes("not found")) return "NOT_FOUND_ERROR";
        if (msg.includes("database") || msg.includes("db")) return "DB_ERROR";
        if (msg.includes("network") || msg.includes("timeout")) return "NETWORK_ERROR";

        return "UNKNOWN_ERROR";
    }

    // --- STEP 3: PROBLEM-02 BOUNDARY (self-contained) ---

    function createBoundary(boundaryConfig) {

        const { boundaryId, fallbackFn, onError } = boundaryConfig;
        const maxErrors = boundaryConfig.maxErrors;

        let errorCount = 0;

        return {
            execute(fn, ...args) {
                try {
                    return { success: true, result: fn(...args) };
                } catch (err) {
                    if (errorCount >= maxErrors) {
                        return { success: false, boundaryBroken: true, boundaryId };
                    }
                    errorCount++;
                    if (onError) onError(err);
                    return { success: false, error: err.message, fallbackResult: fallbackFn(err), boundaryId };
                }
            }
        };
    }

    const boundary = createBoundary(orchestratorConfig.boundaryConfig);

    // --- STEP 4: PROBLEM-03 GLOBAL HANDLER (self-contained) ---

    const handlers = orchestratorConfig.globalHandlerConfig.handlers;

    function handleError(error, type) {

        const handler = handlers.find(h => h.errorType === type) || handlers.find(h => h.errorType === "*");

        if (!handler) {
            return { handled: false, reason: "No handler for type: " + type };
        }

        let result;

        switch (handler.strategy) {
            case "LOG":
                result = { strategy: "LOG", logged: true, type, message: error.message };
                break;
            case "RETRY":
                result = { strategy: "RETRY", retriesUsed: handler.maxRetries, finalStatus: "EXHAUSTED" };
                break;
            case "FALLBACK":
                result = { strategy: "FALLBACK", fallbackValue: handler.fallbackValue ?? null, type };
                break;
            case "ESCALATE":
                result = { strategy: "ESCALATE", escalatedTo: "ENGINEERING_TEAM", severity: errorTypes[type].severity, type };
                break;
        }

        return { handled: true, type, strategy: handler.strategy, result, environment };
    }

    // --- STEP 5: PROBLEM-04 RECOVERY ENGINE (self-contained) ---

    const strategies = orchestratorConfig.recoveryConfig.strategies;

    function recoverError(error, type) {

        const strategy = strategies.find(s => s.applicableTypes.includes(type));

        if (!strategy) {
            return { recovered: false, reason: "No recovery strategy for: " + type };
        }

        const stepLog = [];

        for (const step of strategy.steps) {
            if (step.shouldFail) {
                stepLog.push({ stepName: step.stepName, action: step.action, status: "FAILED", stoppedRecovery: true });
                return { recovered: false, strategyName: strategy.strategyName, failedAt: step.stepName, stepLog };
            }
            stepLog.push({ stepName: step.stepName, action: step.action, status: "SUCCESS" });
        }

        return { recovered: true, strategyName: strategy.strategyName, stepsCompleted: stepLog.length, stepLog };
    }

    // --- STEP 6: PROCESS SCENARIOS ---

    const scenarioLog = [];

    const classification = { byType: {}, bySeverity: {} };
    const handling = { handled: 0, unhandled: 0, byStrategy: {} };
    const recovery = { recovered: 0, unrecovered: 0 };

    for (const scenario of errorScenarios) {

        const error = scenario.error;

        // 1. Classify.
        const type = classify(error);
        const classified = {
            type,
            severity: errorTypes[type].severity,
            httpStatus: errorTypes[type].httpStatus,
            retryable: errorTypes[type].retryable
        };

        // 2. (optional) boundary wrap.
        const process = () => {
            const handled = handleError(error, type);
            const recovered = recoverError(error, type);
            return { handled, recovered };
        };

        let handled, recovered;

        if (scenario.useBoundary === true) {
            const wrapped = boundary.execute(process);
            ({ handled, recovered } = wrapped.success ? wrapped.result : { handled: null, recovered: null });
        } else {
            ({ handled, recovered } = process());
        }

        // 3. Tally classification.
        classification.byType[type] = (classification.byType[type] || 0) + 1;
        const sev = errorTypes[type].severity;
        classification.bySeverity[sev] = (classification.bySeverity[sev] || 0) + 1;

        // 4. Tally handling.
        if (handled && handled.handled === true) {
            handling.handled++;
            handling.byStrategy[handled.strategy] = (handling.byStrategy[handled.strategy] || 0) + 1;
        } else {
            handling.unhandled++;
        }

        // 5. Tally recovery.
        if (recovered && recovered.recovered === true) {
            recovery.recovered++;
        } else {
            recovery.unrecovered++;
        }

        scenarioLog.push({ scenarioId: scenario.scenarioId, classified, handled, recovered });
    }

    // --- STEP 7: BUILD REPORT ---

    const successRate = errorScenarios.length === 0
        ? 0
        : Number(((recovery.recovered / errorScenarios.length) * 100).toFixed(2));

    const report = {
        totalScenarios: errorScenarios.length,
        classificationSummary: classification,
        handlingSummary: handling,
        recoverySummary: { ...recovery, successRate }
    };

    return { orchestratorId, scenarioLog, report };
}


// ------ EXAMPLE USAGE ------

console.log(runErrorHandlingOrchestrator({
    orchestratorId: "ERR-ORCH-01",
    environment: "production",
    boundaryConfig: {
        boundaryId: "MAIN-BOUNDARY",
        fallbackFn: (err) => ({ fallback: true, error: err.message }),
        onError: null,
        maxErrors: 5
    },
    globalHandlerConfig: {
        environment: "production",
        handlers: [
            { errorType: "DB_ERROR", strategy: "RETRY", maxRetries: 2, fallbackValue: null },
            { errorType: "VALIDATION_ERROR", strategy: "LOG", maxRetries: null, fallbackValue: null },
            { errorType: "*", strategy: "FALLBACK", maxRetries: null, fallbackValue: { data: null } }
        ]
    },
    recoveryConfig: {
        strategies: [
            {
                strategyName: "DBRecovery",
                applicableTypes: ["DB_ERROR"],
                steps: [
                    { stepName: "Log", action: "LOG", shouldFail: false },
                    { stepName: "Cache", action: "CACHE_FALLBACK", shouldFail: false }
                ]
            }
        ]
    },
    errorScenarios: [
        { scenarioId: "S1", error: { type: "DB_ERROR", message: "DB timeout" }, useBoundary: true },
        { scenarioId: "S2", error: { type: "VALIDATION_ERROR", message: "Invalid email" }, useBoundary: false },
        { scenarioId: "S3", error: { type: "NETWORK_ERROR", message: "Connection refused" }, useBoundary: true }
    ]
}));


// --- INVALID ---
console.log(runErrorHandlingOrchestrator({ orchestratorId: "", environment: "prod", boundaryConfig: {}, globalHandlerConfig: {}, recoveryConfig: {}, errorScenarios: [] }));