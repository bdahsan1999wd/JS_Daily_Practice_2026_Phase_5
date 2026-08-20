# 🎓 JS DAILY PRACTICE – DAY-233

📅 **Goal:** Full App Error Handler (Full Stack Integration Patterns)
🎯 **Focus:** Error Classification • Error Boundary • Global Error Handler • Recovery Strategies • Error Reporting

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🏷️ Error Classifier

⚠️ **Function Name:** `createErrorClassifier()`

| Input      | None (factory function)      |
| :--------- | :--------------------------- |
| **Output** | object (error classifier)    |

**Rules:**

Return an error classifier object with these methods:

- `classify(error)` — classify an error into a category
- `createError(type, message, details)` — create a structured error object
- `isRetryable(error)` — check if error type is retryable
- `getSeverity(error)` — return severity level of error
- `getHttpStatus(error)` — return appropriate HTTP status code

**Error Types & Properties:**

| Error Type         | Severity  | HTTP Status | Retryable |
| :----------------- | :-------- | :---------- | :-------- |
| `VALIDATION_ERROR` | `LOW`     | 400         | false     |
| `AUTH_ERROR`       | `MEDIUM`  | 401         | false     |
| `FORBIDDEN_ERROR`  | `MEDIUM`  | 403         | false     |
| `NOT_FOUND_ERROR`  | `LOW`     | 404         | false     |
| `CONFLICT_ERROR`   | `MEDIUM`  | 409         | false     |
| `RATE_LIMIT_ERROR` | `MEDIUM`  | 429         | true      |
| `SERVER_ERROR`     | `HIGH`    | 500         | true      |
| `DB_ERROR`         | `HIGH`    | 503         | true      |
| `NETWORK_ERROR`    | `HIGH`    | 503         | true      |
| `UNKNOWN_ERROR`    | `HIGH`    | 500         | false     |

**Operation Rules:**

- `classify(error)`:
  - `error` must be object with at least a `message` (string)
  - Classify by checking `error.type` if present (use as-is if valid type)
  - If no `type` or unknown type → classify by message keywords:
    - message contains `"validation"` or `"invalid"` → `VALIDATION_ERROR`
    - message contains `"unauthorized"` or `"auth"` → `AUTH_ERROR`
    - message contains `"not found"` → `NOT_FOUND_ERROR`
    - message contains `"database"` or `"db"` → `DB_ERROR`
    - message contains `"network"` or `"timeout"` → `NETWORK_ERROR`
    - else → `UNKNOWN_ERROR`
  - Returns `{ type, severity, httpStatus, retryable, message: error.message }`

- `createError(type, message, details)`:
  - `type` must be a valid error type
  - Returns `{ type, message, details: details ?? null, severity, httpStatus, retryable, createdAt: "2025-01-01T00:00:00Z" }`

- `isRetryable(error)` → `{ type: error.type, retryable: boolean }`
- `getSeverity(error)` → `{ type: error.type, severity: string }`
- `getHttpStatus(error)` → `{ type: error.type, httpStatus: number }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the error classifier object with all 5 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const classifier = createErrorClassifier();

classifier.classify({ message: "User not found in database" });
// message contains "not found" → NOT_FOUND_ERROR →

// { type: "NOT_FOUND_ERROR", severity: "LOW", httpStatus: 404, retryable: false, message: "User not found in database" }

classifier.classify({ type: "DB_ERROR", message: "Connection failed" });
// type provided → use directly →

// { type: "DB_ERROR", severity: "HIGH", httpStatus: 503, retryable: true, message: "Connection failed" }

classifier.createError("VALIDATION_ERROR", "Email is invalid", ["email must contain @"]);
// → {
//   type: "VALIDATION_ERROR",
//   message: "Email is invalid",
//   details: ["email must contain @"],
//   severity: "LOW",
//   httpStatus: 400,
//   retryable: false,
//   createdAt: "2025-01-01T00:00:00Z"
// }

classifier.isRetryable({ type: "SERVER_ERROR" });
// → { type: "SERVER_ERROR", retryable: true }

classifier.getSeverity({ type: "AUTH_ERROR" });
// → { type: "AUTH_ERROR", severity: "MEDIUM" }
```

---

## 🧩 PROBLEM–02: 🛡️ Error Boundary

⚠️ **Function Name:** `createErrorBoundary()`

