# 🎓 JS DAILY PRACTICE – DAY-218

📅 **Goal:** Job Queue Processor (Node.js Core Concepts Simulation)
🎯 **Focus:** Job Queue • Priority Scheduling • Job Status Tracking • Concurrency Control • Dead Letter Queue

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📋 Basic Job Queue (Enqueue & Dequeue)

⚠️ **Function Name:** `createJobQueue()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (job queue)      |

**Rules:**

Return a job queue object with these methods:

- `enqueue(jobData)` — add a job to the queue
- `dequeue()` — remove and return the next job (FIFO)
- `peek()` — return the next job WITHOUT removing it
- `size()` — return current queue length
- `isEmpty()` — return `true` if queue is empty
- `clear()` — remove all jobs, return `{ cleared: true, removedCount }`

**Job Data Rules:**

`jobData` object:

- `jobId` (string, non-empty)
- `jobType` (string, non-empty)
- `payload` (object)

**Operation Rules:**

- `enqueue(jobData)` → validates fields, adds job with `{ ...jobData, status: "QUEUED", enqueuedAt: "2025-01-01T00:00:00Z" }`, returns `{ jobId, position: queueLength }`
- `dequeue()` → returns full job object or `{ error: "Queue is empty" }` if empty
- `peek()` → returns full job object or `{ error: "Queue is empty" }` if empty
- `size()` → returns number
- `isEmpty()` → returns boolean
- `clear()` → returns `{ cleared: true, removedCount: N }`
- Invalid `jobData` → return `"Invalid Input"`

| Challenge 📢 | Return the job queue object maintaining internal FIFO state. |
| :----------- | :----------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const queue = createJobQueue();

queue.enqueue({
  jobId: "J-1",
  jobType: "EMAIL",
  payload: { to: "a@mail.com" },
});
// → { jobId: "J-1", position: 1 }

queue.enqueue({
  jobId: "J-2",
  jobType: "SMS",
  payload: { to: "+8801700000000" },
});
// → { jobId: "J-2", position: 2 }

queue.size(); // → 2
queue.isEmpty(); // → false

queue.peek();
// → { jobId: "J-1", jobType: "EMAIL", payload: { to: "a@mail.com" }, status: "QUEUED", enqueuedAt: "2025-01-01T00:00:00Z" }

queue.dequeue();
// → { jobId: "J-1", jobType: "EMAIL", payload: { to: "a@mail.com" }, status: "QUEUED", enqueuedAt: "2025-01-01T00:00:00Z" }

queue.size(); // → 1

queue.clear();
// → { cleared: true, removedCount: 1 }
```

---

## 🧩 PROBLEM–02: ⚡ Priority Job Queue

⚠️ **Function Name:** `createPriorityJobQueue()`

| Input      | None (factory function)     |
| :--------- | :-------------------------- |
| **Output** | object (priority job queue) |

**Rules:**

Return a priority queue object with:

- `enqueue(jobData)` — add job with priority
- `dequeue()` — remove and return HIGHEST priority job first
- `listAll()` — return all jobs sorted by priority descending
- `size()` — return queue length

**Job Data Rules:**

`jobData` object:

- `jobId` (string, non-empty)
- `jobType` (string, non-empty)
- `priority` (number, integer, 1–10) — higher = more urgent
- `payload` (object)

**Priority Rules:**

- `dequeue()` always returns the job with the HIGHEST `priority`
- If two jobs have equal priority → return the one enqueued FIRST (FIFO tiebreaker)
- `enqueue(jobData)` → returns `{ jobId, priority, queuePosition: rankByPriority }` where `queuePosition` is 1-based rank (1 = will be dequeued next)
- `listAll()` → returns array of full job objects sorted by priority descending (then by enqueue order for ties)
- Invalid `jobData` or missing `priority` → return `"Invalid Input"`

| Challenge 📢 | Return the priority queue object. |
| :----------- | :-------------------------------- |

**Sample Input & Output:**

```javascript
const pq = createPriorityJobQueue();

pq.enqueue({ jobId: "J-1", jobType: "EMAIL", priority: 3, payload: {} });
pq.enqueue({ jobId: "J-2", jobType: "SMS", priority: 8, payload: {} });
pq.enqueue({ jobId: "J-3", jobType: "PUSH", priority: 5, payload: {} });

pq.listAll();
// → [
//   { jobId: "J-2", priority: 8, ... },
//   { jobId: "J-3", priority: 5, ... },
//   { jobId: "J-1", priority: 3, ... }
// ]

pq.dequeue();
// → { jobId: "J-2", jobType: "SMS", priority: 8, ... }

pq.size(); // → 2
```

