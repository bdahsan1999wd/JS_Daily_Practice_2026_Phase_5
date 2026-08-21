# 🎓 JS DAILY PRACTICE – DAY-234

📅 **Goal:** Dependency Injection Container (Full Stack Integration Patterns)
🎯 **Focus:** DI Container • Service Registration • Lifetime Management • Dependency Resolution • Auto-Wiring

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📦 Basic DI Container

⚠️ **Function Name:** `createDIContainer()`

| Input      | None (factory function)   |
| :--------- | :------------------------ |
| **Output** | object (DI container)     |

**Rules:**

Return a DI container object with these methods:

- `register(name, factory, lifetime)` — register a service
- `resolve(name)` — get a service instance
- `has(name)` — check if service is registered
- `unregister(name)` — remove a service
- `listServices()` — return all registered service names

**Lifetime Types:**

- `"TRANSIENT"` — new instance created every time `resolve` is called
- `"SINGLETON"` — same instance returned every time (created on first resolve)
- `"SCOPED"` — new instance per scope (treat as TRANSIENT for now — scopes in Problem-04)

**Operation Rules:**

- `register(name, factory, lifetime)`:
  - `name` must be non-empty string
  - `factory` must be a function (called with no args to create the service)
  - `lifetime` must be `"TRANSIENT"`, `"SINGLETON"`, or `"SCOPED"`
  - If name already registered → `{ registered: false, reason: "Service already registered: " + name }`
  - Else → `{ registered: true, name, lifetime }`

- `resolve(name)`:
  - If not registered → `{ error: "Service not found: " + name }`
  - For SINGLETON → call factory once, cache instance, return same instance every time
  - For TRANSIENT → call factory each time, return new instance
  - Returns the service instance directly (not wrapped in object)

- `has(name)` → `{ name, registered: boolean }`
- `unregister(name)` → `{ unregistered: true, name }` or `{ error: "Service not found: " + name }`
- `listServices()` → array of `{ name, lifetime, isSingleton: boolean }`

**Validation:** method-level invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the DI container object maintaining internal registry and singleton cache. |
| :----------- | :-------------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const container = createDIContainer();

container.register("logger", () => ({ log: (msg) => "[LOG] " + msg }), "SINGLETON");
container.register("userRepo", () => ({ findAll: () => [] }), "TRANSIENT");

// Singleton — same instance both times
const logger1 = container.resolve("logger");
const logger2 = container.resolve("logger");
// logger1 === logger2 (same object reference)

// Transient — different instance each time
const repo1 = container.resolve("userRepo");
const repo2 = container.resolve("userRepo");
// repo1 !== repo2 (different objects)

container.has("logger");
// → { name: "logger", registered: true }

container.listServices();
// → [
//   { name: "logger", lifetime: "SINGLETON", isSingleton: true },
//   { name: "userRepo", lifetime: "TRANSIENT", isSingleton: false }
// ]

container.unregister("userRepo");
// → { unregistered: true, name: "userRepo" }

