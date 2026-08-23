# 🎓 JS DAILY PRACTICE – DAY-235

📅 **Goal:** Full Stack App Simulator (Full Stack Integration Patterns)
🎯 **Focus:** End-to-End App Flow • Request Pipeline • Data Layer • Business Logic • Response Building

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🌐 App Bootstrap

⚠️ **Function Name:** `bootstrapApp()`

| Input      | `appConfig` (object) |
| :--------- | :------------------- |
| **Output** | object (app)         |

**Rules:**

`appConfig` object:

- `appName` (string, non-empty)
- `version` (string, non-empty)
- `environment` (string: `"development"`, `"staging"`, `"production"`)
- `port` (number, integer, 1024–65535)
- `features` (object):
  - `auth` (boolean) — enable authentication
  - `rateLimit` (boolean) — enable rate limiting
  - `logging` (boolean) — enable request logging
  - `errorHandling` (boolean) — enable global error handling

Return a bootstrapped app object with:

- `getConfig()` — return full app configuration
- `isFeatureEnabled(featureName)` — check if a feature is enabled
- `getStatus()` — return app health status
- `registerModule(moduleName, moduleConfig)` — register an app module
- `listModules()` — return all registered modules
- `shutdown()` — simulate graceful shutdown

**Operation Rules:**

- `getConfig()` → returns `{ appName, version, environment, port, features, startedAt: "2025-01-01T00:00:00Z" }`
- `isFeatureEnabled(featureName)` → `{ feature: featureName, enabled: boolean }` or `{ error: "Unknown feature" }` if not in features
- `getStatus()` → `{ status: "RUNNING", appName, version, environment, uptime: "0s", moduleCount }`
- `registerModule(moduleName, moduleConfig)`:
  - `moduleName` non-empty string
  - `moduleConfig` non-null object
  - Returns `{ registered: true, moduleName }` or `{ registered: false, reason: "Module already registered" }`
- `listModules()` → array of `{ moduleName, registeredAt: "2025-01-01T00:00:00Z" }`
- `shutdown()` → `{ shutdown: true, appName, modulesUnloaded: count }`

**Validation:** invalid `appConfig` or missing required fields → return `"Invalid Input"`

| Challenge 📢 | Return the bootstrapped app object with all 6 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const app = bootstrapApp({
  appName: "ShopAPI",
  version: "1.0.0",
  environment: "production",
  port: 8080,
  features: { auth: true, rateLimit: true, logging: true, errorHandling: true }
});

app.getConfig();
// → { appName: "ShopAPI", version: "1.0.0", environment: "production", port: 8080, features: { auth: true, rateLimit: true, logging: true, errorHandling: true }, startedAt: "2025-01-01T00:00:00Z" }

app.isFeatureEnabled("auth");
// → { feature: "auth", enabled: true }

app.registerModule("UserModule", { entities: ["User"], routes: ["/users"] });
// → { registered: true, moduleName: "UserModule" }

app.registerModule("UserModule", {});
// → { registered: false, reason: "Module already registered" }

app.getStatus();
// → { status: "RUNNING", appName: "ShopAPI", version: "1.0.0", environment: "production", uptime: "0s", moduleCount: 1 }

app.shutdown();
// → { shutdown: true, appName: "ShopAPI", modulesUnloaded: 1 }
```

---

## 🧩 PROBLEM–02: 📨 Request Pipeline

⚠️ **Function Name:** `createRequestPipeline()`

| Input      | `pipelineConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object (pipeline)         |

**Rules:**

`pipelineConfig` object:

- `pipelineId` (string, non-empty)
- `enableAuth` (boolean)
- `enableRateLimit` (boolean)
- `rateLimit` (object): `{ maxRequests: number, windowMs: number }`
- `enableLogging` (boolean)
- `validTokens` (array of strings)

Return a request pipeline object with:

- `process(request)` — run request through full pipeline
- `processMany(requests)` — process multiple requests
- `getStats()` — return pipeline statistics

**Pipeline Stages (run in order):**

1. **LOGGING** (if `enableLogging`) — log the request: adds `{ logged: true }` to context
2. **RATE_LIMIT** (if `enableRateLimit`) — check rate limit per `clientId`:
   - Use fixed window (windowMs, maxRequests) — track per `clientId`
   - If exceeded → block: `{ stage: "RATE_LIMIT", blocked: true, reason: "Rate limit exceeded" }`
3. **AUTH** (if `enableAuth`) — check `Authorization: Bearer <token>` header:
   - Token must be in `validTokens`
   - If missing/invalid → block: `{ stage: "AUTH", blocked: true, reason: "Unauthorized" }`
