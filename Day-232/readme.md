# 🎓 JS DAILY PRACTICE – DAY-232

📅 **Goal:** Middleware Stack Builder (Full Stack Integration Patterns)
🎯 **Focus:** Middleware Composition • Stack Building • Conditional Middleware • Error Middleware • Middleware Lifecycle

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔗 Middleware Stack Core

⚠️ **Function Name:** `createMiddlewareStack()`

| Input      | None (factory function)   |
| :--------- | :------------------------ |
| **Output** | object (middleware stack) |

**Rules:**

Return a middleware stack object with these methods:

- `use(name, middlewareFn)` — register a middleware
- `remove(name)` — remove a middleware by name
- `execute(context)` — run all middlewares in registration order
- `listMiddlewares()` — return all registered middleware names in order
- `size()` — return count of registered middlewares

**Middleware Function Signature:**

Each `middlewareFn` takes `(context, next)` where:

- `context` — shared mutable object passed through the stack
- `next()` — call to pass control to the next middleware
- If `next()` is NOT called → chain stops at this middleware

**Operation Rules:**

- `use(name, middlewareFn)`:
  - `name` must be non-empty string
  - `middlewareFn` must be a function
  - If name already registered → `{ registered: false, reason: "Middleware already exists: " + name }`
  - Else → `{ registered: true, name, position: stackSize }`

- `execute(context)`:
  - `context` must be a non-null object
  - Run middlewares in order; each can modify `context` and call `next()`
  - Track `executionLog` → array of `{ name, called: true, calledNext: boolean }`
  - Returns `{ finalContext, executionLog, middlewaresExecuted: count, completed: boolean }`
  - `completed: true` if all middlewares called `next()`, `false` if chain stopped early

- `remove(name)` → `{ removed: true, name }` or `{ error: "Middleware not found: " + name }`
- `listMiddlewares()` → array of middleware name strings (in order)
- `size()` → number

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the middleware stack object maintaining internal state. |
| :----------- | :------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const stack = createMiddlewareStack();

stack.use("logger", (ctx, next) => {
  ctx.logs = ctx.logs || [];
  ctx.logs.push("Logger: request received");
  next();
});

stack.use("auth", (ctx, next) => {
  if (!ctx.token) {
    ctx.error = "Unauthorized";
    // does NOT call next() → chain stops
  } else {
    ctx.user = "AuthenticatedUser";
    next();
  }
});

stack.use("handler", (ctx, next) => {
  ctx.response = "Hello " + ctx.user;
  next();
});

stack.execute({ token: "valid-token" });
// → {
//   finalContext: { token: "valid-token", logs: ["Logger: request received"], user: "AuthenticatedUser", response: "Hello AuthenticatedUser" },
//   executionLog: [
//     { name: "logger", called: true, calledNext: true },
//     { name: "auth", called: true, calledNext: true },
//     { name: "handler", called: true, calledNext: true }
//   ],
//   middlewaresExecuted: 3,
//   completed: true
// }

stack.execute({ token: null });
// → {
//   finalContext: { token: null, logs: ["Logger: request received"], error: "Unauthorized" },
//   executionLog: [
//     { name: "logger", called: true, calledNext: true },
//     { name: "auth", called: true, calledNext: false }
//   ],
//   middlewaresExecuted: 2,
//   completed: false
// }
```

---

## 🧩 PROBLEM–02: 🎛️ Conditional Middleware

⚠️ **Function Name:** `createConditionalStack()`

| Input      | None (factory function)    |
| :--------- | :------------------------- |
| **Output** | object (conditional stack) |

**Rules:**

Extend the middleware stack (Problem-01) with conditional execution:

- `useIf(name, conditionFn, middlewareFn)` — register middleware that only runs if `conditionFn(context)` returns true
- `useUnless(name, conditionFn, middlewareFn)` — runs UNLESS `conditionFn(context)` returns true
- `useFor(name, methods, middlewareFn)` — runs only if `context.method` is in `methods` array
- `use(name, middlewareFn)` — always runs (from Problem-01)
- `execute(context)` — run all, respecting conditions

**Execution Rules:**

- For each middleware in order, evaluate its condition before executing:
  - `useIf` → only execute if `conditionFn(context) === true`
  - `useUnless` → only execute if `conditionFn(context) === false`
  - `useFor` → only execute if `context.method` is in `methods`
  - `use` → always execute
- If condition not met → middleware is SKIPPED (count as skipped, `next()` auto-called internally to pass control)
- `executionLog` includes skipped middlewares: `{ name, called: boolean, skipped: boolean, calledNext: boolean }`
- Returns `{ finalContext, executionLog, executed: count, skipped: count, completed: boolean }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the conditional stack object with all methods from Problem-01 plus the 3 new conditional ones. |
| :----------- | :---------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const stack = createConditionalStack();