| Input      | `boundaryConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object (error boundary)   |

**Rules:**

`boundaryConfig` object:

- `boundaryId` (string, non-empty)
- `fallbackFn` (function) — called when an error is caught: `(error) => fallbackResult`
- `onError` (function or null) — optional error reporter: `(error) => void`
- `maxErrors` (number, integer, ≥ 1) — max errors before boundary "breaks" (stops catching)

Return an error boundary object with:

- `wrap(fn)` — wrap a function with error boundary protection
- `execute(fn, ...args)` — execute a function safely within the boundary
- `getErrorCount()` — return number of errors caught so far
- `isOpen()` — return true if boundary is still catching (errorCount < maxErrors)
- `reset()` — reset error count, return `{ reset: true, boundaryId }`
- `getErrorLog()` — return all caught errors

**Operation Rules:**

- `execute(fn, ...args)`:
  - Try to call `fn(...args)`
  - If succeeds → return `{ success: true, result, boundaryId }`
  - If throws:
    - If boundary is OPEN (errorCount < maxErrors): increment errorCount, call `onError` if present, call `fallbackFn(error)`, return `{ success: false, error: error.message, fallbackResult, boundaryId }`
    - If boundary is BROKEN (errorCount >= maxErrors): do NOT call fallback, return `{ success: false, error: error.message, boundaryBroken: true, boundaryId }`
  - Log caught errors: `{ message: error.message, caughtAt: "2025-01-01T00:00:00Z" }`

- `wrap(fn)` → returns a NEW function that behaves like `execute(fn, ...args)` but called directly

- `isOpen()` → `{ boundaryId, isOpen: boolean, errorCount, maxErrors }`
- `getErrorCount()` → number
- `reset()` → `{ reset: true, boundaryId, errorCount: 0 }`
- `getErrorLog()` → array of caught error objects

**Validation:** invalid `boundaryConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the error boundary object with all 6 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const boundary = createErrorBoundary({
  boundaryId: "DB-BOUNDARY",
  fallbackFn: (err) => ({ fallback: true, message: "Using cached data", error: err.message }),
  onError: (err) => { /* report error */ },
  maxErrors: 2
});

boundary.execute(() => "success result");
// → { success: true, result: "success result", boundaryId: "DB-BOUNDARY" }


boundary.execute(() => { throw new Error("DB connection failed"); });
// errorCount becomes 1 →

//  { success: false, error: "DB connection failed", fallbackResult: { fallback: true, message: "Using cached data", error: "DB connection failed" }, boundaryId: "DB-BOUNDARY" }


boundary.execute(() => { throw new Error("Timeout"); });
// errorCount becomes 2 (= maxErrors → boundary now broken) →

//  { success: false, error: "Timeout", fallbackResult: { fallback: true, ... }, boundaryId: "DB-BOUNDARY" }

boundary.execute(() => { throw new Error("Another error"); });
// boundary is BROKEN → no fallback →

//  { success: false, error: "Another error", boundaryBroken: true, boundaryId: "DB-BOUNDARY" }

boundary.isOpen();
// → { boundaryId: "DB-BOUNDARY", isOpen: false, errorCount: 2, maxErrors: 2 }

