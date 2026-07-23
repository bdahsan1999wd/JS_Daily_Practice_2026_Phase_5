// 🧩 PROBLEM–01: retryWithFixedInterval()

// Logic: Simulates a retry mechanism with a fixed retry interval. The task keeps retrying until it succeeds or the maximum retry limit is reached.

async function retryWithFixedInterval(taskId, maxRetries, failUntilAttempt) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof taskId !== "string" ||
        taskId.trim() === "" ||
        typeof maxRetries !== "number" ||
        !Number.isInteger(maxRetries) ||
        maxRetries < 1 ||
        maxRetries > 10 ||
        typeof failUntilAttempt !== "number" ||
        !Number.isInteger(failUntilAttempt) ||
        failUntilAttempt < 1 ||
        failUntilAttempt > 10
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: RETRY TASK ---
    const retryLog = [];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {

        if (attempt < failUntilAttempt) {

            retryLog.push({
                attempt,
                outcome: "FAILED"
            });

        } else {

            retryLog.push({
                attempt,
                outcome: "SUCCEEDED"
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
        retryLog
    };

}

// --- EXAMPLE USAGE ---
retryWithFixedInterval("T-A", 5, 3)
    .then(result => console.log(result))
    .catch(error => console.log(error));