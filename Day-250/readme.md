# 🎓 JS DAILY PRACTICE – DAY-250 🎉

📅 **Goal:** Full Security & Engineering Orchestrator (Security & Auth Patterns)
🎯 **Focus:** Auth • JWT • Password • API Key • CORS • RBAC • Input Security • Audit • Full Stack Security

🏁 **PHASE-5 GRAND FINALE — 10 Problems — Day 201 to Day 250 Complete!**

| #   | Function                       | Domain                                       |
| --- | ------------------------------ | -------------------------------------------- |
| 01  | `buildAuthSystem()`            | Auth Pipeline (JWT + Password)               |
| 02  | `buildAPIGateway()`            | API Key + Rate Limiting + CORS               |
| 03  | `buildAccessControl()`         | RBAC + Policy Engine                         |
| 04  | `buildInputSecurity()`         | XSS + SQLI + Threat Detection                |
| 05  | `buildTokenVault()`            | Refresh Token + Session + Token Family       |
| 06  | `runSecurityAudit()`           | Audit Logger + Breach Detection              |
| 07  | `buildDBSecurityLayer()`       | DB + Transaction + Query Security            |
| 08  | `buildFullStackPipeline()`     | MVC + Service Layer + DTO + Middleware       |
| 09  | `runAsyncSecurityEngine()`     | Async + Promise + Retry + Error Handling     |
| 10  | `runPhase5GrandOrchestrator()` | **All Phase-5 concepts (ultimate capstone)** |

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔐 Auth System Builder

⚠️ **Function Name:** `buildAuthSystem()`

| Input      | `authBlueprint` (object) |
| :--------- | :----------------------- |
| **Output** | object                   |

**Rules:**

`authBlueprint` object:

- `users` (array of objects): `{ userId, password, role }`
- `jwtSecret` (string, non-empty)
- `jwtExpiryMs` (number, > 0)
- `passwordPolicy` (object): `{ minLength, requireUppercase, requireNumbers, requireSpecialChars }`
- `authEvents` (array of objects): `{ eventId, type: "REGISTER"|"LOGIN"|"VERIFY_TOKEN", userId, password, token }`

**Processing Rules:**

**Password Hashing (simulate):**

- `hash(password) = "hash_" + reverseString(password) + "_" + password.length`
- `verify(password, hash) = hash === "hash_" + reverseString(password) + "_" + password.length`

**JWT (simulate):**

- `generateToken(userId, role, secret, expiryMs)`:
  - `payload = { sub: userId, role, iat: 1000000, exp: 1000000 + expiryMs }`
  - `encodedPayload = "jwt_" + userId + "_" + role + "_" + (1000000 + expiryMs)`
  - `signature = "sig_" + (charCodeSum of encodedPayload + secret).toString(16)`
  - `token = encodedPayload + "." + signature`
- `verifyToken(token, secret)`:
  - Split by `"."` → `[encodedPayload, signature]`
  - Recompute signature → compare
  - Parse expiry from `encodedPayload`
  - Returns `{ valid: boolean, userId, role, expired: boolean }`

**Password Policy Check:**

- Returns `{ valid: boolean, violations: [string] }`

**Event Processing:**

- `"REGISTER"`:
  1. Validate password against policy
  2. If invalid → `{ success: false, violations }`
  3. Hash password, store user
  4. Returns `{ success: true, userId, passwordHash }`

- `"LOGIN"`:
  1. Find user by `userId`
  2. Verify password against stored hash
  3. If wrong → `{ success: false, reason: "INVALID_CREDENTIALS" }`
  4. Generate JWT → `{ success: true, userId, token, expiresAt }`

- `"VERIFY_TOKEN"`:
  1. Verify provided `token`
  2. Returns `{ success: boolean, userId, role, reason: null or "INVALID_TOKEN"/"EXPIRED_TOKEN" }`

**Summary:**

- `totalEvents`, `successCount`, `failureCount`

**Validation:** invalid `authBlueprint` → return `"Invalid Input"`