container.resolve("userRepo");
// → { error: "Service not found: userRepo" }
```

---

## 🧩 PROBLEM–02: 🔗 Dependency Resolution

⚠️ **Function Name:** `createDIContainerWithDeps()`

| Input      | None (factory function)        |
| :--------- | :----------------------------- |
| **Output** | object (DI container with deps)|

**Rules:**

Extend the basic container (Problem-01) to support dependency injection between services:

- `register(name, factory, lifetime, dependencies)` — register with explicit dependencies
  - `dependencies` — array of service names this service depends on
  - `factory` now receives resolved dependencies as arguments: `factory(dep1, dep2, ...)`
- `resolve(name)` — auto-resolve dependencies before creating the service
- `getResolutionOrder(name)` — return the order in which services are resolved for a given service
- `getDependencyGraph()` — return full dependency graph

**Resolution Rules:**

- When resolving a service, first resolve all its dependencies (recursively)
- Pass resolved dependency instances to the factory function
- Circular dependency detection: if service A depends on B which depends on A → `{ error: "Circular dependency detected: " + cycle }`
- `getResolutionOrder(name)` → `{ name, resolutionOrder: [dep names in order they are resolved], totalDeps }`
- `getDependencyGraph()` → object: `{ serviceName: { lifetime, dependencies: [names] } }` for all registered services

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the extended DI container object with all methods from Problem-01 plus `getResolutionOrder` and `getDependencyGraph`. |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const container = createDIContainerWithDeps();

container.register("config", () => ({ env: "production", dbUrl: "db://localhost" }), "SINGLETON", []);
container.register("logger", (config) => ({ log: (msg) => "[" + config.env + "] " + msg }), "SINGLETON", ["config"]);
container.register("db", (config, logger) => ({ query: (sql) => { logger.log(sql); return []; }, url: config.dbUrl }), "SINGLETON", ["config", "logger"]);
container.register("userRepo", (db) => ({ findAll: () => db.query("SELECT * FROM users") }), "TRANSIENT", ["db"]);

const userRepo = container.resolve("userRepo");
// Resolution order: config → logger → db → userRepo
// userRepo.findAll() calls db.query which calls logger.log

container.getResolutionOrder("userRepo");
// → { name: "userRepo", resolutionOrder: ["config", "logger", "db", "userRepo"], totalDeps: 1 }

container.getDependencyGraph();
// → {
//   config: { lifetime: "SINGLETON", dependencies: [] },
//   logger: { lifetime: "SINGLETON", dependencies: ["config"] },
//   db: { lifetime: "SINGLETON", dependencies: ["config", "logger"] },
//   userRepo: { lifetime: "TRANSIENT", dependencies: ["db"] }
// }

// Circular dependency:
container.register("A", (b) => b, "TRANSIENT", ["B"]);
container.register("B", (a) => a, "TRANSIENT", ["A"]);
container.resolve("A");
// → { error: "Circular dependency detected: A → B → A" }
```

---

## 🧩 PROBLEM–03: 🏷️ Service Decorators & Interceptors

⚠️ **Function Name:** `createDecoratedContainer()`

| Input      | None (factory function)      |
| :--------- | :--------------------------- |
| **Output** | object (decorated container) |

**Rules:**

Extend the DI container with decorator and interceptor support:

- `register(name, factory, lifetime, dependencies)` — same as Problem-02
- `decorate(name, decoratorFn)` — wrap a registered service with a decorator
- `intercept(name, methodName, interceptorFn)` — intercept a specific method on a service
- `resolve(name)` — return decorated + intercepted service
- `getDecorators(name)` — return list of decorators applied to a service

**Decorator Rules:**

- `decorate(name, decoratorFn)`:
  - `decoratorFn` takes the original service instance and returns a new (wrapped) instance
  - Multiple decorators can be applied to same service → applied in registration order
  - Returns `{ decorated: true, name, decoratorCount: total decorators on this service }`
  - If service not found → `{ error: "Service not found: " + name }`

- `intercept(name, methodName, interceptorFn)`:
  - `interceptorFn` takes `(originalMethod, ...args)` → can modify args or return value
  - Wraps the specific method on the resolved service
  - Returns `{ intercepted: true, name, methodName }`

- `resolve(name)`:
  - Resolve base service (with deps)
  - Apply all decorators in order
  - Apply all interceptors
  - Return final decorated+intercepted instance

