// 🧩 PROBLEM–04: createAutoScalingPool()

// Logic: Simulates an Auto-Scaling Worker Pool.

// Features:
// 1. Add tasks to available workers
// 2. Complete tasks
// 3. Automatically scale up/down
// 4. View current pool state
// 5. View scaling history

function createAutoScalingPool(scalingConfig) {

    // --- STEP 1: VALIDATION ---
    // scalingConfig must be a valid object.

    if (
        typeof scalingConfig !== "object" ||
        scalingConfig === null ||
        Array.isArray(scalingConfig)
    ) {
        return "Invalid Input";
    }

    const {
        minWorkers,
        maxWorkers,
        scaleUpThreshold,
        scaleDownThreshold,
        scaleStep
    } = scalingConfig;

    // Validate configuration.

    if (
        !Number.isInteger(minWorkers) ||
        minWorkers < 1 ||
        !Number.isInteger(maxWorkers) ||
        maxWorkers <= minWorkers ||
        typeof scaleUpThreshold !== "number" ||
        scaleUpThreshold < 0 ||
        scaleUpThreshold > 1 ||
        typeof scaleDownThreshold !== "number" ||
        scaleDownThreshold < 0 ||
        scaleDownThreshold > 1 ||
        !Number.isInteger(scaleStep) ||
        scaleStep < 1
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STORAGE ---

    const workers = [];
    const scalingHistory = [];

    let nextWorkerNumber = 1;

    // Create initial workers.

    for (let i = 0; i < minWorkers; i++) {

        workers.push({
            workerId: `W-${nextWorkerNumber++}`,
            status: "IDLE",
            currentTaskId: null
        });

    }

    // --- STEP 3: RETURN POOL OBJECT ---

    return {

        // -----------------------------
        // Assign multiple tasks
        // -----------------------------
        addTasks(taskIds) {

            if (
                !Array.isArray(taskIds) ||
                !taskIds.every(task =>
                    typeof task === "string" &&
                    task.trim() !== ""
                )
            ) {
                return "Invalid Input";
            }

            let assigned = 0;
            const unassignedTaskIds = [];

            for (const taskId of taskIds) {

                const worker = workers.find(
                    worker => worker.status === "IDLE"
                );

                if (!worker) {

                    unassignedTaskIds.push(taskId);
                    continue;

                }

                worker.status = "BUSY";
                worker.currentTaskId = taskId;

                assigned++;

            }

            return {
                assigned,
                unassigned: unassignedTaskIds.length,
                unassignedTaskIds
            };

        },

        // -----------------------------
        // Complete tasks
        // -----------------------------
        completeTasks(workerIds) {

            if (
                !Array.isArray(workerIds) ||
                !workerIds.every(id =>
                    typeof id === "string" &&
                    id.trim() !== ""
                )
            ) {
                return "Invalid Input";
            }

            let completed = 0;

            for (const workerId of workerIds) {

                const worker = workers.find(
                    worker => worker.workerId === workerId
                );

                if (
                    worker &&
                    worker.status === "BUSY"
                ) {

                    worker.status = "IDLE";
                    worker.currentTaskId = null;

                    completed++;

                }

            }

            return {
                completed
            };

        },

        // -----------------------------
        // Evaluate scaling
        // -----------------------------
        evaluateScaling() {

            const busyCount =
                workers.filter(worker =>
                    worker.status === "BUSY"
                ).length;

            const busyRatio =
                busyCount / workers.length;

            // SCALE UP

            if (
                busyRatio > scaleUpThreshold &&
                workers.length < maxWorkers
            ) {

                const workersToAdd = Math.min(
                    scaleStep,
                    maxWorkers - workers.length
                );

                for (let i = 0; i < workersToAdd; i++) {

                    workers.push({
                        workerId: `W-${nextWorkerNumber++}`,
                        status: "IDLE",
                        currentTaskId: null
                    });

                }

                const event = {
                    event: "SCALE_UP",
                    workersAdded: workersToAdd,
                    totalWorkers: workers.length,
                    busyRatio
                };

                scalingHistory.push(event);

                return event;

            }

            // SCALE DOWN

            if (
                busyRatio < scaleDownThreshold &&
                workers.length > minWorkers
            ) {

                let removable =
                    Math.min(
                        scaleStep,
                        workers.length - minWorkers
                    );

                for (
                    let i = workers.length - 1;
                    i >= 0 && removable > 0;
                    i--
                ) {

                    if (
                        workers[i].status === "IDLE"
                    ) {

                        workers.splice(i, 1);

                        removable--;

                    }

                }

                const removed =
                    Math.min(
                        scaleStep,
                        workers.length + removable - minWorkers >= 0
                            ? scaleStep - removable
                            : 0
                    );

                const event = {
                    event: "SCALE_DOWN",
                    workersRemoved: removed,
                    totalWorkers: workers.length,
                    busyRatio
                };

                scalingHistory.push(event);

                return event;

            }

            return {
                event: "NO_CHANGE",
                totalWorkers: workers.length,
                busyRatio
            };

        },

        // -----------------------------
        // Get current pool state
        // -----------------------------
        getPoolState() {

            const idleCount =
                workers.filter(worker =>
                    worker.status === "IDLE"
                ).length;

            const busyCount =
                workers.length - idleCount;

            return {
                totalWorkers: workers.length,
                idleCount,
                busyCount,
                busyRatio:
                    busyCount / workers.length
            };

        },

        // -----------------------------
        // Get scaling history
        // -----------------------------
        getScalingHistory() {

            return [...scalingHistory];

        }

    };

}

// --- EXAMPLE USAGE ---
const pool = createAutoScalingPool({

    minWorkers: 2,
    maxWorkers: 6,
    scaleUpThreshold: 0.7,
    scaleDownThreshold: 0.3,
    scaleStep: 2

});

console.log(pool.getPoolState());

console.log(

    pool.addTasks([
        "T-1",
        "T-2",
        "T-3"
    ])

);

console.log(pool.getPoolState());

console.log(pool.evaluateScaling());

console.log(

    pool.completeTasks([
        "W-1",
        "W-2"
    ])

);

console.log(pool.evaluateScaling());

console.log(pool.getScalingHistory());