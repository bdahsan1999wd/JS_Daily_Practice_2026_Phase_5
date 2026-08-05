// 🧩 PROBLEM–02: createPriorityJobQueue()

// Logic: Creates a Priority Job Queue. Jobs are processed based on:

// 1. Higher priority first
// 2. If priority is equal → FIFO (earlier job first)

function createPriorityJobQueue() {

    // --- STEP 1: INTERNAL STORAGE ---
    // Stores all queued jobs.

    const queue = [];

    // Used for FIFO ordering when priorities are equal.

    let enqueueOrder = 0;

    // --- STEP 2: HELPER FUNCTION ---
    // Returns jobs sorted by:
    // 1. Priority (Descending)
    // 2. Enqueue order (Ascending)

    function getSortedQueue() {

        return [...queue].sort((a, b) => {

            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }

            return a.enqueueOrder - b.enqueueOrder;

        });

    }

    // --- STEP 3: RETURN QUEUE METHODS ---

    return {

        // Add a new job.

        enqueue(jobData) {

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
                priority,
                payload
            } = jobData;

            if (
                typeof jobId !== "string" ||
                jobId.trim() === "" ||
                typeof jobType !== "string" ||
                jobType.trim() === "" ||
                !Number.isInteger(priority) ||
                priority < 1 ||
                priority > 10 ||
                typeof payload !== "object" ||
                payload === null ||
                Array.isArray(payload)
            ) {
                return "Invalid Input";
            }

            // Create queue item.

            const job = {
                ...jobData,
                enqueueOrder: enqueueOrder++
            };

            queue.push(job);

            // Find current priority rank.

            const sortedQueue = getSortedQueue();

            const queuePosition =
                sortedQueue.findIndex(
                    item => item.jobId === jobId
                ) + 1;

            return {
                jobId,
                priority,
                queuePosition
            };

        },

        // Remove highest-priority job.

        dequeue() {

            if (queue.length === 0) {

                return {
                    error: "Queue is empty"
                };

            }

            const sortedQueue = getSortedQueue();

            const nextJob = sortedQueue[0];

            const originalIndex =
                queue.findIndex(
                    job => job.jobId === nextJob.jobId
                );

            queue.splice(originalIndex, 1);

            return nextJob;

        },

        // Return all jobs sorted by priority.

        listAll() {

            return getSortedQueue();

        },

        // Return queue size.

        size() {

            return queue.length;

        }

    };

}

// --- EXAMPLE USAGE ---
const pq = createPriorityJobQueue();

console.log(

    pq.enqueue({

        jobId: "J-1",
        jobType: "EMAIL",
        priority: 3,
        payload: {}

    })

);

console.log(

    pq.enqueue({

        jobId: "J-2",
        jobType: "SMS",
        priority: 8,
        payload: {}

    })

);

console.log(

    pq.enqueue({

        jobId: "J-3",
        jobType: "PUSH",
        priority: 5,
        payload: {}

    })

);

console.log(pq.listAll());

console.log(pq.dequeue());

console.log(pq.size());