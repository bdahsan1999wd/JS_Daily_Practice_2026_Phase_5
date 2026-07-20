# 🎓 JS DAILY PRACTICE – DAY-201

📅 **Goal:** API Request Simulator (Async JavaScript & Promise Engineering)
🎯 **Focus:** Promise Creation • .then() / .catch() / .finally() • async/await • Error Handling

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- Use **Promise** or **async/await** where specified.
- If input is invalid → return a **rejected Promise** with `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🌐 Basic Promise Wrapper

⚠️ **Function Name:** `fetchUserData()`

| Input      | `userId` (string) |
| :--------- | :---------------- |
| **Output** | Promise           |

**Rules:**

`userId` must be a non-empty string

**Simulation Rules:**

- Return a **new Promise**
- Inside the Promise:
  - If `userId` starts with `"U"` → resolve after simulated delay with:
    `{ userId, name: "User_" + userId, status: "ACTIVE" }`
  - If `userId` starts with anything else → reject with:
    `"User not found: " + userId`
  - If `userId` is invalid (not a non-empty string) → reject with `"Invalid Input"`

**Note:** No real delay needed — simulate by just resolving/rejecting synchronously inside the Promise constructor.

| Challenge 📢 | Return a Promise that resolves or rejects based on the rules above. Show usage with `.then()` and `.catch()` in example usage. |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `fetchUserData("U123")` → resolves with `{ userId: "U123", name: "User_U123", status: "ACTIVE" }`
- `fetchUserData("X999")` → rejects with `"User not found: X999"`

**Example Usage:**

```javascript
fetchUserData("U123")
  .then((data) => console.log(data))
  .catch((err) => console.log(err));
```

---

## 🧩 PROBLEM–02: 🔗 Promise Chaining Engine

⚠️ **Function Name:** `processOrderPipeline()`

| Input      | `orderId` (string) |
| :--------- | :----------------- |
| **Output** | Promise            |

**Rules:**

`orderId` must be a non-empty string starting with `"ORD"`

**Simulation — 3-step chain:**

- **Step 1:** `validateOrder(orderId)` → resolves with `{ orderId, valid: true }` if starts with "ORD", else rejects with `"Invalid order ID"`
- **Step 2:** `calculateTotal(order)` → takes step 1 result, resolves with `{ ...order, total: orderId.length * 100 }` (simulate price based on ID length)
- **Step 3:** `confirmOrder(orderWithTotal)` → takes step 2 result, resolves with `{ ...orderWithTotal, status: "CONFIRMED", confirmationCode: "CONF-" + orderId }`

**Chain all 3 steps** using `.then()` chaining — each step returns a new Promise.

| Challenge 📢 | Return the final Promise (the chain). Resolves with the final confirmed order object. If any step fails, the chain rejects with that step's error. |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `processOrderPipeline("ORD-500")` → resolves with:
  `{ orderId: "ORD-500", valid: true, total: 700, status: "CONFIRMED", confirmationCode: "CONF-ORD-500" }`

**Example Usage:**

```javascript
processOrderPipeline("ORD-500")
  .then((result) => console.log(result))
  .catch((err) => console.log(err));
```

---

## 🧩 PROBLEM–03: ⚡ Promise.all() Parallel Fetcher

⚠️ **Function Name:** `fetchAllResources()`

| Input      | `resourceIds` (array of strings) |
| :--------- | :------------------------------- |
| **Output** | Promise                          |

**Rules:**

`resourceIds` must be a non-empty array of strings

**Simulation Rules:**

- For each `resourceId`, simulate fetching:
  - If `resourceId` starts with `"R"` → resolves with `{ resourceId, data: "data_for_" + resourceId, loaded: true }`
  - Else → rejects with `"Failed to load: " + resourceId`
- Use **`Promise.all()`** to fetch ALL resources in parallel
- If ALL succeed → resolve with array of all resource objects
- If ANY fails → the whole Promise rejects with that error (Promise.all behavior)

| Challenge 📢 | Return `Promise.all(...)` result. If `resourceIds` invalid → reject with `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `fetchAllResources(["R1", "R2", "R3"])` → resolves with:
  `[
  { resourceId: "R1", data: "data_for_R1", loaded: true },
  { resourceId: "R2", data: "data_for_R2", loaded: true },
  { resourceId: "R3", data: "data_for_R3", loaded: true }
]`