boundary.reset();
// → { reset: true, boundaryId: "DB-BOUNDARY", errorCount: 0 }
```

---

## 🧩 PROBLEM–03: 🌍 Global Error Handler

⚠️ **Function Name:** `createGlobalErrorHandler()`

| Input      | `handlerConfig` (object)    |
| :--------- | :-------------------------- |
| **Output** | object (global error handler) |

**Rules:**

`handlerConfig` object:

- `handlerId` (string, non-empty)
- `environment` (string: `"development"`, `"staging"`, `"production"`)
- `handlers` (array of objects):
  - `errorType` (string) — error type to handle (from Problem-01 types, or `"*"` for catch-all)
  - `strategy` (string: `"LOG"`, `"RETRY"`, `"FALLBACK"`, `"ESCALATE"`)
  - `maxRetries` (number, integer, 1–5, for RETRY strategy)
  - `fallbackValue` (any, for FALLBACK strategy)

Return a global error handler object with:

- `handle(error)` — process an error through registered handlers
- `handleBatch(errors)` — process multiple errors
- `getStats()` — return error handling statistics
- `getErrorLog()` — return full error history

**Handling Rules:**

- `handle(error)`:
  - Classify error using Problem-01 logic (type detection)
  - Find matching handler (exact type match first, then `"*"` catch-all)
  - If no handler → `{ handled: false, reason: "No handler for type: " + type }`
  - Apply strategy:
    - `"LOG"` → `{ strategy: "LOG", logged: true, type, message: error.message }`
    - `"RETRY"` → simulate retries: `{ strategy: "RETRY", retriesUsed: maxRetries, finalStatus: "EXHAUSTED" }` (simulate all retries fail)
    - `"FALLBACK"` → `{ strategy: "FALLBACK", fallbackValue, type }`
    - `"ESCALATE"` → `{ strategy: "ESCALATE", escalatedTo: "ENGINEERING_TEAM", severity, type }`
  - In `production`, never include stack traces or internal details
  - In `development`, include full error details
  - Log: `{ type, strategy, handledAt: "2025-01-01T00:00:00Z", environment }`
  - Returns `{ handled: true, type, strategy, result, environment }`

- `handleBatch(errors)` → `{ totalErrors, handled, unhandled, results: [handle result per error] }`
- `getStats()` → `{ totalHandled, byStrategy: { LOG: N, RETRY: N, FALLBACK: N, ESCALATE: N }, byType: { type: count } }`
- `getErrorLog()` → array of all logged error objects

**Validation:** invalid `handlerConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the global error handler object with all 4 methods. |
| :----------- | :--------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const handler = createGlobalErrorHandler({
  handlerId: "GLOBAL-01",
  environment: "production",
  handlers: [
    { errorType: "VALIDATION_ERROR", strategy: "LOG", maxRetries: null, fallbackValue: null },
    { errorType: "DB_ERROR", strategy: "RETRY", maxRetries: 3, fallbackValue: null },
    { errorType: "SERVER_ERROR", strategy: "ESCALATE", maxRetries: null, fallbackValue: null },
    { errorType: "*", strategy: "FALLBACK", maxRetries: null, fallbackValue: { data: null, error: "Service unavailable" } }
  ]
});

handler.handle({ type: "DB_ERROR", message: "Connection timeout" });
// → { handled: true, type: "DB_ERROR", strategy: "RETRY", result: { strategy: "RETRY", retriesUsed: 3, finalStatus: "EXHAUSTED" }, environment: "production" }

handler.handle({ type: "VALIDATION_ERROR", message: "Email invalid" });
// → { handled: true, type: "VALIDATION_ERROR", strategy: "LOG", result: { strategy: "LOG", logged: true, type: "VALIDATION_ERROR", message: "Email invalid" }, environment: "production" }

handler.handle({ type: "NETWORK_ERROR", message: "Timeout" });
// No exact handler → catch-all "*" FALLBACK →

//  { handled: true, type: "NETWORK_ERROR", strategy: "FALLBACK", result: { strategy: "FALLBACK", fallbackValue: { data: null, error: "Service unavailable" }, type: "NETWORK_ERROR" }, environment: "production" }

