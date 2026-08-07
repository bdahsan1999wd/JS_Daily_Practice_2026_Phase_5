// 🧩 PROBLEM–05: runWorkerPoolOrchestrator()

// Logic: Simulates the complete Worker Pool pipeline.

// Steps:
// 1. Initialize worker pool.
// 2. Assign tasks.
// 3. Scale up when pool becomes full.
// 4. Process all assigned tasks.
// 5. Perform health checks.
// 6. Scale down if utilization becomes low.
// 7. Build final report.

function runWorkerPoolOrchestrator(poolConfig) {

    // --- STEP 1: VALIDATION ---
    // poolConfig must be a valid object.

    if (
        typeof poolConfig !== "object" ||
        poolConfig === null ||
        Array.isArray(poolConfig)
    ) {
        return "Invalid Input";
    }

    const {
        poolId,
        minWorkers,
        maxWorkers,
        scaleUpThreshold,
        scaleDownThreshold,
        scaleStep,
        healthConfig,
        tasks,
        workerMetrics
    } = poolConfig;

    // Validate basic configuration.

    if (
        typeof poolId !== "string" ||
        poolId.trim() === "" ||
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
        scaleStep < 1 ||
        typeof healthConfig !== "object" ||
        healthConfig === null ||
        Array.isArray(healthConfig) ||
        !Array.isArray(tasks) ||
        !Array.isArray(workerMetrics)
    ) {
        return "Invalid Input";
    }

    // Validate health configuration.

    const {
        errorRateThreshold,
        criticalErrorRate,
        responseTimeThresholdMs
    } = healthConfig;

    if (
        typeof errorRateThreshold !== "number" ||
        errorRateThreshold < 0 ||
        errorRateThreshold > 1 ||
        typeof criticalErrorRate !== "number" ||
        criticalErrorRate < 0 ||
        criticalErrorRate > 1 ||
        typeof responseTimeThresholdMs !== "number" ||
        responseTimeThresholdMs <= 0
    ) {
        return "Invalid Input";
    }

    // Validate tasks.

    const validTasks = tasks.every(task =>
        typeof task === "object" &&
        task !== null &&
        !Array.isArray(task) &&
        typeof task.taskId === "string" &&
        task.taskId.trim() !== "" &&
        typeof task.payload === "object" &&
        task.payload !== null &&
        !Array.isArray(task.payload) &&
        typeof task.shouldFail === "boolean"
    );

    if (!validTasks) {
        return "Invalid Input";
    }

    // --- STEP 2: CREATE INITIAL WORKERS ---

    const workers = [];

    let nextWorkerNumber = 1;

    for (let i = 0; i < minWorkers; i++) {

        workers.push({
            workerId: `W-${nextWorkerNumber++}`,
            status: "IDLE",
            currentTask: null
        });

    }

    const scalingEvents = [];

    let tasksAssigned = 0;
    let tasksCompleted = 0;
    let tasksFailed = 0;

    // --- STEP 3: ASSIGN TASKS ---

    let index = 0;

    while (index < tasks.length) {

        let worker = workers.find(
            worker => worker.status === "IDLE"
        );

        // Pool full → scale up.

        if (!worker) {

            const busyRatio =
                workers.filter(worker =>
                    worker.status === "BUSY"
                ).length / workers.length;

            if (
                busyRatio > scaleUpThreshold &&
                workers.length < maxWorkers
            ) {

                const addCount = Math.min(
                    scaleStep,
                    maxWorkers - workers.length
                );

                for (let i = 0; i < addCount; i++) {

                    workers.push({
                        workerId: `W-${nextWorkerNumber++}`,
                        status: "IDLE",
                        currentTask: null
                    });

                }

                scalingEvents.push({
                    event: "SCALE_UP",
                    workersAdded: addCount,
                    totalWorkers: workers.length,
                    busyRatio
                });

                worker = workers.find(
                    worker => worker.status === "IDLE"
                );

            }

        }

        if (!worker) {
            break;
        }

        worker.status = "BUSY";
        worker.currentTask = tasks[index];

        tasksAssigned++;

        index++;

    }

    // --- STEP 4: PROCESS TASKS ---

    for (const worker of workers) {

        if (
            worker.status !== "BUSY"
        ) {
            continue;
        }

        if (
            worker.currentTask.shouldFail
        ) {

            tasksFailed++;

        } else {

            tasksCompleted++;

        }

        worker.status = "IDLE";
        worker.currentTask = null;

    }

    // --- STEP 5: HEALTH CHECK ---

    let healthyCount = 0;
    let degradedCount = 0;
    let downCount = 0;

    for (const metric of workerMetrics) {

        if (
            metric.errorRate >
            criticalErrorRate
        ) {

            downCount++;

        } else if (

            metric.errorRate >
            errorRateThreshold ||

            metric.avgResponseTimeMs >
            responseTimeThresholdMs

        ) {

            degradedCount++;

        } else {

            healthyCount++;

        }

    }

    // --- STEP 6: SCALE DOWN ---

    const busyWorkers =
        workers.filter(worker =>
            worker.status === "BUSY"
        ).length;

    const busyRatio =
        busyWorkers / workers.length;

    if (
        busyRatio < scaleDownThreshold &&
        workers.length > minWorkers
    ) {

        const removable =
            Math.min(
                scaleStep,
                workers.length - minWorkers
            );

        workers.splice(
            workers.length - removable,
            removable
        );

        scalingEvents.push({
            event: "SCALE_DOWN",
            workersRemoved: removable,
            totalWorkers: workers.length,
            busyRatio
        });

    }

    // --- STEP 7: RETURN REPORT ---

    return {

        poolId,

        tasksAssigned,

        tasksCompleted,

        tasksFailed,

        scalingEvents,

        healthSummary: {

            healthyCount,

            degradedCount,

            downCount

        }

    };

}

// --- EXAMPLE USAGE ---
const result = runWorkerPoolOrchestrator({

    poolId: "POOL-01",

    minWorkers: 2,

    maxWorkers: 6,

    scaleUpThreshold: 0.7,

    scaleDownThreshold: 0.2,

    scaleStep: 2,

    healthConfig: {

        errorRateThreshold: 0.10,

        criticalErrorRate: 0.50,

        responseTimeThresholdMs: 500

    },

    tasks: [

        {
            taskId: "T-1",
            payload: {},
            shouldFail: false
        },

        {
            taskId: "T-2",
            payload: {},
            shouldFail: false
        },

        {
            taskId: "T-3",
            payload: {},
            shouldFail: true
        }

    ],

    workerMetrics: [

        {
            workerId: "W-1",
            errorRate: 0.05,
            avgResponseTimeMs: 100
        },

        {
            workerId: "W-2",
            errorRate: 0.60,
            avgResponseTimeMs: 200
        }

    ]

});

console.log(result);