- `getDecorators(name)` → `{ name, decorators: count, interceptors: [{ methodName }] }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the decorated container object with all methods. |
| :----------- | :------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const container = createDecoratedContainer();

container.register("userService", () => ({
  getUser: (id) => ({ id, name: "Rahim" }),
  createUser: (data) => ({ id: "U1", ...data })
}), "SINGLETON", []);

// Add logging decorator
container.decorate("userService", (service) => ({
  ...service,
  _decorated: true,
  _decoratorName: "LoggingDecorator"
}));

// Intercept getUser method
container.intercept("userService", "getUser", (originalMethod, id) => {
  const result = originalMethod(id);
  return { ...result, fetchedAt: "2025-01-01T00:00:00Z" };
});

const service = container.resolve("userService");
// service has _decorated: true, _decoratorName: "LoggingDecorator"

// service.getUser("U1") →
// { id: "U1", name: "Rahim", fetchedAt: "2025-01-01T00:00:00Z" }

container.getDecorators("userService");
// → { name: "userService", decorators: 1, interceptors: [{ methodName: "getUser" }] }
```

---

## 🧩 PROBLEM–04: 🔭 Scoped Container

⚠️ **Function Name:** `createScopedContainer()`

| Input      | `parentContainer` (object) |
| :--------- | :------------------------- |
| **Output** | object (scoped container)  |

**Rules:**

`parentContainer` — a DI container instance (from Problem-01 or 02)

Return a scoped container object that:

- Inherits all services from parent
- `SCOPED` lifetime services → one instance per scope (different from SINGLETON which is per container)
- `SINGLETON` services → shared from parent (same instance)
- `TRANSIENT` services → new instance each time (same as parent behavior)

Scoped container methods:

- `createScope()` — create a new child scope (returns a new scoped container)
- `resolve(name)` — resolve within this scope
- `getScopeId()` — return unique scope identifier
- `getScopeStats()` — return stats about this scope
- `dispose()` — end the scope, clear all SCOPED instances

**Scope Rules:**

- Each call to `createScope()` creates a new scope with a unique `scopeId: "SCOPE-" + autoIndex`
- Within a scope, `SCOPED` services are created once and reused (like SINGLETON but per-scope)
- When `dispose()` is called → clear scoped instances, return `{ disposed: true, scopeId, scopedInstancesCleared: count }`
- `getScopeStats()` → `{ scopeId, resolvedServices: count, scopedInstances: count, parentScopeId: null or parentId }`

**Validation:** invalid `parentContainer` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the scoped container object with all 5 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const parent = createDIContainer();
parent.register("logger", () => ({ id: Math.random(), log: (m) => m }), "SINGLETON");
parent.register("requestContext", () => ({ requestId: "REQ-" + Math.random() }), "SCOPED");
parent.register("userService", () => ({ getUser: (id) => id }), "TRANSIENT");

const scopedContainer = createScopedContainer(parent);

const scope1 = scopedContainer.createScope();
// → scope with scopeId: "SCOPE-1"

// Within scope1, SCOPED services return same instance
const ctx1a = scope1.resolve("requestContext");
const ctx1b = scope1.resolve("requestContext");
// ctx1a === ctx1b (same instance within scope)

const scope2 = scopedContainer.createScope();
const ctx2 = scope2.resolve("requestContext");
// ctx2 !== ctx1a (different scope → different instance)

// SINGLETON shared across scopes
const logger1 = scope1.resolve("logger");
const logger2 = scope2.resolve("logger");
// logger1 === logger2 (singleton from parent)

scope1.getScopeStats();
// → { scopeId: "SCOPE-1", resolvedServices: 2, scopedInstances: 1, parentScopeId: null }

