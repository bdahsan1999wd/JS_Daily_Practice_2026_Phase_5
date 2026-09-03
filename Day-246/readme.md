# 🎓 JS DAILY PRACTICE – DAY-246

📅 **Goal:** API Key Lifecycle Manager (Security & Auth Patterns)
🎯 **Focus:** API Key Generation • Key Rotation • Scope Management • Usage Tracking • Key Expiry

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔑 API Key Generator

⚠️ **Function Name:** `createAPIKeyGenerator()`

| Input      | `generatorConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (API key generator) |

**Rules:**

`generatorConfig` object:

- `prefix` (string, non-empty) — key prefix e.g. `"sk"`, `"pk"`, `"api"`
- `keyLength` (number, integer, 16–64) — length of random part
- `environment` (string: `"live"`, `"test"`) — key environment

Return an API key generator object with:

- `generate(ownerId, metadata)` — generate a new API key
- `generatePair()` — generate a public + secret key pair
- `parseKey(key)` — extract info from key format
- `getGeneratedKeys()` — return metadata of all generated keys

**Key Format:**

```
{prefix}_{environment}_{randomPart}
```

Example: `secret_live_a1b2c3d4e5f6...` or `public_test_xyz...`

**Simulated Random Generation:**

- Same as Day-245 Problem-01: use seed-based generation
- `charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"`
- `charIndex = (autoSeed * 7 + position * 13) % charsetLength`
- `autoSeed` increments each call

**Operation Rules:**

- `generate(ownerId, metadata)`:
  - `ownerId` must be non-empty string
  - Generate random part of `keyLength` chars
  - Build full key: `prefix + "_" + environment + "_" + randomPart`
  - Returns `{ key, keyId: "KEY-" + autoIndex, ownerId, prefix, environment, createdAt: "2025-01-01T00:00:00Z", metadata }`

- `generatePair()`:
  - Generate `pk` (public key) and `sk` (secret key) with same ownerId
  - Returns `{ publicKey: { key, keyId }, secretKey: { key, keyId }, pairedAt: "2025-01-01T00:00:00Z" }`

- `parseKey(key)`:
  - Parse format: `prefix_environment_randomPart`
  - Returns `{ prefix, environment, randomPart, isValid: boolean }` or `{ error: "Invalid key format" }`

- `getGeneratedKeys()` → array of `{ keyId, ownerId, prefix, environment, createdAt }` (no actual key values)

**Validation:** invalid `generatorConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the API key generator object with all 4 methods. |
| :----------- | :------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const gen = createAPIKeyGenerator({
  prefix: "sk",
  keyLength: 32,
  environment: "live",
});

gen.generate("USER-1", { name: "My App", description: "Production key" });
// → {
//   key: "secret_live_<randomPart>",
//   keyId: "KEY-1",
//   ownerId: "USER-1",
//   prefix: "sk",
//   environment: "live",
//   createdAt: "2025-01-01T00:00:00Z",
//   metadata: { name: "My App", description: "Production key" }
// }

gen.parseKey("secret_live_<randomPart>");
// → { prefix: "sk", environment: "live", randomPart: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef", isValid: true }

gen.parseKey("invalid-key-format");
// → { error: "Invalid key format" }

gen.getGeneratedKeys();
// → [{ keyId: "KEY-1", ownerId: "USER-1", prefix: "sk", environment: "live", createdAt: "2025-01-01T00:00:00Z" }]
```

---

## 🧩 PROBLEM–02: 🗃️ API Key Store

⚠️ **Function Name:** `createAPIKeyStore()`

| Input      | `storeConfig` (object) |
| :--------- | :--------------------- |
| **Output** | object (API key store) |

**Rules:**

`storeConfig` object:

- `defaultExpiryMs` (number, > 0) — default key lifetime
- `maxKeysPerOwner` (number, integer, ≥ 1)

Return an API key store object with:

- `store(keyData)` — store an API key
- `retrieve(key)` — get key info by key string
- `validate(key, currentTimeMs)` — check if key is valid and active
- `revoke(key, reason)` — revoke a key
- `listByOwner(ownerId)` — list all keys for an owner
- `getStoreStats()` — return store statistics

**Key Data Structure:**

