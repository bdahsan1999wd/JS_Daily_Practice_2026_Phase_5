// 🧩 PROBLEM–04: createDLQManager()

// Logic: Simulates a Dead Letter Queue (DLQ) manager.

// Features:

// 1. Submit jobs
// 2. Process jobs with retry logic
// 3. Store failed jobs in DLQ
// 4. Retry jobs from DLQ
// 5. Show DLQ statistics

function createDLQManager(dlqConfig) {

    // --- STEP 1: VALIDATION ---
    // dlqConfig must be a valid object.

    if (
        typeof dlqConfig !== "object" ||
        dlqConfig === null ||
        Array.isArray(dlqConfig)
    ) {
        return "Invalid Input";
    }

    const {
        maxRetries,
        dlqLimit
    } = dlqConfig;

    // Validate configuration.

    if (
        !Number.isInteger(maxRetries) ||
        maxRetries < 1 ||
        maxRetries > 5 ||
        !Number.isInteger(dlqLimit) ||
        dlqLimit < 1
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STORAGE ---

    // Pending jobs waiting for processing.
    const pendingJobs = [];

    // Dead Letter Queue.
    const deadLetterQueue = [];

    // --- STEP 3: RETURN MANAGER OBJECT ---

    return {

        // -----------------------------
        // Submit a new job
        // -----------------------------
        submitJob(jobData) {

            // Validate job object.

            if (
                typeof jobData !== "object" ||
                jobData === null ||
                Array.isArray(jobData)
            ) {
                return "Invalid Input";
            }

            const {
                jobId,
                jobType,
                payload,
                failUntilAttempt
            } = jobData;

            if (
                typeof jobId !== "string" ||
                jobId.trim() === "" ||
                typeof jobType !== "string" ||
                jobType.trim() === "" ||
                typeof payload !== "object" ||
                payload === null ||
                Array.isArray(payload) ||
                !Number.isInteger(failUntilAttempt) ||
                failUntilAttempt < 1
            ) {
                return "Invalid Input";
            }

            // Store job with initial attempt count.

            pendingJobs.push({
                ...jobData,
                attemptCount: 0
            });

            return {
                submitted: true,
                jobId
            };

        },

        // -----------------------------
        // Process all pending jobs
        // -----------------------------
        processJobs() {

            let completed = 0;
            let sentToDLQ = 0;

            // Process every pending job.

            while (pendingJobs.length > 0) {

                const job = pendingJobs.shift();

                let success = false;

                // Retry until success or retries exhausted.

                while (job.attemptCount < maxRetries) {

                    job.attemptCount++;

                    if (
                        job.attemptCount >= job.failUntilAttempt
                    ) {
                        success = true;
                        break;
                    }

                }

                if (success) {

                    completed++;

                } else {

                    // Move to DLQ if space is available.

                    if (
                        deadLetterQueue.length < dlqLimit
                    ) {

                        deadLetterQueue.push({
                            ...job,
                            dlqReason: "Max retries exceeded"
                        });

                        sentToDLQ++;

                    }

                }

            }

            return {
                totalProcessed: completed + sentToDLQ,
                completed,
                sentToDLQ
            };

        },

        // -----------------------------
        // Get all DLQ jobs
        // -----------------------------
        getDLQ() {

            return [...deadLetterQueue];

        },

        // -----------------------------
        // Retry one job from DLQ
        // -----------------------------
        retryFromDLQ(jobId) {

            // Validate jobId.

            if (
                typeof jobId !== "string" ||
                jobId.trim() === ""
            ) {
                return "Invalid Input";
            }

            const index = deadLetterQueue.findIndex(job =>
                job.jobId === jobId
            );

            if (index === -1) {
                return {
                    error: "Job not found in DLQ"
                };
            }

            const job = deadLetterQueue[index];

            const nextAttempt =
                job.attemptCount + 1;

            // Retry once.

            if (
                nextAttempt >= job.failUntilAttempt
            ) {

                deadLetterQueue.splice(index, 1);

                return {
                    jobId,
                    status: "COMPLETED",
                    finalAttempt: nextAttempt
                };

            }

            // Update attempt count if retry failed.

            job.attemptCount = nextAttempt;

            return {
                jobId,
                status: "FAILED",
                finalAttempt: nextAttempt
            };

        },

        // -----------------------------
        // Get DLQ statistics
        // -----------------------------
        getDLQStats() {

            return {
                dlqSize: deadLetterQueue.length,
                dlqLimit,
                isFull:
                    deadLetterQueue.length >= dlqLimit,
                jobIds: deadLetterQueue.map(job =>
                    job.jobId
                )
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const dlq = createDLQManager({
    maxRetries: 2,
    dlqLimit: 5
});

console.log(

    dlq.submitJob({

        jobId: "J-1",
        jobType: "EMAIL",
        payload: {},
        failUntilAttempt: 1

    })

);

console.log(

    dlq.submitJob({

        jobId: "J-2",
        jobType: "SMS",
        payload: {},
        failUntilAttempt: 5

    })

);

console.log(dlq.processJobs());

console.log(dlq.getDLQ());

console.log(dlq.retryFromDLQ("J-2"));

console.log(dlq.getDLQStats());