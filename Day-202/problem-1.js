// 🧩 PROBLEM–01: createTask()

// Logic: Simulates task creation and queue assignment. Priority determines the queue position in the task manager.

function createTask(taskData) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof taskData !== "object" ||
        taskData === null ||
        typeof taskData.taskId !== "string" ||
        taskData.taskId.trim() === "" ||
        typeof taskData.taskName !== "string" ||
        taskData.taskName.trim() === "" ||
        typeof taskData.priority !== "string"
    ) {
        return Promise.reject("Invalid Input");
    }

    const validPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (!validPriorities.includes(taskData.priority)) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CREATE TASK PROMISE ---
    return new Promise((resolve) => {

        let queuePosition = 0;

        if (taskData.priority === "HIGH") {
            queuePosition = 1;
        }
        else if (taskData.priority === "MEDIUM") {
            queuePosition = 5;
        }
        else {
            queuePosition = 10;
        }

        // --- STEP 3: RETURN RESULT ---
        resolve({
            ...taskData,
            status: "QUEUED",
            queuePosition
        });

    });

}

// --- EXAMPLE USAGE ---
createTask({
    taskId: "T-01",
    taskName: "Send Email",
    priority: "HIGH"
})
    .then(task => console.log(task))
    .catch(error => console.log(error));