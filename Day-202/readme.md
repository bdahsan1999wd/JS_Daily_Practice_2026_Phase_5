# 🎓 JS DAILY PRACTICE – DAY-202

📅 **Goal:** Async Task Queue Manager (Async JavaScript & Promise Engineering)
🎯 **Focus:** Promise Chaining • async/await • Sequential vs Parallel Execution • Error Recovery

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Use **Promise** or **async/await** where specified.
- If input is invalid → return a **rejected Promise** with `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📋 Task Creator

⚠️ **Function Name:** `createTask()`

| Input      | `taskData` (object) |
| :--------- | :------------------ |
| **Output** | Promise             |

**Rules:**

`taskData` object:

- `taskId` (string, non-empty)
- `taskName` (string, non-empty)
- `priority` (string: "LOW", "MEDIUM", "HIGH")

**Simulation Rules:**

- Return a **new Promise**
- Validate: if any field is missing or invalid → reject with `"Invalid Input"`
- If `priority` is valid:
  - "HIGH" → resolve with `{ ...taskData, status: "QUEUED", queuePosition: 1 }`
  - "MEDIUM" → resolve with `{ ...taskData, status: "QUEUED", queuePosition: 5 }`
  - "LOW" → resolve with `{ ...taskData, status: "QUEUED", queuePosition: 10 }`

| Challenge 📢 | Return Promise resolving with the task object including `status` and `queuePosition`. |
| :----------- | :------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `createTask({ taskId: "T-01", taskName: "Send Email", priority: "HIGH" })` → resolves with:
  `{ taskId: "T-01", taskName: "Send Email", priority: "HIGH", status: "QUEUED", queuePosition: 1 }`

**Example Usage:**

```javascript
createTask({ taskId: "T-01", taskName: "Send Email", priority: "HIGH" })
  .then((task) => console.log(task))
  .catch((err) => console.log(err));
```

---

## 🧩 PROBLEM–02: ▶️ Sequential Task Executor

⚠️ **Function Name:** `executeTasksSequentially()`

| Input      | `tasks` (array of objects) |
| :--------- | :------------------------- |
| **Output** | Promise                    |

**Rules:**

`tasks` — non-empty array, each: `{ taskId (string), taskName (string) }`

**Simulation Rules:**

- Use **`async/await`** with a loop to execute tasks ONE BY ONE (not in parallel)
- For each task, simulate execution:
  - If `taskId` contains `"FAIL"` → that task rejects with `"Task failed: " + taskId`
  - Otherwise → resolves with `{ taskId, taskName, status: "COMPLETED" }`
- Collect ALL results — if a task fails, record the error but **continue processing remaining tasks** (do not stop)
- `executionLog` → array of `{ taskId, success, result/error }` for each task in order

| Challenge 📢 | Return Promise resolving with `{ executionLog, completedCount, failedCount }`. |
| :----------- | :----------------------------------------------------------------------------- |

**Sample Input & Output:**

- `executeTasksSequentially([
  { taskId: "T-01", taskName: "Backup" },
  { taskId: "T-FAIL-02", taskName: "Send Report" },
  { taskId: "T-03", taskName: "Cleanup" }
])` → resolves with:

  `{
  executionLog: [
    { taskId: "T-01", success: true, result: { taskId: "T-01", taskName: "Backup", status: "COMPLETED" } },
    { taskId: "T-FAIL-02", success: false, error: "Task failed: T-FAIL-02" },
    { taskId: "T-03", success: true, result: { taskId: "T-03", taskName: "Cleanup", status: "COMPLETED" } }
  ],
  completedCount: 2,
  failedCount: 1
}`

**Example Usage:**

```javascript
executeTasksSequentially([...]).then(result => console.log(result));
```

---

## 🧩 PROBLEM–03: ⚡ Parallel Task Executor with Timeout

⚠️ **Function Name:** `executeTasksWithTimeout()`

| Input      | `tasks` (array of objects), `timeoutMs` (number) |
| :--------- | :----------------------------------------------- |
| **Output** | Promise                                          |

**Rules:**

`tasks` — non-empty array, each: `{ taskId (string), durationMs (number, > 0) }`
`timeoutMs` must be a number, > 0

**Simulation Rules:**

- Use **`Promise.race()`** for each individual task against a timeout
- For each task, create TWO promises that race:
  1. **Task Promise** → simulates completion: if `durationMs <= timeoutMs` → resolves `{ taskId, status: "COMPLETED", durationMs }`
  2. **Timeout Promise** → if `durationMs > timeoutMs` → this "wins" the race → resolves `{ taskId, status: "TIMED_OUT", durationMs }`
  - (Note: simulate by just checking `durationMs > timeoutMs` synchronously — no real timers needed)
- Run ALL tasks using `Promise.all()` of the races

| Challenge 📢 | Return Promise resolving with `{ results, completedCount, timedOutCount }`. If invalid input → reject with `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `executeTasksWithTimeout([
  { taskId: "T-1", durationMs: 100 },
  { taskId: "T-2", durationMs: 500 },
  { taskId: "T-3", durationMs: 200 }
], 300)` → resolves with:

  `{
  results: [
    { taskId: "T-1", status: "COMPLETED", durationMs: 100 },
    { taskId: "T-2", status: "TIMED_OUT", durationMs: 500 },
    { taskId: "T-3", status: "COMPLETED", durationMs: 200 }
  ],
  completedCount: 2,
  timedOutCount: 1
}`