---

## 🧩 PROBLEM–03: 🔄 Job Processor with Status Tracking

⚠️ **Function Name:** `createJobProcessor()`

| Input      | `processorConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (job processor)     |

**Rules:**

`processorConfig` object:

- `processorId` (string, non-empty)
- `maxConcurrent` (number, integer, 1–10) — max jobs that can be IN_PROGRESS simultaneously

Return a job processor object with:

- `addJob(jobData)` — add job to internal queue (`jobData`: `{ jobId, jobType, payload, shouldFail }`)
- `processNext()` — pick next QUEUED job, move to IN_PROGRESS, simulate execution
- `processAll()` — process ALL queued jobs respecting `maxConcurrent` limit (batch by batch)
- `getStatus(jobId)` — return current status of a job
- `getStats()` — return processing statistics

**Job Lifecycle:** `QUEUED` → `IN_PROGRESS` → `COMPLETED` or `FAILED`

**Simulation Rules:**

- `processNext()`:
  - If no QUEUED jobs → `{ processed: false, reason: "No jobs in queue" }`
  - Pick next QUEUED job, set status `IN_PROGRESS`
  - If `shouldFail: true` → set status `FAILED`, `{ jobId, status: "FAILED", error: "Job execution failed" }`
  - If `shouldFail: false` → set status `COMPLETED`, `{ jobId, status: "COMPLETED", result: "processed_" + jobId }`

- `processAll()`:
  - Process jobs in batches of `maxConcurrent`
  - Returns `{ totalProcessed, completedCount, failedCount, batches: count }`

- `getStatus(jobId)` → `{ jobId, status }` or `{ error: "Job not found" }`

- `getStats()` → `{ processorId, totalJobs, queued, inProgress, completed, failed }`

**Validation:** invalid `processorConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the job processor object with all 5 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const processor = createJobProcessor({ processorId: "P-1", maxConcurrent: 2 });

processor.addJob({
  jobId: "J-1",
  jobType: "EMAIL",
  payload: {},
  shouldFail: false,
});
processor.addJob({
  jobId: "J-2",
  jobType: "SMS",
  payload: {},
  shouldFail: true,
});
processor.addJob({
  jobId: "J-3",
  jobType: "PUSH",
  payload: {},
  shouldFail: false,
});

processor.getStats();
// → { processorId: "P-1", totalJobs: 3, queued: 3, inProgress: 0, completed: 0, failed: 0 }

processor.processAll();
// → { totalProcessed: 3, completedCount: 2, failedCount: 1, batches: 2 }
// Batch 1: J-1(COMPLETED), J-2(FAILED) | Batch 2: J-3(COMPLETED)

processor.getStatus("J-2");
// → { jobId: "J-2", status: "FAILED" }

processor.getStats();
// → { processorId: "P-1", totalJobs: 3, queued: 0, inProgress: 0, completed: 2, failed: 1 }
```

---

## 🧩 PROBLEM–04: ☠️ Dead Letter Queue (DLQ) Manager

⚠️ **Function Name:** `createDLQManager()`

| Input      | `dlqConfig` (object) |
| :--------- | :------------------- |
| **Output** | object (DLQ manager) |

**Rules:**

`dlqConfig` object:

- `maxRetries` (number, integer, 1–5) — max retry attempts before moving to DLQ
- `dlqLimit` (number, integer, ≥ 1) — max jobs the DLQ can hold

Return a DLQ manager object with:

- `submitJob(jobData)` — submit a job for processing
- `processJobs()` — process all pending jobs with retry logic
- `getDLQ()` — return all jobs currently in the Dead Letter Queue
- `retryFromDLQ(jobId)` — move a job from DLQ back to pending and retry once more
- `getDLQStats()` — return DLQ statistics

**Job Data Rules:**

`jobData`: `{ jobId (string), jobType (string), payload (object), failUntilAttempt (number) }`

- `failUntilAttempt` — job fails on attempts before this number, succeeds on this attempt or later

**Processing Rules:**

- Each job starts with `attemptCount: 0`
- On each attempt: increment `attemptCount`
  - If `attemptCount < failUntilAttempt` → FAIL this attempt
  - If `attemptCount >= failUntilAttempt` → SUCCESS
- Retry up to `maxRetries` total attempts
- If still failing after `maxRetries` → move to DLQ with `{ ...job, dlqReason: "Max retries exceeded", attemptCount }`
- If DLQ is full (`dlqLimit` reached) → reject new DLQ entries: `{ jobId, error: "DLQ is full" }`

- `getDLQStats()` → `{ dlqSize, dlqLimit, isFull: dlqSize >= dlqLimit, jobIds: [array of jobIds in DLQ] }`

- `retryFromDLQ(jobId)`:
  - If not in DLQ → `{ error: "Job not found in DLQ" }`
  - Remove from DLQ, attempt once more:
    - If `attemptCount + 1 >= failUntilAttempt` → SUCCESS: `{ jobId, status: "COMPLETED", finalAttempt: attemptCount + 1 }`
    - Else → FAILED again: `{ jobId, status: "FAILED", finalAttempt: attemptCount + 1 }`

**Validation:** invalid `dlqConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the DLQ manager object with all 5 methods. |
| :----------- | :------------------------------------------------ |