stack.use("logger", (ctx, next) => {
  ctx.logged = true;
  next();
});
stack.useIf(
  "adminOnly",
  (ctx) => ctx.role === "ADMIN",
  (ctx, next) => {
    ctx.adminAccess = true;
    next();
  },
);
stack.useFor("postOnly", ["POST", "PUT"], (ctx, next) => {
  ctx.bodyParsed = true;
  next();
});
stack.useUnless(
  "skipForInternal",
  (ctx) => ctx.isInternal,
  (ctx, next) => {
    ctx.publicProcessed = true;
    next();
  },
);

stack.execute({ role: "ADMIN", method: "POST", isInternal: false });
// all conditions met → all 4 execute →

// { finalContext: { role: "ADMIN", method: "POST", isInternal: false, logged: true, adminAccess: true, bodyParsed: true, publicProcessed: true },

//   executionLog: [
//     { name: "logger", called: true, skipped: false, calledNext: true },
//     { name: "adminOnly", called: true, skipped: false, calledNext: true },
//     { name: "postOnly", called: true, skipped: false, calledNext: true },
//     { name: "skipForInternal", called: true, skipped: false, calledNext: true }
//   ],
//   executed: 4, skipped: 0, completed: true
// }


stack.execute({ role: "USER", method: "GET", isInternal: true });
// adminOnly skipped (role≠ADMIN), postOnly skipped (GET not in [POST,PUT]), skipForInternal skipped (isInternal=true) →

// {finalContext: { role: "USER", method: "GET", isInternal: true, logged: true },

//   executionLog: [
//     { name: "logger", called: true, skipped: false, calledNext: true },
//     { name: "adminOnly", called: false, skipped: true, calledNext: true },
//     { name: "postOnly", called: false, skipped: true, calledNext: true },
//     { name: "skipForInternal", called: false, skipped: true, calledNext: true }
//   ],
//   executed: 1, skipped: 3, completed: true
// }
```

---

## 🧩 PROBLEM–03: ❌ Error Middleware

⚠️ **Function Name:** `createErrorAwareStack()`

| Input      | None (factory function)    |
| :--------- | :------------------------- |
| **Output** | object (error-aware stack) |

**Rules:**

Extend the middleware stack with error handling:

- `use(name, middlewareFn)` — normal middleware
- `useError(name, errorHandlerFn)` — register error-handling middleware
  - `errorHandlerFn` signature: `(error, context, next)` — receives the error + context
- `execute(context)` — run stack with error propagation

**Error Handling Rules:**

- Normal middleware can throw an error OR set `context.error` and not call `next()`
- When an error occurs (throw OR `context.error` set without `next()`):
  - Skip remaining normal middlewares
  - Run error middlewares in registration order, passing the error
  - Error middleware can call `next()` to pass to next error handler, or resolve the error
  - If error middleware sets `context.errorHandled = true` → stop error chain, mark as handled
- `executionLog` entries: `{ name, type: "NORMAL" or "ERROR_HANDLER", called: boolean, threw: boolean, calledNext: boolean }`
- Returns `{ finalContext, executionLog, errorOccurred: boolean, errorHandled: boolean, completed: boolean }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the error-aware stack object. |
| :----------- | :----------------------------------- |

**Sample Input & Output:**

