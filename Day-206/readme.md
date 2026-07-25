# 🎓 JS DAILY PRACTICE – DAY-206

📅 **Goal:** Async Event Stream Processor (Async JavaScript & Promise Engineering)
🎯 **Focus:** Promise Chaining • async/await • Event-Based Async Patterns • Stream-Like Processing • Error Isolation

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Use **Promise** or **async/await** where specified.
- If input is invalid → return a **rejected Promise** with `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📡 Event Emitter Simulator

⚠️ **Function Name:** `simulateEventEmitter()`

| Input      | `events` (array of objects) |
| :--------- | :-------------------------- |
| **Output** | Promise (async function)    |

**Rules:**

`events` — non-empty array, each:

- `eventName` (string, non-empty)
- `payload` (any value)
- `shouldFail` (boolean)

**Simulation Rules:**

- Process each event as a Promise:
  - `shouldFail === false` → resolves `{ eventName, payload, processed: true, status: "SUCCESS" }`
  - `shouldFail === true` → rejects `"Event failed: " + eventName`
- Use **`Promise.allSettled()`** — process all events, never abort on failure
- Build result:
  - `processedEvents` → array of `{ eventName, status: "SUCCESS" or "FAILED", payload or error }`
  - `successCount`, `failureCount`

| Challenge 📢 | Return Promise resolving with `{ processedEvents, successCount, failureCount }`. If invalid → reject `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `simulateEventEmitter([
  { eventName: "user.created", payload: { id: "U1" }, shouldFail: false },
  { eventName: "payment.failed", payload: { amount: 500 }, shouldFail: true },
  { eventName: "order.placed", payload: { orderId: "O1" }, shouldFail: false }
])` → resolves with:

  `{
  processedEvents: [
    { eventName: "user.created", status: "SUCCESS", payload: { id: "U1" } },
    { eventName: "payment.failed", status: "FAILED", error: "Event failed: payment.failed" },
    { eventName: "order.placed", status: "SUCCESS", payload: { orderId: "O1" } }
  ],
  successCount: 2,
  failureCount: 1
}`

---

## 🧩 PROBLEM–02: 🔄 Async Stream Transformer

⚠️ **Function Name:** `transformStream()`

| Input      | `dataChunks` (array of objects), `transformFn` (function) |
| :--------- | :-------------------------------------------------------- |
| **Output** | Promise (async function)                                  |

**Rules:**

`dataChunks` — non-empty array, each: `{ chunkId (string), value (number) }`
`transformFn` — a synchronous function that takes a chunk and returns a transformed value

**Stream Processing Rules:**

- Process each chunk through `transformFn` wrapped in a Promise
- If `transformFn(chunk)` throws an error → that chunk fails with the error message
- If `transformFn(chunk)` returns successfully → chunk processed
- Use **`Promise.allSettled()`** to process all chunks
- Build `streamOutput` → array of `{ chunkId, transformed: result or null, error: null or errorMsg }`
- `throughput` → count of successfully transformed chunks

| Challenge 📢 | Return Promise resolving with `{ streamOutput, throughput }`. If invalid → reject `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `transformStream([
  { chunkId: "C1", value: 10 },
  { chunkId: "C2", value: 0 },
  { chunkId: "C3", value: 5 }
], (chunk) => {
  if (chunk.value === 0) throw new Error("Zero value not allowed");
  return chunk.value * 3;
})` → resolves with:

  `{
  streamOutput: [
    { chunkId: "C1", transformed: 30, error: null },
    { chunkId: "C2", transformed: null, error: "Zero value not allowed" },
    { chunkId: "C3", transformed: 15, error: null }
  ],
  throughput: 2
}`

---

## 🧩 PROBLEM–03: 🚦 Async Priority Queue Processor

⚠️ **Function Name:** `processPriorityQueue()`

| Input      | `queue` (array of objects) |
| :--------- | :------------------------- |
| **Output** | Promise (async function)   |

**Rules:**

`queue` — non-empty array, each:

- `itemId` (string, non-empty)
- `priority` (number, integer, 1–10) — higher = more urgent
- `data` (any value)

**Processing Rules:**

- Sort queue by `priority` descending (highest priority processed first)
- Process items **sequentially** using `async/await` loop (not in parallel)
- Each item:
  - `priority >= 7` → resolves `{ itemId, data, status: "PROCESSED", tier: "URGENT" }`
  - `priority >= 4` → resolves `{ itemId, data, status: "PROCESSED", tier: "NORMAL" }`
  - `priority < 4` → resolves `{ itemId, data, status: "PROCESSED", tier: "LOW" }`
- Track `processingOrder` → array of `itemId` in the order they were processed

| Challenge 📢 | Return Promise resolving with `{ results, processingOrder }`. If invalid → reject `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `processPriorityQueue([
  { itemId: "I-1", priority: 3, data: "low task" },
  { itemId: "I-2", priority: 8, data: "urgent task" },
  { itemId: "I-3", priority: 5, data: "normal task" }
])` → resolves with:

  `{
  results: [
    { itemId: "I-2", data: "urgent task", status: "PROCESSED", tier: "URGENT" },
    { itemId: "I-3", data: "normal task", status: "PROCESSED", tier: "NORMAL" },
    { itemId: "I-1", data: "low task", status: "PROCESSED", tier: "LOW" }
  ],
  processingOrder: ["I-2", "I-3", "I-1"]
}`