**Sample Input & Output:**

```javascript
const dlq = createDLQManager({ maxRetries: 2, dlqLimit: 5 });

dlq.submitJob({
  jobId: "J-1",
  jobType: "EMAIL",
  payload: {},
  failUntilAttempt: 1,
}); // succeeds on attempt 1
dlq.submitJob({
  jobId: "J-2",
  jobType: "SMS",
  payload: {},
  failUntilAttempt: 5,
}); // needs 5 attempts → goes to DLQ

dlq.processJobs();
// J-1: attempt 1 → success (COMPLETED)
// J-2: attempt 1→FAIL, attempt 2→FAIL → maxRetries(2) exhausted → DLQ
// → { totalProcessed: 2, completed: 1, sentToDLQ: 1 }

dlq.getDLQ();
// → [{ jobId: "J-2", jobType: "SMS", payload: {}, failUntilAttempt: 5, dlqReason: "Max retries exceeded", attemptCount: 2 }]

dlq.retryFromDLQ("J-2");
// attemptCount was 2, failUntilAttempt is 5, so 2+1=3 < 5 → still FAILED
// → { jobId: "J-2", status: "FAILED", finalAttempt: 3 }

dlq.getDLQStats();
// → { dlqSize: 1, dlqLimit: 5, isFull: false, jobIds: ["J-2"] }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Job Queue Orchestrator

⚠️ **Function Name:** `runJobQueueOrchestrator()`

| Input      | `queueConfig` (object) |
| :--------- | :--------------------- |
| **Output** | object                 |

**Rules:**

`queueConfig` object:

- `queueId` (string, non-empty)
- `maxConcurrent` (number, integer, 1–10)
- `maxRetries` (number, integer, 1–5)
- `dlqLimit` (number, integer, ≥ 1)
- `jobs` (array of objects):
  - `jobId` (string)
  - `jobType` (string)
  - `priority` (number, integer, 1–10)
  - `payload` (object)
  - `failUntilAttempt` (number, integer, ≥ 1)

**Orchestration Rules (compose all previous concepts):**

1. **Enqueue** all jobs into a Priority Queue (Problem-02 logic) — higher priority processed first
2. **Dequeue** jobs in priority order and process them in batches of `maxConcurrent` (Problem-03 logic)
3. **Retry** failed jobs up to `maxRetries` total attempts (Problem-04 DLQ logic):
   - If job succeeds within retries → `COMPLETED`
   - If exhausted → move to DLQ
4. **Build final report:**
   - `processingOrder` → array of `jobId` in the order they were dequeued (by priority)
   - `completedJobs` → array of `jobId` that completed successfully
   - `dlqJobs` → array of `jobId` that ended up in DLQ
   - `totalBatches` → number of batches processed
   - `successRate` → `(completedCount / totalJobs) × 100` rounded to 2 decimal places

**Validation:** invalid `queueConfig` or missing required fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ queueId, processingOrder, completedJobs, dlqJobs, totalBatches, successRate }`. |
| :----------- | :---------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runJobQueueOrchestrator({
  queueId: "Q-01",
  maxConcurrent: 2,
  maxRetries: 3,
  dlqLimit: 5,
  jobs: [
    { jobId: "J-A", jobType: "EMAIL", priority: 8, payload: {}, failUntilAttempt: 1 },
    { jobId: "J-B", jobType: "SMS", priority: 5, payload: {}, failUntilAttempt: 2 },
    { jobId: "J-C", jobType: "PUSH", priority: 9, payload: {}, failUntilAttempt: 5 },
    { jobId: "J-D", jobType: "REPORT", priority: 3, payload: {}, failUntilAttempt: 1 }
  ]
})` →

  `{
  queueId: "Q-01",
  processingOrder: ["J-C", "J-A", "J-B", "J-D"],
  completedJobs: ["J-A", "J-B", "J-D"],
  dlqJobs: ["J-C"],
  totalBatches: 2,
  successRate: 75.00
}`

---
