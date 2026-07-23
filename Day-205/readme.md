# 🎓 JS DAILY PRACTICE – DAY-205

📅 **Goal:** Async Waterfall Processor (Async JavaScript & Promise Engineering)
🎯 **Focus:** Waterfall Pattern • Data Transformation Pipeline • Conditional Async Branching • Error Propagation • async/await Composition

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Use **Promise** or **async/await** where specified.
- If input is invalid → return a **rejected Promise** with `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 💧 Basic Waterfall Chain

⚠️ **Function Name:** `runWaterfallChain()`

| Input      | `inputData` (object)     |
| :--------- | :----------------------- |
| **Output** | Promise (async function) |

**Rules:**

`inputData` object:

- `value` (number, > 0)
- `label` (string, non-empty)

**Waterfall Steps (each step receives result of previous):**

- **Step 1 — Double:** `{ ...inputData, value: value × 2, step: "DOUBLED" }`
- **Step 2 — AddTax:** `{ ...prev, value: prev.value × 1.15, step: "TAX_ADDED" }` (15% tax, rounded to 2dp)
- **Step 3 — Format:** `{ ...prev, formattedValue: "৳" + prev.value.toFixed(2), step: "FORMATTED" }`

Each step is a separate `async` function that takes the previous result and returns a Promise.

| Challenge 📢 | Return Promise resolving with the final result after all 3 steps. If invalid → reject `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `runWaterfallChain({ value: 100, label: "Product A" })` → resolves with:

  `{
  value: 230,
  label: "Product A",
  step: "FORMATTED",
  formattedValue: "৳230.00"
}`

---

## 🧩 PROBLEM–02: 🔀 Conditional Waterfall Brancher

⚠️ **Function Name:** `runConditionalWaterfall()`

| Input      | `order` (object)         |
| :--------- | :----------------------- |
| **Output** | Promise (async function) |

**Rules:**

`order` object:

- `orderId` (string, non-empty)
- `amount` (number, > 0)
- `customerType` (string: "REGULAR", "VIP", "WHOLESALE")

**Waterfall with conditional branching:**

- **Step 1 — Validate:** check `amount > 0` → resolves `{ ...order, validated: true }`
- **Step 2 — Apply Discount (branches by customerType):**
  - "VIP" → 20% discount: `discountedAmount = amount × 0.8`
  - "WHOLESALE" → 30% discount: `discountedAmount = amount × 0.7`
  - "REGULAR" → 5% discount: `discountedAmount = amount × 0.95`
  - Add `{ discountedAmount: rounded to 2dp, discountApplied: true }`
- **Step 3 — Add Delivery Fee:**
  - `discountedAmount < 1000` → `deliveryFee = 60`
  - `discountedAmount >= 1000` → `deliveryFee = 0` (free delivery)
  - `finalAmount = discountedAmount + deliveryFee`

| Challenge 📢 | Return Promise resolving with `{ orderId, customerType, discountedAmount, deliveryFee, finalAmount }`. If invalid → reject `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runConditionalWaterfall({ orderId: "ORD-77", amount: 800, customerType: "VIP" })` →

  `{
  orderId: "ORD-77",
  customerType: "VIP",
  discountedAmount: 640.00,
  deliveryFee: 60,
  finalAmount: 700
}`

---

## 🧩 PROBLEM–03: 🔗 Dynamic Step Builder

⚠️ **Function Name:** `runDynamicWaterfall()`

| Input      | `initialValue` (number), `steps` (array of objects) |
| :--------- | :-------------------------------------------------- |
| **Output** | Promise (async function)                            |

**Rules:**

`initialValue` must be a number, > 0
`steps` — non-empty array, each:

- `operation` (string: "MULTIPLY", "ADD", "SUBTRACT", "DIVIDE")
- `operand` (number)

**Dynamic Step Rules:**

- Start with `{ currentValue: initialValue, history: [] }`
- For each step in order (waterfall — each uses result of previous):
  - Apply `operation` to `currentValue` using `operand`:
    - "MULTIPLY" → `currentValue × operand`
    - "ADD" → `currentValue + operand`
    - "SUBTRACT" → `currentValue - operand`
    - "DIVIDE" → if `operand === 0` → reject `"Division by zero"` else `currentValue / operand`
  - Round result to 2 decimal places
  - Push to `history`: `{ step: stepIndex+1, operation, operand, result: newValue }`
  - If any step rejects → entire waterfall rejects

