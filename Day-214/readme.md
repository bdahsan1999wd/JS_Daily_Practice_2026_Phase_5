# 🎓 JS DAILY PRACTICE – DAY-214

📅 **Goal:** API Webhook & Event Notification System (API Design & Data Transformation)
🎯 **Focus:** Webhook Registration • Event Dispatch • Payload Signing • Delivery Tracking • Retry on Failure

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📋 Webhook Registry Manager

⚠️ **Function Name:** `manageWebhookRegistry()`

| Input      | `registry` (array of objects), `operation` (object) |
| :--------- | :-------------------------------------------------- |
| **Output** | object                                              |

**Rules:**

`registry` — array of existing webhook objects (may be empty), each:

- `webhookId` (string)
- `url` (string)
- `events` (array of strings — event types to subscribe to)
- `isActive` (boolean)

`operation` object:

- `type` (string: "REGISTER", "DEACTIVATE", "DELETE", "LIST")
- `webhookId` (string, required for DEACTIVATE and DELETE)
- `url` (string, required for REGISTER, must start with "https://")
- `events` (array, required for REGISTER, ≥ 1 event)

**Operation Rules:**

- **REGISTER** → add new webhook, auto-generate `webhookId = "WH-" + (registry.length + 1)`, `isActive: true`
  - If `url` doesn't start with "https://" → reject: `"Webhook URL must use HTTPS"`
- **DEACTIVATE** → set `isActive: false` for matching `webhookId`; if not found → `"Webhook not found"`
- **DELETE** → remove webhook from registry; if not found → `"Webhook not found"`
- **LIST** → return all webhooks (no mutation)

Do NOT mutate `registry` — return new array.

| Challenge 📢 | Return `{ registry: updatedRegistry, operationResult }` where `operationResult` describes what happened. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `manageWebhookRegistry(
  [{ webhookId: "WH-1", url: "https://example.com/hook", events: ["order.created"], isActive: true }],
  { type: "REGISTER", url: "https://myapp.com/webhook", events: ["payment.success", "order.shipped"] }
)` ➔

  `{
  registry: [
    { webhookId: "WH-1", url: "https://example.com/hook", events: ["order.created"], isActive: true },
    { webhookId: "WH-2", url: "https://myapp.com/webhook", events: ["payment.success", "order.shipped"], isActive: true }
  ],
  operationResult: { success: true, webhookId: "WH-2", message: "Webhook registered successfully" }
}`

---

## 🧩 PROBLEM–02: 📡 Event Dispatcher

⚠️ **Function Name:** `dispatchEvent()`

| Input      | `event` (object), `webhooks` (array of objects) |
| :--------- | :---------------------------------------------- |
| **Output** | object                                          |

**Rules:**

`event` object:

- `eventId` (string, non-empty)
- `eventType` (string, non-empty)
- `payload` (object)

`webhooks` — array of webhook objects (with `webhookId`, `url`, `events`, `isActive`)

**Dispatch Rules:**

- Find all webhooks where `isActive === true` AND `event.eventType` is in their `events` array
- For each matched webhook, simulate delivery:
  - If `url` contains `"healthy"` → delivery succeeds: `{ delivered: true, statusCode: 200 }`
  - Else → delivery fails: `{ delivered: false, statusCode: 500 }`
- `dispatchLog` → array of `{ webhookId, url, delivered, statusCode }`
- `successCount`, `failureCount`

