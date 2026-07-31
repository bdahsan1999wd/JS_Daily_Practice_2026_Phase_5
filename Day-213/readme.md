# 🎓 JS DAILY PRACTICE – DAY-213

📅 **Goal:** API Versioning & Routing Simulator (API Design & Data Transformation)
🎯 **Focus:** API Versioning • Route Matching • Path Parameters • Request Routing • Version Migration

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🛣️ Route Matcher

⚠️ **Function Name:** `matchRoute()`

| Input      | `requestPath` (string), `routeDefinitions` (array of objects) |
| :--------- | :------------------------------------------------------------ |
| **Output** | object                                                        |

**Rules:**

`requestPath` — actual request path (e.g. `"/api/users/123/orders"`)
`routeDefinitions` — array of route objects:

- `pattern` (string) — route pattern with params (e.g. `"/api/users/:userId/orders"`)
- `method` (string)
- `handler` (string) — handler name

**Matching Rules:**

- Split both `requestPath` and `pattern` by `"/"`
- A segment matches if it's identical, OR if the pattern segment starts with `":"` (path param)
- Extract path params: `{ userId: "123" }` from `:userId`
- If multiple routes could match → return the FIRST match (definition order)
- If no match → `{ matched: false }`

| Challenge 📢 | Return `{ matched: true, handler, params }` or `{ matched: false }`. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `matchRoute("/api/users/U123/orders", [
  { pattern: "/api/products/:productId", method: "GET", handler: "getProduct" },
  { pattern: "/api/users/:userId/orders", method: "GET", handler: "getUserOrders" },
  { pattern: "/api/users/:userId", method: "GET", handler: "getUser" }
])` ➔

  `{
  matched: true,
  handler: "getUserOrders",
  params: { userId: "U123" }
}`

---

## 🧩 PROBLEM–02: 🔢 API Version Router

⚠️ **Function Name:** `routeByVersion()`

| Input      | `request` (object), `versionHandlers` (object) |
| :--------- | :--------------------------------------------- |
| **Output** | object                                         |

**Rules:**

`request` object:

- `path` (string, starts with `/api/v{N}/...`)
- `method` (string: "GET", "POST", "PUT", "DELETE")
- `headers` (object, may contain `"API-Version"` header as fallback)

`versionHandlers` object — each key is a version string (`"v1"`, `"v2"`, `"v3"`), value is object of `{ method_path: handlerName }`

**Version Extraction Rules (priority order):**

1. Extract version from path: `/api/v2/users` → `"v2"`
2. If path doesn't contain version → use `headers["API-Version"]` (e.g. `"v1"`)
3. If neither → default to `"v1"`

**Routing Rules:**

- Look up `versionHandlers[version]`
- Strip version from path to get resource path: `/api/v2/users` → `/users`
- Build lookup key: `METHOD_/resource` (e.g. `"GET_/users"`)
- If handler found → `{ routed: true, version, handler, resourcePath }`
- If version not supported → `{ routed: false, reason: "Version not supported: " + version }`
- If route not found in version → `{ routed: false, reason: "Route not found in " + version }`

| Challenge 📢 | Return routing result object. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------ |

**Sample Input & Output:**

- `routeByVersion(
  { path: "/api/v2/users", method: "GET", headers: {} },
  {
    v1: { "GET_/users": "getUsersV1", "POST_/users": "createUserV1" },
    v2: { "GET_/users": "getUsersV2", "GET_/users/profile": "getUserProfileV2" }
  }
)` ➔

  `{
  routed: true,
  version: "v2",
  handler: "getUsersV2",
  resourcePath: "/users"
}`

---

## 🧩 PROBLEM–03: 🔄 Version Migration Transformer

⚠️ **Function Name:** `migrateResponseVersion()`

| Input      | `response` (object), `fromVersion` (string), `toVersion` (string), `migrationRules` (object) |
| :--------- | :------------------------------------------------------------------------------------------- |
| **Output** | object                                                                                       |

**Rules:**

`response` — a response object from an older API version
`fromVersion`, `toVersion` — version strings (e.g. `"v1"`, `"v2"`)
`migrationRules` object — key is `"v1_to_v2"` or `"v2_to_v3"` etc., value is:

- `renameFields` (object) — `{ oldName: newName }`
- `addFields` (object) — `{ fieldName: defaultValue }` — add new fields with defaults
- `removeFields` (array of strings) — fields to drop
- `transformFields` (object) — `{ fieldName: "uppercase" | "lowercase" | "stringify" }` — value transformations

**Migration Rules:**

- Build migration key: `fromVersion + "_to_" + toVersion` (e.g. `"v1_to_v2"`)
- If no migration rule found → return `{ migrated: false, reason: "No migration path found" }`
- Apply rules in order: rename → add → remove → transform
- Return migrated response

