# 🎓 JS DAILY PRACTICE – DAY-210

📅 **Goal:** API Middleware Chain Simulator (API Design & Data Transformation)
🎯 **Focus:** Middleware Pattern • Request Pipeline • Request/Response Transformation • Error Middleware • Chain Composition

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔗 Basic Middleware Runner

⚠️ **Function Name:** `runMiddlewareChain()`

| Input      | `request` (object), `middlewares` (array of functions) |
| :--------- | :----------------------------------------------------- |
| **Output** | object                                                 |

**Rules:**

`request` object:

- `method` (string: "GET", "POST", "PUT", "DELETE")
- `path` (string, non-empty)
- `headers` (object)
- `body` (object or null)

`middlewares` — non-empty array of functions, each takes `(req, context)` and returns `{ req: modifiedReq, context: modifiedContext, blocked: boolean, blockReason: string or null }`

**Chain Rules:**

- Start with `context = { logs: [], startTime: "2025-01-01T00:00:00Z" }`
- Pass `request` and `context` through each middleware in order
- Each middleware may MODIFY `req` or `context`, or BLOCK the request
- If any middleware returns `blocked: true` → stop chain, return early with block info
- If all pass → return final `req` and `context`

| Challenge 📢 | Return `{ finalRequest, context, blocked, blockReason, middlewaresRun }` where `middlewaresRun` is count of middlewares that actually executed. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `runMiddlewareChain(
  { method: "GET", path: "/api/users", headers: { "x-api-key": "valid-key" }, body: null },
  [
    (req, ctx) => {
      ctx.logs.push("Logger: " + req.method + " " + req.path);
      return { req, context: ctx, blocked: false, blockReason: null };
    },
    (req, ctx) => {
      if (!req.headers["x-api-key"]) return { req, context: ctx, blocked: true, blockReason: "Missing API key" };
      ctx.logs.push("Auth: API key validated");
      return { req, context: ctx, blocked: false, blockReason: null };
    }
  ]
)` ➔

  `{
  finalRequest: { method: "GET", path: "/api/users", headers: { "x-api-key": "valid-key" }, body: null },
  context: { logs: ["Logger: GET /api/users", "Auth: API key validated"], startTime: "2025-01-01T00:00:00Z" },
  blocked: false,
  blockReason: null,
  middlewaresRun: 2
}`

---

## 🧩 PROBLEM–02: 🔐 Auth Middleware Simulator

⚠️ **Function Name:** `simulateAuthMiddleware()`

| Input      | `request` (object), `validTokens` (array of strings) |
| :--------- | :--------------------------------------------------- |
| **Output** | object                                               |

**Rules:**

`request` object:

- `path` (string, non-empty)
- `headers` (object)

`validTokens` — array of valid token strings

**Auth Rules:**

- Extract `Authorization` header value (format: `"Bearer <token>"`)
- If `Authorization` header missing → block: `"Authorization header missing"`
- If format is not `"Bearer <token>"` → block: `"Invalid authorization format"`
- If token not in `validTokens` → block: `"Invalid or expired token"`
- If valid → attach `{ userId: "USER_" + token, role: "USER" }` to request as `req.auth`
- `authStatus`: `"PASSED"` or `"BLOCKED"`

| Challenge 📢 | Return `{ authStatus, request: (modified with auth or original), blockReason }`. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `simulateAuthMiddleware(
  { path: "/api/orders", headers: { "Authorization": "Bearer token-abc" } },
  ["token-abc", "token-xyz"]
)` ➔

  `{
  authStatus: "PASSED",
  request: {
    path: "/api/orders",
    headers: { "Authorization": "Bearer token-abc" },
    auth: { userId: "USER_token-abc", role: "USER" }
  },
  blockReason: null
}`

---

## 🧩 PROBLEM–03: ✅ Request Validation Middleware

⚠️ **Function Name:** `simulateValidationMiddleware()`

| Input      | `request` (object), `validationSchema` (object) |
| :--------- | :---------------------------------------------- |
| **Output** | object                                          |

**Rules:**

`request` object:

- `body` (object or null)

`validationSchema` object — each key is a field name, value is validation rules:

- `required` (boolean)
- `type` (string: "string", "number", "boolean", "array")
- `minLength` (number, for strings — optional)
- `min` (number, for numbers — optional)

**Validation Rules:**

- If `body` is null/missing and any field is `required` → block: `"Request body is required"`
- For each field in schema:
  - If `required: true` and field missing from body → add to errors: `"${field} is required"`
  - If field present and type wrong → add to errors: `"${field} must be a ${type}"`
  - If string and `minLength` provided and `value.length < minLength` → add to errors: `"${field} must be at least ${minLength} characters"`
  - If number and `min` provided and `value < min` → add to errors: `"${field} must be at least ${min}"`
- If ANY errors → block: validation failed
- `validationStatus`: `"PASSED"` or `"FAILED"`
- `errors` → array of error strings

