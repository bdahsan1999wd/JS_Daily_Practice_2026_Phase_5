# 🎓 JS DAILY PRACTICE – DAY-229

📅 **Goal:** Mini MVC Framework Simulator (Full Stack Integration Patterns)
🎯 **Focus:** Model • View • Controller • Route Handling • Request/Response Cycle • MVC Composition

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🗄️ Model Layer

⚠️ **Function Name:** `createModel()`

| Input      | `modelConfig` (object)  |
| :--------- | :---------------------- |
| **Output** | object (model)          |

**Rules:**

`modelConfig` object:

- `modelName` (string, non-empty) — e.g. `"User"`, `"Product"`
- `schema` (object) — field definitions: `{ fieldName: { type: string, required: boolean, default: any or null } }`
- Supported types: `"string"`, `"number"`, `"boolean"`

Return a model object with these methods:

- `create(data)` — create a new record, auto-generate `id: "modelName_" + autoIndex`
- `findById(id)` — find record by id
- `findAll()` — return all records
- `update(id, data)` — update fields of existing record
- `delete(id)` — remove record by id
- `count()` — return total record count

**Operation Rules:**

- `create(data)`:
  - Validate required fields against schema
  - Apply defaults for missing optional fields
  - If required field missing → `{ error: "Missing required field: " + fieldName }`
  - If type mismatch → `{ error: "Invalid type for field: " + fieldName }`
  - Else → store record with auto-id, return `{ created: true, record }`
- `findById(id)` → `{ found: true, record }` or `{ found: false, id }`
- `findAll()` → `{ records, count }`
- `update(id, data)` → `{ updated: true, record }` or `{ error: "Record not found" }`
- `delete(id)` → `{ deleted: true, id }` or `{ error: "Record not found" }`
- `count()` → number

**Validation:** invalid `modelConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the model object maintaining internal record store. |
| :----------- | :--------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const UserModel = createModel({
  modelName: "User",
  schema: {
    name: { type: "string", required: true, default: null },
    age: { type: "number", required: false, default: 0 },
    active: { type: "boolean", required: false, default: true }
  }
});

UserModel.create({ name: "Rahim", age: 25 });
// → { created: true, record: { id: "User_1", name: "Rahim", age: 25, active: true } }

UserModel.create({ age: 30 });
// → { error: "Missing required field: name" }

UserModel.create({ name: "Karim" });
// → { created: true, record: { id: "User_2", name: "Karim", age: 0, active: true } }

UserModel.findAll();
// → { records: [{ id: "User_1", ... }, { id: "User_2", ... }], count: 2 }

UserModel.update("User_1", { age: 26 });
// → { updated: true, record: { id: "User_1", name: "Rahim", age: 26, active: true } }

UserModel.delete("User_2");
// → { deleted: true, id: "User_2" }

UserModel.count(); // → 1
```

---

## 🧩 PROBLEM–02: 👁️ View Layer

⚠️ **Function Name:** `createView()`

| Input      | `viewConfig` (object)  |
| :--------- | :--------------------- |
| **Output** | object (view)          |

**Rules:**

`viewConfig` object:

- `viewName` (string, non-empty)
- `templates` (object) — named templates: `{ templateName: templateString }`
  - Template strings use `{{fieldName}}` placeholders

Return a view object with these methods:

- `render(templateName, data)` — render a template with data
- `renderList(templateName, dataArray)` — render template for each item in array
- `renderError(statusCode, message)` — render a standard error view
- `renderSuccess(data, message)` — render a standard success view
- `listTemplates()` — return array of available template names

**Rendering Rules:**

- `render(templateName, data)`:
  - Replace all `{{fieldName}}` in template with `data[fieldName]`
  - If `templateName` not found → `{ error: "Template not found: " + templateName }`
  - If a placeholder has no matching data key → leave as `""` (empty string)
  - Returns `{ viewName, templateName, rendered: string }`

- `renderList(templateName, dataArray)`:
  - Apply `render` to each item in array
  - Returns `{ viewName, templateName, rendered: array of rendered strings, count }`

- `renderError(statusCode, message)`:
  - Returns `{ viewName, type: "ERROR", statusCode, message, rendered: "[ERROR " + statusCode + "] " + message }`

