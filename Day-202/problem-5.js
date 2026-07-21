// 🧩 PROBLEM–05: runTaskPipelineOrchestrator()

// Logic: Creates tasks, assigns queue positions, sorts them by priority, executes each task sequentially with retry logic, and returns the final orchestration report.

async function runTaskPipelineOrchestrator(taskBatch) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(taskBatch) ||
        taskBatch.length === 0 ||
        !taskBatch.every(task =>
            typeof task === "object" &&
            task !== null &&
            typeof task.taskId === "string" &&
            task.taskId.trim() !== "" &&
            typeof task.taskName === "string" &&
            task.taskName.trim() !== "" &&
            ["LOW", "MEDIUM", "HIGH"].includes(task.priority) &&
            typeof task.maxRetries === "number" &&
            Number.isInteger(task.maxRetries) &&
            task.maxRetries >= 1 &&
            task.maxRetries <= 5
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CREATE TASKS WITH QUEUE POSITION ---
    const queuedTasks = taskBatch
        .map(task => {

            let queuePosition = 10;

            if (task.priority === "HIGH") {
                queuePosition = 1;
            }
            else if (task.priority === "MEDIUM") {
                queuePosition = 5;
            }

            return {
                ...task,
                status: "QUEUED",
                queuePosition
            };

        })
        .sort((a, b) => a.queuePosition - b.queuePosition);

    // --- STEP 3: EXECUTE TASKS SEQUENTIALLY ---
    const orchestrationLog = [];
    let totalCompleted = 0;
    let totalExhausted = 0;

    for (const task of queuedTasks) {

        let completed = false;

        for (let attempt = 1; attempt <= task.maxRetries; attempt++) {

            if (attempt >= 3) {

                orchestrationLog.push({
                    taskId: task.taskId,
                    taskName: task.taskName,
                    priority: task.priority,
                    queuePosition: task.queuePosition,
                    finalStatus: "COMPLETED",
                    attemptsNeeded: attempt
                });

                totalCompleted++;
                completed = true;
                break;
            }

        }

        if (!completed) {

            orchestrationLog.push({
                taskId: task.taskId,
                taskName: task.taskName,
                priority: task.priority,
                queuePosition: task.queuePosition,
                finalStatus: "EXHAUSTED",
                attemptsNeeded: null
            });

            totalExhausted++;

        }

    }

    // --- STEP 4: RETURN RESULT ---
    return {
        orchestrationLog,
        totalCompleted,
        totalExhausted
    };

}

// --- EXAMPLE USAGE ---
runTaskPipelineOrchestrator([
    {
        taskId: "T-A",
        taskName: "Send Email",
        priority: "LOW",
        maxRetries: 3
    },
    {
        taskId: "T-B",
        taskName: "Process Payment",
        priority: "HIGH",
        maxRetries: 2
    },
    {
        taskId: "T-C",
        taskName: "Generate Report",
        priority: "MEDIUM",
        maxRetries: 4
    }
])
    .then(result => console.log(result))
    .catch(error => console.log(error));