| Challenge 📢 | Return `{ eventLog: [{ eventId, type, result }], summary: { totalEvents, successCount, failureCount }, userStore: [{ userId, role, passwordHash }] }`. |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildAuthSystem({
  users: [],
  jwtSecret: "secret-2025",
  jwtExpiryMs: 3600000,
  passwordPolicy: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecialChars: false },
  authEvents: [
    { eventId: "E1", type: "REGISTER", userId: "U1", password: "Secure123", token: null },
    { eventId: "E2", type: "LOGIN", userId: "U1", password: "Secure123", token: null },
    { eventId: "E3", type: "VERIFY_TOKEN", userId: null, password: null, token: "<token from E2>" }
  ]
})` →

  `{
  eventLog: [
    { eventId: "E1", type: "REGISTER", result: { success: true, userId: "U1", passwordHash: "hash_321eruceS_9" } },
    { eventId: "E2", type: "LOGIN", result: { success: true, userId: "U1", token: "jwt_U1_USER_3601000000.sig_<hex>", expiresAt: 3601000000 } },
    { eventId: "E3", type: "VERIFY_TOKEN", result: { success: true, userId: "U1", role: "USER", reason: null } }
  ],
  summary: { totalEvents: 3, successCount: 3, failureCount: 0 },
  userStore: [{ userId: "U1", role: "USER", passwordHash: "hash_321eruceS_9" }]
}`

---

## 🧩 PROBLEM–02: 🌐 API Gateway Builder

⚠️ **Function Name:** `buildAPIGateway()`

| Input      | `gatewayConfig` (object) |
| :--------- | :----------------------- |
| **Output** | object                   |

**Rules:**

`gatewayConfig` object:

- `validAPIKeys` (array of strings)
- `allowedOrigins` (array of strings)
- `rateLimitConfig` (object): `{ maxRequests: number, windowMs: number }`
- `routes` (array of objects): `{ method, path, requiresAuth: boolean }`
- `requests` (array of objects):
  - `requestId` (string)
  - `method` (string)
  - `path` (string)
  - `origin` (string or null)
  - `apiKey` (string or null)
  - `clientId` (string)
  - `timestampMs` (number)

**Gateway Pipeline (check in order, stop on block):**

1. **CORS** — if `origin` provided: must be in `allowedOrigins`
   - Block: `{ stage: "CORS", reason: "ORIGIN_NOT_ALLOWED" }`

2. **RATE_LIMIT** — per `clientId`: count requests in `windowMs`
   - If count > `maxRequests` → Block: `{ stage: "RATE_LIMIT", reason: "RATE_LIMIT_EXCEEDED" }`

3. **AUTH** — find matching route by `method + path`
   - If `requiresAuth: true` AND no valid `apiKey` → Block: `{ stage: "AUTH", reason: "UNAUTHORIZED" }`

4. **ROUTE** — if route not found → Block: `{ stage: "ROUTE", reason: "NOT_FOUND" }`

5. **PASS** → `{ stage: "HANDLER", result: "processed_" + requestId }`

- Process all requests sequentially (rate limit state carries over)

**Summary:**

- `totalRequests`, `passedCount`, `blockedCount`
- `blockBreakdown` → `{ CORS: N, RATE_LIMIT: N, AUTH: N, ROUTE: N }`

| Challenge 📢 | Return `{ requestLog: [{ requestId, passed, blockedAt, stage }], summary }`. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildAPIGateway({
  validAPIKeys: ["key-abc"],
  allowedOrigins: ["https://myapp.com"],
  rateLimitConfig: { maxRequests: 2, windowMs: 60000 },
  routes: [
    { method: "GET", path: "/users", requiresAuth: true },
    { method: "POST", path: "/users", requiresAuth: true }
  ],
  requests: [
    { requestId: "R1", method: "GET", path: "/users", origin: "https://myapp.com", apiKey: "key-abc", clientId: "C1", timestampMs: 1000 },
    { requestId: "R2", method: "GET", path: "/users", origin: "https://evil.com", apiKey: "key-abc", clientId: "C2", timestampMs: 2000 },
    { requestId: "R3", method: "GET", path: "/users", origin: "https://myapp.com", apiKey: null, clientId: "C3", timestampMs: 3000 }
  ]
})` →

  `{
  requestLog: [
    { requestId: "R1", passed: true, blockedAt: null, stage: "HANDLER" },
    { requestId: "R2", passed: false, blockedAt: "CORS", stage: "CORS" },
    { requestId: "R3", passed: false, blockedAt: "AUTH", stage: "AUTH" }
  ],
  summary: { totalRequests: 3, passedCount: 1, blockedCount: 2, blockBreakdown: { CORS: 1, RATE_LIMIT: 0, AUTH: 1, ROUTE: 0 } }
}`

---

## 🧩 PROBLEM–03: 🔑 Access Control System Builder

⚠️ **Function Name:** `buildAccessControl()`

| Input      | `acConfig` (object) |
| :--------- | :------------------ |
| **Output** | object              |

**Rules:**

`acConfig` object:

- `roles` (array of objects): `{ name, permissions: [string], inherits: [string] }`
- `policies` (array of objects): `{ policyId, effect: "ALLOW"|"DENY", roles: [string], resources: [string], actions: [string] }`
- `accessRequests` (array of objects):
  - `requestId` (string)
  - `userId` (string)
  - `userRole` (string)
  - `resource` (string)
  - `action` (string)

**Processing Rules:**

**Step 1 — Get Effective Permissions (with inheritance):**

- Recursively collect permissions from role + all inherited roles
- Deduplicate

**Step 2 — Permission Check:**

- Check if `"resource:action"` OR `"resource:*"` OR `"*:action"` OR `"*:*"` in effective permissions
- `checkerResult`: `{ permitted: boolean, matchedPermission: string or null }`

**Step 3 — Policy Evaluation:**

- Find matching policies (role in `roles` OR `"*"`, resource in `resources` OR `"*"`, action in `actions` OR `"*"`)
- DENY overrides ALLOW; no match → DEFAULT_DENY
- `policyResult`: `{ permitted: boolean, reason: "EXPLICIT_ALLOW"|"EXPLICIT_DENY"|"DEFAULT_DENY" }`

**Final Decision:** BOTH checker AND policy must permit → `permitted: true`

**Summary:**

- `totalRequests`, `permittedCount`, `deniedCount`
- `denialBreakdown` → `{ NO_PERMISSION: N, POLICY_DENY: N, DEFAULT_DENY: N }`

