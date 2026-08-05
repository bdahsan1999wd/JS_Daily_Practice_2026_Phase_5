// 🧩 PROBLEM–05: runJobQueueOrchestrator()

// Logic: Simulates the complete Job Queue pipeline.

// Steps:

// 1. Enqueue all jobs into a priority queue.
// 2. Process jobs in priority order.
// 3. Retry failed jobs up to maxRetries.
// 4. Move permanently failed jobs to the Dead Letter Queue (DLQ).
// 5. Build the final processing report.

function runJobQueueOrchestrator(queueConfig) {

    // --- STEP 1: VALIDATION ---
    // queueConfig must be a valid object.

    if (
        typeof queueConfig !== "object" ||
        queueConfig === null ||
        Array.isArray(queueConfig)
    ) {
        return "Invalid Input";
    }

    const {
        queueId,
        maxConcurrent,
        maxRetries,
        dlqLimit,
        jobs
    } = queueConfig;

    // Validate required configuration.

    if (
        typeof queueId !== "string" ||
        queueId.trim() === "" ||
        !Number.isInteger(maxConcurrent) ||
        maxConcurrent < 1 ||
        maxConcurrent > 10 ||
        !Number.isInteger(maxRetries) ||
        maxRetries < 1 ||
        maxRetries > 5 ||
        !Number.isInteger(dlqLimit) ||
        dlqLimit < 1 ||
        !Array.isArray(jobs)
    ) {
        return "Invalid Input";
    }

    // Validate every job.

    const isValidJobs = jobs.every(job =>
        typeof job === "object" &&
        job !== null &&
        !Array.isArray(job) &&
        typeof job.jobId === "string" &&
        job.jobId.trim() !== "" &&
        typeof job.jobType === "string" &&
        job.jobType.trim() !== "" &&
        Number.isInteger(job.priority) &&
        job.priority >= 1 &&
        job.priority <= 10 &&
        typeof job.payload === "object" &&
        job.payload !== null &&
        !Array.isArray(job.payload) &&
        Number.isInteger(job.failUntilAttempt) &&
        job.failUntilAttempt >= 1
    );

    if (!isValidJobs) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD PRIORITY QUEUE ---
    // Higher priority jobs come first.
    // Same priority → FIFO.

    const priorityQueue = jobs
        .map((job, index) => ({
            ...job,
            enqueueOrder: index
        }))
        .sort((a, b) => {

            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }

            return a.enqueueOrder - b.enqueueOrder;

        });

    // --- STEP 3: PROCESS JOBS ---

    const processingOrder = [];
    const completedJobs = [];
    const dlqJobs = [];

    let totalBatches = 0;

    // Process jobs batch-by-batch.

    while (priorityQueue.length > 0) {

        totalBatches++;

        const currentBatch = priorityQueue.splice(
            0,
            maxConcurrent
        );

        // Process every job in this batch.

        for (const job of currentBatch) {

            processingOrder.push(job.jobId);

            let attempt = 0;
            let completed = false;

            // Retry until success or retries exhausted.

            while (attempt < maxRetries) {

                attempt++;

                if (
                    attempt >= job.failUntilAttempt
                ) {
                    completed = true;
                    break;
                }

            }

            // Store final result.

            if (completed) {

                completedJobs.push(job.jobId);

            } else if (
                dlqJobs.length < dlqLimit
            ) {

                dlqJobs.push(job.jobId);

            }

        }

    }

    // --- STEP 4: CALCULATE SUCCESS RATE ---

    const successRate = Number(
        (
            (completedJobs.length / jobs.length) * 100
        ).toFixed(2)
    );

    // --- STEP 5: RETURN RESULT ---

    return {
        queueId,
        processingOrder,
        completedJobs,
        dlqJobs,
        totalBatches,
        successRate
    };

}

// --- EXAMPLE USAGE ---
console.log(

    runJobQueueOrchestrator({

        queueId: "Q-01",
        maxConcurrent: 2,
        maxRetries: 3,
        dlqLimit: 5,

        jobs: [

            {
                jobId: "J-A",
                jobType: "EMAIL",
                priority: 8,
                payload: {},
                failUntilAttempt: 1
            },

            {
                jobId: "J-B",
                jobType: "SMS",
                priority: 5,
                payload: {},
                failUntilAttempt: 2
            },

            {
                jobId: "J-C",
                jobType: "PUSH",
                priority: 9,
                payload: {},
                failUntilAttempt: 5
            },

            {
                jobId: "J-D",
                jobType: "REPORT",
                priority: 3,
                payload: {},
                failUntilAttempt: 1
            }

        ]

    })

);