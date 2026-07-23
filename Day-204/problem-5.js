// 🧩 PROBLEM–05: runResilienceOrchestrator()

// Logic: Orchestrates retry with exponential backoff and fallback strategy. If the primary task succeeds during retries, returns immediately. Otherwise, executes fallback tasks sequentially.

async function runResilienceOrchestrator(config) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof config !== "object" ||
        config === null ||
        typeof config.taskId !== "string" ||
        config.taskId.trim() === "" ||
        typeof config.maxRetries !== "number" ||
        !Number.isInteger(config.maxRetries) ||
        config.maxRetries < 1 ||
        config.maxRetries > 5 ||
        typeof config.baseDelayMs !== "number" ||
        config.baseDelayMs <= 0 ||
        typeof config.failureThreshold !== "number" ||
        !Number.isInteger(config.failureThreshold) ||
        config.failureThreshold < 1 ||
        config.failureThreshold > 10 ||
        !Array.isArray(config.fallbackIds) ||
        !config.fallbackIds.every(id =>
            typeof id === "string" &&
            id.trim() !== ""
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: RETRY PRIMARY TASK ---
    const retryLog = [];

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {

        const simulatedDelayMs =
            attempt === 1
                ? 0
                : config.baseDelayMs * Math.pow(2, attempt - 2);

        if (attempt < 3) {

            retryLog.push({
                attempt,
                outcome: "FAILED",
                simulatedDelayMs
            });

        } else {

            retryLog.push({
                attempt,
                outcome: "SUCCEEDED",
                simulatedDelayMs
            });

            return {
                source: "PRIMARY_RETRY",
                taskId: config.taskId,
                status: "SUCCESS",
                attemptNumber: attempt,
                retryLog
            };

        }

    }

    // --- STEP 3: EXECUTE FALLBACK TASKS ---
    const executionPath = [];

    for (let i = 0; i < config.fallbackIds.length; i++) {

        const taskId = config.fallbackIds[i];

        if (taskId.includes("OK")) {

            executionPath.push({
                taskId,
                tried: true,
                succeeded: true
            });

            return {
                source: "FALLBACK",
                taskId,
                status: "SUCCESS",
                fallbackIndex: i,
                executionPath
            };

        }

        executionPath.push({
            taskId,
            tried: true,
            succeeded: false
        });

    }

    // --- STEP 4: RETURN COMPLETELY FAILED ---
    return {
        source: "NONE",
        status: "COMPLETELY_FAILED",
        taskId: config.taskId
    };

}

// --- EXAMPLE USAGE ---
runResilienceOrchestrator({
    taskId: "BAD-main",
    maxRetries: 2,
    baseDelayMs: 100,
    failureThreshold: 3,
    fallbackIds: [
        "BAD-fb1",
        "OK-fb2"
    ]
})
    .then(result => console.log(result))
    .catch(error => console.log(error));