```javascript
const stack = createErrorAwareStack();

stack.use("step1", (ctx, next) => {
  ctx.step1 = true;
  next();
});
stack.use("step2", (ctx, next) => {
  if (ctx.triggerError) throw new Error("Something went wrong");
  ctx.step2 = true;
  next();
});
stack.use("step3", (ctx, next) => {
  ctx.step3 = true;
  next();
});
stack.useError("errorLogger", (err, ctx, next) => {
  ctx.errorLog = "Caught: " + err.message;
  next();
});
stack.useError("errorResolver", (err, ctx, next) => {
  ctx.errorHandled = true;
  ctx.recoveredFrom = err.message;
});

// No error:
stack.execute({ triggerError: false });
// → { finalContext: { triggerError: false, step1: true, step2: true, step3: true }, errorOccurred: false, errorHandled: false, completed: true, executionLog: [...] }


// With error:
stack.execute({ triggerError: true });
// step1 runs, step2 throws, step3 skipped
// errorLogger runs (logs error), errorResolver runs (sets errorHandled=true) →

//  { finalContext: { triggerError: true, step1: true, errorLog: "Caught: Something went wrong", errorHandled: true, recoveredFrom: "Something went wrong" },

//   executionLog: [
//     { name: "step1", type: "NORMAL", called: true, threw: false, calledNext: true },
//     { name: "step2", type: "NORMAL", called: true, threw: true, calledNext: false },
//     { name: "step3", type: "NORMAL", called: false, threw: false, calledNext: false },
//     { name: "errorLogger", type: "ERROR_HANDLER", called: true, threw: false, calledNext: true },
//     { name: "errorResolver", type: "ERROR_HANDLER", called: true, threw: false, calledNext: false }
//   ],
//   errorOccurred: true,
//   errorHandled: true,
//   completed: false
// }
```

---

## 🧩 PROBLEM–04: 🔀 Middleware Router

⚠️ **Function Name:** `createMiddlewareRouter()`

| Input      | None (factory function)    |
| :--------- | :------------------------- |
| **Output** | object (middleware router) |

**Rules:**

Return a middleware router — a stack of stacks, where each route has its own middleware stack:

- `mount(path, stack)` — mount a middleware stack at a path prefix
- `route(method, path, ...middlewareFns)` — register exact route with inline middlewares
- `dispatch(context)` — route incoming request to the right stack/route
- `listRoutes()` — return all registered routes and mounts

**Context Requirements:**

`context` must have:

