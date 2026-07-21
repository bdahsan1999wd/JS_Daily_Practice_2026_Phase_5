# 🎓 JS DAILY PRACTICE – DAY-203

📅 **Goal:** Parallel Data Fetcher (Async JavaScript & Promise Engineering)
🎯 **Focus:** Promise.all() • Promise.allSettled() • Promise.race() • Promise.any() • Concurrent Execution Patterns

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Use **Promise** or **async/await** where specified.
- If input is invalid → return a **rejected Promise** with `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🗄️ Multi-Source Data Aggregator

⚠️ **Function Name:** `aggregateFromSources()`

| Input      | `sources` (array of objects) |
| :--------- | :--------------------------- |
| **Output** | Promise                      |

**Rules:**

`sources` — non-empty array, each:

- `sourceId` (string, non-empty)
- `dataType` (string: "USERS", "PRODUCTS", "ORDERS")

**Simulation Rules:**

- For each source, simulate fetch:
  - `dataType === "USERS"` → resolves `{ sourceId, dataType, records: [{ id: "U1" }, { id: "U2" }] }`
  - `dataType === "PRODUCTS"` → resolves `{ sourceId, dataType, records: [{ id: "P1" }, { id: "P2" }, { id: "P3" }] }`
  - `dataType === "ORDERS"` → resolves `{ sourceId, dataType, records: [{ id: "O1" }] }`
- Use **`Promise.all()`** to fetch all sources simultaneously
- After all resolve, compute `totalRecords` → sum of all `records.length` values

| Challenge 📢 | Return Promise resolving with `{ results, totalRecords }`. If invalid → reject `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `aggregateFromSources([
  { sourceId: "S1", dataType: "USERS" },
  { sourceId: "S2", dataType: "PRODUCTS" }
])` → resolves with:

  `{
  results: [
    { sourceId: "S1", dataType: "USERS", records: [{ id: "U1" }, { id: "U2" }] },
    { sourceId: "S2", dataType: "PRODUCTS", records: [{ id: "P1" }, { id: "P2" }, { id: "P3" }] }
  ],
  totalRecords: 5
}`

---

## 🧩 PROBLEM–02: 🏁 Fastest Source Finder

⚠️ **Function Name:** `findFastestSource()`

| Input      | `sources` (array of objects) |
| :--------- | :--------------------------- |
| **Output** | Promise                      |

**Rules:**

`sources` — non-empty array, each:

- `sourceId` (string, non-empty)
- `responseSpeedMs` (number, > 0) — lower = faster

**Simulation Rules:**

- For each source, simulate a fetch that resolves with `{ sourceId, responseSpeedMs, data: "data_from_" + sourceId }`
- Use **`Promise.race()`** — but since we can't use real timers, simulate by sorting: the source with the **lowest `responseSpeedMs`** is the "winner" — build its Promise to resolve first
  - Practical approach: find the min-speed source manually, resolve only that one instantly, resolve others "slower" (but synchronously in JS, just return the winner using `.race()` where the winner's Promise is created first)
  - **Alternative approach (simpler):** Use `Promise.race()` on an array where you put the fastest source's Promise first (sorted by `responseSpeedMs`) — in synchronous Promise resolution, the first one in the array wins if all resolve synchronously

| Challenge 📢 | Return Promise (via `Promise.race()`) resolving with the FASTEST source's result object. If tie → whichever appears first. If invalid → reject `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `findFastestSource([
  { sourceId: "DB-1", responseSpeedMs: 300 },
  { sourceId: "DB-2", responseSpeedMs: 100 },
  { sourceId: "DB-3", responseSpeedMs: 200 }
])` → resolves with:

  `{ sourceId: "DB-2", responseSpeedMs: 100, data: "data_from_DB-2" }`

---

## 🧩 PROBLEM–03: 🌐 Resilient Multi-Endpoint Fetcher

⚠️ **Function Name:** `fetchFromFirstAvailable()`

| Input      | `endpoints` (array of objects) |
| :--------- | :----------------------------- |
| **Output** | Promise                        |

**Rules:**

`endpoints` — non-empty array, each:

- `url` (string, non-empty)
- `isAvailable` (boolean)

**Simulation Rules:**

- For each endpoint:
  - `isAvailable === true` → resolves `{ url, status: "OK", data: "response_from_" + url }`
  - `isAvailable === false` → rejects `"Endpoint unavailable: " + url`
- Use **`Promise.any()`** — resolves as soon as the FIRST available (non-rejected) endpoint responds
- If ALL endpoints reject → `Promise.any()` throws `AggregateError` — catch it and reject with `"All endpoints unavailable"`

| Challenge 📢 | Return Promise resolving with the FIRST successful endpoint's result. If ALL fail → reject with `"All endpoints unavailable"`. If invalid → reject `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `fetchFromFirstAvailable([
  { url: "api.service1.com", isAvailable: false },
  { url: "api.service2.com", isAvailable: true },
  { url: "api.service3.com", isAvailable: true }
])` → resolves with:

  `{ url: "api.service2.com", status: "OK", data: "response_from_api.service2.com" }`

