# 🎓 JS DAILY PRACTICE – DAY-204

📅 **Goal:** Retry Logic Engine (Async JavaScript & Promise Engineering)
🎯 **Focus:** Retry Patterns • Exponential Backoff • Circuit Breaker • Fallback Strategy • async/await loops

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Use **Promise** or **async/await** where specified.
- If input is invalid → return a **rejected Promise** with `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔁 Fixed Interval Retry

⚠️ **Function Name:** `retryWithFixedInterval()`

| Input      | `taskId` (string), `maxRetries` (number), `failUntilAttempt` (number) |
| :--------- | :-------------------------------------------------------------------- |
| **Output** | Promise (async function)                                              |

**Rules:**

`taskId` must be non-empty string
`maxRetries` must be integer, 1–10
`failUntilAttempt` must be integer, 1–10 (task fails on attempts < this number, succeeds on this attempt or later)

**Simulation Rules:**

- Loop up to `maxRetries` attempts
- Each attempt:
  - If `currentAttempt < failUntilAttempt` → simulated failure: `"Attempt " + currentAttempt + " failed"`
  - If `currentAttempt >= failUntilAttempt` → success: `{ taskId, status: "SUCCESS", attemptNumber: currentAttempt }`
- Track `retryLog` → array of `{ attempt, outcome: "FAILED" or "SUCCEEDED" }`
- If success within maxRetries → resolve with `{ taskId, status: "SUCCESS", attemptNumber, retryLog }`
- If exhausted → resolve with `{ taskId, status: "EXHAUSTED", retryLog }`

| Challenge 📢 | Return Promise always resolving (never rejecting) with the outcome. If invalid → reject `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `retryWithFixedInterval("T-A", 5, 3)` → resolves with:

  `{
  taskId: "T-A",
  status: "SUCCESS",
  attemptNumber: 3,
  retryLog: [
    { attempt: 1, outcome: "FAILED" },
    { attempt: 2, outcome: "FAILED" },
    { attempt: 3, outcome: "SUCCEEDED" }
  ]
}`

- `retryWithFixedInterval("T-B", 2, 5)` → resolves with:

  `{
  taskId: "T-B",
  status: "EXHAUSTED",
  retryLog: [
    { attempt: 1, outcome: "FAILED" },
    { attempt: 2, outcome: "FAILED" }
  ]
}`

---

## 🧩 PROBLEM–02: 📈 Exponential Backoff Retry

⚠️ **Function Name:** `retryWithExponentialBackoff()`

| Input      | `taskId` (string), `maxRetries` (number), `baseDelayMs` (number) |
| :--------- | :--------------------------------------------------------------- |
| **Output** | Promise (async function)                                         |

**Rules:**

`taskId` must be non-empty string
`maxRetries` must be integer, 1–5
`baseDelayMs` must be number, > 0

**Simulation Rules:**

- Same failure simulation as Problem-01: fails first 2 attempts, succeeds on 3rd
- Exponential backoff delay (simulated — no real timers):
  - Attempt 1 delay: `baseDelayMs × 2^0 = baseDelayMs × 1`
  - Attempt 2 delay: `baseDelayMs × 2^1 = baseDelayMs × 2`
  - Attempt 3 delay: `baseDelayMs × 2^2 = baseDelayMs × 4`
  - etc.