- `renderSuccess(data, message)`:
  - Returns `{ viewName, type: "SUCCESS", message, data, rendered: "[SUCCESS] " + message }`

- `listTemplates()` → array of template name strings

**Validation:** invalid `viewConfig` → return `"Invalid Input"` from factory. Method invalid → return `"Invalid Input"`

| Challenge 📢 | Return the view object with all 5 methods. |
| :----------- | :----------------------------------------- |

**Sample Input & Output:**

```javascript
const UserView = createView({
  viewName: "UserView",
  templates: {
    "userCard": "Name: {{name}}, Age: {{age}}, Active: {{active}}",
    "userSummary": "User {{name}} has ID {{id}}"
  }
});

UserView.render("userCard", { name: "Rahim", age: 25, active: true });
// → { viewName: "UserView", templateName: "userCard", rendered: "Name: Rahim, Age: 25, Active: true" }

UserView.renderList("userSummary", [
  { id: "User_1", name: "Rahim" },
  { id: "User_2", name: "Karim" }
]);
// → {
//   viewName: "UserView",
//   templateName: "userSummary",
//   rendered: ["User Rahim has ID User_1", "User Karim has ID User_2"],
//   count: 2
// }

UserView.renderError(404, "User not found");
// → { viewName: "UserView", type: "ERROR", statusCode: 404, message: "User not found", rendered: "[ERROR 404] User not found" }

UserView.listTemplates();
// → ["userCard", "userSummary"]
```

---

## 🧩 PROBLEM–03: 🎮 Controller Layer

⚠️ **Function Name:** `createController()`

| Input      | `controllerConfig` (object) |
| :--------- | :-------------------------- |
| **Output** | object (controller)         |

**Rules:**

`controllerConfig` object:

- `controllerName` (string, non-empty)
- `model` (object) — a model instance (from Problem-01)
- `view` (object) — a view instance (from Problem-02)

Return a controller object with these methods:

- `handleCreate(requestBody)` — create a record via model, render response via view
- `handleGetAll()` — get all records, render list view
- `handleGetById(id)` — get one record, render view
- `handleUpdate(id, requestBody)` — update record, render response
- `handleDelete(id)` — delete record, render response
- `getActionLog()` — return log of all controller actions

**Handler Rules:**

- Each handler:
  1. Calls the appropriate model method
  2. If model returns error → use `view.renderError()` with appropriate status code
  3. If model succeeds → use `view.renderSuccess()` with result data
  4. Logs the action: `{ action, timestamp: "2025-01-01T00:00:00Z", success: boolean }`

- `handleCreate(requestBody)`:
  - Model: `create(requestBody)`
  - On error → `renderError(400, error.message)` ... On success → `renderSuccess(record, controllerName + " created")`

- `handleGetAll()`:
  - Model: `findAll()`
  - Always success → `renderSuccess({ records, count }, "Fetched all " + controllerName + "s")`

- `handleGetById(id)`:
  - Model: `findById(id)`
  - Not found → `renderError(404, controllerName + " not found")` ... Found → `renderSuccess(record, controllerName + " found")`

- `handleUpdate(id, requestBody)`:
  - Model: `update(id, requestBody)`
  - Error → `renderError(404, "Record not found")` ... Success → `renderSuccess(record, controllerName + " updated")`

- `handleDelete(id)`:
  - Model: `delete(id)`
  - Error → `renderError(404, "Record not found")` ... Success → `renderSuccess({ id }, controllerName + " deleted")`

**Validation:** invalid `controllerConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the controller object with all 6 methods. |
| :----------- | :------------------------------------------------ |

**Sample Input & Output:**

```javascript
const UserModel = createModel({ modelName: "User", schema: { name: { type: "string", required: true, default: null } } });
const UserView = createView({ viewName: "UserView", templates: { "user": "User: {{name}}" } });
const UserController = createController({ controllerName: "User", model: UserModel, view: UserView });

UserController.handleCreate({ name: "Rahim" });
// → { viewName: "UserView", type: "SUCCESS", message: "User created", data: { id: "User_1", name: "Rahim" }, rendered: "[SUCCESS] User created" }