```javascript
{
  key: string,
  keyId: string,
  ownerId: string,
  scopes: [string],
  expiresAt: number or null,  // null = never expires
  status: "ACTIVE" | "REVOKED" | "EXPIRED",
  revokedReason: null or string,
  createdAt: "2025-01-01T00:00:00Z",
  lastUsedAt: null,
  usageCount: 0
}
```

**Operation Rules:**

- `store(keyData)`:
  - Check if owner already has `maxKeysPerOwner` active keys → `{ stored: false, reason: "Max keys reached for owner" }`
  - If `keyData.expiresAt` not provided → set to `1000000 + defaultExpiryMs`
  - Returns `{ stored: true, keyId, expiresAt }`

- `validate(key, currentTimeMs)`:
  - If not found → `{ valid: false, reason: "KEY_NOT_FOUND" }`
  - If `status === "REVOKED"` → `{ valid: false, reason: "KEY_REVOKED", revokedReason }`
  - If `expiresAt && currentTimeMs > expiresAt` → set status `"EXPIRED"`, return `{ valid: false, reason: "KEY_EXPIRED" }`
  - Else → update `lastUsedAt`, increment `usageCount`, return `{ valid: true, keyId, ownerId, scopes }`

- `revoke(key, reason)` → `{ revoked: true, key, reason }` or `{ error: "Key not found" }`
- `listByOwner(ownerId)` → `{ ownerId, keys: [key data objects], totalCount, activeCount }`
- `getStoreStats()` → `{ totalKeys, active, revoked, expired, uniqueOwners }`

**Validation:** invalid `storeConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the API key store object with all 6 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const store = createAPIKeyStore({
  defaultExpiryMs: 2592000000,
  maxKeysPerOwner: 5,
});

store.store({
  key: "secret_live_<example-key>",
  keyId: "KEY-1",
  ownerId: "U1",
  scopes: ["read:data", "write:data"],
  expiresAt: null,
  createdAt: "2025-01-01T00:00:00Z",
});
// → { stored: true, keyId: "KEY-1", expiresAt: 2593000000 }

store.validate("secret_live_abc123", 1000000);
// → { valid: true, keyId: "KEY-1", ownerId: "U1", scopes: ["read:data", "write:data"] }

store.validate("secret_live_abc123", 9999999999);
// expired
// → { valid: false, reason: "KEY_EXPIRED" }

store.revoke("secret_live_abc123", "Security breach suspected");
// → { revoked: true, key: "secret_live_abc123", reason: "Security breach suspected" }

store.getStoreStats();
// → { totalKeys: 1, active: 0, revoked: 1, expired: 0, uniqueOwners: 1 }
```

---

## 🧩 PROBLEM–03: 🎯 Scope & Permission Manager

⚠️ **Function Name:** `createScopeManager()`

| Input      | `scopeConfig` (object) |
| :--------- | :--------------------- |
| **Output** | object (scope manager) |

**Rules:**

`scopeConfig` object:

- `availableScopes` (array of objects):
  - `scope` (string) — e.g. `"read:users"`, `"write:orders"`
  - `description` (string)
  - `riskLevel` (string: `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"`)
- `scopeHierarchy` (object) — `{ parentScope: [childScopes] }`:
  - e.g. `{ "admin": ["read:users", "write:users", "read:orders"] }`
  - Granting `"admin"` scope automatically grants all children

Return a scope manager object with:

- `validateScopes(requestedScopes)` — check if scopes are valid
- `expandScopes(scopes)` — expand parent scopes to include children
- `checkPermission(keyScopes, requiredScope)` — check if key has permission
- `getScopeInfo(scope)` — return scope details
- `buildScopeSet(template)` — build a predefined scope set

**Operation Rules:**

- `validateScopes(requestedScopes)`:
  - Check each scope against `availableScopes`
  - Returns `{ valid: boolean, validScopes: [], invalidScopes: [], riskAssessment: { LOW: N, MEDIUM: N, HIGH: N, CRITICAL: N } }`

- `expandScopes(scopes)`:
  - For each scope in input, check if it's a parent in `scopeHierarchy`
  - If so, add all children
  - Returns `{ original: scopes, expanded: [all scopes including children], addedScopes: [newly added] }`