| Challenge 📢 | Return `{ accessLog: [{ requestId, userId, resource, action, permitted, reason }], summary }`. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildAccessControl({
  roles: [
    { name: "USER", permissions: ["articles:read"], inherits: [] },
    { name: "ADMIN", permissions: ["*:*"], inherits: ["USER"] }
  ],
  policies: [
    { policyId: "P1", effect: "ALLOW", roles: ["USER", "ADMIN"], resources: ["articles"], actions: ["read"] },
    { policyId: "P2", effect: "ALLOW", roles: ["ADMIN"], resources: ["*"], actions: ["*"] }
  ],
  accessRequests: [
    { requestId: "AR1", userId: "U1", userRole: "USER", resource: "articles", action: "read" },
    { requestId: "AR2", userId: "U1", userRole: "USER", resource: "articles", action: "delete" },
    { requestId: "AR3", userId: "U2", userRole: "ADMIN", resource: "users", action: "delete" }
  ]
})` →

  `{
  accessLog: [
    { requestId: "AR1", userId: "U1", resource: "articles", action: "read", permitted: true, reason: "BOTH_CHECKS_PASSED" },
    { requestId: "AR2", userId: "U1", resource: "articles", action: "delete", permitted: false, reason: "NO_PERMISSION" },
    { requestId: "AR3", userId: "U2", resource: "users", action: "delete", permitted: true, reason: "BOTH_CHECKS_PASSED" }
  ],
  summary: { totalRequests: 3, permittedCount: 2, deniedCount: 1, denialBreakdown: { NO_PERMISSION: 1, POLICY_DENY: 0, DEFAULT_DENY: 0 } }
}`

---

## 🧩 PROBLEM–04: 🛡️ Input Security Engine

⚠️ **Function Name:** `buildInputSecurity()`

| Input      | `securityConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object                    |

**Rules:**

`securityConfig` object:

- `mode` (string: `"ESCAPE"`, `"STRIP"`, `"BLOCK"`) — how to handle threats
- `enabledDetectors` (array: `"XSS"`, `"SQLI"`, `"PATH_TRAVERSAL"`, `"COMMAND_INJECTION"`)
- `inputs` (array of objects):
  - `inputId` (string)
  - `data` (object) — key-value pairs of user input fields

**Threat Patterns:**