| Challenge 📢 | Return Promise resolving with `{ finalValue, history }`. If any step fails → reject with that error. If invalid → reject `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runDynamicWaterfall(100, [
  { operation: "MULTIPLY", operand: 2 },
  { operation: "ADD", operand: 50 },
  { operation: "DIVIDE", operand: 5 }
])` → resolves with:

  `{
  finalValue: 50,
  history: [
    { step: 1, operation: "MULTIPLY", operand: 2, result: 200 },
    { step: 2, operation: "ADD", operand: 50, result: 250 },
    { step: 3, operation: "DIVIDE", operand: 5, result: 50 }
  ]
}`

---

## 🧩 PROBLEM–04: 🚦 Waterfall with Rollback

⚠️ **Function Name:** `runWaterfallWithRollback()`

| Input      | `transactionId` (string), `operations` (array of objects) |
| :--------- | :-------------------------------------------------------- |
| **Output** | Promise (async function)                                  |

**Rules:**

`transactionId` must be non-empty string
`operations` — non-empty array, each:

- `operationId` (string)
- `shouldFail` (boolean) — simulate whether this operation fails

**Waterfall with Rollback Rules:**

- Execute operations ONE BY ONE (waterfall)
- Track `completedOperations` → array of operationIds that succeeded before failure
- If an operation has `shouldFail === true` → it fails: `"Operation failed: " + operationId`
- On failure → trigger rollback: build `rollbackLog` → array of `{ operationId, rolledBack: true }` for each completed operation IN REVERSE ORDER
- If ALL succeed → `{ transactionId, status: "COMMITTED", completedOperations }`
- If any fail → `{ transactionId, status: "ROLLED_BACK", failedOperation: operationId, rollbackLog }`

| Challenge 📢 | Return Promise ALWAYS resolving (catch failure internally, never reject). If invalid → reject `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runWaterfallWithRollback("TXN-001", [
  { operationId: "OP-1", shouldFail: false },
  { operationId: "OP-2", shouldFail: false },
  { operationId: "OP-3", shouldFail: true },
  { operationId: "OP-4", shouldFail: false }
])` → resolves with:

  `{
  transactionId: "TXN-001",
  status: "ROLLED_BACK",
  failedOperation: "OP-3",
  rollbackLog: [
    { operationId: "OP-2", rolledBack: true },
    { operationId: "OP-1", rolledBack: true }
  ]
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Async Waterfall Orchestrator

⚠️ **Function Name:** `runFullWaterfallOrchestrator()`

| Input      | `pipeline` (object)      |
| :--------- | :----------------------- |
| **Output** | Promise (async function) |

**Rules:**

`pipeline` object:

- `pipelineId` (string, non-empty)
- `initialValue` (number, > 0)
- `transformSteps` (array of `{ operation, operand }` — same as Problem-03)
- `failOnStep` (number or null) — if number, the step at that index (1-based) will fail (simulate by making that step's operand 0 for DIVIDE, or just force-fail)

**Full Orchestration Rules:**

1. **Step A — Initialize:** create `{ pipelineId, initialValue, startedAt: "2025-01-01", status: "RUNNING" }`
2. **Step B — Dynamic Waterfall:** run the `transformSteps` using Problem-03 logic
   - If `failOnStep` is not null → force-fail that step by making its operand 0 and operation "DIVIDE" (simulating an error)
   - If failure → go to Step C (rollback)
3. **Step C (on failure) — Rollback:** mark `{ status: "FAILED", failedAtStep: failOnStep, rolledBack: true, finalValue: initialValue }` (restore to initial)
4. **Step D (on success) — Finalize:** `{ status: "COMPLETED", finalValue, totalSteps: transformSteps.length }`

| Challenge 📢 | Return Promise ALWAYS resolving with `{ pipelineId, status, finalValue, history or rollbackInfo }`. If invalid → reject `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runFullWaterfallOrchestrator({
  pipelineId: "PIPE-01",
  initialValue: 100,
  transformSteps: [
    { operation: "MULTIPLY", operand: 3 },
    { operation: "ADD", operand: 50 },
    { operation: "DIVIDE", operand: 5 }
  ],
  failOnStep: null
})` → resolves with:

  `{
  pipelineId: "PIPE-01",
  status: "COMPLETED",
  finalValue: 70,
  totalSteps: 3,
  history: [
    { step: 1, operation: "MULTIPLY", operand: 3, result: 300 },
    { step: 2, operation: "ADD", operand: 50, result: 350 },
    { step: 3, operation: "DIVIDE", operand: 5, result: 70 }
  ]
}`

- `runFullWaterfallOrchestrator({
  pipelineId: "PIPE-02",
  initialValue: 100,
  transformSteps: [
    { operation: "MULTIPLY", operand: 3 },
    { operation: "ADD", operand: 50 }
  ],
  failOnStep: 2
})` → resolves with:

  `{
  pipelineId: "PIPE-02",
  status: "FAILED",
  failedAtStep: 2,
  rolledBack: true,
  finalValue: 100
}`

---