- `fetchFromFirstAvailable([
  { url: "api.down1.com", isAvailable: false },
  { url: "api.down2.com", isAvailable: false }
])` → rejects with:

`"All endpoints unavailable"`

---

## 🧩 PROBLEM–04: 📊 Concurrent Batch Processor

⚠️ **Function Name:** `processBatchConcurrently()`

| Input      | `items` (array of objects), `concurrencyLimit` (number) |
| :--------- | :------------------------------------------------------ |
| **Output** | Promise (async function)                                |

**Rules:**

`items` — non-empty array, each: `{ itemId (string), value (number, > 0) }`
`concurrencyLimit` must be a number, integer, 1–10

**Simulation Rules — `async/await`:**

- Process items in batches of `concurrencyLimit` at a time
- For each item, simulate processing: resolves `{ itemId, processedValue: value × 2, status: "DONE" }`
- Process each batch using `Promise.all()`, then move to next batch
- Order of results must match order of input items

**Example:** if `concurrencyLimit=2` and 5 items:

- Batch 1: items[0], items[1] → Promise.all
- Batch 2: items[2], items[3] → Promise.all
- Batch 3: items[4] → Promise.all

| Challenge 📢 | Return Promise resolving with `{ results, totalBatches, totalProcessed }`. If invalid → reject `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `processBatchConcurrently([
  { itemId: "I-1", value: 10 },
  { itemId: "I-2", value: 20 },
  { itemId: "I-3", value: 30 }
], 2)` → resolves with:

  `{
  results: [
    { itemId: "I-1", processedValue: 20, status: "DONE" },
    { itemId: "I-2", processedValue: 40, status: "DONE" },
    { itemId: "I-3", processedValue: 60, status: "DONE" }
  ],
  totalBatches: 2,
  totalProcessed: 3
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Parallel Fetch Orchestrator

⚠️ **Function Name:** `runParallelFetchOrchestrator()`

| Input      | `fetchPlan` (object)     |
| :--------- | :----------------------- |
| **Output** | Promise (async function) |

**Rules:**

`fetchPlan` object:

- `criticalSources` (array of objects: `{ sourceId, dataType }`) — ALL must succeed (use `Promise.all`)
- `optionalSources` (array of objects: `{ sourceId, dataType }`) — partial success OK (use `Promise.allSettled`)
- `fallbackEndpoints` (array of objects: `{ url, isAvailable }`) — use first available (use `Promise.any`)

**Simulation Rules (compose all previous concepts):**

1. Fetch `criticalSources` using `Promise.all()` logic (same as Problem-01) — if any fails, the whole orchestration fails
2. Fetch `optionalSources` using `Promise.allSettled()` logic — collect succeeded and failed
3. Fetch from `fallbackEndpoints` using `Promise.any()` logic — get first available

**Fetch simulation (same as Day-201/202 patterns):**

- `dataType` valid (USERS/PRODUCTS/ORDERS) → resolves with records
- unknown `dataType` → rejects `"Unknown data type: " + dataType`
- endpoint `isAvailable=true` → resolves, else rejects

| Challenge 📢 | Return Promise resolving with `{ criticalData, optionalData: { succeeded, failed }, fallbackData }`. If `criticalSources` fails → reject with that error. If invalid input → reject `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runParallelFetchOrchestrator({
  criticalSources: [{ sourceId: "S1", dataType: "USERS" }],
  optionalSources: [
    { sourceId: "S2", dataType: "PRODUCTS" },
    { sourceId: "S3", dataType: "UNKNOWN" }
  ],
  fallbackEndpoints: [
    { url: "backup.api.com", isAvailable: false },
    { url: "secondary.api.com", isAvailable: true }
  ]
})` → resolves with:

  `{
  criticalData: [
    { sourceId: "S1", dataType: "USERS", records: [{ id: "U1" }, { id: "U2" }] }
  ],
  optionalData: {
    succeeded: [{ sourceId: "S2", dataType: "PRODUCTS", records: [{ id: "P1" }, { id: "P2" }, { id: "P3" }] }],
    failed: [{ sourceId: "S3", reason: "Unknown data type: UNKNOWN" }]
  },
  fallbackData: { url: "secondary.api.com", status: "OK", data: "response_from_secondary.api.com" }
}`

---