- **XSS**: `<script>`, `javascript:`, `onerror=`, `alert(`, `eval(`
- **SQLI**: `' OR`, `UNION SELECT`, `DROP TABLE`, `--`, `; SELECT`
- **PATH_TRAVERSAL**: `../`, `/etc/passwd`, `C:\Windows`
- **COMMAND_INJECTION**: `; ls`, `| cat`, `&& rm`, `$(`, `` ` ``

**Processing Rules (per input field string value):**

1. **Detect** — scan for all enabled detector patterns → collect threats
2. **Sanitize/Block** based on `mode`:
   - `"ESCAPE"` → replace `<>&"'` with HTML entities: `&lt; &gt; &amp; &quot; &#x27;`
   - `"STRIP"` → remove all detected patterns from string
   - `"BLOCK"` → if any threat found → mark entire input as blocked (don't sanitize)
3. Build per-field result: `{ field, original, sanitized or blocked, threats: [{ type, pattern }] }`

**Per-Input Summary:**

- `totalFields`, `threatsFound`, `blocked` (only for BLOCK mode)

**Overall Summary:**

- `totalInputs`, `cleanInputs`, `threatenedInputs`
- `threatBreakdown` → `{ XSS: N, SQLI: N, ... }`

| Challenge 📢 | Return `{ inputLog: [{ inputId, fields: [field results], summary }], overallSummary }`. If invalid → return `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildInputSecurity({
  mode: "ESCAPE",
  enabledDetectors: ["XSS", "SQLI"],
  inputs: [
    { inputId: "I1", data: { name: "Rahim", comment: "<script>alert(1)</script>" } },
    { inputId: "I2", data: { query: "' OR 1=1 --", page: "1" } }
  ]
})` →

  `{
  inputLog: [
    { inputId: "I1", fields: [
      { field: "name", original: "Rahim", sanitized: "Rahim", threats: [] },
      { field: "comment", original: "<script>alert(1)</script>", sanitized: "&lt;script&gt;alert(1)&lt;/script&gt;", threats: [{ type: "XSS", pattern: "<script>" }, { type: "XSS", pattern: "alert(" }] }
    ], summary: { totalFields: 2, threatsFound: 1 } },
    { inputId: "I2", fields: [
      { field: "query", original: "' OR 1=1 --", sanitized: "&#x27; OR 1=1 ", threats: [{ type: "SQLI", pattern: "' OR" }, { type: "SQLI", pattern: "--" }] },
      { field: "page", original: "1", sanitized: "1", threats: [] }
    ], summary: { totalFields: 2, threatsFound: 1 } }
  ],
  overallSummary: { totalInputs: 2, cleanInputs: 0, threatenedInputs: 2, threatBreakdown: { XSS: 2, SQLI: 2 } }
}`

---

## 🧩 PROBLEM–05: 🔄 Token Vault & Session Manager

⚠️ **Function Name:** `buildTokenVault()`

| Input      | `vaultBlueprint` (object) |
| :--------- | :------------------------ |
| **Output** | object                    |

**Rules:**

`vaultBlueprint` object:

- `encryptionKey` (string, non-empty) — `encrypt(val) = "ENC:" + reverse(val + key)`
- `refreshTokenTTLMs` (number, > 0)
- `sessionTTLMs` (number, > 0)
- `maxSessionsPerUser` (number, integer, ≥ 1)
- `rotateOnRefresh` (boolean)
- `events` (array of objects):
  - `eventId` (string)
  - `type` (string: `"ISSUE"`, `"VALIDATE"`, `"REFRESH"`, `"REVOKE"`, `"CREATE_SESSION"`, `"DESTROY_SESSION"`)
  - `userId` (string)
  - `tokenRef` (string or null) — references a previous event's token
  - `currentTimeMs` (number)

**Simulated Token Generation:**

- Refresh token: `"RT-" + autoIndex + "-" + userId`
- Session ID: `"SES-" + autoIndex + "-" + userId`
- All token values stored encrypted: `encrypt(tokenValue)`

**Event Processing:**

- `"ISSUE"` → generate new refresh token, store encrypted, return `{ token, expiresAt: currentTimeMs + refreshTokenTTLMs }`
- `"VALIDATE"` → find token from `tokenRef`, decrypt, check if expired or revoked → `{ valid: boolean, reason: null or "EXPIRED"/"REVOKED" }`
- `"REFRESH"` → validate tokenRef, if valid: if `rotateOnRefresh` mark old as REPLACED and issue new; else issue new access token only → `{ refreshed: boolean, newToken or null }`
- `"REVOKE"` → mark token as REVOKED → `{ revoked: true, tokenRef }`
- `"CREATE_SESSION"` → create session (enforce maxSessionsPerUser; if exceeded revoke oldest) → `{ sessionId, expiresAt }`
- `"DESTROY_SESSION"` → destroy session from tokenRef → `{ destroyed: true, sessionId }`

**Summary:**

- `totalEvents`, `activeTokens`, `activeSessions`, `revokedCount`

| Challenge 📢 | Return `{ eventLog: [{ eventId, type, userId, result }], summary }`. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildTokenVault({
  encryptionKey: "vault-key",
  refreshTokenTTLMs: 86400000,
  sessionTTLMs: 1800000,
  maxSessionsPerUser: 2,
  rotateOnRefresh: true,
  events: [
    { eventId: "EV1", type: "ISSUE", userId: "U1", tokenRef: null, currentTimeMs: 1000000 },
    { eventId: "EV2", type: "VALIDATE", userId: "U1", tokenRef: "EV1", currentTimeMs: 1001000 },
    { eventId: "EV3", type: "REFRESH", userId: "U1", tokenRef: "EV1", currentTimeMs: 1002000 },
    { eventId: "EV4", type: "REVOKE", userId: "U1", tokenRef: "EV3", currentTimeMs: 1003000 }
  ]
})` →

  `{
  eventLog: [
    { eventId: "EV1", type: "ISSUE", userId: "U1", result: { token: "RT-1-U1", expiresAt: 87400000 } },
    { eventId: "EV2", type: "VALIDATE", userId: "U1", result: { valid: true, reason: null } },
    { eventId: "EV3", type: "REFRESH", userId: "U1", result: { refreshed: true, newToken: "RT-2-U1" } },
    { eventId: "EV4", type: "REVOKE", userId: "U1", result: { revoked: true, tokenRef: "EV3" } }
  ],
  summary: { totalEvents: 4, activeTokens: 0, activeSessions: 0, revokedCount: 1 }
}`

---

## 🧩 PROBLEM–06: 📋 Security Audit Engine

⚠️ **Function Name:** `runSecurityAudit()`

| Input      | `auditConfig` (object) |
| :--------- | :--------------------- |
| **Output** | object                 |

**Rules:**

`auditConfig` object:

- `events` (array of objects):
  - `eventId` (string)
  - `eventType` (string: `"AUTH_SUCCESS"`, `"AUTH_FAILURE"`, `"ACCESS_DENIED"`, `"THREAT_DETECTED"`, `"TOKEN_ISSUED"`, `"TOKEN_REVOKED"`, `"RATE_LIMITED"`)
  - `userId` (string or null)
  - `resource` (string or null)
  - `severity` (string: `"INFO"`, `"WARN"`, `"ERROR"`, `"CRITICAL"`)
  - `timestamp` (number)
  - `details` (object)
- `alertThresholds` (object): `{ authFailuresPerMinute, threatsPerMinute, rateLimitedPerMinute }`
- `breachedPasswords` (array of strings) — known breached passwords
- `passwordsToCheck` (array of strings) — check these against breach list

**Processing Rules:**

**Event Analysis:**

- `byType` → count per eventType
- `bySeverity` → count per severity
- `topUsers` → top 3 users by event count
- `criticalEvents` → array of events with severity `"CRITICAL"`
- `timeline` → group events by 10-second buckets: `{ bucket: bucketStart, count }`

**Alert Detection (check last 60 seconds from max timestamp):**

- Count AUTH_FAILURE, THREAT_DETECTED, RATE_LIMITED in last 60s
- If any count > threshold → add alert: `{ type, count, threshold, severity: "HIGH" }`

**Breach Check:**

- For each password in `passwordsToCheck`:
  - Case-insensitive match against `breachedPasswords`
  - Returns `{ password: "***", breached: boolean, riskLevel: "CRITICAL" or "SAFE" }`

**Security Score (0–100):**

- Start: 100
- -15 per CRITICAL event
- -10 per AUTH_FAILURE event
- -20 per THREAT_DETECTED event
- -5 per ACCESS_DENIED event
- +5 per AUTH_SUCCESS event (max +20)
- Min score: 0, Max: 100

| Challenge 📢 | Return `{ eventAnalysis, alerts, breachCheckResults, securityScore, recommendation: string }`. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runSecurityAudit({
  events: [
    { eventId: "E1", eventType: "AUTH_FAILURE", userId: "U1", resource: null, severity: "WARN", timestamp: 1000000, details: {} },
    { eventId: "E2", eventType: "AUTH_SUCCESS", userId: "U1", resource: null, severity: "INFO", timestamp: 1001000, details: {} },
    { eventId: "E3", eventType: "THREAT_DETECTED", userId: null, resource: "/api/data", severity: "CRITICAL", timestamp: 1002000, details: { type: "SQLI" } }
  ],
  alertThresholds: { authFailuresPerMinute: 5, threatsPerMinute: 1, rateLimitedPerMinute: 10 },
  breachedPasswords: ["password", "123456", "qwerty"],
  passwordsToCheck: ["password", "Secure@Pass123"]
})` →

  `{
  eventAnalysis: {
    byType: { AUTH_FAILURE: 1, AUTH_SUCCESS: 1, THREAT_DETECTED: 1 },
    bySeverity: { WARN: 1, INFO: 1, CRITICAL: 1 },
    topUsers: [{ userId: "U1", count: 2 }],
    criticalEvents: [{ eventId: "E3", eventType: "THREAT_DETECTED", severity: "CRITICAL", timestamp: 1002000, details: { type: "SQLI" } }],
    timeline: [{ bucket: 1000000, count: 3 }]
  },
  alerts: [{ type: "HIGH_THREAT_RATE", count: 1, threshold: 1, severity: "HIGH" }],
  breachCheckResults: [
    { password: "***", breached: true, riskLevel: "CRITICAL" },
    { password: "***", breached: false, riskLevel: "SAFE" }
  ],
  securityScore: 60,
  recommendation: "Critical threats detected. Immediate security review required."
}`

---

## 🧩 PROBLEM–07: 🗄️ DB Security Layer

⚠️ **Function Name:** `buildDBSecurityLayer()`

| Input      | `dbConfig` (object) |
| :--------- | :------------------ |
| **Output** | object              |

**Rules:**

`dbConfig` object:

- `tables` (object) — `{ tableName: [records] }`
- `indexes` (array of objects): `{ table, field, type: "HASH"|"BTREE" }`
- `transactions` (array of objects):
  - `txnId` (string)
  - `isolationLevel` (string: `"READ_COMMITTED"`, `"SERIALIZABLE"`)
  - `operations` (array of `{ type: "READ"|"WRITE"|"DELETE", table, id, data }`)
  - `shouldRollback` (boolean)
- `queries` (array of objects):
  - `queryId` (string)
  - `table` (string)
  - `filter` (object) — `{ field, operator, value }` (single condition)
  - `sanitize` (boolean) — if true, run SQLI detection on filter value

**Processing Rules:**

**Index Usage:**

- When querying: if index exists on filter field → `"INDEX_SCAN"`, else `"FULL_SCAN"`

**Transaction Processing:**

- `begin` → snapshot table
- Apply operations to working copy
- If `shouldRollback` → restore snapshot
- Else → commit to main tables
- Track `operationsApplied` or `operationsDiscarded`

**Query Processing:**

- Apply filter to (post-transaction) table data
- If `sanitize: true`:
  - Check filter value for SQLI patterns (`' OR`, `--`, `UNION SELECT`, `DROP`)
  - If threat found → block query: `{ blocked: true, reason: "SQLI_DETECTED" }`
- Return `{ results: [matching records], count, scanType, blocked: false }`

**Summary:**

- `transactionSummary` → `{ committed, rolledBack }`
- `querySummary` → `{ total, indexScans, fullScans, blocked }`
- `finalTableStats` → `{ tableName: recordCount }`

| Challenge 📢 | Return `{ transactionLog, queryLog, summary }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `buildDBSecurityLayer({
  tables: {
    users: [{ id: "U1", name: "Rahim", dept: "IT" }, { id: "U2", name: "Karim", dept: "HR" }]
  },
  indexes: [{ table: "users", field: "dept", type: "HASH" }],
  transactions: [
    { txnId: "T1", isolationLevel: "READ_COMMITTED", operations: [{ type: "WRITE", table: "users", id: null, data: { id: "U3", name: "Nadia", dept: "IT" } }], shouldRollback: false }
  ],
  queries: [
    { queryId: "Q1", table: "users", filter: { field: "dept", operator: "=", value: "IT" }, sanitize: true },
    { queryId: "Q2", table: "users", filter: { field: "name", operator: "=", value: "' OR 1=1 --" }, sanitize: true }
  ]
})` →

  `{
  transactionLog: [{ txnId: "T1", status: "COMMITTED", operationsApplied: 1 }],
  queryLog: [
    { queryId: "Q1", results: [{ id: "U1", name: "Rahim", dept: "IT" }, { id: "U3", name: "Nadia", dept: "IT" }], count: 2, scanType: "INDEX_SCAN", blocked: false },
    { queryId: "Q2", results: [], count: 0, scanType: "FULL_SCAN", blocked: true, reason: "SQLI_DETECTED" }
  ],
  summary: {
    transactionSummary: { committed: 1, rolledBack: 0 },
    querySummary: { total: 2, indexScans: 1, fullScans: 1, blocked: 1 },
    finalTableStats: { users: 3 }
  }
}`

---

## 🧩 PROBLEM–08: 🏗️ Full Stack Pipeline Builder

⚠️ **Function Name:** `buildFullStackPipeline()`

| Input      | `pipelineBlueprint` (object) |
| :--------- | :--------------------------- |
| **Output** | object                       |

**Rules:**

`pipelineBlueprint` object:

- `modelConfig` (object): `{ entityName, schema: { fieldName: { type, required, default } } }`
- `middlewares` (array of objects): `{ name, type: "AUTH"|"VALIDATION"|"LOGGER"|"RATE_LIMIT", config: object }`
- `requests` (array of objects):
  - `requestId` (string)
  - `method` (string: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`)
  - `path` (string)
  - `headers` (object)
  - `body` (object or null)
  - `operation` (object or null): `{ type: "CREATE"|"READ"|"UPDATE"|"DELETE", id: string or null, data: object or null }`

