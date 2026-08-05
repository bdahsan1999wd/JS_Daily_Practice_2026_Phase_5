// 🧩 PROBLEM–03: createJobProcessor()

// Logic: Simulates a job processor that tracks job status.

// Supports:

// 1. Add jobs to queue
// 2. Process one job
// 3. Process all jobs (batch by batch)
// 4. Check job status
// 5. View processing statistics

function createJobProcessor(processorConfig) {

    // --- STEP 1: VALIDATION ---
    // processorConfig must be a valid object.

    if (
        typeof processorConfig !== "object" ||
        processorConfig === null ||
        Array.isArray(processorConfig)
    ) {
        return "Invalid Input";
    }

    const {
        processorId,
        maxConcurrent
    } = processorConfig;

    // Validate processor configuration.

    if (
        typeof processorId !== "string" ||
        processorId.trim() === "" ||
        !Number.isInteger(maxConcurrent) ||
        maxConcurrent < 1 ||
        maxConcurrent > 10
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STORAGE ---

    // Stores every job.
    const jobs = [];

    // Fixed timestamp for simulation.
    const timestamp = "2025-01-01T00:00:00Z";

    // --- STEP 3: RETURN PROCESSOR OBJECT ---

    return {

        // -----------------------------
        // Add a new job
        // -----------------------------
        addJob(jobData) {

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
                shouldFail
            } = jobData;

            if (
                typeof jobId !== "string" ||
                jobId.trim() === "" ||
                typeof jobType !== "string" ||
                jobType.trim() === "" ||
                typeof payload !== "object" ||
                payload === null ||
                Array.isArray(payload) ||
                typeof shouldFail !== "boolean"
            ) {
                return "Invalid Input";
            }

            // Store job with initial status.

            jobs.push({
                jobId,
                jobType,
                payload,
                shouldFail,
                status: "QUEUED",
                createdAt: timestamp
            });

            return {
                added: true,
                jobId
            };

        },

        // -----------------------------
        // Process the next queued job
        // -----------------------------
        processNext() {

            // Find the first queued job.

            const job = jobs.find(job =>
                job.status === "QUEUED"
            );

            if (!job) {
                return {
                    processed: false,
                    reason: "No jobs in queue"
                };
            }

            // Mark job as running.

            job.status = "IN_PROGRESS";

            // Simulate processing result.

            if (job.shouldFail) {

                job.status = "FAILED";

                return {
                    jobId: job.jobId,
                    status: "FAILED",
                    error: "Job execution failed"
                };

            }

            job.status = "COMPLETED";

            return {
                jobId: job.jobId,
                status: "COMPLETED",
                result: `processed_${job.jobId}`
            };

        },

        // -----------------------------
        // Process all queued jobs
        // -----------------------------
        processAll() {

            let totalProcessed = 0;
            let completedCount = 0;
            let failedCount = 0;
            let batches = 0;

            // Continue until no queued jobs remain.

            while (jobs.some(job => job.status === "QUEUED")) {

                batches++;

                // Take one processing batch.

                const currentBatch = jobs
                    .filter(job => job.status === "QUEUED")
                    .slice(0, maxConcurrent);

                // Process every job in the batch.

                for (const job of currentBatch) {

                    job.status = "IN_PROGRESS";

                    if (job.shouldFail) {

                        job.status = "FAILED";
                        failedCount++;

                    } else {

                        job.status = "COMPLETED";
                        completedCount++;

                    }

                    totalProcessed++;

                }

            }

            return {
                totalProcessed,
                completedCount,
                failedCount,
                batches
            };

        },

        // -----------------------------
        // Get current job status
        // -----------------------------
        getStatus(jobId) {

            // Validate jobId.

            if (
                typeof jobId !== "string" ||
                jobId.trim() === ""
            ) {
                return "Invalid Input";
            }

            const job = jobs.find(job =>
                job.jobId === jobId
            );

            if (!job) {
                return {
                    error: "Job not found"
                };
            }

            return {
                jobId,
                status: job.status
            };

        },

        // -----------------------------
        // Get processor statistics
        // -----------------------------
        getStats() {

            return {
                processorId,
                totalJobs: jobs.length,
                queued: jobs.filter(job => job.status === "QUEUED").length,
                inProgress: jobs.filter(job => job.status === "IN_PROGRESS").length,
                completed: jobs.filter(job => job.status === "COMPLETED").length,
                failed: jobs.filter(job => job.status === "FAILED").length
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const processor = createJobProcessor({
    processorId: "P-1",
    maxConcurrent: 2
});

console.log(

    processor.addJob({

        jobId: "J-1",
        jobType: "EMAIL",
        payload: {},
        shouldFail: false

    })

);

console.log(

    processor.addJob({

        jobId: "J-2",
        jobType: "SMS",
        payload: {},
        shouldFail: true

    })

);

console.log(

    processor.addJob({

        jobId: "J-3",
        jobType: "PUSH",
        payload: {},
        shouldFail: false

    })

);

console.log(processor.getStats());

console.log(processor.processAll());

console.log(processor.getStatus("J-2"));

console.log(processor.getStats());