| Challenge 📢 | Return `{ validationStatus, errors, blocked }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `simulateValidationMiddleware(
  { body: { username: "ab", age: 15 } },
  {
    username: { required: true, type: "string", minLength: 4 },
    age: { required: true, type: "number", min: 18 },
    email: { required: true, type: "string" }
  }
)` ➔

  `{
  validationStatus: "FAILED",
  errors: [
    "username must be at least 4 characters",
    "age must be at least 18",
    "email is required"
  ],
  blocked: true
}`

---

## 🧩 PROBLEM–04: 📝 Request Logger Middleware

⚠️ **Function Name:** `simulateLoggerMiddleware()`

| Input      | `requests` (array of objects) |
| :--------- | :---------------------------- |
| **Output** | object                        |

**Rules:**

`requests` — non-empty array, each:

- `requestId` (string)
- `method` (string: "GET", "POST", "PUT", "DELETE")
- `path` (string)
- `statusCode` (number: 200, 201, 400, 401, 403, 404, 500)
- `durationMs` (number, ≥ 0)

**Logger Rules:**

- For each request, create a log entry:
  - `level`:
    - statusCode < 400 → `"INFO"`
    - statusCode < 500 → `"WARN"`
    - statusCode >= 500 → `"ERROR"`
  - `logMessage` → `` `[${level}] ${method} ${path} ${statusCode} (${durationMs}ms)` ``
- `summary`:
  - `totalRequests` → count
  - `infoCount`, `warnCount`, `errorCount`
  - `avgDurationMs` → mean (rounded to 2 decimal places)
  - `slowestRequest` → `requestId` with highest `durationMs`

| Challenge 📢 | Return `{ logs, summary }` where `logs` is array of `{ requestId, level, logMessage }`. If invalid → return `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `simulateLoggerMiddleware([
  { requestId: "R1", method: "GET", path: "/users", statusCode: 200, durationMs: 120 },
  { requestId: "R2", method: "POST", path: "/orders", statusCode: 400, durationMs: 45 },
  { requestId: "R3", method: "DELETE", path: "/items", statusCode: 500, durationMs: 300 }
])` ➔

  `{
  logs: [
    { requestId: "R1", level: "INFO", logMessage: "[INFO] GET /users 200 (120ms)" },
    { requestId: "R2", level: "WARN", logMessage: "[WARN] POST /orders 400 (45ms)" },
    { requestId: "R3", level: "ERROR", logMessage: "[ERROR] DELETE /items 500 (300ms)" }
  ],
  summary: {
    totalRequests: 3,
    infoCount: 1,
    warnCount: 1,
    errorCount: 1,
    avgDurationMs: 155.00,
    slowestRequest: "R3"
  }
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Middleware Pipeline Orchestrator

⚠️ **Function Name:** `runFullMiddlewarePipeline()`

| Input      | `request` (object), `pipelineConfig` (object) |
| :--------- | :-------------------------------------------- |
| **Output** | object                                        |

**Rules:**

`request` object:

- `method` (string)
- `path` (string)
- `headers` (object)
- `body` (object or null)

`pipelineConfig` object:

- `validTokens` (array of strings)
- `validationSchema` (object)

**Pipeline Rules (compose Problems 02, 03, 04):**

Run these 3 middleware steps IN ORDER:

1. **Auth Middleware** (Problem-02 logic): check Authorization header
   - If blocked → stop pipeline, log as blocked
2. **Validation Middleware** (Problem-03 logic): validate request body
   - If blocked → stop pipeline, log as blocked
3. **Logger** (Problem-04 logic — single request): log the request

After pipeline completes:

- `pipelineStatus`: `"COMPLETED"` if all passed, `"BLOCKED_AT_AUTH"` or `"BLOCKED_AT_VALIDATION"` if stopped early
- `stepsCompleted` → count of middleware steps that actually ran

| Challenge 📢 | Return `{ pipelineStatus, stepsCompleted, authResult, validationResult, logEntry }` — include `null` for steps that were skipped. If invalid → return `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runFullMiddlewarePipeline(
  { method: "POST", path: "/api/register", headers: { "Authorization": "Bearer token-xyz" }, body: { username: "Rahim123", age: 25, email: "rahim@mail.com" } },
  {
    validTokens: ["token-xyz"],
    validationSchema: {
      username: { required: true, type: "string", minLength: 4 },
      age: { required: true, type: "number", min: 18 },
      email: { required: true, type: "string" }
    }
  }
)` ➔

  `{
  pipelineStatus: "COMPLETED",
  stepsCompleted: 3,
  authResult: {
    authStatus: "PASSED",
    blockReason: null
  },
  validationResult: {
    validationStatus: "PASSED",
    errors: [],
    blocked: false
  },
  logEntry: {
    level: "INFO",
    logMessage: "[INFO] POST /api/register 200 (0ms)"
  }
}`

---
