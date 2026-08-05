// 🧩 PROBLEM–01: createJobQueue()

// Logic: Creates a basic FIFO (First In First Out) job queue.

// Supports:
// 1. Enqueue a new job
// 2. Dequeue the next job
// 3. Peek the next job
// 4. Get queue size
// 5. Check if queue is empty
// 6. Clear the queue

function createJobQueue() {

    // --- STEP 1: INTERNAL QUEUE ---
    // Stores all queued jobs.

    const queue = [];

    // --- STEP 2: RETURN QUEUE METHODS ---

    return {

        // Add a new job to the queue.

        enqueue(jobData) {

            // Validate job data.

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
                payload
            } = jobData;

            if (
                typeof jobId !== "string" ||
                jobId.trim() === "" ||
                typeof jobType !== "string" ||
                jobType.trim() === "" ||
                typeof payload !== "object" ||
                payload === null ||
                Array.isArray(payload)
            ) {
                return "Invalid Input";
            }

            // Create queued job.

            const job = {
                ...jobData,
                status: "QUEUED",
                enqueuedAt: "2025-01-01T00:00:00Z"
            };

            queue.push(job);

            return {
                jobId,
                position: queue.length
            };

        },

        // Remove and return the next job.

        dequeue() {

            if (queue.length === 0) {

                return {
                    error: "Queue is empty"
                };

            }

            return queue.shift();

        },

        // Return the next job without removing it.

        peek() {

            if (queue.length === 0) {

                return {
                    error: "Queue is empty"
                };

            }

            return queue[0];

        },

        // Return current queue length.

        size() {

            return queue.length;

        },

        // Check whether queue is empty.

        isEmpty() {

            return queue.length === 0;

        },

        // Remove all jobs from queue.

        clear() {

            const removedCount = queue.length;

            queue.length = 0;

            return {
                cleared: true,
                removedCount
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const queue = createJobQueue();

console.log(

    queue.enqueue({

        jobId: "J-1",
        jobType: "EMAIL",
        payload: {
            to: "a@mail.com"
        }

    })

);

console.log(

    queue.enqueue({

        jobId: "J-2",
        jobType: "SMS",
        payload: {
            to: "+8801700000000"
        }

    })

);

console.log(queue.size());

console.log(queue.isEmpty());

console.log(queue.peek());

console.log(queue.dequeue());

console.log(queue.size());

console.log(queue.clear());