4. **HANDLER** — simulate route handler: `{ stage: "HANDLER", result: "processed_" + requestId }`

**request** object: `{ requestId, clientId, method, path, headers, timestampMs }`

- `process(request)` → `{ requestId, stages: [stage results], finalStatus: "COMPLETED" or "BLOCKED", blockedAt: stage name or null }`
- `processMany(requests)` → `{ results: [process results], completedCount, blockedCount }`
- `getStats()` → `{ totalProcessed, completedCount, blockedCount, blockReasons: { AUTH: N, RATE_LIMIT: N } }`

**Validation:** invalid `pipelineConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the pipeline object with all 3 methods. |
| :----------- | :--------------------------------------------- |

**Sample Input & Output:**

```javascript
const pipeline = createRequestPipeline({
  pipelineId: "PIPE-01",
  enableAuth: true,
  enableRateLimit: true,
  rateLimit: { maxRequests: 2, windowMs: 1000 },
  enableLogging: true,
  validTokens: ["token-123", "token-456"]
});

pipeline.process({
  requestId: "REQ-1", clientId: "C1", method: "GET", path: "/users",
  headers: { "Authorization": "Bearer token-123" }, timestampMs: 100
});
// All stages pass: →

//  {
//   requestId: "REQ-1",
//   stages: [
//     { stage: "LOGGING", logged: true },
//     { stage: "RATE_LIMIT", blocked: false, requestCount: 1 },
//     { stage: "AUTH", blocked: false, userId: "USER_token-123" },
//     { stage: "HANDLER", result: "processed_REQ-1" }
//   ],
//   finalStatus: "COMPLETED",
//   blockedAt: null
// }


pipeline.process({
  requestId: "REQ-2", clientId: "C1", method: "GET", path: "/users",
  headers: {}, timestampMs: 200
});
// AUTH blocked (no token): →

//  { requestId: "REQ-2", stages: [{ stage: "LOGGING", logged: true }, { stage: "RATE_LIMIT", blocked: false, requestCount: 2 }, { stage: "AUTH", blocked: true, reason: "Unauthorized" }], finalStatus: "BLOCKED", blockedAt: "AUTH" }
```

---

## 🧩 PROBLEM–03: 🗄️ Data Layer Simulator

⚠️ **Function Name:** `createDataLayer()`

| Input      | `dataConfig` (object) |
| :--------- | :-------------------- |
| **Output** | object (data layer)   |

**Rules:**

`dataConfig` object:

- `entities` (array of objects):
  - `name` (string, non-empty)
  - `fields` (object) — `{ fieldName: { type, required, default } }`
  - `relations` (array of objects or null):
    - `type` (string: `"HAS_MANY"`, `"BELONGS_TO"`)
    - `entity` (string) — related entity name
    - `foreignKey` (string) — field linking them

Return a data layer object with:

- `getRepository(entityName)` — return a CRUD repository for that entity
- `seed(entityName, records)` — pre-populate entity with records
- `getWithRelations(entityName, id, includeRelations)` — fetch entity + related data
- `getDataStats()` — return counts per entity

**Operation Rules:**

- `getRepository(entityName)`:
  - Returns a repository with `create`, `findById`, `findAll`, `update`, `delete` methods (same as Day-230 Problem-01)
  - If entity not found → `{ error: "Entity not registered: " + entityName }`

- `seed(entityName, records)`:
  - Bulk-insert records into entity store
  - Returns `{ entityName, seeded: count }`

- `getWithRelations(entityName, id, includeRelations)`:
  - Fetch entity by id
  - For each relation in `includeRelations`:
    - `HAS_MANY` → find all records in related entity where `foreignKey === id`
    - `BELONGS_TO` → find one record in related entity where `id === entity[foreignKey]`
  - Returns `{ entity: mainRecord, relations: { relatedEntityName: records or record } }`
  - If not found → `{ error: "Record not found" }`

- `getDataStats()` → `{ entities: { entityName: recordCount } }`

**Validation:** invalid `dataConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the data layer object with all 4 methods. |
| :----------- | :----------------------------------------------- |

**Sample Input & Output:**