- `fetchAllResources(["R1", "X2"])` → rejects with `"Failed to load: X2"`

**Example Usage:**

```javascript
fetchAllResources(["R1", "R2", "R3"])
  .then((results) => console.log(results))
  .catch((err) => console.log(err));
```

---

## 🧩 PROBLEM–04: 🛡️ Async/Await with Error Handling

⚠️ **Function Name:** `getUserOrders()`

| Input      | `userId` (string)        |
| :--------- | :----------------------- |
| **Output** | Promise (async function) |

**Rules:**

`userId` must be a non-empty string starting with `"U"`

**Simulation — use `async/await` syntax:**

```javascript
async function getUserOrders(userId) { ... }
```

**Steps inside (simulate with helper Promises):**

1. **Fetch user** → if `userId` starts with "U" → resolves `{ userId, name: "User_" + userId }`, else rejects `"User not found"`
2. **Fetch orders for user** → always resolves with `[{ orderId: "ORD-1", amount: 500 }, { orderId: "ORD-2", amount: 300 }]`
3. **Calculate total spent** → sum all order amounts → `totalSpent`

**Use try/catch inside async function to handle errors.**

| Challenge 📢 | Return `{ user, orders, totalSpent }` if successful. If any step throws, catch and return `{ error: errorMessage }` (NOT a rejected Promise — catch it and return the error object). If invalid input → return `{ error: "Invalid Input" }`. |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `getUserOrders("U-001")` → resolves with:
  `{ user: { userId: "U-001", name: "User_U-001" }, orders: [{ orderId: "ORD-1", amount: 500 }, { orderId: "ORD-2", amount: 300 }], totalSpent: 800 }`

- `getUserOrders("X-999")` → resolves with:
  `{ error: "User not found" }`

**Example Usage:**

```javascript
getUserOrders("U-001").then((result) => console.log(result));
```

---

## 🧩 PROBLEM–05: 🔄 Promise.allSettled() — Resilient Batch Fetcher

⚠️ **Function Name:** `fetchWithFallback()`

| Input      | `requests` (array of objects) |
| :--------- | :---------------------------- |
| **Output** | Promise                       |

**Rules:**

`requests` must be a non-empty array, each entry:

- `id` (string)
- `type` (string: "USER", "PRODUCT", "ORDER")

**Simulation Rules:**

- For each request, simulate fetching:
  - `type === "USER"` and `id` starts with "U" → resolves `{ id, type, result: "user_data_" + id }`
  - `type === "PRODUCT"` and `id` starts with "P" → resolves `{ id, type, result: "product_data_" + id }`
  - `type === "ORDER"` and `id` starts with "O" → resolves `{ id, type, result: "order_data_" + id }`
  - Any mismatch → rejects `"Fetch failed for " + id`

- Use **`Promise.allSettled()`** — do NOT fail the whole batch even if some requests fail
- After settling, build result:
  - `succeeded` → array of `{ id, result }` from fulfilled promises
  - `failed` → array of `{ id, reason }` from rejected promises
  - `successRate` → `(succeeded.length / total) × 100` (rounded to 2 decimal places)

| Challenge 📢 | Return Promise resolving with `{ succeeded, failed, successRate }`. Never rejects (allSettled guarantees this). If invalid input → reject with `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `fetchWithFallback([
  { id: "U-1", type: "USER" },
  { id: "X-1", type: "PRODUCT" },
  { id: "O-1", type: "ORDER" }
])` → Resolves with:

  `{
  succeeded: [
    { id: "U-1", result: "user_data_U-1" },
    { id: "O-1", result: "order_data_O-1" }
  ],
  failed: [
    { id: "X-1", reason: "Fetch failed for X-1" }
  ],
  successRate: 66.67
}`

**Example Usage:**

```javascript
fetchWithFallback([...])
  .then(result => console.log(result));
```

---