**Pipeline Layers:**

1. **LOGGER** → log: `{ logged: true, method, path }`

2. **RATE_LIMIT** (config: `{ maxRequests, windowMs }`) → per requestId prefix (first 2 chars of requestId as clientId simulation)
   - Block: `{ blocked: true, reason: "RATE_LIMIT_EXCEEDED" }`

3. **AUTH** (config: `{ validTokens: [string] }`) → check `headers["Authorization"]` = `"Bearer <token>"`
   - Block: `{ blocked: true, reason: "UNAUTHORIZED" }`

4. **VALIDATION** (config: `{ schema: same shape as modelConfig.schema }`) → validate `body` against schema
   - Block: `{ blocked: true, errors: [string] }`

5. **MODEL OPERATION** → if not blocked: apply `operation` to in-memory entity store:
   - `CREATE` → insert `data` with auto-id `entityName + "_" + autoIndex`
   - `READ` → find by `id`
   - `UPDATE` → merge `data` into existing record
   - `DELETE` → remove by `id`
   - Returns `{ success: boolean, result: record or null }`

**Per-Request Result:**

- `{ requestId, passed: boolean, blockedAt: null or middleware name, modelResult: null or operation result }`

**Summary:**

- `totalRequests`, `passedCount`, `blockedCount`
- `entityStore` → final state of all records