UserController.handleCreate({});
// → { viewName: "UserView", type: "ERROR", statusCode: 400, message: "Missing required field: name", rendered: "[ERROR 400] Missing required field: name" }

UserController.handleGetById("User_1");
// → { viewName: "UserView", type: "SUCCESS", message: "User found", data: { id: "User_1", name: "Rahim" }, rendered: "[SUCCESS] User found" }

UserController.handleGetById("User_99");
// → { viewName: "UserView", type: "ERROR", statusCode: 404, message: "User not found", rendered: "[ERROR 404] User not found" }

UserController.getActionLog();
// → [
//   { action: "CREATE", timestamp: "2025-01-01T00:00:00Z", success: true },
//   { action: "CREATE", timestamp: "2025-01-01T00:00:00Z", success: false },
//   { action: "GET_BY_ID", timestamp: "2025-01-01T00:00:00Z", success: true },
//   { action: "GET_BY_ID", timestamp: "2025-01-01T00:00:00Z", success: false }
// ]
```

---

## 🧩 PROBLEM–04: 🛣️ Router

⚠️ **Function Name:** `createRouter()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (router)         |

**Rules:**

Return a router object with these methods:

- `register(method, path, handler)` — register a route
- `dispatch(method, path, payload)` — match and execute a route handler
- `listRoutes()` — return all registered routes
- `unregister(method, path)` — remove a route

**Route Rules:**

- `method` must be one of: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`
- `path` must be non-empty string starting with `"/"`
- `handler` must be a function — it receives `{ params, payload }` and returns a result
- Supports path params: `/users/:id` matches `/users/User_1`, extracts `{ id: "User_1" }`
- Route key = `method + "_" + path` (e.g. `"GET_/users/:id"`)

- `register(method, path, handler)`:
  - If route already registered → `{ registered: false, reason: "Route already exists" }`
  - Else → `{ registered: true, method, path }`

- `dispatch(method, path, payload)`:
  - Match against registered routes (support path params like Problem-01 Day-213)
  - If no match → `{ dispatched: false, reason: "No route found for " + method + " " + path }`
  - If match → call `handler({ params, payload })`, return `{ dispatched: true, method, path, result: handlerResult }`

- `listRoutes()` → array of `{ method, path }`
- `unregister(method, path)` → `{ unregistered: true, method, path }` or `{ error: "Route not found" }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the router object with all 4 methods. |
| :----------- | :------------------------------------------- |

**Sample Input & Output:**

```javascript
const router = createRouter();

router.register("GET", "/users", ({ payload }) => ({ action: "list users", payload }));
router.register("GET", "/users/:id", ({ params }) => ({ action: "get user", id: params.id }));
router.register("POST", "/users", ({ payload }) => ({ action: "create user", data: payload }));

router.listRoutes();
// → [
//   { method: "GET", path: "/users" },
//   { method: "GET", path: "/users/:id" },
//   { method: "POST", path: "/users" }
// ]

router.dispatch("GET", "/users/User_1", null);
// → { dispatched: true, method: "GET", path: "/users/User_1", result: { action: "get user", id: "User_1" } }

router.dispatch("DELETE", "/users", null);
// → { dispatched: false, reason: "No route found for DELETE /users" }
```

---

## 🧩 PROBLEM–05: 🏗️ Full MVC App Orchestrator

⚠️ **Function Name:** `runMVCOrchestrator()`

| Input      | `appConfig` (object)  |
| :--------- | :-------------------- |
| **Output** | object                |

**Rules:**

`appConfig` object:

