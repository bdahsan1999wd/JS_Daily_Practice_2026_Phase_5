// 🧩 PROBLEM–03: executeWithCircuitBreaker()

// Logic: Simulates the Circuit Breaker pattern. If consecutive failures reach the threshold, the circuit opens and all remaining tasks are skipped.

async function executeWithCircuitBreaker(tasks, failureThreshold) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(tasks) ||
        tasks.length === 0 ||
        !tasks.every(task =>
            typeof task === "string" &&
            task.trim() !== ""
        ) ||
        typeof failureThreshold !== "number" ||
        !Number.isInteger(failureThreshold) ||
        failureThreshold < 1 ||
        failureThreshold > 10
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: EXECUTE TASKS ---
    const results = [];
    let consecutiveFailures = 0;
    let circuitOpened = false;

    for (const taskId of tasks) {

        if (circuitOpened) {

            results.push({
                taskId,
                status: "SKIPPED_CIRCUIT_OPEN"
            });

            continue;

        }

        if (taskId.includes("OK")) {

            results.push({
                taskId,
                status: "COMPLETED"
            });

            consecutiveFailures = 0;

        } else {

            results.push({
                taskId,
                status: "FAILED"
            });

            consecutiveFailures++;

            if (consecutiveFailures >= failureThreshold) {
                circuitOpened = true;
            }

        }

    }

    // --- STEP 3: RETURN RESULT ---
    return {
        results,
        circuitOpened
    };

}

// --- EXAMPLE USAGE ---
executeWithCircuitBreaker(
    [
        "OK-1",
        "BAD-2",
        "BAD-3",
        "OK-4",
        "BAD-5"
    ],
    2
)
    .then(result => console.log(result))
    .catch(error => console.log(error));