handler.getStats();
// → { totalHandled: 3, byStrategy: { LOG: 1, RETRY: 1, FALLBACK: 1, ESCALATE: 0 }, byType: { DB_ERROR: 1, VALIDATION_ERROR: 1, NETWORK_ERROR: 1 } }
```

---

## 🧩 PROBLEM–04: 🔁 Recovery Strategy Engine

⚠️ **Function Name:** `createRecoveryEngine()`

| Input      | `recoveryConfig` (object)  |
| :--------- | :------------------------- |
| **Output** | object (recovery engine)   |

**Rules:**

`recoveryConfig` object:

- `engineId` (string, non-empty)
- `strategies` (array of objects):
  - `strategyName` (string)
  - `applicableTypes` (array of error type strings)
  - `steps` (array of objects):
    - `stepName` (string)
    - `action` (string: `"LOG"`, `"NOTIFY"`, `"CACHE_FALLBACK"`, `"CIRCUIT_BREAK"`, `"RESTART"`)
    - `shouldFail` (boolean) — simulate whether this step succeeds

Return a recovery engine object with:

- `recover(error)` — find and execute the appropriate recovery strategy
- `executeStrategy(strategyName, error)` — execute a specific strategy
- `getRecoveryHistory()` — return history of all recovery attempts
- `getSuccessRate()` — return `{ successRate: percentage, totalAttempts, succeeded, failed }`

**Recovery Rules:**

- `recover(error)`:
  - Classify error type (Problem-01 logic)
  - Find strategy where `applicableTypes` includes the error type
  - If no strategy found → `{ recovered: false, reason: "No recovery strategy for: " + type }`
  - Execute strategy steps in order
  - Each step: if `shouldFail: false` → `{ stepName, action, status: "SUCCESS" }`, else → `{ stepName, action, status: "FAILED", stoppedRecovery: true }` and stop
  - If all steps pass → `{ recovered: true, strategyName, stepsCompleted, stepLog }`
  - If any step fails → `{ recovered: false, strategyName, failedAt: stepName, stepLog }`

- `executeStrategy(strategyName, error)`:
  - If not found → `{ error: "Strategy not found: " + strategyName }`
  - Execute and return same result structure as `recover`

- `getRecoveryHistory()` → array of all recovery attempt results
- `getSuccessRate()` → `{ successRate: rounded to 2dp, totalAttempts, succeeded, failed }`

**Validation:** invalid `recoveryConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the recovery engine object with all 4 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const engine = createRecoveryEngine({
  engineId: "RECOVERY-01",
  strategies: [
    {
      strategyName: "DBRecovery",
      applicableTypes: ["DB_ERROR", "NETWORK_ERROR"],
      steps: [
        { stepName: "LogError", action: "LOG", shouldFail: false },
        { stepName: "NotifyTeam", action: "NOTIFY", shouldFail: false },
        { stepName: "SwitchToCache", action: "CACHE_FALLBACK", shouldFail: false }
      ]
    },
    {
      strategyName: "ServerRecovery",
      applicableTypes: ["SERVER_ERROR"],
      steps: [
        { stepName: "LogError", action: "LOG", shouldFail: false },
        { stepName: "Restart", action: "RESTART", shouldFail: true }
      ]
    }
  ]
});

engine.recover({ type: "DB_ERROR", message: "Connection failed" });
// → {
//   recovered: true,
//   strategyName: "DBRecovery",
//   stepsCompleted: 3,
//   stepLog: [
//     { stepName: "LogError", action: "LOG", status: "SUCCESS" },
//     { stepName: "NotifyTeam", action: "NOTIFY", status: "SUCCESS" },
//     { stepName: "SwitchToCache", action: "CACHE_FALLBACK", status: "SUCCESS" }
//   ]
// }

engine.recover({ type: "SERVER_ERROR", message: "Internal error" });
// → {
//   recovered: false,
//   strategyName: "ServerRecovery",
//   failedAt: "Restart",
//   stepLog: [
//     { stepName: "LogError", action: "LOG", status: "SUCCESS" },
//     { stepName: "Restart", action: "RESTART", status: "FAILED", stoppedRecovery: true }
//   ]
// }

engine.getSuccessRate();
// → { successRate: 50.00, totalAttempts: 2, succeeded: 1, failed: 1 }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Error Handling Orchestrator

⚠️ **Function Name:** `runErrorHandlingOrchestrator()`

| Input      | `orchestratorConfig` (object) |
| :--------- | :---------------------------- |
| **Output** | object                        |

**Rules:**

`orchestratorConfig` object:

- `orchestratorId` (string, non-empty)
- `environment` (string: `"development"`, `"staging"`, `"production"`)
- `boundaryConfig` (object) — same shape as Problem-02
- `globalHandlerConfig` (object) — same shape as Problem-03 (without `handlerId`, use `orchestratorId`)
- `recoveryConfig` (object) — same shape as Problem-04 (without `engineId`, use `orchestratorId`)
- `errorScenarios` (array of objects):
  - `scenarioId` (string)
  - `error` (object: `{ type, message, details }`)
  - `useBoundary` (boolean) — if true, wrap in error boundary first

**Orchestration Rules (compose all previous concepts):**

1. **Setup** — create classifier, boundary, global handler, recovery engine
2. **Process each scenario:**
   - **Classify** the error (Problem-01)
   - If `useBoundary: true` → wrap processing in error boundary (Problem-02)
   - **Handle** via global error handler (Problem-03)
   - **Recover** via recovery engine (Problem-04)
   - Build scenario result: `{ scenarioId, classified, handled, recovered }`