```javascript
const dataLayer = createDataLayer({
  entities: [
    {
      name: "User",
      fields: { id: { type: "string", required: true, default: null }, name: { type: "string", required: true, default: null } },
      relations: [{ type: "HAS_MANY", entity: "Order", foreignKey: "userId" }]
    },
    {
      name: "Order",
      fields: { id: { type: "string", required: true, default: null }, userId: { type: "string", required: true, default: null }, amount: { type: "number", required: true, default: null } },
      relations: [{ type: "BELONGS_TO", entity: "User", foreignKey: "userId" }]
    }
  ]
});


dataLayer.seed("User", [{ id: "U1", name: "Rahim" }, { id: "U2", name: "Karim" }]);
// → { entityName: "User", seeded: 2 }


dataLayer.seed("Order", [
  { id: "O1", userId: "U1", amount: 500 },
  { id: "O2", userId: "U1", amount: 300 },
  { id: "O3", userId: "U2", amount: 800 }
]);
// → { entityName: "Order", seeded: 3 }


dataLayer.getWithRelations("User", "U1", ["Order"]);
// → {
//   entity: { id: "U1", name: "Rahim" },
//   relations: { Order: [{ id: "O1", userId: "U1", amount: 500 }, { id: "O2", userId: "U1", amount: 300 }] }
// }


dataLayer.getDataStats();
// → { entities: { User: 2, Order: 3 } }
```

---

## 🧩 PROBLEM–04: ⚙️ Business Logic Layer

⚠️ **Function Name:** `createBusinessLayer()`

| Input      | `businessConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object (business layer)   |

**Rules:**

`businessConfig` object:

- `layerId` (string, non-empty)
- `services` (array of objects):
  - `serviceName` (string)
  - `operations` (array of objects):
    - `operationName` (string)
    - `inputRules` (array of objects): `{ field, rule, value, message }` — same as Day-231 Problem-04 validators
    - `execute` (function) — `(validatedInput, context) => result`
    - `shouldFail` (boolean) — simulate operation failure

Return a business layer object with:

- `getService(serviceName)` — return a specific service handler
- `execute(serviceName, operationName, input, context)` — run a business operation
- `getOperationLog()` — return history of all executed operations
- `getLayerStats()` — return statistics

**Execution Rules:**

- `execute(serviceName, operationName, input, context)`:
  1. Find service and operation
  2. If not found → `{ success: false, error: "Operation not found: " + serviceName + "." + operationName }`
  3. Validate `input` against `inputRules` (same logic as Day-231 Problem-04)
  4. If validation fails → `{ success: false, validationErrors: [...] }`
  5. If `shouldFail: true` → `{ success: false, error: "Operation execution failed" }`
  6. Else → call `execute(validatedInput, context)`, return `{ success: true, result, serviceName, operationName }`
  7. Log: `{ serviceName, operationName, success, timestamp: "2025-01-01T00:00:00Z" }`

- `getService(serviceName)` → `{ serviceName, operations: [operationName strings] }` or `{ error: "Service not found" }`
- `getLayerStats()` → `{ totalExecutions, successCount, failureCount, operationBreakdown: { "service.operation": count } }`

**Validation:** invalid `businessConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the business layer object with all 4 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const bl = createBusinessLayer({
  layerId: "BL-01",
  services: [
    {
      serviceName: "OrderService",
      operations: [
        {
          operationName: "createOrder",
          inputRules: [
            { field: "userId", rule: "required", value: null, message: "userId is required" },
            { field: "amount", rule: "min", value: 1, message: "amount must be positive" }
          ],
          execute: (input, ctx) => ({ orderId: "O-" + Date.now(), ...input, status: "CREATED" }),
          shouldFail: false
        }
      ]
    }
  ]
});


bl.execute("OrderService", "createOrder", { userId: "U1", amount: 500 }, { requestId: "REQ-1" });
// → { success: true, result: { orderId: "O-...", userId: "U1", amount: 500, status: "CREATED" }, serviceName: "OrderService", operationName: "createOrder" }


bl.execute("OrderService", "createOrder", { amount: 0 }, {});
// validation fails (userId missing, amount < 1):

// → { success: false, validationErrors: [{ field: "userId", message: "userId is required" }, { field: "amount", message: "amount must be positive" }] }


bl.getLayerStats();
// → { totalExecutions: 2, successCount: 1, failureCount: 1, operationBreakdown: { "OrderService.createOrder": 2 } }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Stack App Orchestrator

⚠️ **Function Name:** `runFullStackApp()`

| Input      | `appBlueprint` (object) |
| :--------- | :---------------------- |
| **Output** | object                  |

**Rules:**

`appBlueprint` object:

- `appId` (string, non-empty)
- `appConfig` (object) — same shape as Problem-01
- `pipelineConfig` (object) — same shape as Problem-02 (without `pipelineId`, use `appId`)
- `dataConfig` (object) — same shape as Problem-03
- `businessConfig` (object) — same shape as Problem-04 (without `layerId`, use `appId`)
- `seedData` (object) — `{ entityName: [records] }` for initial data
- `requests` (array of objects):
  - `requestId` (string)
  - `clientId` (string)
  - `method` (string)
  - `path` (string)
  - `headers` (object)
  - `body` (object or null)
  - `timestampMs` (number)
  - `businessOperation` (object or null): `{ serviceName, operationName, input }`

