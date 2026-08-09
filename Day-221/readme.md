# 🎓 JS DAILY PRACTICE – DAY-221

📅 **Goal:** Event-Driven App Simulator (Node.js Core Concepts Simulation)
🎯 **Focus:** Event-Driven Architecture • Request Lifecycle • Middleware Pipeline • Service Communication • App Orchestration

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔁 Request Lifecycle Simulator

⚠️ **Function Name:** `simulateRequestLifecycle()`

| Input      | `request` (object), `lifecycleConfig` (object) |
| :--------- | :--------------------------------------------- |
| **Output** | object                                         |

**Rules:**

`request` object:

- `requestId` (string, non-empty)
- `method` (string: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`)
- `path` (string, non-empty, starts with `"/"`)
- `body` (object or null)
- `headers` (object)

`lifecycleConfig` object:

- `requireAuth` (boolean) — if true, check `headers["Authorization"]` exists
- `validateBody` (boolean) — if true and method is POST/PUT, check `body` is not null
- `logRequest` (boolean) — if true, add a log entry to lifecycle

**Lifecycle Stages (run in order):**

1. **RECEIVED** — request enters the system: `{ stage: "RECEIVED", requestId, method, path }`
2. **AUTH** (if `requireAuth: true`):
   - Header present → `{ stage: "AUTH", status: "PASSED" }`
   - Header missing → `{ stage: "AUTH", status: "FAILED", reason: "Authorization header missing" }` → stop lifecycle
3. **VALIDATION** (if `validateBody: true` and method is `"POST"` or `"PUT"`):
   - Body present → `{ stage: "VALIDATION", status: "PASSED" }`
   - Body null → `{ stage: "VALIDATION", status: "FAILED", reason: "Request body required" }` → stop lifecycle
4. **PROCESSING** — always runs if not stopped: `{ stage: "PROCESSING", status: "COMPLETED", result: "processed_" + requestId }`
5. **LOGGING** (if `logRequest: true`): `{ stage: "LOGGING", logged: true, logMessage: "[INFO] " + method + " " + path + " → COMPLETED" }`

**lifecycleStatus:** `"COMPLETED"` if all stages passed, `"BLOCKED"` if stopped early

| Challenge 📢 | Return `{ requestId, lifecycleStatus, stages: [array of stage objects], stagesCompleted: count }`. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `simulateRequestLifecycle(
  { requestId: "REQ-1", method: "POST", path: "/api/orders", body: { item: "Book" }, headers: { "Authorization": "Bearer token-123" } },
  { requireAuth: true, validateBody: true, logRequest: true }
)` →

  `{
  requestId: "REQ-1",
  lifecycleStatus: "COMPLETED",
  stages: [
    { stage: "RECEIVED", requestId: "REQ-1", method: "POST", path: "/api/orders" },
    { stage: "AUTH", status: "PASSED" },
    { stage: "VALIDATION", status: "PASSED" },
    { stage: "PROCESSING", status: "COMPLETED", result: "processed_REQ-1" },
    { stage: "LOGGING", logged: true, logMessage: "[INFO] POST /api/orders → COMPLETED" }
  ],
  stagesCompleted: 5
}`

- `simulateRequestLifecycle(
  { requestId: "REQ-2", method: "POST", path: "/api/users", body: null, headers: {} },
  { requireAuth: true, validateBody: true, logRequest: true }
)` →

  `{
  requestId: "REQ-2",
  lifecycleStatus: "BLOCKED",
  stages: [
    { stage: "RECEIVED", requestId: "REQ-2", method: "POST", path: "/api/users" },
    { stage: "AUTH", status: "FAILED", reason: "Authorization header missing" }
  ],
  stagesCompleted: 2
}`

---

## 🧩 PROBLEM–02: 📨 Inter-Service Message Bus

⚠️ **Function Name:** `createServiceBus()`

| Input      | `services` (array of objects) |
| :--------- | :---------------------------- |
| **Output** | object (service bus)          |

**Rules:**

`services` — non-empty array, each:

- `serviceId` (string, non-empty)
- `subscribedEvents` (array of strings) — event types this service listens to
- `isOnline` (boolean)

Return a service bus object with:

- `publish(event)` — send an event to all subscribed, online services
- `sendDirect(serviceId, message)` — send a direct message to a specific service
- `getServiceStatus(serviceId)` — return a service's current online status
- `toggleService(serviceId)` — flip a service's `isOnline` status
- `getMessageLog()` — return all messages sent through the bus

**Event Rules:**

`event` object: `{ eventId (string), eventType (string), payload (object) }`

- `publish(event)`:
  - Find all services where `subscribedEvents` includes `eventType` AND `isOnline: true`
  - For each matched service: deliver `{ to: serviceId, eventId, eventType, payload, delivered: true }`
  - Offline matching services: `{ to: serviceId, eventId, eventType, delivered: false, reason: "Service offline" }`
  - Returns `{ eventId, eventType, deliveredCount, failedCount, deliveryLog }`

- `sendDirect(serviceId, message)`:
  - `message`: `{ messageId (string), content (any) }`
  - If service not found → `{ error: "Service not found: " + serviceId }`
  - If service offline → `{ messageId, delivered: false, reason: "Service offline" }`
  - If online → `{ messageId, delivered: true, to: serviceId }`

- `getServiceStatus(serviceId)` → `{ serviceId, isOnline }` or `{ error: "Service not found" }`
- `toggleService(serviceId)` → `{ serviceId, isOnline: newStatus }` or `{ error: "Service not found" }`
- `getMessageLog()` → array of all delivery records (from both publish and sendDirect)

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the service bus object maintaining internal state. |
| :----------- | :------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const bus = createServiceBus([
  { serviceId: "order-service", subscribedEvents: ["payment.success", "payment.failed"], isOnline: true },
  { serviceId: "email-service", subscribedEvents: ["payment.success", "order.created"], isOnline: true },
  { serviceId: "sms-service", subscribedEvents: ["payment.success"], isOnline: false }
]);

bus.publish({ eventId: "EVT-1", eventType: "payment.success", payload: { amount: 500 } });
// order-service: online + subscribed → delivered
// email-service: online + subscribed → delivered
// sms-service: subscribed but OFFLINE → failed
// → { eventId: "EVT-1", eventType: "payment.success", deliveredCount: 2, failedCount: 1,
//     deliveryLog: [
//       { to: "order-service", eventId: "EVT-1", eventType: "payment.success", payload: { amount: 500 }, delivered: true },
//       { to: "email-service", eventId: "EVT-1", eventType: "payment.success", payload: { amount: 500 }, delivered: true },
//       { to: "sms-service", eventId: "EVT-1", eventType: "payment.success", delivered: false, reason: "Service offline" }
//     ] }

bus.toggleService("sms-service");
// → { serviceId: "sms-service", isOnline: true }

bus.sendDirect("sms-service", { messageId: "MSG-1", content: "Payment confirmed" });
// → { messageId: "MSG-1", delivered: true, to: "sms-service" }
```

---

## 🧩 PROBLEM–03: 🔀 Event-Driven State Machine

⚠️ **Function Name:** `createStateMachine()`

| Input      | `machineConfig` (object) |
| :--------- | :----------------------- |
| **Output** | object (state machine)   |

**Rules:**

`machineConfig` object:

- `machineId` (string, non-empty)
- `initialState` (string, non-empty)
- `transitions` (array of objects):
  - `from` (string) — source state
  - `event` (string) — event that triggers this transition
  - `to` (string) — target state
  - `action` (string) — description of action taken on transition

Return a state machine object with:

- `dispatch(event)` — trigger a state transition
- `getCurrentState()` — return current state
- `getHistory()` — return full transition history
- `canTransition(event)` — check if event is valid from current state
- `reset()` — return to `initialState`, clear history

**Transition Rules:**

- `dispatch(event)`:
  - Find a transition where `from === currentState` AND `event === event`
  - If found → transition to `to` state, log `{ from, event, to, action, transitionedAt: "2025-01-01T00:00:00Z" }`
  - Returns `{ dispatched: true, from, to, action }` or `{ dispatched: false, reason: "No valid transition for event '" + event + "' from state '" + currentState + "'" }`
- `getCurrentState()` → `{ machineId, currentState, totalTransitions: history.length }`
- `getHistory()` → array of all transition log objects
- `canTransition(event)` → `{ event, canTransition: true/false, targetState: to or null }`
- `reset()` → `{ reset: true, state: initialState }`

**Validation:** invalid `machineConfig` → return `"Invalid Input"` from factory. Method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the state machine object with all 5 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const machine = createStateMachine({
  machineId: "order-fsm",
  initialState: "PENDING",
  transitions: [
    { from: "PENDING", event: "PAY", to: "PAID", action: "Process payment" },
    { from: "PENDING", event: "CANCEL", to: "CANCELLED", action: "Cancel order" },
    { from: "PAID", event: "SHIP", to: "SHIPPED", action: "Ship order" },
    { from: "SHIPPED", event: "DELIVER", to: "DELIVERED", action: "Mark delivered" }
  ]
});

machine.getCurrentState();
// → { machineId: "order-fsm", currentState: "PENDING", totalTransitions: 0 }

machine.canTransition("PAY");
// → { event: "PAY", canTransition: true, targetState: "PAID" }

machine.dispatch("PAY");
// → { dispatched: true, from: "PENDING", to: "PAID", action: "Process payment" }

machine.dispatch("CANCEL");
// No transition from PAID for CANCEL
// → { dispatched: false, reason: "No valid transition for event 'CANCEL' from state 'PAID'" }

machine.dispatch("SHIP");
// → { dispatched: true, from: "PAID", to: "SHIPPED", action: "Ship order" }

machine.getHistory();
// → [
//   { from: "PENDING", event: "PAY", to: "PAID", action: "Process payment", transitionedAt: "2025-01-01T00:00:00Z" },
//   { from: "PAID", event: "SHIP", to: "SHIPPED", action: "Ship order", transitionedAt: "2025-01-01T00:00:00Z" }
// ]

machine.reset();
// → { reset: true, state: "PENDING" }
```

---

## 🧩 PROBLEM–04: 🔌 Plugin System Simulator

⚠️ **Function Name:** `createPluginSystem()`

| Input      | `appConfig` (object)    |
| :--------- | :---------------------- |
| **Output** | object (plugin system)  |

**Rules:**

`appConfig` object:

- `appId` (string, non-empty)
- `hooks` (array of strings) — available hook points (e.g. `["onRequest", "onResponse", "onError"]`)

Return a plugin system object with:

- `registerPlugin(pluginData)` — register a plugin with its hook handlers
- `unregisterPlugin(pluginId)` — remove a plugin
- `executeHook(hookName, context)` — run all plugins registered for a hook in order
- `listPlugins()` — return all registered plugins
- `getHookReport()` — return stats for each hook

**Plugin Data Rules:**

`pluginData` object:

- `pluginId` (string, non-empty)
- `name` (string, non-empty)
- `priority` (number, integer, 1–10) — higher priority runs first
- `hooks` (object) — keys are hook names, values are handler descriptions (strings like `"fn:logRequest"`)
  - Only register handlers for hooks that exist in `appConfig.hooks`

**Operation Rules:**

- `registerPlugin(pluginData)`:
  - If `pluginId` already registered → `{ registered: false, reason: "Plugin already exists: " + pluginId }`
  - Filter `hooks` to only valid hook names → store plugin
  - Returns `{ registered: true, pluginId, registeredHooks: [array of valid hook names] }`

- `executeHook(hookName, context)`:
  - If `hookName` not in `appConfig.hooks` → `{ error: "Unknown hook: " + hookName }`
  - Find all plugins with a handler for `hookName`, sort by `priority` descending
  - For each plugin (in order): simulate execution → `{ pluginId, hookName, status: "EXECUTED", context }`
  - Returns `{ hookName, context, executionLog: [{ pluginId, priority, status }], executedCount }`

- `listPlugins()` → array of `{ pluginId, name, priority, registeredHooks }`
- `getHookReport()` → object: each hook name → `{ subscribedPlugins: count, pluginIds: [array] }`
- `unregisterPlugin(pluginId)` → `{ unregistered: true, pluginId }` or `{ error: "Plugin not found" }`

**Validation:** invalid `appConfig` → return `"Invalid Input"` from factory. Method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the plugin system object with all 5 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const ps = createPluginSystem({
  appId: "my-app",
  hooks: ["onRequest", "onResponse", "onError"]
});

ps.registerPlugin({
  pluginId: "P-1",
  name: "AuthPlugin",
  priority: 9,
  hooks: { onRequest: "fn:checkAuth", onError: "fn:logError" }
});
// → { registered: true, pluginId: "P-1", registeredHooks: ["onRequest", "onError"] }

ps.registerPlugin({
  pluginId: "P-2",
  name: "LoggerPlugin",
  priority: 5,
  hooks: { onRequest: "fn:logRequest", onResponse: "fn:logResponse", onUnknown: "fn:x" }
});
// onUnknown is not a valid hook → filtered out
// → { registered: true, pluginId: "P-2", registeredHooks: ["onRequest", "onResponse"] }

ps.executeHook("onRequest", { path: "/api/users" });
// P-1(priority 9) runs first, then P-2(priority 5)
// → {
//   hookName: "onRequest",
//   context: { path: "/api/users" },
//   executionLog: [
//     { pluginId: "P-1", priority: 9, status: "EXECUTED" },
//     { pluginId: "P-2", priority: 5, status: "EXECUTED" }
//   ],
//   executedCount: 2
// }

ps.getHookReport();
// → {
//   onRequest: { subscribedPlugins: 2, pluginIds: ["P-1", "P-2"] },
//   onResponse: { subscribedPlugins: 1, pluginIds: ["P-2"] },
//   onError: { subscribedPlugins: 1, pluginIds: ["P-1"] }
// }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Event-Driven App Orchestrator

⚠️ **Function Name:** `runEventDrivenAppOrchestrator()`

| Input      | `appBlueprint` (object) |
| :--------- | :---------------------- |
| **Output** | object                  |

**Rules:**

`appBlueprint` object:

- `appId` (string, non-empty)
- `services` (array of objects: `{ serviceId, subscribedEvents, isOnline }`) — for service bus
- `stateMachine` (object: `{ initialState, transitions }`) — for FSM
- `plugins` (array of objects: `{ pluginId, name, priority, hooks }`) — for plugin system
- `availableHooks` (array of strings) — hook names for plugin system
- `incomingRequests` (array of objects: `{ requestId, method, path, body, headers, eventType, payload }`)

**Orchestration Rules (compose all previous concepts):**

1. **Setup Service Bus** (Problem-02) — register all services
2. **Setup State Machine** (Problem-03) — initialize FSM with `stateMachine` config
3. **Setup Plugin System** (Problem-04) — register all plugins with `availableHooks`
4. **Process Each Request** in order:
   - Run request lifecycle (Problem-01): `requireAuth: true`, `validateBody: true`, `logRequest: true`
   - If lifecycle COMPLETED:
     - Execute `"onRequest"` hook on plugin system
     - Publish event `{ eventId: requestId, eventType, payload }` on service bus
     - Dispatch `eventType` as FSM event (if valid transition exists)
     - Execute `"onResponse"` hook on plugin system
   - If lifecycle BLOCKED:
     - Execute `"onError"` hook on plugin system
5. **Build final summary:**
   - `totalRequests` → count
   - `completedRequests` → lifecycle COMPLETED count
   - `blockedRequests` → lifecycle BLOCKED count
   - `finalFSMState` → current state machine state after all requests
   - `totalEventsPublished` → total events sent to service bus
   - `pluginExecutions` → total times any plugin hook was executed

**Validation:** invalid `appBlueprint` or missing required fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ appId, totalRequests, completedRequests, blockedRequests, finalFSMState, totalEventsPublished, pluginExecutions }`. |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runEventDrivenAppOrchestrator({
  appId: "APP-01",
  services: [
    { serviceId: "order-service", subscribedEvents: ["PAY"], isOnline: true },
    { serviceId: "email-service", subscribedEvents: ["PAY", "SHIP"], isOnline: true }
  ],
  stateMachine: {
    initialState: "PENDING",
    transitions: [
      { from: "PENDING", event: "PAY", to: "PAID", action: "Process payment" },
      { from: "PAID", event: "SHIP", to: "SHIPPED", action: "Ship order" }
    ]
  },
  plugins: [
    { pluginId: "P-1", name: "LoggerPlugin", priority: 8, hooks: { onRequest: "fn:log", onResponse: "fn:log", onError: "fn:logError" } }
  ],
  availableHooks: ["onRequest", "onResponse", "onError"],
  incomingRequests: [
    { requestId: "REQ-1", method: "POST", path: "/pay", body: { amount: 500 }, headers: { "Authorization": "Bearer t1" }, eventType: "PAY", payload: { amount: 500 } },
    { requestId: "REQ-2", method: "POST", path: "/ship", body: null, headers: {}, eventType: "SHIP", payload: { trackingId: "TRK-1" } }
  ]
})` →

  `{
  appId: "APP-01",
  totalRequests: 2,
  completedRequests: 1,
  blockedRequests: 1,
  finalFSMState: "PAID",
  totalEventsPublished: 1,
  pluginExecutions: 3
}`

---