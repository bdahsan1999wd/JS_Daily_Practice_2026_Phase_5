# 🎓 JS DAILY PRACTICE – DAY-215

📅 **Goal:** Event Bus System (Node.js Core Concepts Simulation)
🎯 **Focus:** Event Emitter Pattern • Subscribe / Publish • Wildcard Events • One-Time Listeners • Event Queue

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📡 Basic Event Bus (Subscribe & Publish)

⚠️ **Function Name:** `createEventBus()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (event bus)      |

**Rules:**

Return an event bus object with these methods:

- `subscribe(eventName, listenerId, handlerFn)` — register a listener
- `publish(eventName, payload)` — emit an event to all subscribers
- `unsubscribe(eventName, listenerId)` — remove a specific listener
- `getListeners(eventName)` — return array of listenerIds for that event

**Validation Rules:**

- `eventName` must be non-empty string
- `listenerId` must be non-empty string
- `handlerFn` must be a function
- Duplicate `listenerId` on same `eventName` → overwrite (update handler)

**Subscribe / Publish Rules:**

- `subscribe(eventName, listenerId, handlerFn)` → returns `{ subscribed: true, eventName, listenerId }`
- `publish(eventName, payload)` → calls ALL registered handlers for that event with `payload`, returns `{ eventName, payload, listenersNotified: count }`
  - If no listeners → `listenersNotified: 0`
- `unsubscribe(eventName, listenerId)` → returns `{ unsubscribed: true, eventName, listenerId }` or `{ unsubscribed: false, reason: "Listener not found" }`
- `getListeners(eventName)` → returns array of `listenerId` strings (empty array if none)
- If any method receives invalid input → return `"Invalid Input"`

| Challenge 📢 | Return the event bus object. Each method should work independently and maintain internal state. |
| :----------- | :---------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const bus = createEventBus();

bus.subscribe("user.created", "L-1", (payload) => payload);
bus.subscribe("user.created", "L-2", (payload) => payload);

bus.publish("user.created", { userId: "U1" });
// → { eventName: "user.created", payload: { userId: "U1" }, listenersNotified: 2 }

bus.getListeners("user.created");
// → ["L-1", "L-2"]

bus.unsubscribe("user.created", "L-1");
// → { unsubscribed: true, eventName: "user.created", listenerId: "L-1" }

bus.getListeners("user.created");
// → ["L-2"]
```

---

## 🧩 PROBLEM–02: 🔂 One-Time Event Listener

⚠️ **Function Name:** `createOneTimeBus()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (event bus)      |

**Rules:**

Extend the basic event bus concept — return object with:

- `once(eventName, listenerId, handlerFn)` — register a listener that fires ONLY ONCE then auto-removes
- `on(eventName, listenerId, handlerFn)` — regular persistent listener
- `emit(eventName, payload)` — fire all matching listeners
- `listenerCount(eventName)` — return count of active listeners for that event

**One-Time Rules:**

- `once` listeners auto-remove after their FIRST invocation
- `on` listeners persist until manually removed (no `off` method needed in this problem)
- `emit` → calls all matching handlers (both `once` and `on`), then removes spent `once` listeners
- Returns `{ eventName, payload, firedCount, removedOneTimeListeners: count }`

**Validation:** same as Problem-01 — non-empty strings, handler must be function. Invalid → return `"Invalid Input"`

| Challenge 📢 | Return the bus object with `once`, `on`, `emit`, `listenerCount` methods. |
| :----------- | :------------------------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const bus = createOneTimeBus();

bus.on("order.placed", "persistent-L", (p) => p);
bus.once("order.placed", "one-time-L", (p) => p);

bus.listenerCount("order.placed"); // → 2

bus.emit("order.placed", { orderId: "O1" });
// → { eventName: "order.placed", payload: { orderId: "O1" }, firedCount: 2, removedOneTimeListeners: 1 }

bus.listenerCount("order.placed"); // → 1 (one-time-L removed)

bus.emit("order.placed", { orderId: "O2" });
// → { eventName: "order.placed", payload: { orderId: "O2" }, firedCount: 1, removedOneTimeListeners: 0 }
```

---

## 🧩 PROBLEM–03: 🌐 Wildcard Event Bus

⚠️ **Function Name:** `createWildcardBus()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (event bus)      |

**Rules:**

Return event bus object with:

- `subscribe(pattern, listenerId, handlerFn)` — `pattern` may be exact (`"user.created"`) or wildcard (`"user.*"` or `"*"`)
- `publish(eventName, payload)` — match against ALL registered patterns
- `getMatchedListeners(eventName)` — return listenerIds that would match the given eventName

**Wildcard Matching Rules:**

- `"*"` → matches ALL event names
- `"user.*"` → matches any event starting with `"user."` (e.g. `"user.created"`, `"user.deleted"`)
- `"*.created"` → matches any event ending with `".created"` (e.g. `"user.created"`, `"order.created"`)
- Exact match → only matches that exact event name
- A listener can match via multiple patterns — call it ONCE per publish (deduplicate by listenerId)

**publish** → returns `{ eventName, payload, matchedListeners: count }`

**Validation:** `eventName`/`pattern` must be non-empty string, `listenerId` non-empty string, `handlerFn` function. Invalid → return `"Invalid Input"`

| Challenge 📢 | Return the wildcard bus object with `subscribe`, `publish`, `getMatchedListeners` methods. |
| :----------- | :----------------------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const bus = createWildcardBus();

bus.subscribe("user.*", "L-1", (p) => p);
bus.subscribe("*.created", "L-2", (p) => p);
bus.subscribe("order.shipped", "L-3", (p) => p);
bus.subscribe("*", "L-4", (p) => p);

bus.getMatchedListeners("user.created");
// → ["L-1", "L-2", "L-4"]  (L-3 doesn't match "user.created")

bus.publish("user.created", { userId: "U1" });
// → { eventName: "user.created", payload: { userId: "U1" }, matchedListeners: 3 }

bus.publish("order.shipped", { orderId: "O1" });
// → { eventName: "order.shipped", payload: { orderId: "O1" }, matchedListeners: 2 }
// (L-3 exact match + L-4 wildcard "*")
```