| Challenge 📢 | Return `{ requestLog, summary: { totalRequests, passedCount, blockedCount }, entityStore: [records] }`. If invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildFullStackPipeline({
  modelConfig: {
    entityName: "Product",
    schema: { name: { type: "string", required: true, default: null }, price: { type: "number", required: true, default: null } }
  },
  middlewares: [
    { name: "logger", type: "LOGGER", config: {} },
    { name: "auth", type: "AUTH", config: { validTokens: ["token-123"] } }
  ],
  requests: [
    { requestId: "R1", method: "POST", path: "/products", headers: { "Authorization": "Bearer token-123" }, body: { name: "JS Book", price: 500 }, operation: { type: "CREATE", id: null, data: { name: "JS Book", price: 500 } } },
    { requestId: "R2", method: "GET", path: "/products/Product_1", headers: {}, body: null, operation: { type: "READ", id: "Product_1", data: null } }
  ]
})` →

  `{
  requestLog: [
    { requestId: "R1", passed: true, blockedAt: null, modelResult: { success: true, result: { id: "Product_1", name: "JS Book", price: 500 } } },
    { requestId: "R2", passed: false, blockedAt: "auth", modelResult: null }
  ],
  summary: { totalRequests: 2, passedCount: 1, blockedCount: 1 },
  entityStore: [{ id: "Product_1", name: "JS Book", price: 500 }]
}`

---

## 🧩 PROBLEM–09: ⚡ Async Security Engine

⚠️ **Function Name:** `runAsyncSecurityEngine()`

| Input      | `asyncConfig` (object)   |
| :--------- | :----------------------- |
| **Output** | Promise (async function) |

**Rules:**

`asyncConfig` object:

- `tasks` (array of objects):
  - `taskId` (string)
  - `type` (string: `"HASH_PASSWORD"`, `"VERIFY_TOKEN"`, `"CHECK_BREACH"`, `"SCAN_INPUT"`, `"VALIDATE_API_KEY"`)
  - `input` (any) — task-specific input
  - `maxRetries` (number, integer, 1–5)
  - `shouldFail` (boolean) — simulate failure for retry testing

**Task Simulation (use async/await):**

- `"HASH_PASSWORD"`: hash `input` string → `"hash_" + reverse(input) + "_" + input.length`
- `"VERIFY_TOKEN"`: check if `input` starts with `"jwt_"` → valid
- `"CHECK_BREACH"`: check if `input` in `["password", "123456", "qwerty"]` (case-insensitive)
- `"SCAN_INPUT"`: check `input` string for `<script>` or `' OR` or `../` patterns
- `"VALIDATE_API_KEY"`: check if `input` starts with `"key-"` and length ≥ 10

**Retry Logic:**

- If `shouldFail: true` → fail first 2 attempts, succeed on 3rd (if `maxRetries ≥ 3`)
- If `shouldFail: false` → succeed on first attempt
- If retries exhausted → `{ status: "EXHAUSTED" }`

**Process ALL tasks using `Promise.allSettled()` (parallel):**

- Track `attemptLog` per task: `[{ attempt, outcome: "FAILED"|"SUCCEEDED" }]`
- Returns `{ taskId, type, status: "COMPLETED"|"EXHAUSTED", result: task output, attempts: N, attemptLog }`

