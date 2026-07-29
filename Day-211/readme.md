# 🎓 JS DAILY PRACTICE – DAY-211

📅 **Goal:** Rate Limiter & Throttle Engine (API Design & Data Transformation)
🎯 **Focus:** Rate Limiting Algorithms • Sliding Window • Token Bucket • IP-Based Limiting • Throttle Logic

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🚦 Fixed Window Rate Limiter

⚠️ **Function Name:** `checkFixedWindowLimit()`

| Input      | `requests` (array of objects), `windowConfig` (object) |
| :--------- | :----------------------------------------------------- |
| **Output** | object                                                 |

**Rules:**

`requests` — non-empty array, each:

- `requestId` (string)
- `clientId` (string)
- `timestampMs` (number, ≥ 0)

`windowConfig` object:

- `windowSizeMs` (number, > 0) — size of the time window
- `maxRequests` (number, integer, ≥ 1) — max allowed requests per window per client

**Fixed Window Rules:**

- Group requests by `clientId`
- For each client, divide their requests into fixed windows:
  - `windowNumber = Math.floor(timestampMs / windowSizeMs)`
  - Count requests per window per client
  - If count exceeds `maxRequests` → those excess requests are RATE_LIMITED
- A request is ALLOWED if it's within the limit, RATE_LIMITED if it exceeds
- Process requests in arrival order (by `timestampMs`) per client