- `appId` (string, non-empty)
- `modelConfig` (object) — same shape as Problem-01
- `viewConfig` (object) — same shape as Problem-02
- `routes` (array of objects):
  - `method` (string: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`)
  - `path` (string)
  - `action` (string: `"CREATE"`, `"GET_ALL"`, `"GET_BY_ID"`, `"UPDATE"`, `"DELETE"`)
- `requests` (array of objects) — incoming requests to process:
  - `requestId` (string)
  - `method` (string)
  - `path` (string)
  - `payload` (object or null)

**Orchestration Rules (compose all previous concepts):**

1. **Build Model** (Problem-01 logic) using `modelConfig`
2. **Build View** (Problem-02 logic) using `viewConfig`
3. **Build Controller** (Problem-03 logic) wiring model + view
4. **Build Router** (Problem-04 logic) — register routes, each route maps to controller action:
   - `"CREATE"` → `controller.handleCreate(payload)`
   - `"GET_ALL"` → `controller.handleGetAll()`
   - `"GET_BY_ID"` → `controller.handleGetById(params.id)`
   - `"UPDATE"` → `controller.handleUpdate(params.id, payload)`
   - `"DELETE"` → `controller.handleDelete(params.id)`
5. **Process Requests** — dispatch each request through router, collect responses
6. **Build Summary:**
   - `totalRequests` → count
   - `successCount` → responses with `type: "SUCCESS"`
   - `errorCount` → responses with `type: "ERROR"`
   - `actionLog` → controller's full action log

**Validation:** invalid `appConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ appId, requestLog, summary }` where `requestLog` is array of `{ requestId, method, path, response }`. |
| :----------- | :--------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runMVCOrchestrator({
  appId: "APP-MVC-01",
  modelConfig: {
    modelName: "Product",
    schema: {
      name: { type: "string", required: true, default: null },
      price: { type: "number", required: true, default: null }
    }
  },
  viewConfig: {
    viewName: "ProductView",
    templates: { "product": "Product: {{name}} - ৳{{price}}" }
  },
  routes: [
    { method: "POST", path: "/products", action: "CREATE" },
    { method: "GET", path: "/products", action: "GET_ALL" },
    { method: "GET", path: "/products/:id", action: "GET_BY_ID" }
  ],
  requests: [
    { requestId: "REQ-1", method: "POST", path: "/products", payload: { name: "JS Book", price: 500 } },
    { requestId: "REQ-2", method: "POST", path: "/products", payload: { name: "CSS Guide", price: 300 } },
    { requestId: "REQ-3", method: "GET", path: "/products", payload: null },
    { requestId: "REQ-4", method: "GET", path: "/products/Product_1", payload: null },
    { requestId: "REQ-5", method: "GET", path: "/products/Product_99", payload: null }
  ]
})` →

  **Manual Verify:**
  - REQ-1: POST /products → create "JS Book" → SUCCESS (Product_1)
  - REQ-2: POST /products → create "CSS Guide" → SUCCESS (Product_2)
  - REQ-3: GET /products → get all → SUCCESS (2 records)
  - REQ-4: GET /products/Product_1 → found → SUCCESS
  - REQ-5: GET /products/Product_99 → not found → ERROR 404
  - successCount: 4, errorCount: 1

  `{
  appId: "APP-MVC-01",
  requestLog: [
    { requestId: "REQ-1", method: "POST", path: "/products", response: { type: "SUCCESS", message: "Product created", data: { id: "Product_1", name: "JS Book", price: 500 } } },
    { requestId: "REQ-2", method: "POST", path: "/products", response: { type: "SUCCESS", message: "Product created", data: { id: "Product_2", name: "CSS Guide", price: 300 } } },
    { requestId: "REQ-3", method: "GET", path: "/products", response: { type: "SUCCESS", message: "Fetched all Products", data: { records: [{ id: "Product_1", name: "JS Book", price: 500 }, { id: "Product_2", name: "CSS Guide", price: 300 }], count: 2 } } },
    { requestId: "REQ-4", method: "GET", path: "/products/Product_1", response: { type: "SUCCESS", message: "Product found", data: { id: "Product_1", name: "JS Book", price: 500 } } },
    { requestId: "REQ-5", method: "GET", path: "/products/Product_99", response: { type: "ERROR", statusCode: 404, message: "Product not found" } }
  ],
  summary: {
    totalRequests: 5,
    successCount: 4,
    errorCount: 1,
    actionLog: [
      { action: "CREATE", timestamp: "2025-01-01T00:00:00Z", success: true },
      { action: "CREATE", timestamp: "2025-01-01T00:00:00Z", success: true },
      { action: "GET_ALL", timestamp: "2025-01-01T00:00:00Z", success: true },
      { action: "GET_BY_ID", timestamp: "2025-01-01T00:00:00Z", success: true },
      { action: "GET_BY_ID", timestamp: "2025-01-01T00:00:00Z", success: false }
    ]
  }
}`

---