- `checkPermission(keyScopes, requiredScope)`:
  - First expand `keyScopes` (include hierarchy children)
  - Check if `requiredScope` is in expanded scopes
  - Returns `{ permitted: boolean, requiredScope, keyScopes: expanded, reason: null or "SCOPE_NOT_GRANTED" }`

- `getScopeInfo(scope)` → scope object with description and riskLevel, or `{ error: "Unknown scope: " + scope }`

- `buildScopeSet(template)`:
  - `template`: `"READ_ONLY"`, `"READ_WRITE"`, `"ADMIN"`, `"MINIMAL"`
  - `"READ_ONLY"` → all scopes starting with `"read:"`
  - `"READ_WRITE"` → all scopes starting with `"read:"` or `"write:"`
  - `"ADMIN"` → all available scopes
  - `"MINIMAL"` → only `LOW` risk scopes
  - Returns `{ template, scopes: [scope strings], count }`

**Validation:** invalid `scopeConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the scope manager object with all 5 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const sm = createScopeManager({
  availableScopes: [
    { scope: "read:users", description: "Read user data", riskLevel: "LOW" },
    {
      scope: "write:users",
      description: "Modify user data",
      riskLevel: "HIGH",
    },
    { scope: "read:orders", description: "Read orders", riskLevel: "LOW" },
    {
      scope: "write:orders",
      description: "Create/modify orders",
      riskLevel: "MEDIUM",
    },
    { scope: "admin", description: "Full admin access", riskLevel: "CRITICAL" },
  ],
  scopeHierarchy: {
    admin: ["read:users", "write:users", "read:orders", "write:orders"],
  },
});

sm.validateScopes(["read:users", "write:orders", "unknown:scope"]);
// → { valid: false, validScopes: ["read:users", "write:orders"], invalidScopes: ["unknown:scope"], riskAssessment: { LOW: 1, MEDIUM: 1, HIGH: 0, CRITICAL: 0 } }

sm.expandScopes(["admin", "read:orders"]);
// admin → [read:users, write:users, read:orders, write:orders]; read:orders already included
// → { original: ["admin", "read:orders"], expanded: ["admin", "read:users", "write:users", "read:orders", "write:orders"], addedScopes: ["read:users", "write:users", "write:orders"] }

sm.checkPermission(["admin"], "write:users");
// expand admin → includes write:users → permitted
// → { permitted: true, requiredScope: "write:users", keyScopes: ["admin", "read:users", "write:users", "read:orders", "write:orders"], reason: null }

sm.buildScopeSet("READ_ONLY");
// → { template: "READ_ONLY", scopes: ["read:users", "read:orders"], count: 2 }
```

---

## 🧩 PROBLEM–04: 📊 API Key Usage Tracker

⚠️ **Function Name:** `createUsageTracker()`

| Input      | `trackerConfig` (object) |
| :--------- | :----------------------- |
| **Output** | object (usage tracker)   |

**Rules:**

`trackerConfig` object:

- `rateLimits` (object) — `{ scope: { requestsPerMinute, requestsPerDay } }`
  - e.g. `{ "read:users": { requestsPerMinute: 60, requestsPerDay: 10000 } }`
  - `"default"` key for scopes without specific limits
- `trackingWindowMs` (number, > 0) — sliding window for rate limiting

Return a usage tracker object with:

- `recordUsage(keyId, scope, currentTimeMs)` — record an API call
- `checkRateLimit(keyId, scope, currentTimeMs)` — check if key is within limits
- `getUsageStats(keyId)` — return usage statistics for a key
- `getTopKeys(n)` — return top N keys by usage count
- `resetUsage(keyId)` — reset usage counters for a key
- `generateUsageReport()` — comprehensive usage report

**Usage Tracking Rules:**

- Internal store: `{ keyId: { totalRequests, requestLog: [{ scope, timestamp }], dailyCount, minuteCount } }`

- `recordUsage(keyId, scope, currentTimeMs)`:
  - Add to request log
  - Returns `{ recorded: true, keyId, scope, currentTimeMs }`

