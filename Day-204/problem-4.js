// 🧩 PROBLEM–04: executeWithFallback()

// Logic: Attempts the primary task first. If it fails, executes fallback tasks one by one until one succeeds. If all fail, returns ALL_FAILED along with the execution path.

async function executeWithFallback(primaryTaskId, fallbackTaskIds) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof primaryTaskId !== "string" ||
        primaryTaskId.trim() === "" ||
        !Array.isArray(fallbackTaskIds) ||
        fallbackTaskIds.length === 0 ||
        !fallbackTaskIds.every(taskId =>
            typeof taskId === "string" &&
            taskId.trim() !== ""
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: EXECUTE PRIMARY TASK ---
    const executionPath = [];

    if (primaryTaskId.includes("OK")) {

        executionPath.push({
            taskId: primaryTaskId,
            tried: true,
            succeeded: true
        });

        return {
            taskId: primaryTaskId,
            source: "PRIMARY",
            status: "SUCCESS",
            executionPath
        };

    }

    executionPath.push({
        taskId: primaryTaskId,
        tried: true,
        succeeded: false
    });

    // --- STEP 3: EXECUTE FALLBACK TASKS ---
    for (let i = 0; i < fallbackTaskIds.length; i++) {

        const taskId = fallbackTaskIds[i];

        if (taskId.includes("OK")) {

            executionPath.push({
                taskId,
                tried: true,
                succeeded: true
            });

            return {
                taskId,
                source: "FALLBACK",
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

    // --- STEP 4: RETURN ALL FAILED ---
    return {
        status: "ALL_FAILED",
        primaryTaskId,
        attemptedFallbacks: fallbackTaskIds.length,
        executionPath
    };

}

// --- EXAMPLE USAGE ---
executeWithFallback(
    "BAD-primary",
    [
        "BAD-fb1",
        "OK-fb2",
        "OK-fb3"
    ]
)
    .then(result => console.log(result))
    .catch(error => console.log(error));