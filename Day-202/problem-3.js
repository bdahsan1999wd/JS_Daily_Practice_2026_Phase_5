// 🧩 PROBLEM–03: executeTasksWithTimeout()

// Logic: Simulates parallel task execution using Promise.race(). Each task races against a timeout. Finally, all task results are collected using Promise.all().

function executeTasksWithTimeout(tasks, timeoutMs) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(tasks) ||
        tasks.length === 0 ||
        typeof timeoutMs !== "number" ||
        timeoutMs <= 0 ||
        !tasks.every(task =>
            typeof task === "object" &&
            task !== null &&
            typeof task.taskId === "string" &&
            task.taskId.trim() !== "" &&
            typeof task.durationMs === "number" &&
            task.durationMs > 0
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CREATE RACE PROMISES ---
    const taskPromises = tasks.map(task => {

        const taskPromise = new Promise(resolve => {

            if (task.durationMs <= timeoutMs) {
                resolve({
                    taskId: task.taskId,
                    status: "COMPLETED",
                    durationMs: task.durationMs
                });
            }
        });

        const timeoutPromise = new Promise(resolve => {

            if (task.durationMs > timeoutMs) {
                resolve({
                    taskId: task.taskId,
                    status: "TIMED_OUT",
                    durationMs: task.durationMs
                });
            }
        });

        return Promise.race([
            taskPromise,
            timeoutPromise
        ]);

    });

    // --- STEP 3: PROCESS RESULTS ---
    return Promise.all(taskPromises)
        .then(results => {

            const completedCount = results.filter(
                task => task.status === "COMPLETED"
            ).length;

            const timedOutCount = results.filter(
                task => task.status === "TIMED_OUT"
            ).length;

            return {
                results,
                completedCount,
                timedOutCount
            };

        });

}

// --- EXAMPLE USAGE ---
executeTasksWithTimeout(
    [
        { taskId: "T-1", durationMs: 100 },
        { taskId: "T-2", durationMs: 500 },
        { taskId: "T-3", durationMs: 200 }
    ],
    300
)
    .then(result => console.log(result))
    .catch(error => console.log(error));