- `checkRateLimit(keyId, scope, currentTimeMs)`:
  - Count requests in last 60000ms (1 minute) for this key → `minuteCount`
  - Count requests in last 86400000ms (24 hours) for this key → `dailyCount`
  - Get limit from `rateLimits[scope]` or `rateLimits["default"]`
  - If `minuteCount >= requestsPerMinute` → `{ allowed: false, reason: "RATE_LIMIT_MINUTE", retryAfterMs: time until oldest request leaves window }`
  - If `dailyCount >= requestsPerDay` → `{ allowed: false, reason: "RATE_LIMIT_DAY" }`
  - Else → `{ allowed: true, minuteCount, dailyCount, remainingMinute: limit - minuteCount, remainingDay: limit - dailyCount }`

- `getUsageStats(keyId)` → `{ keyId, totalRequests, last24hRequests, lastMinuteRequests, topScopes: [{ scope, count }], firstUsedAt, lastUsedAt }`

- `getTopKeys(n)` → array of `{ keyId, totalRequests }` sorted desc, top N

- `resetUsage(keyId)` → `{ reset: true, keyId, previousTotal: N }`

- `generateUsageReport()` → `{ totalKeys, totalRequests, avgRequestsPerKey: rounded to 2dp, peakUsageKey, scopeBreakdown: { scope: count } }`

**Validation:** invalid `trackerConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the usage tracker object with all 6 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const tracker = createUsageTracker({
  rateLimits: {
    "read:users": { requestsPerMinute: 2, requestsPerDay: 100 },
    default: { requestsPerMinute: 10, requestsPerDay: 1000 },
  },
  trackingWindowMs: 60000,
});

tracker.recordUsage("KEY-1", "read:users", 1000000);
tracker.recordUsage("KEY-1", "read:users", 1010000);
tracker.recordUsage("KEY-1", "read:users", 1020000);

tracker.checkRateLimit("KEY-1", "read:users", 1030000);
// 3 requests in last minute, limit=2 → RATE_LIMITED
// → { allowed: false, reason: "RATE_LIMIT_MINUTE", retryAfterMs: 30000 }

tracker.checkRateLimit("KEY-1", "read:users", 1070000);
// first request (at 1000000) is now outside 60s window → only 2 remain
// → { allowed: true, minuteCount: 2, dailyCount: 3, remainingMinute: 0, remainingDay: 97 }

tracker.getUsageStats("KEY-1");
// → { keyId: "KEY-1", totalRequests: 3, last24hRequests: 3, lastMinuteRequests: 2, topScopes: [{ scope: "read:users", count: 3 }], firstUsedAt: 1000000, lastUsedAt: 1020000 }
```

---

## 🧩 PROBLEM–05: 🏗️ Full API Key Lifecycle Orchestrator

⚠️ **Function Name:** `runAPIKeyLifecycleOrchestrator()`

