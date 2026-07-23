// 🧩 PROBLEM–02: retryWithExponentialBackoff()

// Logic: Simulates retry attempts using an exponential backoff strategy. The first two attempts always fail, while the third attempt succeeds. Each retry records its simulated delay.

async function retryWithExponentialBackoff(taskId, maxRetries, baseDelayMs) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof taskId !== "string" ||
        taskId.trim() === "" ||
        typeof maxRetries !== "number" ||
        !Number.isInteger(maxRetries) ||
        maxRetries < 1 ||
        maxRetries > 5 ||
        typeof baseDelayMs !== "number" ||
        baseDelayMs <= 0
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: RETRY TASK ---
    const retryLog = [];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {

        const simulatedDelayMs =
            attempt === 1
                ? 0
                : baseDelayMs * Math.pow(2, attempt - 2);

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

            // --- STEP 3: RETURN SUCCESS ---
            return {
                taskId,
                status: "SUCCESS",
                attemptNumber: attempt,
                retryLog
            };

        }

    }

    // --- STEP 4: RETURN EXHAUSTED ---
    return {
        taskId,
        status: "EXHAUSTED",
        attemptNumber: null,
        retryLog
    };

}

// --- EXAMPLE USAGE ---
retryWithExponentialBackoff("T-X", 4, 100)
    .then(result => console.log(result))
    .catch(error => console.log(error));