**Summary:**

- `totalTasks`, `completedCount`, `exhaustedCount`

| Challenge 📢 | Return Promise resolving with `{ taskLog, summary }`. If invalid → return rejected Promise with `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runAsyncSecurityEngine({
  tasks: [
    { taskId: "T1", type: "HASH_PASSWORD", input: "Secure123", maxRetries: 3, shouldFail: false },
    { taskId: "T2", type: "CHECK_BREACH", input: "password", maxRetries: 3, shouldFail: false },
    { taskId: "T3", type: "VERIFY_TOKEN", input: "jwt_U1_USER_3601000000", maxRetries: 3, shouldFail: true }
  ]
})` → resolves with:

  `{
  taskLog: [
    { taskId: "T1", type: "HASH_PASSWORD", status: "COMPLETED", result: { hash: "hash_321eruceS_9" }, attempts: 1, attemptLog: [{ attempt: 1, outcome: "SUCCEEDED" }] },
    { taskId: "T2", type: "CHECK_BREACH", status: "COMPLETED", result: { breached: true, riskLevel: "CRITICAL" }, attempts: 1, attemptLog: [{ attempt: 1, outcome: "SUCCEEDED" }] },
    { taskId: "T3", type: "VERIFY_TOKEN", status: "COMPLETED", result: { valid: true }, attempts: 3, attemptLog: [{ attempt: 1, outcome: "FAILED" }, { attempt: 2, outcome: "FAILED" }, { attempt: 3, outcome: "SUCCEEDED" }] }
  ],
  summary: { totalTasks: 3, completedCount: 3, exhaustedCount: 0 }
}`

---

## 🧩 PROBLEM–10: 🏆 Phase-5 ULTIMATE GRAND ORCHESTRATOR

⚠️ **Function Name:** `runPhase5GrandOrchestrator()`

| Input      | `systemBlueprint` (object) |
| :--------- | :------------------------- |
| **Output** | Promise (async function)   |

**Rules:**

This is the ULTIMATE capstone of Phase-5, composing ALL concepts from Day 201 to Day 250:

- Module 1: Async + Promise
- Module 2: API Design
- Module 3: Node.js Patterns
- Module 4: DSA
- Module 5: Full Stack
- Module 6: Database
- Module 7: Security

`systemBlueprint` object:

- `systemId` (string, non-empty)
- `authConfig` — same as Problem-01
- `gatewayConfig` — same as Problem-02
- `accessControlConfig` — same as Problem-03
- `inputSecurityConfig` — same as Problem-04
- `tokenVaultConfig` — same as Problem-05
- `auditConfig` — same as Problem-06
- `dbConfig` — same as Problem-07
- `pipelineConfig` — same as Problem-08
- `asyncTasks` — same as Problem-09 `tasks` array

**Grand Orchestration (run in this order, async):**

1. **Auth System** → `buildAuthSystem(authConfig)`
2. **Token Vault** → `buildTokenVault(tokenVaultConfig)`
3. **API Gateway** → `buildAPIGateway(gatewayConfig)`
4. **Access Control** → `buildAccessControl(accessControlConfig)`
5. **Input Security** → `buildInputSecurity(inputSecurityConfig)`
6. **DB Security** → `buildDBSecurityLayer(dbConfig)`
7. **Full Stack Pipeline** → `buildFullStackPipeline(pipelineConfig)`
8. **Async Tasks** → `runAsyncSecurityEngine({ tasks: asyncTasks })` (await this)
9. **Security Audit** → `runSecurityAudit(auditConfig)`

**Build Grand Report:**

- `systemId`
- `moduleResults` → `{ auth, tokenVault, gateway, accessControl, inputSecurity, db, pipeline, asyncEngine, audit }`
- `grandSummary`:
  - `totalAuthEvents` → from auth system
  - `totalGatewayRequests` → from gateway
  - `totalAccessRequests` → from access control
  - `totalInputsScanned` → from input security
  - `totalTransactions` → from DB
  - `totalPipelineRequests` → from pipeline
  - `totalAsyncTasks` → from async engine
  - `securityScore` → from audit
- `systemHealthStatus`:
  - `"HEALTHY"` if securityScore ≥ 80
  - `"DEGRADED"` if securityScore ≥ 50
  - `"CRITICAL"` if securityScore < 50
- `phase5Complete: true` ← always set this

**Validation:** invalid `systemBlueprint` or missing fields → return rejected Promise with `"Invalid Input"`

