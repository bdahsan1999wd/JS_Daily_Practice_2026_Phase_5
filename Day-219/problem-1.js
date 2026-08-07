// 🧩 PROBLEM–01: createWorkerPool()

// Logic: Creates a basic Worker Pool.

// Supports:
// 1. View all workers
// 2. Assign tasks
// 3. Complete tasks
// 4. Count available workers
// 5. View pool statistics

function createWorkerPool(poolSize) {

    // --- STEP 1: VALIDATION ---
    // poolSize must be an integer between 1 and 20.

    if (
        !Number.isInteger(poolSize) ||
        poolSize < 1 ||
        poolSize > 20
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: CREATE WORKERS ---
    // Initialize worker pool.

    const workers = [];

    for (let i = 1; i <= poolSize; i++) {

        workers.push({
            workerId: `W-${i}`,
            status: "IDLE",
            currentTaskId: null,
            tasksCompleted: 0
        });

    }

    // --- STEP 3: RETURN POOL METHODS ---

    return {

        // -----------------------------
        // Get all workers
        // -----------------------------
        getWorkers() {

            return workers.map(worker => ({
                ...worker
            }));

        },

        // -----------------------------
        // Assign a task
        // -----------------------------
        assignTask(taskId) {

            // Validate taskId.

            if (
                typeof taskId !== "string" ||
                taskId.trim() === ""
            ) {
                return "Invalid Input";
            }

            // Find first available worker.

            const worker = workers.find(worker =>
                worker.status === "IDLE"
            );

            if (!worker) {

                return {
                    assigned: false,
                    reason: "No workers available"
                };

            }

            worker.status = "BUSY";
            worker.currentTaskId = taskId;

            return {
                workerId: worker.workerId,
                taskId,
                assigned: true
            };

        },

        // -----------------------------
        // Complete a task
        // -----------------------------
        completeTask(workerId) {

            // Validate workerId.

            if (
                typeof workerId !== "string" ||
                workerId.trim() === ""
            ) {
                return "Invalid Input";
            }

            const worker = workers.find(worker =>
                worker.workerId === workerId
            );

            if (!worker) {

                return {
                    error: "Worker not found"
                };

            }

            if (worker.status === "IDLE") {

                return {
                    error: "Worker has no active task"
                };

            }

            worker.status = "IDLE";
            worker.currentTaskId = null;
            worker.tasksCompleted++;

            return {
                workerId,
                completed: true,
                tasksCompleted: worker.tasksCompleted
            };

        },

        // -----------------------------
        // Count available workers
        // -----------------------------
        getAvailableCount() {

            return workers.filter(worker =>
                worker.status === "IDLE"
            ).length;

        },

        // -----------------------------
        // Get pool statistics
        // -----------------------------
        getPoolStats() {

            return {
                poolSize: workers.length,
                idleCount: workers.filter(worker =>
                    worker.status === "IDLE"
                ).length,
                busyCount: workers.filter(worker =>
                    worker.status === "BUSY"
                ).length,
                totalTasksCompleted: workers.reduce(
                    (total, worker) =>
                        total + worker.tasksCompleted,
                    0
                )
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const pool = createWorkerPool(3);

console.log(pool.getWorkers());

console.log(
    pool.assignTask("TASK-1")
);

console.log(
    pool.assignTask("TASK-2")
);

console.log(
    pool.completeTask("W-1")
);

console.log(
    pool.getAvailableCount()
);

console.log(
    pool.getPoolStats()
);