| Challenge 📢 | Return `{ results, allowedCount, rateLimitedCount }` where `results` is array of `{ requestId, clientId, status: "ALLOWED" or "RATE_LIMITED" }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `checkFixedWindowLimit([
  { requestId: "R1", clientId: "C1", timestampMs: 100 },
  { requestId: "R2", clientId: "C1", timestampMs: 200 },
  { requestId: "R3", clientId: "C1", timestampMs: 300 },
  { requestId: "R4", clientId: "C1", timestampMs: 1100 }
], { windowSizeMs: 1000, maxRequests: 2 })` ➔

  `{
  results: [
    { requestId: "R1", clientId: "C1", status: "ALLOWED" },
    { requestId: "R2", clientId: "C1", status: "ALLOWED" },
    { requestId: "R3", clientId: "C1", status: "RATE_LIMITED" },
    { requestId: "R4", clientId: "C1", status: "ALLOWED" }
  ],
  allowedCount: 3,
  rateLimitedCount: 1
}`

---

## 🧩 PROBLEM–02: 🪣 Token Bucket Rate Limiter

⚠️ **Function Name:** `simulateTokenBucket()`

| Input      | `requests` (array of objects), `bucketConfig` (object) |
| :--------- | :----------------------------------------------------- |
| **Output** | object                                                 |

**Rules:**

`requests` — non-empty array, ORDERED by `timestampMs`, each:

- `requestId` (string)
- `timestampMs` (number, ≥ 0)
- `tokensRequired` (number, integer, ≥ 1)

`bucketConfig` object:

- `bucketCapacity` (number, integer, ≥ 1) — max tokens
- `refillRatePerMs` (number, > 0) — tokens added per millisecond
- `initialTokens` (number, ≥ 0) — starting tokens (≤ bucketCapacity)

**Token Bucket Rules:**

- Start with `currentTokens = initialTokens`
- For each request (in order):
  1. Calculate tokens refilled since last request: `refilled = (timestampMs - lastTimestampMs) × refillRatePerMs`
  2. `currentTokens = Math.min(bucketCapacity, currentTokens + refilled)`
  3. If `currentTokens >= tokensRequired` → ALLOWED, deduct: `currentTokens -= tokensRequired`
  4. Else → RATE_LIMITED, tokens stay unchanged
  5. Update `lastTimestampMs = timestampMs`

| Challenge 📢 | Return `{ results, finalTokenCount }` where `results` is array of `{ requestId, status, tokensAfter }`. If invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `simulateTokenBucket([
  { requestId: "R1", timestampMs: 0, tokensRequired: 3 },
  { requestId: "R2", timestampMs: 0, tokensRequired: 3 },
  { requestId: "R3", timestampMs: 500, tokensRequired: 2 }
], { bucketCapacity: 5, refillRatePerMs: 0.01, initialTokens: 5 })` ➔

  `{
  results: [
    { requestId: "R1", status: "ALLOWED", tokensAfter: 2 },
    { requestId: "R2", status: "RATE_LIMITED", tokensAfter: 2 },
    { requestId: "R3", status: "ALLOWED", tokensAfter: 3 }
  ],
  finalTokenCount: 3
}`

---

## 🧩 PROBLEM–03: 🌊 Sliding Window Rate Limiter

⚠️ **Function Name:** `checkSlidingWindowLimit()`

| Input      | `requests` (array of objects), `windowConfig` (object) |
| :--------- | :----------------------------------------------------- |
| **Output** | object                                                 |

**Rules:**

`requests` — non-empty array, ORDERED by `timestampMs`, each:

- `requestId` (string)
- `clientId` (string)
- `timestampMs` (number, ≥ 0)

`windowConfig` object:

- `windowSizeMs` (number, > 0)
- `maxRequests` (number, integer, ≥ 1)

**Sliding Window Rules:**

- For each request, look back a rolling window of `windowSizeMs` ms ending at the current `timestampMs`
- Count how many ALLOWED requests from the same `clientId` fall within `[timestampMs - windowSizeMs, timestampMs)` (exclusive of current)
- If count < `maxRequests` → ALLOW this request
- Else → RATE_LIMITED

| Challenge 📢 | Return `{ results, allowedCount, rateLimitedCount }` where `results` is array of `{ requestId, clientId, status, windowCount }` (`windowCount` = requests in window before this one). If invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `checkSlidingWindowLimit([
  { requestId: "R1", clientId: "C1", timestampMs: 100 },
  { requestId: "R2", clientId: "C1", timestampMs: 400 },
  { requestId: "R3", clientId: "C1", timestampMs: 700 },
  { requestId: "R4", clientId: "C1", timestampMs: 900 }
], { windowSizeMs: 500, maxRequests: 2 })` ➔

  `{
  results: [
    { requestId: "R1", clientId: "C1", status: "ALLOWED", windowCount: 0 },
    { requestId: "R2", clientId: "C1", status: "ALLOWED", windowCount: 1 },
    { requestId: "R3", clientId: "C1", status: "ALLOWED", windowCount: 1 },
    { requestId: "R4", clientId: "C1", status: "ALLOWED", windowCount: 1 }
  ],
  allowedCount: 4,
  rateLimitedCount: 0
}`

---

## 🧩 PROBLEM–04: 🎯 Tiered Rate Limit Policy Engine

⚠️ **Function Name:** `applyTieredRateLimit()`

| Input      | `requests` (array of objects), `tierPolicies` (object) |
| :--------- | :----------------------------------------------------- |
| **Output** | object                                                 |

**Rules:**

`requests` — non-empty array, each:

- `requestId` (string)
- `clientId` (string)
- `clientTier` (string: "FREE", "BASIC", "PREMIUM", "ENTERPRISE")
- `timestampMs` (number, ≥ 0)

`tierPolicies` object — each key is a tier, value is `{ maxRequests, windowSizeMs }`:

```
{
  FREE: { maxRequests: 10, windowSizeMs: 60000 },
  BASIC: { maxRequests: 100, windowSizeMs: 60000 },
  PREMIUM: { maxRequests: 1000, windowSizeMs: 60000 },
  ENTERPRISE: { maxRequests: 999999, windowSizeMs: 60000 }
}
```

**Tiered Rules:**

- Apply FIXED WINDOW rate limiting (Problem-01 logic) per client, using their tier's policy
- Each client's tier determines their `maxRequests` and `windowSizeMs`

| Challenge 📢 | Return `{ results, tierSummary }` where `tierSummary` is object: each tier → `{ totalRequests, allowed, rateLimited }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `applyTieredRateLimit([
  { requestId: "R1", clientId: "C1", clientTier: "FREE", timestampMs: 100 },
  { requestId: "R2", clientId: "C1", clientTier: "FREE", timestampMs: 200 },
  { requestId: "R3", clientId: "C2", clientTier: "PREMIUM", timestampMs: 100 }
], {
  FREE: { maxRequests: 1, windowSizeMs: 60000 },
  BASIC: { maxRequests: 100, windowSizeMs: 60000 },
  PREMIUM: { maxRequests: 1000, windowSizeMs: 60000 },
  ENTERPRISE: { maxRequests: 999999, windowSizeMs: 60000 }
})` ➔

  `{
  results: [
    { requestId: "R1", clientId: "C1", status: "ALLOWED" },
    { requestId: "R2", clientId: "C1", status: "RATE_LIMITED" },
    { requestId: "R3", clientId: "C2", status: "ALLOWED" }
  ],
  tierSummary: {
    FREE: { totalRequests: 2, allowed: 1, rateLimited: 1 },
    PREMIUM: { totalRequests: 1, allowed: 1, rateLimited: 0 }
  }
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Rate Limit Orchestrator

⚠️ **Function Name:** `runRateLimitOrchestrator()`

| Input      | `incomingRequests` (array of objects), `config` (object) |
| :--------- | :------------------------------------------------------- |
| **Output** | object                                                   |

**Rules:**

`incomingRequests` — non-empty array, each:

- `requestId` (string)
- `clientId` (string)
- `clientTier` (string: "FREE", "BASIC", "PREMIUM", "ENTERPRISE")
- `timestampMs` (number, ≥ 0)
- `tokensRequired` (number, integer, ≥ 1)

`config` object:

- `algorithm` (string: "FIXED_WINDOW", "TOKEN_BUCKET")
- `windowSizeMs` (number, > 0) — for FIXED_WINDOW
- `maxRequests` (number, ≥ 1) — for FIXED_WINDOW
- `bucketCapacity` (number, ≥ 1) — for TOKEN_BUCKET
- `refillRatePerMs` (number, > 0) — for TOKEN_BUCKET
- `initialTokens` (number, ≥ 0) — for TOKEN_BUCKET

**Orchestration Rules:**

- If `algorithm === "FIXED_WINDOW"` → apply Problem-01 logic (ignore token fields)
- If `algorithm === "TOKEN_BUCKET"` → apply Problem-02 logic (ignore window/maxRequests fields), treat all requests as one shared bucket (not per-client)
- After processing, build `rateLimitReport`:
  - `algorithm`
  - `totalRequests`
  - `allowedCount`
  - `rateLimitedCount`
  - `rateLimitedPercent` → rounded to 2 decimal places
  - `mostThrottledClient` → clientId with most RATE_LIMITED requests (null if none)

| Challenge 📢 | Return `{ results, rateLimitReport }`. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runRateLimitOrchestrator([
  { requestId: "R1", clientId: "C1", clientTier: "FREE", timestampMs: 0, tokensRequired: 1 },
  { requestId: "R2", clientId: "C1", clientTier: "FREE", timestampMs: 10, tokensRequired: 1 },
  { requestId: "R3", clientId: "C2", clientTier: "BASIC", timestampMs: 20, tokensRequired: 1 }
], {
  algorithm: "FIXED_WINDOW",
  windowSizeMs: 1000,
  maxRequests: 1,
  bucketCapacity: 5,
  refillRatePerMs: 0.01,
  initialTokens: 5
})` ➔

  `{
  results: [
    { requestId: "R1", clientId: "C1", status: "ALLOWED" },
    { requestId: "R2", clientId: "C1", status: "RATE_LIMITED" },
    { requestId: "R3", clientId: "C2", status: "ALLOWED" }
  ],
  rateLimitReport: {
    algorithm: "FIXED_WINDOW",
    totalRequests: 3,
    allowedCount: 2,
    rateLimitedCount: 1,
    rateLimitedPercent: 33.33,
    mostThrottledClient: "C1"
  }
}`

---