| Challenge 📢 | Return Promise resolving with `{ systemId, moduleResults, grandSummary, systemHealthStatus, phase5Complete: true }`. |
| :----------- | :------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runPhase5GrandOrchestrator({
  systemId: "PHASE5-FINAL-01",
  authConfig: {
    users: [],
    jwtSecret: "grand-secret",
    jwtExpiryMs: 3600000,
    passwordPolicy: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecialChars: false },
    authEvents: [
      { eventId: "AE1", type: "REGISTER", userId: "U1", password: "Secure123", token: null },
      { eventId: "AE2", type: "LOGIN", userId: "U1", password: "Secure123", token: null }
    ]
  },
  gatewayConfig: {
    validAPIKeys: ["key-grand-2025"],
    allowedOrigins: ["https://phase5app.com"],
    rateLimitConfig: { maxRequests: 10, windowMs: 60000 },
    routes: [{ method: "GET", path: "/api/health", requiresAuth: false }],
    requests: [{ requestId: "GR1", method: "GET", path: "/api/health", origin: "https://phase5app.com", apiKey: null, clientId: "C1", timestampMs: 1000 }]
  },
  accessControlConfig: {
    roles: [{ name: "USER", permissions: ["health:read"], inherits: [] }],
    policies: [{ policyId: "P1", effect: "ALLOW", roles: ["USER"], resources: ["health"], actions: ["read"] }],
    accessRequests: [{ requestId: "AC1", userId: "U1", userRole: "USER", resource: "health", action: "read" }]
  },
  inputSecurityConfig: {
    mode: "ESCAPE",
    enabledDetectors: ["XSS", "SQLI"],
    inputs: [{ inputId: "II1", data: { search: "hello world" } }]
  },
  tokenVaultConfig: {
    encryptionKey: "grand-vault-key",
    refreshTokenTTLMs: 86400000,
    sessionTTLMs: 1800000,
    maxSessionsPerUser: 3,
    rotateOnRefresh: true,
    events: [{ eventId: "TV1", type: "ISSUE", userId: "U1", tokenRef: null, currentTimeMs: 1000000 }]
  },
  auditConfig: {
    events: [
      { eventId: "AU1", eventType: "AUTH_SUCCESS", userId: "U1", resource: null, severity: "INFO", timestamp: 1000000, details: {} },
      { eventId: "AU2", eventType: "AUTH_SUCCESS", userId: "U1", resource: null, severity: "INFO", timestamp: 1001000, details: {} }
    ],
    alertThresholds: { authFailuresPerMinute: 5, threatsPerMinute: 3, rateLimitedPerMinute: 10 },
    breachedPasswords: ["password", "123456"],
    passwordsToCheck: ["Secure123"]
  },
  dbConfig: {
    tables: { products: [{ id: "P1", name: "JS Book", price: 500 }] },
    indexes: [{ table: "products", field: "id", type: "HASH" }],
    transactions: [{ txnId: "DT1", isolationLevel: "READ_COMMITTED", operations: [{ type: "READ", table: "products", id: "P1", data: null }], shouldRollback: false }],
    queries: [{ queryId: "DQ1", table: "products", filter: { field: "id", operator: "=", value: "P1" }, sanitize: true }]
  },
  pipelineConfig: {
    modelConfig: { entityName: "Order", schema: { product: { type: "string", required: true, default: null }, qty: { type: "number", required: true, default: null } } },
    middlewares: [{ name: "logger", type: "LOGGER", config: {} }],
    requests: [{ requestId: "PR1", method: "POST", path: "/orders", headers: {}, body: { product: "JS Book", qty: 2 }, operation: { type: "CREATE", id: null, data: { product: "JS Book", qty: 2 } } }]
  },
  asyncTasks: [
    { taskId: "AT1", type: "HASH_PASSWORD", input: "Secure123", maxRetries: 3, shouldFail: false },
    { taskId: "AT2", type: "CHECK_BREACH", input: "Secure123", maxRetries: 3, shouldFail: false }
  ]
})` → resolves with:

  **Manual Verify:**
  - Auth: 2 events (REGISTER + LOGIN) → successCount: 2
  - Gateway: 1 request (GET /api/health, no auth required, origin ok) → passedCount: 1
  - Access: 1 request (USER, health:read) → permittedCount: 1
  - Input: 1 input, no threats → cleanInputs: 1
  - Vault: 1 event (ISSUE) → activeTokens: 1
  - Audit: 2 AUTH_SUCCESS → securityScore: 100 + 5+5 = 110 → capped at 100
  - DB: 1 txn committed, 1 query (INDEX_SCAN, not blocked) → committed: 1
  - Pipeline: 1 request passed (logger only, no auth middleware) → passedCount: 1
  - Async: 2 tasks completed
  - systemHealthStatus: HEALTHY (score ≥ 80)

  `{
  systemId: "PHASE5-FINAL-01",
  moduleResults: {
    auth: { summary: { totalEvents: 2, successCount: 2, failureCount: 0 } },
    tokenVault: { summary: { totalEvents: 1, activeTokens: 1, activeSessions: 0, revokedCount: 0 } },
    gateway: { summary: { totalRequests: 1, passedCount: 1, blockedCount: 0 } },
    accessControl: { summary: { totalRequests: 1, permittedCount: 1, deniedCount: 0 } },
    inputSecurity: { overallSummary: { totalInputs: 1, cleanInputs: 1, threatenedInputs: 0 } },
    db: { summary: { transactionSummary: { committed: 1, rolledBack: 0 }, querySummary: { total: 1, indexScans: 1, fullScans: 0, blocked: 0 } } },
    pipeline: { summary: { totalRequests: 1, passedCount: 1, blockedCount: 0 } },
    asyncEngine: { summary: { totalTasks: 2, completedCount: 2, exhaustedCount: 0 } },
    audit: { securityScore: 100 }
  },
  grandSummary: {
    totalAuthEvents: 2,
    totalGatewayRequests: 1,
    totalAccessRequests: 1,
    totalInputsScanned: 1,
    totalTransactions: 1,
    totalPipelineRequests: 1,
    totalAsyncTasks: 2,
    securityScore: 100
  },
  systemHealthStatus: "HEALTHY",
  phase5Complete: true
}`

---
