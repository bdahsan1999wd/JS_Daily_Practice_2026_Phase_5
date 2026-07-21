// 🧩 PROBLEM–04: executeWithRetry()

// Logic: Simulates an unreliable task using async/await. The first two attempts always fail, while the third attempt succeeds. If retries are exhausted, returns EXHAUSTED.

async function executeWithRetry(taskId, maxRetries) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof taskId !== "string" ||
        taskId.trim() === "" ||
        typeof maxRetries !== "number" ||
        !Number.isInteger(maxRetries) ||
        maxRetries < 1 ||
        maxRetries > 5
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: INITIALIZE VARIABLES ---
    const attemptLog = [];

    // --- STEP 3: RETRY LOOP ---
    for (let attempt = 1; attempt <= maxRetries; attempt++) {

        try {

            await new Promise((resolve, reject) => {

                if (attempt <= 2) {
                    reject(`Attempt ${attempt} failed`);
                } else {
                    resolve();
                }

            });

            attemptLog.push({
                attempt,
                outcome: "SUCCEEDED"
            });

            return {
                taskId,
                status: "COMPLETED",
                attemptsNeeded: attempt,
                attemptLog
            };

        } catch (error) {

            attemptLog.push({
                attempt,
                outcome: "FAILED"
            });

        }

    }

    // --- STEP 4: RETURN FINAL RESULT ---
    return {
        taskId,
        status: "EXHAUSTED",
        attemptLog
    };

}

// --- EXAMPLE USAGE ---
executeWithRetry("T-001", 3)
    .then(result => console.log(result))
    .catch(error => console.log(error));