**Orchestration Rules (compose ALL previous concepts):**

1. **Bootstrap** the app (Problem-01)
2. **Setup Pipeline** (Problem-02) — request lifecycle
3. **Setup Data Layer** (Problem-03) — seed initial data
4. **Setup Business Layer** (Problem-04) — register services
5. **Process each request:**
   - Run through **request pipeline** (auth, rate limit, logging)
   - If pipeline BLOCKED → skip business logic, record error
   - If pipeline COMPLETED → execute **business operation** if provided
   - Fetch result from **data layer** if applicable
   - Build full response
6. **Build App Report:**
   - `appStatus` → from `getStatus()`
   - `pipelineStats` → from `getStats()`
   - `dataStats` → from `getDataStats()`
   - `businessStats` → from `getLayerStats()`
   - `totalRequests`, `successCount`, `blockedCount`

**Validation:** invalid `appBlueprint` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ appId, requestLog, appReport }` where `requestLog` is array of `{ requestId, pipelineStatus, businessResult or null, finalResponse }`. |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `runFullStackApp({
  appId: "SHOP-APP-01",
  appConfig: {
    appName: "ShopAPI", version: "1.0.0", environment: "production", port: 8080,
    features: { auth: true, rateLimit: true, logging: true, errorHandling: true }
  },
  pipelineConfig: {
    enableAuth: true, enableRateLimit: true,
    rateLimit: { maxRequests: 5, windowMs: 60000 },
    enableLogging: true,
    validTokens: ["token-admin", "token-user"]
  },
  dataConfig: {
    entities: [
      { name: "Product", fields: { id: { type: "string", required: true, default: null }, name: { type: "string", required: true, default: null }, price: { type: "number", required: true, default: null } }, relations: null }
    ]
  },
  businessConfig: {
    services: [
      {
        serviceName: "ProductService",
        operations: [
          {
            operationName: "getProduct",
            inputRules: [{ field: "id", rule: "required", value: null, message: "id is required" }],
            execute: (input) => ({ id: input.id, name: "JS Book", price: 500 }),
            shouldFail: false
          }
        ]
      }
    ]
  },
  seedData: {
    Product: [
      { id: "P1", name: "JS Book", price: 500 },
      { id: "P2", name: "CSS Guide", price: 300 }
    ]
  },
  requests: [
    {
      requestId: "REQ-1", clientId: "C1", method: "GET", path: "/products/P1",
      headers: { "Authorization": "Bearer token-admin" }, body: null, timestampMs: 100,
      businessOperation: { serviceName: "ProductService", operationName: "getProduct", input: { id: "P1" } }
    },
    {
      requestId: "REQ-2", clientId: "C2", method: "GET", path: "/products/P2",
      headers: {}, body: null, timestampMs: 200,
      businessOperation: { serviceName: "ProductService", operationName: "getProduct", input: { id: "P2" } }
    }
  ]
})` →

  **Manual Verify:**
  - Seed: 2 products loaded
  - REQ-1: pipeline COMPLETED (auth✓, rateLimit✓) → business getProduct(P1) → SUCCESS
  - REQ-2: pipeline BLOCKED (no auth token) → business skipped
  - successCount: 1, blockedCount: 1

  `{
  appId: "SHOP-APP-01",
  requestLog: [
    {
      requestId: "REQ-1",
      pipelineStatus: "COMPLETED",
      businessResult: { success: true, result: { id: "P1", name: "JS Book", price: 500 }, serviceName: "ProductService", operationName: "getProduct" },
      finalResponse: { status: "SUCCESS", data: { id: "P1", name: "JS Book", price: 500 } }
    },
    {
      requestId: "REQ-2",
      pipelineStatus: "BLOCKED",
      businessResult: null,
      finalResponse: { status: "ERROR", reason: "Unauthorized", blockedAt: "AUTH" }
    }
  ],
  appReport: {
    appStatus: { status: "RUNNING", appName: "ShopAPI", version: "1.0.0", environment: "production", uptime: "0s", moduleCount: 0 },
    pipelineStats: { totalProcessed: 2, completedCount: 1, blockedCount: 1, blockReasons: { AUTH: 1, RATE_LIMIT: 0 } },
    dataStats: { entities: { Product: 2 } },
    businessStats: { totalExecutions: 1, successCount: 1, failureCount: 0, operationBreakdown: { "ProductService.getProduct": 1 } },
    totalRequests: 2,
    successCount: 1,
    blockedCount: 1
  }
}`

---