| Challenge 📢 | Return `{ eventId, eventType, matchedWebhooks, dispatchLog, successCount, failureCount }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `dispatchEvent(
  { eventId: "EVT-1", eventType: "order.created", payload: { orderId: "O1" } },
  [
    { webhookId: "WH-1", url: "https://healthy.service.com/hook", events: ["order.created"], isActive: true },
    { webhookId: "WH-2", url: "https://broken.service.com/hook", events: ["order.created"], isActive: true },
    { webhookId: "WH-3", url: "https://healthy.other.com/hook", events: ["payment.success"], isActive: true }
  ]
)` ➔

  `{
  eventId: "EVT-1",
  eventType: "order.created",
  matchedWebhooks: 2,
  dispatchLog: [
    { webhookId: "WH-1", url: "https://healthy.service.com/hook", delivered: true, statusCode: 200 },
    { webhookId: "WH-2", url: "https://broken.service.com/hook", delivered: false, statusCode: 500 }
  ],
  successCount: 1,
  failureCount: 1
}`

---

## 🧩 PROBLEM–03: 🔐 Webhook Payload Signer

⚠️ **Function Name:** `signWebhookPayload()`

| Input      | `payload` (object), `secret` (string) |
| :--------- | :------------------------------------ |
| **Output** | object                                |

**Rules:**

`payload` — non-null object
`secret` — non-empty string

**Signing Rules (simulated — no real crypto):**

- Serialize payload to string: `JSON.stringify(payload)`
- Build signature: sum of char codes of `(serialized + secret)` as a hex-like string
  - `signatureValue = charCodes.reduce((sum, code) => sum + code, 0)`
  - `signature = "sha256=" + signatureValue.toString(16)` (hexadecimal)
- `signedAt = "2025-01-01T00:00:00Z"` (fixed)
- Return original payload + signature headers

**Verification (bonus):** include a `verify(incomingSignature)` method that returns `true` if signatures match

| Challenge 📢 | Return `{ payload, signature, signedAt, headers: { "X-Webhook-Signature": signature, "X-Webhook-Timestamp": signedAt } }`. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `signWebhookPayload({ orderId: "O1", amount: 500 }, "my-secret")` ➔

  `{
  payload: { orderId: "O1", amount: 500 },
  signature: "sha256=<computed_hex>",
  signedAt: "2025-01-01T00:00:00Z",
  headers: {
    "X-Webhook-Signature": "sha256=<computed_hex>",
    "X-Webhook-Timestamp": "2025-01-01T00:00:00Z"
  }
}`

---

## 🧩 PROBLEM–04: 🔁 Webhook Delivery Tracker with Retry

⚠️ **Function Name:** `trackWebhookDelivery()`

| Input      | `deliveryAttempts` (array of objects), `maxRetries` (number) |
| :--------- | :----------------------------------------------------------- |
| **Output** | object                                                       |

**Rules:**

`deliveryAttempts` — non-empty array, each (ordered by attempt number):

- `attemptNumber` (number, integer, ≥ 1)
- `webhookId` (string)
- `statusCode` (number)
- `responseTimeMs` (number, ≥ 0)

`maxRetries` must be integer, ≥ 1

**Tracking Rules:**

- A delivery is SUCCESSFUL if `statusCode >= 200 && statusCode < 300`
- A delivery FAILED if `statusCode >= 400` or `statusCode === 0` (timeout)
- Find the FIRST successful attempt:
  - `finalStatus`: `"DELIVERED"` if success found, `"FAILED"` if all attempts failed
  - `deliveredOnAttempt`: attempt number where success happened (or `null`)
- `retriesUsed` → total attempts minus 1 (first attempt + retries)
- `retriesExhausted` → true if `retriesUsed >= maxRetries` AND still not delivered
- `avgResponseTimeMs` → mean of all `responseTimeMs` (rounded to 2 decimal places)

| Challenge 📢 | Return `{ webhookId, finalStatus, deliveredOnAttempt, retriesUsed, retriesExhausted, avgResponseTimeMs }`. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `trackWebhookDelivery([
  { attemptNumber: 1, webhookId: "WH-1", statusCode: 500, responseTimeMs: 200 },
  { attemptNumber: 2, webhookId: "WH-1", statusCode: 503, responseTimeMs: 150 },
  { attemptNumber: 3, webhookId: "WH-1", statusCode: 200, responseTimeMs: 100 }
], 5)` ➔

  `{
  webhookId: "WH-1",
  finalStatus: "DELIVERED",
  deliveredOnAttempt: 3,
  retriesUsed: 2,
  retriesExhausted: false,
  avgResponseTimeMs: 150.00
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Webhook Pipeline Orchestrator

⚠️ **Function Name:** `runWebhookPipelineOrchestrator()`

| Input      | `events` (array of objects), `webhookConfig` (object) |
| :--------- | :---------------------------------------------------- |
| **Output** | object                                                |

**Rules:**

`events` — non-empty array, each:

- `eventId` (string)
- `eventType` (string)
- `payload` (object)

`webhookConfig` object:

- `webhooks` (array) — same shape as Problem-02
- `secret` (string) — for signing
- `maxRetries` (number, ≥ 1)

**Full Pipeline for each event:**

1. **Dispatch** (Problem-02 logic) → find matched webhooks, simulate delivery
2. **Sign** each successful delivery payload (Problem-03 logic) → get signature
3. **Track** deliveries (Problem-04 logic — simulate delivery attempts):
   - If initial delivery succeeded → 1 attempt, statusCode 200
   - If initial delivery failed → simulate retry: 2nd attempt also fails (statusCode 500), 3rd attempt succeeds (statusCode 200) if maxRetries ≥ 3, else stays failed

**Build final `orchestrationLog`:**

- Per event → `{ eventId, eventType, deliveries: [{ webhookId, finalStatus, signature }] }`

| Challenge 📢 | Return `{ orchestrationLog, totalEvents, totalDeliveries, totalSuccessful, totalFailed }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runWebhookPipelineOrchestrator(
  [{ eventId: "E1", eventType: "order.created", payload: { orderId: "O1" } }],
  {
    webhooks: [
      { webhookId: "WH-1", url: "https://healthy.app.com/hook", events: ["order.created"], isActive: true },
      { webhookId: "WH-2", url: "https://broken.app.com/hook", events: ["order.created"], isActive: true }
    ],
    secret: "my-secret",
    maxRetries: 3
  }
)` ➔

  `{
  orchestrationLog: [
    {
      eventId: "E1",
      eventType: "order.created",
      deliveries: [
        { webhookId: "WH-1", finalStatus: "DELIVERED", signature: "sha256=<computed>" },
        { webhookId: "WH-2", finalStatus: "DELIVERED", signature: "sha256=<computed>" }
      ]
    }
  ],
  totalEvents: 1,
  totalDeliveries: 2,
  totalSuccessful: 2,
  totalFailed: 0
}`

---
