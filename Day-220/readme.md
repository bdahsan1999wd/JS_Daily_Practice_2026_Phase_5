# 🎓 JS DAILY PRACTICE – DAY-220

📅 **Goal:** Module System Simulator (Node.js Core Concepts Simulation)
🎯 **Focus:** Module Registration • Dependency Resolution • Circular Dependency Detection • Lazy Loading • Module Lifecycle

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📦 Basic Module Registry

⚠️ **Function Name:** `createModuleRegistry()`

| Input      | None (factory function)   |
| :--------- | :------------------------ |
| **Output** | object (module registry)  |

**Rules:**

Return a module registry object with these methods:

- `register(moduleData)` — register a new module
- `get(moduleName)` — retrieve a registered module
- `unregister(moduleName)` — remove a module
- `listModules()` — return all registered module names
- `has(moduleName)` — check if module exists

**Module Data Rules:**

`moduleData` object:

- `name` (string, non-empty) — unique module name
- `version` (string, non-empty) — e.g. `"1.0.0"`
- `exports` (object) — the module's exported values
- `dependencies` (array of strings) — names of modules this module depends on

**Operation Rules:**

- `register(moduleData)`:
  - If `name` already registered → `{ registered: false, reason: "Module already exists: " + name }`
  - Else → store module with `{ ...moduleData, registeredAt: "2025-01-01T00:00:00Z", status: "REGISTERED" }`, return `{ registered: true, name, version }`
- `get(moduleName)` → full module object or `{ error: "Module not found: " + moduleName }`
- `unregister(moduleName)` → `{ unregistered: true, name }` or `{ error: "Module not found: " + moduleName }`
- `listModules()` → array of `{ name, version, status }` for all registered modules
- `has(moduleName)` → `{ name: moduleName, exists: true/false }`
- Invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the module registry object maintaining internal state. |
| :----------- | :----------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const registry = createModuleRegistry();

registry.register({
  name: "logger",
  version: "1.0.0",
  exports: { log: "fn", warn: "fn" },
  dependencies: []
});
// → { registered: true, name: "logger", version: "1.0.0" }

registry.register({
  name: "logger",
  version: "2.0.0",
  exports: {},
  dependencies: []
});
// → { registered: false, reason: "Module already exists: logger" }

registry.has("logger");
// → { name: "logger", exists: true }

registry.get("logger");
// → { name: "logger", version: "1.0.0", exports: { log: "fn", warn: "fn" }, dependencies: [], registeredAt: "2025-01-01T00:00:00Z", status: "REGISTERED" }

registry.listModules();
// → [{ name: "logger", version: "1.0.0", status: "REGISTERED" }]

registry.unregister("logger");
// → { unregistered: true, name: "logger" }
```

---

## 🧩 PROBLEM–02: 🔗 Dependency Resolver

⚠️ **Function Name:** `resolveDependencies()`

| Input      | `moduleName` (string), `moduleGraph` (object) |
| :--------- | :-------------------------------------------- |
| **Output** | object                                        |

**Rules:**

`moduleName` — non-empty string, the module to resolve
`moduleGraph` — object where each key is a module name and value is array of its dependency names:

```javascript
{
  "app": ["router", "db"],
  "router": ["logger"],
  "db": ["logger", "config"],
  "logger": [],
  "config": []
}
```

**Resolution Rules:**

- Perform a **topological sort** — return the order modules must be loaded so all dependencies are loaded before the module that needs them
- Only include `moduleName` and its transitive dependencies (not unrelated modules)
- Use DFS (depth-first): resolve each dependency recursively before the current module
- If a module in the graph has a dependency that doesn't exist in `moduleGraph` → add error: `"Missing module: " + depName`
- `loadOrder` → array of module names in correct load order (dependencies first)
- `resolvedCount` → total modules in load order

| Challenge 📢 | Return `{ moduleName, loadOrder, resolvedCount, errors }`. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `resolveDependencies("app", {
  "app": ["router", "db"],
  "router": ["logger"],
  "db": ["logger", "config"],
  "logger": [],
  "config": []
})` →

  `{
  moduleName: "app",
  loadOrder: ["logger", "router", "config", "db", "app"],
  resolvedCount: 5,
  errors: []
}`

---

## 🧩 PROBLEM–03: 🔄 Circular Dependency Detector

⚠️ **Function Name:** `detectCircularDependencies()`

| Input      | `moduleGraph` (object) |
| :--------- | :--------------------- |
| **Output** | object                 |

**Rules:**

`moduleGraph` — object where each key is a module name and value is array of its dependency names

**Detection Rules:**

- Check ALL modules in the graph for circular dependency chains
- A circular dependency exists when a module (directly or transitively) depends on itself
- For each cycle found, record the cycle path: e.g. `["A", "B", "C", "A"]` (repeats start to show the loop)
- Each unique cycle should appear only ONCE (regardless of which node you start from)
- `hasCycles` → true if any cycle found
- `cycles` → array of cycle path arrays
- `safeModules` → array of module names NOT involved in any cycle
- `affectedModules` → array of module names that ARE part of a cycle

| Challenge 📢 | Return `{ hasCycles, cycles, safeModules, affectedModules }`. If invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `detectCircularDependencies({
  "app": ["router", "db"],
  "router": ["logger"],
  "db": ["cache"],
  "cache": ["db"],
  "logger": []
})` →

  `{
  hasCycles: true,
  cycles: [["db", "cache", "db"]],
  safeModules: ["app", "router", "logger"],
  affectedModules: ["db", "cache"]
}`

---

## 🧩 PROBLEM–04: 💤 Lazy Module Loader

⚠️ **Function Name:** `createLazyLoader()`

| Input      | `moduleDefinitions` (array of objects) |
| :--------- | :------------------------------------- |
| **Output** | object (lazy loader)                   |

**Rules:**

`moduleDefinitions` — non-empty array, each:

- `name` (string, non-empty)
- `dependencies` (array of strings)
- `factory` (function) — a zero-arg function that returns the module's exports object

Return a lazy loader object with:

- `load(moduleName)` — load a module and its dependencies on demand
- `isLoaded(moduleName)` — check if module is already in memory
- `getLoadedModules()` — return list of all currently loaded module names
- `unload(moduleName)` — remove module from memory (but keep definition)
- `getLoadStats()` — return loading statistics

**Lazy Loading Rules:**

- Modules are NOT loaded on registration — only when `load(moduleName)` is called
- `load(moduleName)`:
  - If already loaded → return `{ name: moduleName, source: "CACHE", exports: cachedExports }`
  - Else → first load all dependencies (recursively), then call `factory()` to get exports, cache result
  - Returns `{ name: moduleName, source: "LOADED", exports, loadedDependencies: [depNames in load order] }`
  - If module not found in definitions → `{ error: "Module not defined: " + moduleName }`
- `isLoaded(moduleName)` → `{ name: moduleName, loaded: true/false }`
- `getLoadedModules()` → array of module names currently in memory
- `unload(moduleName)` → remove from cache, return `{ name: moduleName, unloaded: true }` or `{ error: "Module not loaded" }`
- `getLoadStats()` → `{ totalDefined, totalLoaded, cacheHitRate: (cacheHits / totalLoadCalls × 100) rounded to 2dp }`

**Validation:** invalid `moduleDefinitions` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the lazy loader object with all 5 methods. |
| :----------- | :------------------------------------------------ |

**Sample Input & Output:**

```javascript
const loader = createLazyLoader([
  { name: "config", dependencies: [], factory: () => ({ env: "production" }) },
  { name: "logger", dependencies: ["config"], factory: () => ({ log: "fn", warn: "fn" }) },
  { name: "app", dependencies: ["logger"], factory: () => ({ start: "fn" }) }
]);