scope1.dispose();
// → { disposed: true, scopeId: "SCOPE-1", scopedInstancesCleared: 1 }
```

---

## 🧩 PROBLEM–05: 🏗️ Full DI App Orchestrator

⚠️ **Function Name:** `runDIOrchestrator()`

| Input      | `diConfig` (object) |
| :--------- | :------------------ |
| **Output** | object              |

**Rules:**

`diConfig` object:

- `appId` (string, non-empty)
- `services` (array of objects):
  - `name` (string)
  - `lifetime` (string: `"TRANSIENT"`, `"SINGLETON"`, `"SCOPED"`)
  - `dependencies` (array of strings)
  - `factoryResult` (object) — the object the factory should return (simulate factory as `() => factoryResult`)
  - `decorators` (array of objects or null):
    - `addFields` (object) — fields to add to service via decorator
  - `interceptors` (array of objects or null):
    - `methodName` (string)
    - `addToResult` (object) — fields to merge into method's return value
- `resolutions` (array of objects):
  - `resolutionId` (string)
  - `serviceName` (string)
  - `useScope` (boolean) — if true, resolve within a new scope
  - `methodCall` (object or null):
    - `method` (string) — method name to call on resolved service
    - `args` (array) — arguments to pass

**Orchestration Rules (compose all previous concepts):**

1. **Build container** using Problem-02 (dependency resolution) logic
2. **Register all services** with their factories, lifetimes, and dependencies
3. **Apply decorators and interceptors** using Problem-03 logic
4. **Process resolutions** — for each resolution:
   - If `useScope: true` → create a new scope (Problem-04 logic)
   - Resolve the service
   - If `methodCall` provided → call `service[method](...args)`, return result
   - Build resolution log entry
5. **Summary:**
   - `totalServices` → registered service count
   - `totalResolutions` → count
   - `singletonCount` → services with SINGLETON lifetime
   - `dependencyGraph` → from `getDependencyGraph()`

**Validation:** invalid `diConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ appId, resolutionLog, summary }` where `resolutionLog` is array of `{ resolutionId, serviceName, instance, methodCallResult or null, scopeId or null }`. |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runDIOrchestrator({
  appId: "DI-APP-01",
  services: [
    {
      name: "config",
      lifetime: "SINGLETON",
      dependencies: [],
      factoryResult: { env: "production", version: "1.0.0" },
      decorators: null,
      interceptors: null
    },
    {
      name: "logger",
      lifetime: "SINGLETON",
      dependencies: ["config"],
      factoryResult: { level: "info", prefix: "[LOG]" },
      decorators: [{ addFields: { decorated: true } }],
      interceptors: null
    },
    {
      name: "userService",
      lifetime: "TRANSIENT",
      dependencies: ["logger"],
      factoryResult: { getUser: "fn", createUser: "fn" },
      decorators: null,
      interceptors: [{ methodName: "getUser", addToResult: { cached: false } }]
    }
  ],
  resolutions: [
    { resolutionId: "R1", serviceName: "config", useScope: false, methodCall: null },
    { resolutionId: "R2", serviceName: "logger", useScope: false, methodCall: null },
    { resolutionId: "R3", serviceName: "userService", useScope: true, methodCall: null }
  ]
})` →

  **Manual Verify:**
  - config: SINGLETON, no deps → registered
  - logger: SINGLETON, depends on config → decorator adds { decorated: true }
  - userService: TRANSIENT, depends on logger → interceptor on getUser
  - R1: resolve config → { env: "production", version: "1.0.0" }
  - R2: resolve logger → { level: "info", prefix: "[LOG]", decorated: true }
  - R3: resolve userService in new scope (SCOPE-1) → { getUser: "fn", createUser: "fn" }
  - singletonCount: 2 (config, logger)

  `{
  appId: "DI-APP-01",
  resolutionLog: [
    { resolutionId: "R1", serviceName: "config", instance: { env: "production", version: "1.0.0" }, methodCallResult: null, scopeId: null },
    { resolutionId: "R2", serviceName: "logger", instance: { level: "info", prefix: "[LOG]", decorated: true }, methodCallResult: null, scopeId: null },
    { resolutionId: "R3", serviceName: "userService", instance: { getUser: "fn", createUser: "fn" }, methodCallResult: null, scopeId: "SCOPE-1" }
  ],
  summary: {
    totalServices: 3,
    totalResolutions: 3,
    singletonCount: 2,
    dependencyGraph: {
      config: { lifetime: "SINGLETON", dependencies: [] },
      logger: { lifetime: "SINGLETON", dependencies: ["config"] },
      userService: { lifetime: "TRANSIENT", dependencies: ["logger"] }
    }
  }
}`

---