3. **Final Report:**
   - `totalScenarios`
   - `classificationSummary` → `{ byType: { type: count }, bySeverity: { severity: count } }`
   - `handlingSummary` → `{ handled, unhandled, byStrategy: { strategy: count } }`
   - `recoverySummary` → `{ recovered, unrecovered, successRate }`

**Validation:** invalid `orchestratorConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, scenarioLog, report }`. |
| :----------- | :------------------------------------------------- |

**Sample Input & Output:**

- `runErrorHandlingOrchestrator({
  orchestratorId: "ERR-ORCH-01",
  environment: "production",
  boundaryConfig: {
    boundaryId: "MAIN-BOUNDARY",
    fallbackFn: (err) => ({ fallback: true, error: err.message }),
    onError: null,
    maxErrors: 5
  },
  globalHandlerConfig: {
    environment: "production",
    handlers: [
      { errorType: "DB_ERROR", strategy: "RETRY", maxRetries: 2, fallbackValue: null },
      { errorType: "VALIDATION_ERROR", strategy: "LOG", maxRetries: null, fallbackValue: null },
      { errorType: "*", strategy: "FALLBACK", maxRetries: null, fallbackValue: { data: null } }
    ]
  },
  recoveryConfig: {
    strategies: [
      {
        strategyName: "DBRecovery",
        applicableTypes: ["DB_ERROR"],
        steps: [
          { stepName: "Log", action: "LOG", shouldFail: false },
          { stepName: "Cache", action: "CACHE_FALLBACK", shouldFail: false }
        ]
      }
    ]
  },
  errorScenarios: [
    { scenarioId: "S1", error: { type: "DB_ERROR", message: "DB timeout" }, useBoundary: true },
    { scenarioId: "S2", error: { type: "VALIDATION_ERROR", message: "Invalid email" }, useBoundary: false },
    { scenarioId: "S3", error: { type: "NETWORK_ERROR", message: "Connection refused" }, useBoundary: true }
  ]
})` →

  **Manual Verify:**
  - S1: DB_ERROR → boundary wraps → handled(RETRY) → recovered(DBRecovery✓)
  - S2: VALIDATION_ERROR → no boundary → handled(LOG) → no recovery strategy → unrecovered
  - S3: NETWORK_ERROR → boundary wraps → handled(FALLBACK via *) → no recovery strategy
  - handlingSummary: handled=3, byStrategy: { RETRY:1, LOG:1, FALLBACK:1 }
  - recoverySummary: recovered=1, unrecovered=2, successRate=33.33

  `{
  orchestratorId: "ERR-ORCH-01",
  scenarioLog: [
    {
      scenarioId: "S1",
      classified: { type: "DB_ERROR", severity: "HIGH", httpStatus: 503, retryable: true },
      handled: { handled: true, type: "DB_ERROR", strategy: "RETRY", result: { strategy: "RETRY", retriesUsed: 2, finalStatus: "EXHAUSTED" } },
      recovered: { recovered: true, strategyName: "DBRecovery", stepsCompleted: 2 }
    },
    {
      scenarioId: "S2",
      classified: { type: "VALIDATION_ERROR", severity: "LOW", httpStatus: 400, retryable: false },
      handled: { handled: true, type: "VALIDATION_ERROR", strategy: "LOG", result: { strategy: "LOG", logged: true } },
      recovered: { recovered: false, reason: "No recovery strategy for: VALIDATION_ERROR" }
    },
    {
      scenarioId: "S3",
      classified: { type: "NETWORK_ERROR", severity: "HIGH", httpStatus: 503, retryable: true },
      handled: { handled: true, type: "NETWORK_ERROR", strategy: "FALLBACK", result: { strategy: "FALLBACK", fallbackValue: { data: null } } },
      recovered: { recovered: false, reason: "No recovery strategy for: NETWORK_ERROR" }
    }
  ],
  report: {
    totalScenarios: 3,
    classificationSummary: {
      byType: { DB_ERROR: 1, VALIDATION_ERROR: 1, NETWORK_ERROR: 1 },
      bySeverity: { HIGH: 2, LOW: 1 }
    },
    handlingSummary: {
      handled: 3,
      unhandled: 0,
      byStrategy: { RETRY: 1, LOG: 1, FALLBACK: 1 }
    },
    recoverySummary: {
      recovered: 1,
      unrecovered: 2,
      successRate: 33.33
    }
  }
}`

---