---

## 🧩 PROBLEM–04: 🔁 Retry Logic Engine

⚠️ **Function Name:** `executeWithRetry()`

| Input      | `taskId` (string), `maxRetries` (number) |
| :--------- | :--------------------------------------- |
| **Output** | Promise (async function)                 |

**Rules:**

`taskId` must be a non-empty string
`maxRetries` must be a number, integer, 1–5

**Simulation Rules — `async/await` with retry loop:**

- Simulate an **unreliable task** that fails the first 2 attempts and succeeds on the 3rd:
  - Attempt 1 → always rejects: `"Attempt 1 failed"`
  - Attempt 2 → always rejects: `"Attempt 2 failed"`
  - Attempt 3+ → resolves: `{ taskId, status: "COMPLETED", attemptsNeeded: attemptNumber }`
- Track `attemptLog` → array of `{ attempt, outcome }` where outcome is `"FAILED"` or `"SUCCEEDED"`
- If all retries exhausted without success → resolve with `{ taskId, status: "EXHAUSTED", attemptLog }`
- If succeeds within retries → resolve with `{ taskId, status: "COMPLETED", attemptsNeeded, attemptLog }`

| Challenge 📢 | Return Promise resolving (NEVER rejecting) with the outcome object + `attemptLog`. If invalid input → reject with `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `executeWithRetry("T-001", 3)` → resolves with:

  **Manual Verify:**
  - Attempt 1 → FAILED
  - Attempt 2 → FAILED
  - Attempt 3 → SUCCEEDED
  - maxRetries=3, succeeded on attempt 3

  `{
  taskId: "T-001",
  status: "COMPLETED",
  attemptsNeeded: 3,
  attemptLog: [
    { attempt: 1, outcome: "FAILED" },
    { attempt: 2, outcome: "FAILED" },
    { attempt: 3, outcome: "SUCCEEDED" }
  ]
}`

- `executeWithRetry("T-002", 2)` → resolves with:

  `{
  taskId: "T-002",
  status: "EXHAUSTED",
  attemptLog: [
    { attempt: 1, outcome: "FAILED" },
    { attempt: 2, outcome: "FAILED" }
  ]
}`

---

## 🧩 PROBLEM–05: 🏗️ Async Task Pipeline Orchestrator

⚠️ **Function Name:** `runTaskPipelineOrchestrator()`

| Input      | `taskBatch` (array of objects) |
| :--------- | :----------------------------- |
| **Output** | Promise (async function)       |

**Rules:**

`taskBatch` — non-empty array, each:

- `taskId` (string, non-empty)
- `taskName` (string, non-empty)
- `priority` (string: "LOW", "MEDIUM", "HIGH")
- `maxRetries` (number, 1–5)

**Orchestration Rules (compose previous concepts):**

1. Use equivalent of `createTask()` logic → create each task with `queuePosition`
2. Sort tasks by `queuePosition` ascending (HIGH priority first, position=1)
3. Execute tasks in sorted order **sequentially** using `async/await` loop
4. For each task, apply equivalent of `executeWithRetry()` logic (simulated: first 2 attempts fail, 3rd succeeds)
5. Build `orchestrationLog` → array of `{ taskId, taskName, priority, queuePosition, finalStatus, attemptsNeeded }`
   - `finalStatus` → `"COMPLETED"` or `"EXHAUSTED"` based on maxRetries vs needed attempts

| Challenge 📢 | Return Promise resolving with `{ orchestrationLog, totalCompleted, totalExhausted }`. If invalid input → reject with `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runTaskPipelineOrchestrator([
  { taskId: "T-A", taskName: "Send Email", priority: "LOW", maxRetries: 3 },
  { taskId: "T-B", taskName: "Process Payment", priority: "HIGH", maxRetries: 2 },
  { taskId: "T-C", taskName: "Generate Report", priority: "MEDIUM", maxRetries: 4 }
])` → resolves with:

  `{
  orchestrationLog: [
    { taskId: "T-B", taskName: "Process Payment", priority: "HIGH", queuePosition: 1, finalStatus: "EXHAUSTED", attemptsNeeded: null },
    { taskId: "T-C", taskName: "Generate Report", priority: "MEDIUM", queuePosition: 5, finalStatus: "COMPLETED", attemptsNeeded: 3 },
    { taskId: "T-A", taskName: "Send Email", priority: "LOW", queuePosition: 10, finalStatus: "COMPLETED", attemptsNeeded: 3 }
  ],
  totalCompleted: 2,
  totalExhausted: 1
}`

---