| Input      | `lifecycleConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object                     |

**Rules:**

`lifecycleConfig` object:

- `orchestratorId` (string, non-empty)
- `generatorConfig` (object) — same shape as Problem-01
- `storeConfig` (object) — same shape as Problem-02
- `scopeConfig` (object) — same shape as Problem-03
- `trackerConfig` (object) — same shape as Problem-04
- `keyOperations` (array of objects):
  - `operationId` (string)
  - `type` (string: `"CREATE"`, `"VALIDATE"`, `"USE"`, `"REVOKE"`, `"ROTATE"`)
  - `ownerId` (string)
  - `keyRef` (string or null) — references a previous operation's keyId
  - `scopes` (array of strings or null)
  - `metadata` (object or null)
  - `currentTimeMs` (number)
  - `requiredScope` (string or null) — for USE operation

**Operation Rules:**

- `"CREATE"` → generate key (Problem-01) + validate scopes (Problem-03) + store (Problem-02)
  - Returns `{ keyId, key, scopes, expiresAt }`

- `"VALIDATE"` → retrieve key from store + validate (Problem-02) + check scope if `requiredScope` provided (Problem-03)
  - Returns `{ valid, ownerId, scopes, permitted: boolean or null }`

- `"USE"` → validate key (Problem-02) + check rate limit (Problem-04) + record usage (Problem-04)
  - Returns `{ allowed: boolean, reason: null or rate limit reason, usageRecorded: boolean }`

- `"REVOKE"` → revoke key in store (Problem-02) + reset usage (Problem-04)
  - Returns `{ revoked: boolean, keyId }`

- `"ROTATE"` → revoke old key + generate new key with same scopes/owner
  - Returns `{ oldKeyId, newKeyId, newKey, rotatedAt: "2025-01-01T00:00:00Z" }`

**Summary:**

- `totalOperations`
- `keysCreated`, `keysRevoked`, `keysRotated`
- `validationsPassed`, `validationsFailed`
- `usageAllowed`, `usageBlocked`

**Validation:** invalid `lifecycleConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, operationLog, summary }` where `operationLog` is array of `{ operationId, type, ownerId, result }`. |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runAPIKeyLifecycleOrchestrator({
  orchestratorId: "KEY-ORCH-01",
  generatorConfig: { prefix: "sk", keyLength: 24, environment: "live" },
  storeConfig: { defaultExpiryMs: 2592000000, maxKeysPerOwner: 5 },
  scopeConfig: {
    availableScopes: [
      { scope: "read:data", description: "Read data", riskLevel: "LOW" },
      { scope: "write:data", description: "Write data", riskLevel: "MEDIUM" }
    ],
    scopeHierarchy: {}
  },
  trackerConfig: {
    rateLimits: { "default": { requestsPerMinute: 2, requestsPerDay: 100 } },
    trackingWindowMs: 60000
  },
  keyOperations: [
    { operationId: "OP-1", type: "CREATE", ownerId: "U1", keyRef: null, scopes: ["read:data", "write:data"], metadata: { name: "Main Key" }, currentTimeMs: 1000000, requiredScope: null },
    { operationId: "OP-2", type: "USE", ownerId: "U1", keyRef: "OP-1", scopes: null, metadata: null, currentTimeMs: 1001000, requiredScope: "read:data" },
    { operationId: "OP-3", type: "USE", ownerId: "U1", keyRef: "OP-1", scopes: null, metadata: null, currentTimeMs: 1002000, requiredScope: "read:data" },
    { operationId: "OP-4", type: "USE", ownerId: "U1", keyRef: "OP-1", scopes: null, metadata: null, currentTimeMs: 1003000, requiredScope: "read:data" },
    { operationId: "OP-5", type: "ROTATE", ownerId: "U1", keyRef: "OP-1", scopes: ["read:data", "write:data"], metadata: null, currentTimeMs: 1004000, requiredScope: null }
  ]
})` →

  **Manual Verify:**
  - OP-1: CREATE → key generated, scopes valid, stored → KEY-1
  - OP-2: USE KEY-1 → validate✓ → rateLimit: 1/2 min → allowed → record
  - OP-3: USE KEY-1 → validate✓ → rateLimit: 2/2 min → allowed (at limit)
  - OP-4: USE KEY-1 → validate✓ → rateLimit: 3/2 min → BLOCKED
  - OP-5: ROTATE → revoke KEY-1, generate KEY-2 with same scopes
  - usageAllowed: 2, usageBlocked: 1

  `{
  orchestratorId: "KEY-ORCH-01",
  operationLog: [
    { operationId: "OP-1", type: "CREATE", ownerId: "U1", result: { keyId: "KEY-1", key: "secret_live_<random>", scopes: ["read:data", "write:data"], expiresAt: 2593000000 } },
    { operationId: "OP-2", type: "USE", ownerId: "U1", result: { allowed: true, reason: null, usageRecorded: true } },
    { operationId: "OP-3", type: "USE", ownerId: "U1", result: { allowed: true, reason: null, usageRecorded: true } },
    { operationId: "OP-4", type: "USE", ownerId: "U1", result: { allowed: false, reason: "RATE_LIMIT_MINUTE", usageRecorded: false } },
    { operationId: "OP-5", type: "ROTATE", ownerId: "U1", result: { oldKeyId: "KEY-1", newKeyId: "KEY-2", newKey: "secret_live_<new_random>", rotatedAt: "2025-01-01T00:00:00Z" } }
  ],
  summary: {
    totalOperations: 5,
    keysCreated: 1,
    keysRevoked: 1,
    keysRotated: 1,
    validationsPassed: 0,
    validationsFailed: 0,
    usageAllowed: 2,
    usageBlocked: 1
  }
}`

---