- Track `retryLog` → array of `{ attempt, outcome, simulatedDelayMs }`
  - First attempt has no prior delay (it's the initial try), so `simulatedDelayMs = 0`
  - Retry attempts get the backoff delay: retry 1 (attempt 2) → `baseDelayMs × 1`, retry 2 (attempt 3) → `baseDelayMs × 2`, etc.

| Challenge 📢 | Return Promise resolving with `{ taskId, status, attemptNumber (or null if exhausted), retryLog }`. If invalid → reject `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `retryWithExponentialBackoff("T-X", 4, 100)` → resolves with:

  `{
  taskId: "T-X",
  status: "SUCCESS",
  attemptNumber: 3,
  retryLog: [
    { attempt: 1, outcome: "FAILED", simulatedDelayMs: 0 },
    { attempt: 2, outcome: "FAILED", simulatedDelayMs: 100 },
    { attempt: 3, outcome: "SUCCEEDED", simulatedDelayMs: 200 }
  ]
}`

---

## 🧩 PROBLEM–03: ⚡ Circuit Breaker Pattern

⚠️ **Function Name:** `executeWithCircuitBreaker()`

| Input      | `tasks` (array of strings), `failureThreshold` (number) |
| :--------- | :------------------------------------------------------ |
| **Output** | Promise (async function)                                |

**Rules:**

`tasks` — non-empty array of taskId strings
`failureThreshold` must be integer, 1–10 — if consecutive failures reach this count, circuit "opens" and remaining tasks are skipped

**Simulation Rules:**

- For each task in order:
  - If taskId contains `"OK"` → success: `{ taskId, status: "COMPLETED" }`
  - Else → failure: `{ taskId, status: "FAILED" }`
- Track `consecutiveFailures` counter:
  - Increment on failure, reset to 0 on success
  - If `consecutiveFailures >= failureThreshold` AFTER a failure → **circuit OPENS** — skip all remaining tasks with `status: "SKIPPED_CIRCUIT_OPEN"`
- `circuitOpened` → true if circuit opened during execution, else false

| Challenge 📢 | Return Promise resolving with `{ results, circuitOpened }`. If invalid → reject `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `executeWithCircuitBreaker(["OK-1", "BAD-2", "BAD-3", "OK-4", "BAD-5"], 2)` → resolves with:

  `{
  results: [
    { taskId: "OK-1", status: "COMPLETED" },
    { taskId: "BAD-2", status: "FAILED" },
    { taskId: "BAD-3", status: "FAILED" },
    { taskId: "OK-4", status: "SKIPPED_CIRCUIT_OPEN" },
    { taskId: "BAD-5", status: "SKIPPED_CIRCUIT_OPEN" }
  ],
  circuitOpened: true
}`

---

## 🧩 PROBLEM–04: 🛡️ Fallback Strategy Engine

⚠️ **Function Name:** `executeWithFallback()`

| Input      | `primaryTaskId` (string), `fallbackTaskIds` (array of strings) |
| :--------- | :------------------------------------------------------------- |
| **Output** | Promise (async function)                                       |

**Rules:**

`primaryTaskId` must be non-empty string
`fallbackTaskIds` must be non-empty array of strings

**Simulation Rules:**

- Try `primaryTaskId` first:
  - If contains `"OK"` → succeeds: `{ taskId: primaryTaskId, source: "PRIMARY", status: "SUCCESS" }`
  - Else → fails
- If primary fails, try each fallback **one by one** (sequential, not parallel):
  - If fallback taskId contains `"OK"` → succeeds: `{ taskId, source: "FALLBACK", status: "SUCCESS", fallbackIndex }`
  - Else → fails, try next fallback
- If ALL fallbacks fail → resolve with `{ status: "ALL_FAILED", primaryTaskId, attemptedFallbacks: fallbackTaskIds.length }`
- `executionPath` → array of `{ taskId, tried: true, succeeded: boolean }` for all attempted tasks

| Challenge 📢 | Return Promise always resolving with the outcome + `executionPath`. If invalid → reject `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `executeWithFallback("BAD-primary", ["BAD-fb1", "OK-fb2", "OK-fb3"])` → resolves with:

  `{
  taskId: "OK-fb2",
  source: "FALLBACK",
  status: "SUCCESS",
  fallbackIndex: 1,
  executionPath: [
    { taskId: "BAD-primary", tried: true, succeeded: false },
    { taskId: "BAD-fb1", tried: true, succeeded: false },
    { taskId: "OK-fb2", tried: true, succeeded: true }
  ]
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Resilience Orchestrator

⚠️ **Function Name:** `runResilienceOrchestrator()`

| Input      | `config` (object)        |
| :--------- | :----------------------- |
| **Output** | Promise (async function) |

**Rules:**

`config` object:

- `taskId` (string, non-empty)
- `maxRetries` (number, 1–5)
- `baseDelayMs` (number, > 0)
- `failureThreshold` (number, 1–10)
- `fallbackIds` (array of strings)

**Orchestration Rules (compose all 4 patterns):**

1. **Step 1 — Retry with Exponential Backoff** (Problem-02 logic):
   - Try the main `taskId` up to `maxRetries` times (fails first 2 attempts, succeeds on 3rd)
   - If succeeds within retries → skip remaining steps, return `{ source: "PRIMARY_RETRY", ...retryResult }`

2. **Step 2 — If Step 1 exhausted** → try fallback strategy (Problem-04 logic):
   - Try `fallbackIds` one by one
   - If any fallback contains "OK" → succeeds → return `{ source: "FALLBACK", ...fallbackResult }`

3. **Step 3 — If all fallbacks failed** → return `{ source: "NONE", status: "COMPLETELY_FAILED", taskId }`

| Challenge 📢 | Return Promise resolving with the final outcome object. If invalid → reject `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runResilienceOrchestrator({
  taskId: "BAD-main",
  maxRetries: 2,
  baseDelayMs: 100,
  failureThreshold: 3,
  fallbackIds: ["BAD-fb1", "OK-fb2"]
})` → resolves with:

  `{
  source: "FALLBACK",
  taskId: "OK-fb2",
  status: "SUCCESS",
  fallbackIndex: 1,
  executionPath: [
    { taskId: "BAD-fb1", tried: true, succeeded: false },
    { taskId: "OK-fb2", tried: true, succeeded: true }
  ]
}`

---