- `method` (string: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`)
- `path` (string, starts with `"/"`)

**Dispatch Rules:**

- First check exact routes (`method + path` match)
- Then check mounted stacks (path starts with mount prefix)
- If no match → `context.routeError = "No route matched: " + method + " " + path`
- Extract path params from route patterns (`:param` style, like Day-213/229)
- Attach `context.params` with extracted params

- `mount(path, stack)` → `{ mounted: true, path }`
- `route(method, path, ...middlewareFns)`:
  - Creates internal stack from provided middleware functions
  - Returns `{ registered: true, method, path }`
- `dispatch(context)` → runs matching stack's `execute(context)`, returns its result + `{ matchedRoute: { method, path } or null }`
- `listRoutes()` → `{ routes: [{ type: "ROUTE", method, path }], mounts: [{ type: "MOUNT", path }] }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the middleware router object with all 4 methods. |
| :----------- | :------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const router = createMiddlewareRouter();

// Mount a logging stack at /api
const apiStack = createMiddlewareStack();
apiStack.use("apiLogger", (ctx, next) => {
  ctx.apiLogged = true;
  next();
});
router.mount("/api", apiStack);

// Register exact routes
router.route("GET", "/api/users", (ctx, next) => {
  ctx.result = "list of users";
  next();
});
router.route("GET", "/api/users/:id", (ctx, next) => {
  ctx.result = "user " + ctx.params.id;
  next();
});
router.route("POST", "/api/users", (ctx, next) => {
  ctx.result = "user created";
  next();
});

router.dispatch({ method: "GET", path: "/api/users/U1" });
// → {
//   finalContext: { method: "GET", path: "/api/users/U1", params: { id: "U1" }, result: "user U1" },
//   matchedRoute: { method: "GET", path: "/api/users/:id" },
//   completed: true,
//   ...
// }

router.dispatch({ method: "DELETE", path: "/api/orders" });
// → {
//   finalContext: { method: "DELETE", path: "/api/orders", routeError: "No route matched: DELETE /api/orders" },
//   matchedRoute: null,
//   completed: false
// }

router.listRoutes();
// → {
//   routes: [
//     { type: "ROUTE", method: "GET", path: "/api/users" },
//     { type: "ROUTE", method: "GET", path: "/api/users/:id" },
//     { type: "ROUTE", method: "POST", path: "/api/users" }
//   ],
//   mounts: [{ type: "MOUNT", path: "/api" }]
// }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Middleware App Orchestrator

⚠️ **Function Name:** `runMiddlewareAppOrchestrator()`

| Input      | `appConfig` (object) |
| :--------- | :------------------- |
| **Output** | object               |

**Rules:**

`appConfig` object:

- `appId` (string, non-empty)
- `globalMiddlewares` (array of objects):
  - `name` (string)
  - `type` (string: `"always"`, `"ifCondition"`, `"forMethods"`)
  - `condition` (string or null) — for `"ifCondition"`: field name that must be truthy in context
  - `methods` (array of strings or null) — for `"forMethods"`
  - `action` (string) — what the middleware sets: `"log"`, `"auth"`, `"parse"`, `"respond"`
- `routes` (array of objects):
  - `method` (string)
  - `path` (string)
  - `action` (string) — e.g. `"getUsers"`, `"createUser"`
- `requests` (array of objects):
  - `requestId` (string)
  - `method` (string)
  - `path` (string)
  - `token` (string or null)
  - `body` (object or null)

**Middleware Action Simulation:**

- `"log"` → sets `ctx.logged = true`
- `"auth"` → if `ctx.token` exists: sets `ctx.authenticated = true`; else sets `ctx.error = "Unauthorized"` and stops
- `"parse"` → if `ctx.body` exists: sets `ctx.parsed = true`
- `"respond"` → sets `ctx.response = { action: matchedRouteAction, status: "OK" }`

**Orchestration Rules (compose all previous concepts):**

1. **Build global middleware stack** (Problem-02 conditional stack) from `globalMiddlewares`
2. **Build router** (Problem-04) — register each route
3. **Process each request:**
   - Build context: `{ requestId, method, path, token, body }`
   - Run global middleware stack first
   - If not stopped → dispatch to router
   - Collect final context + execution log
4. **Summary:**
   - `totalRequests`
   - `successCount` → completed without error
   - `errorCount` → stopped by middleware error
   - `routeNotFoundCount` → no matching route

**Validation:** invalid `appConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ appId, requestLog, summary }` where `requestLog` is array of `{ requestId, finalContext, completed, middlewaresExecuted }`. |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `runMiddlewareAppOrchestrator({
  appId: "MW-APP-01",
  globalMiddlewares: [
    { name: "logger", type: "always", condition: null, methods: null, action: "log" },
    { name: "auth", type: "always", condition: null, methods: null, action: "auth" },
    { name: "bodyParser", type: "forMethods", condition: null, methods: ["POST", "PUT"], action: "parse" }
  ],
  routes: [
    { method: "GET", path: "/users", action: "getUsers" },
    { method: "POST", path: "/users", action: "createUser" }
  ],
  requests: [
    { requestId: "REQ-1", method: "GET", path: "/users", token: "valid-token", body: null },
    { requestId: "REQ-2", method: "POST", path: "/users", token: "valid-token", body: { name: "Rahim" } },
    { requestId: "REQ-3", method: "GET", path: "/users", token: null, body: null }
  ]
})` →

  **Manual Verify:**
  - REQ-1: log✓ → auth(token exists)✓ → bodyParser skipped(GET) → dispatch GET /users → respond(getUsers) → SUCCESS
  - REQ-2: log✓ → auth✓ → bodyParser(POST,body exists)✓ → dispatch POST /users → respond(createUser) → SUCCESS
  - REQ-3: log✓ → auth(no token) → error "Unauthorized" → chain stops → ERROR

  `{
  appId: "MW-APP-01",
  requestLog: [
    {
      requestId: "REQ-1",
      finalContext: { requestId: "REQ-1", method: "GET", path: "/users", token: "valid-token", body: null, logged: true, authenticated: true, response: { action: "getUsers", status: "OK" } },
      completed: true,
      middlewaresExecuted: 3
    },
    {
      requestId: "REQ-2",
      finalContext: { requestId: "REQ-2", method: "POST", path: "/users", token: "valid-token", body: { name: "Rahim" }, logged: true, authenticated: true, parsed: true, response: { action: "createUser", status: "OK" } },
      completed: true,
      middlewaresExecuted: 3
    },
    {
      requestId: "REQ-3",
      finalContext: { requestId: "REQ-3", method: "GET", path: "/users", token: null, body: null, logged: true, error: "Unauthorized" },
      completed: false,
      middlewaresExecuted: 2
    }
  ],
  summary: {
    totalRequests: 3,
    successCount: 2,
    errorCount: 1,
    routeNotFoundCount: 0
  }
}`

---
