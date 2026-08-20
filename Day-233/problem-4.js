// 🧩 PROBLEM–04: createRecoveryEngine()

// Logic: Returns a recovery engine object.
//   recover(error)             — find & execute the appropriate recovery strategy
//   executeStrategy(name, error) — execute a specific strategy
//   getRecoveryHistory()       — history of all recovery attempts
//   getSuccessRate()           — { successRate, totalAttempts, succeeded, failed }

// recover(): classify error type → find strategy whose applicableTypes includes
// it → run steps in order. Each step: shouldFail:false → SUCCESS; true → FAILED
// + stoppedRecovery, and stop. If all pass → recovered true.

function createRecoveryEngine(recoveryConfig) {

    // --- STEP 1: VALIDATE recoveryConfig ---

    if (
        typeof recoveryConfig !== "object" || recoveryConfig === null || Array.isArray(recoveryConfig) ||
        typeof recoveryConfig.engineId !== "string" || recoveryConfig.engineId.trim() === "" ||
        !Array.isArray(recoveryConfig.strategies)
    ) {
        return "Invalid Input";
    }

    const validActions = ["LOG", "NOTIFY", "CACHE_FALLBACK", "CIRCUIT_BREAK", "RESTART"];

    for (const s of recoveryConfig.strategies) {
        if (
            typeof s.strategyName !== "string" ||
            !Array.isArray(s.applicableTypes) ||
            !Array.isArray(s.steps)
        ) {
            return "Invalid Input";
        }
        for (const step of s.steps) {
            if (
                typeof step.stepName !== "string" ||
                !validActions.includes(step.action) ||
                typeof step.shouldFail !== "boolean"
            ) {
                return "Invalid Input";
            }
        }
    }

    const { engineId, strategies } = recoveryConfig;

    // --- STEP 2: PROBLEM-01 CLASSIFICATION LOGIC (self-contained) ---

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

        const msg = String(error.message).toLowerCase();

        if (msg.includes("validation") || msg.includes("invalid")) return "VALIDATION_ERROR";
        if (msg.includes("unauthorized") || msg.includes("auth")) return "AUTH_ERROR";
        if (msg.includes("not found")) return "NOT_FOUND_ERROR";
        if (msg.includes("database") || msg.includes("db")) return "DB_ERROR";
        if (msg.includes("network") || msg.includes("timeout")) return "NETWORK_ERROR";

        return "UNKNOWN_ERROR";
    }

    // --- STEP 3: INTERNAL STATE ---

    const history = [];

    // --- STEP 4: EXECUTE A STRATEGY ---

    function runStrategy(strategy, error) {

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

    // --- STEP 5: RETURN ENGINE OBJECT ---

    return {

        recover(error) {

            if (
                typeof error !== "object" || error === null || Array.isArray(error) ||
                typeof error.message !== "string"
            ) {
                return "Invalid Input";
            }

            const type = (error.type && errorTypes[error.type]) ? error.type : classify(error);

            const strategy = strategies.find(s => s.applicableTypes.includes(type));

            if (!strategy) {
                const noStrategy = { recovered: false, reason: "No recovery strategy for: " + type };
                history.push(noStrategy);
                return noStrategy;
            }

            const result = runStrategy(strategy, error);

            history.push(result);

            return result;
        },

        executeStrategy(strategyName, error) {

            if (typeof strategyName !== "string") return "Invalid Input";

            const strategy = strategies.find(s => s.strategyName === strategyName);

            if (!strategy) {
                return { error: "Strategy not found: " + strategyName };
            }

            const result = runStrategy(strategy, error);

            history.push(result);

            return result;
        },

        getRecoveryHistory() {
            return history.slice();
        },

        getSuccessRate() {

            const totalAttempts = history.length;
            const succeeded = history.filter(r => r.recovered === true).length;
            const failed = history.filter(r => r.recovered === false).length;

            const successRate = totalAttempts === 0
                ? 0
                : Number(((succeeded / totalAttempts) * 100).toFixed(2));

            return { successRate, totalAttempts, succeeded, failed };
        }
    };
}


// ------ EXAMPLE USAGE ------

const engine = createRecoveryEngine({
    engineId: "RECOVERY-01",
    strategies: [
        {
            strategyName: "DBRecovery",
            applicableTypes: ["DB_ERROR", "NETWORK_ERROR"],
            steps: [
                { stepName: "LogError", action: "LOG", shouldFail: false },
                { stepName: "NotifyTeam", action: "NOTIFY", shouldFail: false },
                { stepName: "SwitchToCache", action: "CACHE_FALLBACK", shouldFail: false }
            ]
        },
        {
            strategyName: "ServerRecovery",
            applicableTypes: ["SERVER_ERROR"],
            steps: [
                { stepName: "LogError", action: "LOG", shouldFail: false },
                { stepName: "Restart", action: "RESTART", shouldFail: true }
            ]
        }
    ]
});

console.log(engine.recover({ type: "DB_ERROR", message: "Connection failed" }));

console.log(engine.recover({ type: "SERVER_ERROR", message: "Internal error" }));

console.log(engine.getSuccessRate());

console.log(engine.executeStrategy("DBRecovery", { type: "NETWORK_ERROR", message: "timeout" }));

console.log(engine.executeStrategy("Missing", { type: "DB_ERROR", message: "x" }));

// --- INVALID ---
console.log(createRecoveryEngine({ engineId: "", strategies: [] }));