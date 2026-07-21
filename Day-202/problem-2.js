// 🧩 PROBLEM–02: executeTasksSequentially()

// Logic: Executes tasks one by one using async/await. Even if one task fails, the remaining tasks continue executing. Finally returns the execution summary.

async function executeTasksSequentially(tasks) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(tasks) ||
        tasks.length === 0 ||
        !tasks.every(task =>
            typeof task === "object" &&
            task !== null &&
            typeof task.taskId === "string" &&
            task.taskId.trim() !== "" &&
            typeof task.taskName === "string" &&
            task.taskName.trim() !== ""
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: HELPER FUNCTION ---
    function executeTask(task) {

        return new Promise((resolve, reject) => {

            if (task.taskId.includes("FAIL")) {
                reject("Task failed: " + task.taskId);
            } else {
                resolve({
                    taskId: task.taskId,
                    taskName: task.taskName,
                    status: "COMPLETED"
                });
            }

        });

    }

    // --- STEP 3: EXECUTE TASKS SEQUENTIALLY ---
    const executionLog = [];
    let completedCount = 0;
    let failedCount = 0;

    for (const task of tasks) {

        try {

            const result = await executeTask(task);

            executionLog.push({
                taskId: task.taskId,
                success: true,
                result
            });

            completedCount++;

        } catch (error) {

            executionLog.push({
                taskId: task.taskId,
                success: false,
                error
            });

            failedCount++;

        }

    }

    // --- STEP 4: RETURN RESULT ---
    return {
        executionLog,
        completedCount,
        failedCount
    };

}

// --- EXAMPLE USAGE ---
executeTasksSequentially([
    { taskId: "T-01", taskName: "Backup" },
    { taskId: "T-FAIL-02", taskName: "Send Report" },
    { taskId: "T-03", taskName: "Cleanup" }
])
    .then(result => console.log(result))
    .catch(error => console.log(error));