---

## 🧩 PROBLEM–04: ⏱️ Async Debounce Simulator

⚠️ **Function Name:** `simulateDebounce()`

| Input      | `events` (array of objects), `debounceWindowMs` (number) |
| :--------- | :------------------------------------------------------- |
| **Output** | Promise (async function)                                 |

**Rules:**

`events` — non-empty array, each:

- `eventId` (string)
- `timestampMs` (number, ≥ 0)
- `data` (any)

`debounceWindowMs` must be number, > 0

**Debounce Simulation Rules:**

- Sort events by `timestampMs` ascending
- Group events: if the gap between consecutive events is `<= debounceWindowMs`, they are in the same debounce group — only the **LAST** event in each group is processed (the rest are "debounced out")
- A new group starts when `timestampMs[i] - timestampMs[i-1] > debounceWindowMs`
- `processedEvents` → array of events that survived debouncing (last of each group)
- `debouncedCount` → number of events that were suppressed

| Challenge 📢 | Return Promise resolving with `{ processedEvents, debouncedCount }`. If invalid → reject `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `simulateDebounce([
  { eventId: "E1", timestampMs: 100, data: "a" },
  { eventId: "E2", timestampMs: 150, data: "b" },
  { eventId: "E3", timestampMs: 200, data: "c" },
  { eventId: "E4", timestampMs: 500, data: "d" }
], 100)` → resolves with:

  `{
  processedEvents: [
    { eventId: "E3", timestampMs: 200, data: "c" },
    { eventId: "E4", timestampMs: 500, data: "d" }
  ],
  debouncedCount: 2
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Event Stream Orchestrator

⚠️ **Function Name:** `runEventStreamOrchestrator()`

| Input      | `streamConfig` (object)  |
| :--------- | :----------------------- |
| **Output** | Promise (async function) |

**Rules:**

`streamConfig` object:

- `streamId` (string, non-empty)
- `events` (array of `{ eventId, timestampMs, priority, payload, shouldFail }`)
- `debounceWindowMs` (number, > 0)

**Orchestration Rules (compose previous concepts):**

1. **Step 1 — Debounce:** apply debounce logic (Problem-04) using `timestampMs` and `debounceWindowMs` → keep only surviving events
2. **Step 2 — Priority Sort:** sort surviving events by `priority` descending (Problem-03 logic)
3. **Step 3 — Process:** emit each surviving event sequentially (Problem-01 logic — `shouldFail` based resolve/reject), using `Promise.allSettled()`
4. **Build final summary:**
   - `totalReceived` → original event count
   - `afterDebounce` → surviving event count after step 1
   - `successCount`, `failureCount` → from step 3

| Challenge 📢 | Return Promise resolving with `{ streamId, totalReceived, afterDebounce, successCount, failureCount, processedLog }` where `processedLog` is array of `{ eventId, status }`. If invalid → reject `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runEventStreamOrchestrator({
  streamId: "STREAM-01",
  events: [
    { eventId: "E1", timestampMs: 100, priority: 5, payload: "data1", shouldFail: false },
    { eventId: "E2", timestampMs: 130, priority: 8, payload: "data2", shouldFail: false },
    { eventId: "E3", timestampMs: 500, priority: 3, payload: "data3", shouldFail: true }
  ],
  debounceWindowMs: 100
})` → resolves with:

  `{
  streamId: "STREAM-01",
  totalReceived: 3,
  afterDebounce: 2,
  successCount: 1,
  failureCount: 1,
  processedLog: [
    { eventId: "E2", status: "SUCCESS" },
    { eventId: "E3", status: "FAILED" }
  ]
}`

---
