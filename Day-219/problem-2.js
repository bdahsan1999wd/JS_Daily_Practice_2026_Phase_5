// 🧩 PROBLEM–02: createLoadBalancer()

// Logic: Creates a Load Balancer.

// Supports:
// 1. Select the next worker
// 2. Assign load
// 3. Release load
// 4. View load report

function createLoadBalancer(workers, strategy) {

    // --- STEP 1: VALIDATION ---
    // Validate workers array and strategy.

    if (
        !Array.isArray(workers) ||
        workers.length === 0 ||
        ![
            "ROUND_ROBIN",
            "LEAST_LOADED",
            "WEIGHTED"
        ].includes(strategy)
    ) {
        return "Invalid Input";
    }

    const isValidWorkers = workers.every(worker =>
        typeof worker === "object" &&
        worker !== null &&
        !Array.isArray(worker) &&
        typeof worker.workerId === "string" &&
        worker.workerId.trim() !== "" &&
        Number.isInteger(worker.capacity) &&
        worker.capacity >= 1 &&
        Number.isInteger(worker.currentLoad) &&
        worker.currentLoad >= 0 &&
        worker.currentLoad <= worker.capacity
    );

    if (!isValidWorkers) {
        return "Invalid Input";
    }

    // Clone workers to maintain internal state.

    const pool = workers.map(worker => ({
        ...worker
    }));

    // Used by Round Robin strategy.

    let currentIndex = 0;

    // --- STEP 2: HELPER FUNCTION ---
    // Returns workers that still have available capacity.

    function getAvailableWorkers() {

        return pool.filter(worker =>
            worker.currentLoad < worker.capacity
        );

    }

    // --- STEP 3: RETURN LOAD BALANCER OBJECT ---

    return {

        // -----------------------------
        // Select the next worker
        // -----------------------------
        getNextWorker() {

            const availableWorkers =
                getAvailableWorkers();

            if (availableWorkers.length === 0) {

                return {
                    error: "All workers at full capacity"
                };

            }

            let selectedWorker;

            // ROUND ROBIN

            if (strategy === "ROUND_ROBIN") {

                let checked = 0;

                while (checked < pool.length) {

                    const worker =
                        pool[currentIndex];

                    currentIndex =
                        (currentIndex + 1) %
                        pool.length;

                    checked++;

                    if (
                        worker.currentLoad <
                        worker.capacity
                    ) {

                        selectedWorker = worker;
                        break;

                    }

                }

            }

            // LEAST LOADED

            else if (
                strategy === "LEAST_LOADED"
            ) {

                selectedWorker =
                    availableWorkers.reduce(
                        (best, current) => {

                            const bestRatio =
                                best.currentLoad /
                                best.capacity;

                            const currentRatio =
                                current.currentLoad /
                                current.capacity;

                            return currentRatio <
                                bestRatio
                                ? current
                                : best;

                        }
                    );

            }

            // WEIGHTED

            else {

                selectedWorker =
                    availableWorkers.reduce(
                        (best, current) => {

                            const bestRemaining =
                                best.capacity -
                                best.currentLoad;

                            const currentRemaining =
                                current.capacity -
                                current.currentLoad;

                            return currentRemaining >
                                bestRemaining
                                ? current
                                : best;

                        }
                    );

            }

            return {
                workerId:
                    selectedWorker.workerId,
                strategy,
                currentLoad:
                    selectedWorker.currentLoad,
                capacity:
                    selectedWorker.capacity
            };

        },

        // -----------------------------
        // Assign load
        // -----------------------------
        assignLoad(workerId, amount) {

            if (
                typeof workerId !== "string" ||
                workerId.trim() === "" ||
                !Number.isInteger(amount) ||
                amount < 1
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

            if (
                worker.currentLoad + amount >
                worker.capacity
            ) {

                return {
                    error:
                        "Exceeds worker capacity"
                };

            }

            worker.currentLoad += amount;

            return {
                workerId,
                currentLoad:
                    worker.currentLoad,
                capacity:
                    worker.capacity
            };

        },

        // -----------------------------
        // Release load
        // -----------------------------
        releaseLoad(workerId, amount) {

            if (
                typeof workerId !== "string" ||
                workerId.trim() === "" ||
                !Number.isInteger(amount) ||
                amount < 1
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

            worker.currentLoad = Math.max(
                0,
                worker.currentLoad - amount
            );

            return {
                workerId,
                currentLoad:
                    worker.currentLoad
            };

        },

        // -----------------------------
        // Get load report
        // -----------------------------
        getLoadReport() {

            return pool.map(worker => ({

                workerId: worker.workerId,

                currentLoad:
                    worker.currentLoad,

                capacity:
                    worker.capacity,

                loadPercent: Number(
                    (
                        (worker.currentLoad /
                            worker.capacity) *
                        100
                    ).toFixed(1)
                ),

                status:
                    worker.currentLoad ===
                        worker.capacity
                        ? "FULL"
                        : "AVAILABLE"

            }));

        }

    };

}

// --- EXAMPLE USAGE ---
const lb = createLoadBalancer(

    [
        {
            workerId: "W-1",
            capacity: 10,
            currentLoad: 3
        },
        {
            workerId: "W-2",
            capacity: 10,
            currentLoad: 7
        },
        {
            workerId: "W-3",
            capacity: 10,
            currentLoad: 1
        }
    ],

    "LEAST_LOADED"

);

console.log(
    lb.getNextWorker()
);

console.log(
    lb.assignLoad("W-3", 5)
);

console.log(
    lb.releaseLoad("W-2", 2)
);

console.log(
    lb.getLoadReport()
);