---

## 🧩 PROBLEM–04: 📋 Event History & Replay Bus

⚠️ **Function Name:** `createReplayBus()`

| Input      | `maxHistorySize` (number) |
| :--------- | :------------------------ |
| **Output** | object (event bus)        |

**Rules:**

`maxHistorySize` must be integer, ≥ 1 — max number of past events to keep in history

Return event bus object with:

- `subscribe(eventName, listenerId, handlerFn)` — register listener
- `publish(eventName, payload)` — emit event AND record in history
- `replay(eventName, listenerId)` — re-deliver ALL past events matching `eventName` to a specific listener
- `getHistory(eventName)` — return array of past events for that eventName (or all if `eventName` is `"*"`)
- `clearHistory()` — wipe all history, return `{ cleared: true, eventsRemoved: count }`

**History Rules:**

- History is stored as array of `{ eventId: "EVT-" + autoIndex, eventName, payload, publishedAt: "2025-01-01T00:00:00Z" }`
- `autoIndex` starts at 1 and increments with each publish
- When history exceeds `maxHistorySize` → drop the OLDEST entry (FIFO)
- `replay(eventName, listenerId)`:
  - Find listener's handler by `listenerId`
  - Call handler for each matching historical event
  - Returns `{ listenerId, eventName, replayed: count }`
  - If listener not found → return `{ replayed: 0, reason: "Listener not found" }`

**Validation:** `maxHistorySize` invalid → return `"Invalid Input"` from factory. Method-level invalid input → return `"Invalid Input"`

| Challenge 📢 | Return the replay bus object with `subscribe`, `publish`, `replay`, `getHistory`, `clearHistory` methods. |
| :----------- | :-------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const bus = createReplayBus(3);

bus.subscribe("user.created", "L-1", (p) => p);

bus.publish("user.created", { userId: "U1" });
bus.publish("user.created", { userId: "U2" });
bus.publish("order.placed", { orderId: "O1" });

bus.getHistory("user.created");
// → [
//   { eventId: "EVT-1", eventName: "user.created", payload: { userId: "U1" }, publishedAt: "2025-01-01T00:00:00Z" },
//   { eventId: "EVT-2", eventName: "user.created", payload: { userId: "U2" }, publishedAt: "2025-01-01T00:00:00Z" }
// ]

bus.replay("user.created", "L-1");
// → { listenerId: "L-1", eventName: "user.created", replayed: 2 }

bus.clearHistory();
// → { cleared: true, eventsRemoved: 3 }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Event Bus Orchestrator

⚠️ **Function Name:** `runEventBusOrchestrator()`

| Input      | `busConfig` (object) |
| :--------- | :------------------- |
| **Output** | object               |

**Rules:**

`busConfig` object:

- `busId` (string, non-empty)
- `maxHistorySize` (number, integer, ≥ 1)
- `subscriptions` (array of objects):
  - `listenerId` (string)
  - `pattern` (string) — supports wildcards (like Problem-03)
  - `isOneTime` (boolean) — if true, auto-remove after first fire
- `eventsToPublish` (array of objects):
  - `eventName` (string)
  - `payload` (object)

**Orchestration Rules (compose all previous concepts):**

1. **Setup Bus** with `maxHistorySize` (Problem-04 history tracking)
2. **Register Subscriptions** — use `once` for `isOneTime: true`, `on` for `isOneTime: false`; support wildcard patterns (Problem-03)
3. **Publish Events** in order — each publish records history, matches wildcard patterns, respects one-time listeners
4. **Build Summary** after all events:
   - `totalPublished` → total events published
   - `totalListenerFires` → total times any handler was called across all publishes
   - `oneTimeListenersRemoved` → count of one-time listeners that auto-removed
   - `historySnapshot` → `getHistory("*")` — all recorded events

**Validation:** invalid `busConfig` or any required field missing → return `"Invalid Input"`

| Challenge 📢 | Return `{ busId, totalPublished, totalListenerFires, oneTimeListenersRemoved, historySnapshot }`. |
| :----------- | :------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `runEventBusOrchestrator({
  busId: "BUS-01",
  maxHistorySize: 10,
  subscriptions: [
    { listenerId: "L-1", pattern: "user.*", isOneTime: false },
    { listenerId: "L-2", pattern: "*.created", isOneTime: true },
    { listenerId: "L-3", pattern: "*", isOneTime: false }
  ],
  eventsToPublish: [
    { eventName: "user.created", payload: { userId: "U1" } },
    { eventName: "user.deleted", payload: { userId: "U2" } },
    { eventName: "order.created", payload: { orderId: "O1" } }
  ]
})` → resolves with:

  `{
  busId: "BUS-01",
  totalPublished: 3,
  totalListenerFires: 6,
  oneTimeListenersRemoved: 1,
  historySnapshot: [
    { eventId: "EVT-1", eventName: "user.created", payload: { userId: "U1" }, publishedAt: "2025-01-01T00:00:00Z" },
    { eventId: "EVT-2", eventName: "user.deleted", payload: { userId: "U2" }, publishedAt: "2025-01-01T00:00:00Z" },
    { eventId: "EVT-3", eventName: "order.created", payload: { orderId: "O1" }, publishedAt: "2025-01-01T00:00:00Z" }
  ]
}`

---