| Challenge 📢 | Return `{ migrated: true, fromVersion, toVersion, data: migratedResponse }` or `{ migrated: false, reason }`. If invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `migrateResponseVersion(
  { user_id: "U1", user_name: "Rahim", age: 25 },
  "v1", "v2",
  {
    v1_to_v2: {
      renameFields: { user_id: "id", user_name: "name" },
      addFields: { version: "v2", verified: false },
      removeFields: ["age"],
      transformFields: { name: "uppercase" }
    }
  }
)` ➔

  `{
  migrated: true,
  fromVersion: "v1",
  toVersion: "v2",
  data: { id: "U1", name: "RAHIM", version: "v2", verified: false }
}`

---

## 🧩 PROBLEM–04: 🗂️ Multi-Version API Registry

⚠️ **Function Name:** `buildAPIRegistry()`

| Input      | `apiDefinitions` (array of objects) |
| :--------- | :---------------------------------- |
| **Output** | object                              |

**Rules:**

`apiDefinitions` — non-empty array, each:

- `version` (string: "v1", "v2", "v3")
- `method` (string: "GET", "POST", "PUT", "DELETE")
- `path` (string, starts with `/`)
- `handler` (string)
- `deprecated` (boolean)

**Registry Rules:**

- Group by version → each version has a list of routes
- `registry` → object: `{ v1: [routes], v2: [routes], ... }`
- `deprecatedRoutes` → array of `{ version, method, path }` where `deprecated === true`
- `routeCount` → total routes across all versions
- `versionSummary` → object: each version → `{ total, deprecated, active }`

| Challenge 📢 | Return `{ registry, deprecatedRoutes, routeCount, versionSummary }`. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildAPIRegistry([
  { version: "v1", method: "GET", path: "/users", handler: "getUsersV1", deprecated: true },
  { version: "v1", method: "POST", path: "/users", handler: "createUserV1", deprecated: false },
  { version: "v2", method: "GET", path: "/users", handler: "getUsersV2", deprecated: false }
])` ➔

  `{
  registry: {
    v1: [
      { version: "v1", method: "GET", path: "/users", handler: "getUsersV1", deprecated: true },
      { version: "v1", method: "POST", path: "/users", handler: "createUserV1", deprecated: false }
    ],
    v2: [
      { version: "v2", method: "GET", path: "/users", handler: "getUsersV2", deprecated: false }
    ]
  },
  deprecatedRoutes: [{ version: "v1", method: "GET", path: "/users" }],
  routeCount: 3,
  versionSummary: {
    v1: { total: 2, deprecated: 1, active: 1 },
    v2: { total: 1, deprecated: 0, active: 1 }
  }
}`

---

## 🧩 PROBLEM–05: 🏗️ Full API Gateway Simulator

⚠️ **Function Name:** `runAPIGateway()`

| Input      | `incomingRequests` (array of objects), `gatewayConfig` (object) |
| :--------- | :-------------------------------------------------------------- |
| **Output** | object                                                          |

**Rules:**

`incomingRequests` — non-empty array, each:

- `requestId` (string)
- `path` (string)
- `method` (string)
- `headers` (object)

`gatewayConfig` object:

- `versionHandlers` (object) — same as Problem-02
- `routeDefinitions` (array) — same as Problem-01
- `deprecatedPaths` (array of strings) — paths that should return a deprecation warning

**Gateway Pipeline for each request:**

1. **Version Route** (Problem-02 logic) → get version + handler
2. **Match Route** (Problem-01 logic) → extract path params
3. **Check Deprecation** → if path in `deprecatedPaths` → add `warning: "This route is deprecated"`
4. Build gateway response per request

| Challenge 📢 | Return `{ gatewayLog }` — array of `{ requestId, routed, version, handler, params, warning }`. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runAPIGateway([
  { requestId: "REQ-1", path: "/api/v2/users/U123", method: "GET", headers: {} },
  { requestId: "REQ-2", path: "/api/v1/products", method: "GET", headers: {} }
], {
  versionHandlers: {
    v1: { "GET_/products": "getProductsV1" },
    v2: { "GET_/users/:userId": "getUserV2" }
  },
  routeDefinitions: [
    { pattern: "/api/v2/users/:userId", method: "GET", handler: "getUserV2" },
    { pattern: "/api/v1/products", method: "GET", handler: "getProductsV1" }
  ],
  deprecatedPaths: ["/api/v1/products"]
})` ➔

  `{
  gatewayLog: [
    { requestId: "REQ-1", routed: true, version: "v2", handler: "getUserV2", params: { userId: "U123" }, warning: null },
    { requestId: "REQ-2", routed: true, version: "v1", handler: "getProductsV1", params: {}, warning: "This route is deprecated" }
  ]
}`

---