loader.isLoaded("logger");
// → { name: "logger", loaded: false }

loader.load("app");
// Loads: config → logger → app
// → { name: "app", source: "LOADED", exports: { start: "fn" }, loadedDependencies: ["config", "logger"] }

loader.isLoaded("config");
// → { name: "config", loaded: true }  (loaded as dependency of app)

loader.load("logger");
// Already in cache
// → { name: "logger", source: "CACHE", exports: { log: "fn", warn: "fn" } }

loader.getLoadedModules();
// → ["config", "logger", "app"]

loader.getLoadStats();
// totalDefined: 3, totalLoaded: 3, 1 cache hit out of 4 total load calls
// → { totalDefined: 3, totalLoaded: 3, cacheHitRate: 50.00 }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Module System Orchestrator

⚠️ **Function Name:** `runModuleSystemOrchestrator()`

| Input      | `systemConfig` (object) |
| :--------- | :---------------------- |
| **Output** | object                  |

**Rules:**

`systemConfig` object:

- `systemId` (string, non-empty)
- `modules` (array of objects):
  - `name` (string)
  - `version` (string)
  - `dependencies` (array of strings)
  - `exports` (object)
- `entryModule` (string) — the main module to load (resolve its full dependency tree)
- `checkForCycles` (boolean) — if true, run circular dependency detection before loading

**Orchestration Rules (compose all previous concepts):**

1. **Register** all modules into a registry (Problem-01 logic)
2. **Cycle Check** — if `checkForCycles: true`, run Problem-03 logic:
   - If cycles found → stop, return `{ status: "CYCLE_DETECTED", cycles }`
3. **Resolve Dependencies** — run Problem-02 logic for `entryModule` to get `loadOrder`
4. **Lazy Load** — load modules in `loadOrder` using Problem-04 logic (factory returns `exports` from module definition)
5. **Build final report:**
   - `registeredModules` → count of registered modules
   - `loadOrder` → resolved load order for entry module
   - `loadedModules` → names of all modules loaded into memory
   - `cycleCheckResult` → `{ hasCycles, cycles }` or `null` if `checkForCycles: false`

**Validation:** invalid `systemConfig` or missing required fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ systemId, status, registeredModules, loadOrder, loadedModules, cycleCheckResult }`. |
| :----------- | :-------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runModuleSystemOrchestrator({
  systemId: "SYS-01",
  modules: [
    { name: "config", version: "1.0.0", dependencies: [], exports: { env: "production" } },
    { name: "logger", version: "1.2.0", dependencies: ["config"], exports: { log: "fn" } },
    { name: "db", version: "2.0.0", dependencies: ["config", "logger"], exports: { query: "fn" } },
    { name: "app", version: "3.1.0", dependencies: ["logger", "db"], exports: { start: "fn" } }
  ],
  entryModule: "app",
  checkForCycles: true
})` →

  `{
  systemId: "SYS-01",
  status: "SUCCESS",
  registeredModules: 4,
  loadOrder: ["config", "logger", "db", "app"],
  loadedModules: ["config", "logger", "db", "app"],
  cycleCheckResult: {
    hasCycles: false,
    cycles: []
  }
}`

---