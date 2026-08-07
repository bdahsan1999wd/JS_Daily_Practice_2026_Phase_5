// 🧩 PROBLEM–03: createHealthMonitor()

// Logic: Monitors worker health.

// Supports:
// 1. Check one worker's health
// 2. Check all workers
// 3. View health report
// 4. Restart DOWN workers

function createHealthMonitor(workers, healthConfig) {

    // --- STEP 1: VALIDATION ---
    // Validate workers and configuration.

    if (
        !Array.isArray(workers) ||
        workers.length === 0 ||
        typeof healthConfig !== "object" ||
        healthConfig === null ||
        Array.isArray(healthConfig)
    ) {
        return "Invalid Input";
    }

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

    const isValidWorkers = workers.every(worker =>
        typeof worker === "object" &&
        worker !== null &&
        !Array.isArray(worker) &&
        typeof worker.workerId === "string" &&
        worker.workerId.trim() !== "" &&
        ["HEALTHY", "DEGRADED", "DOWN"].includes(worker.status) &&
        typeof worker.errorRate === "number" &&
        worker.errorRate >= 0 &&
        worker.errorRate <= 1 &&
        typeof worker.avgResponseTimeMs === "number" &&
        worker.avgResponseTimeMs >= 0 &&
        typeof worker.tasksCompleted === "number" &&
        worker.tasksCompleted >= 0
    );

    if (!isValidWorkers) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STORAGE ---

    const pool = workers.map(worker => ({
        ...worker
    }));

    // --- STEP 3: HELPER FUNCTION ---
    // Determine worker status.

    function evaluateStatus(worker) {

        if (
            worker.errorRate >
            criticalErrorRate
        ) {
            return "DOWN";
        }

        if (
            worker.errorRate >
            errorRateThreshold ||
            worker.avgResponseTimeMs >
            responseTimeThresholdMs
        ) {
            return "DEGRADED";
        }

        return "HEALTHY";

    }

    // --- STEP 4: RETURN MONITOR OBJECT ---

    return {

        // -----------------------------
        // Check one worker
        // -----------------------------
        checkHealth(workerId) {

            if (
                typeof workerId !== "string" ||
                workerId.trim() === ""
            ) {
                return "Invalid Input";
            }

            const worker = pool.find(worker =>
                worker.workerId === workerId
            );

            if (!worker) {
                return {
                    error: "Worker not found"
                };
            }

            const oldStatus = worker.status;
            const newStatus =
                evaluateStatus(worker);

            worker.status = newStatus;

            return {
                workerId,
                oldStatus,
                newStatus,
                changed:
                    oldStatus !== newStatus
            };

        },

        // -----------------------------
        // Check all workers
        // -----------------------------
        checkAllHealth() {

            const statusChanges = [];

            for (const worker of pool) {

                const oldStatus =
                    worker.status;

                const newStatus =
                    evaluateStatus(worker);

                worker.status = newStatus;

                if (
                    oldStatus !== newStatus
                ) {

                    statusChanges.push({
                        workerId:
                            worker.workerId,
                        oldStatus,
                        newStatus
                    });

                }

            }

            return {
                checked: pool.length,
                statusChanges
            };

        },

        // -----------------------------
        // Get health report
        // -----------------------------
        getHealthReport() {

            return {

                healthyCount:
                    pool.filter(worker =>
                        worker.status ===
                        "HEALTHY"
                    ).length,

                degradedCount:
                    pool.filter(worker =>
                        worker.status ===
                        "DEGRADED"
                    ).length,

                downCount:
                    pool.filter(worker =>
                        worker.status ===
                        "DOWN"
                    ).length,

                workers: pool.map(worker => ({
                    ...worker
                }))

            };

        },

        // -----------------------------
        // Restart a DOWN worker
        // -----------------------------
        restartWorker(workerId) {

            if (
                typeof workerId !== "string" ||
                workerId.trim() === ""
            ) {
                return "Invalid Input";
            }

            const worker = pool.find(worker =>
                worker.workerId === workerId
            );

            if (!worker) {

                return {
                    error:
                        "Worker not found"
                };

            }

            if (
                worker.status !== "DOWN"
            ) {

                return {
                    error:
                        "Worker is not DOWN"
                };

            }

            worker.status = "HEALTHY";
            worker.errorRate = 0;
            worker.avgResponseTimeMs = 0;

            return {
                workerId,
                restarted: true,
                status: "HEALTHY"
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const monitor = createHealthMonitor(

    [
        {
            workerId: "W-1",
            status: "HEALTHY",
            errorRate: 0.02,
            avgResponseTimeMs: 120,
            tasksCompleted: 500
        },
        {
            workerId: "W-2",
            status: "HEALTHY",
            errorRate: 0.15,
            avgResponseTimeMs: 80,
            tasksCompleted: 300
        },
        {
            workerId: "W-3",
            status: "HEALTHY",
            errorRate: 0.60,
            avgResponseTimeMs: 200,
            tasksCompleted: 100
        }
    ],

    {
        errorRateThreshold: 0.10,
        criticalErrorRate: 0.50,
        responseTimeThresholdMs: 500
    }

);

console.log(
    monitor.checkAllHealth()
);

console.log(
    monitor.getHealthReport()
);

console.log(
    monitor.restartWorker("W-3")
);

console.log(
    monitor.getHealthReport()
);