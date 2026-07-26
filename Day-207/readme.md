# 🎓 JS DAILY PRACTICE – DAY-207

📅 **Goal:** Async Cache & Memoization Engine (Async JavaScript & Promise Engineering)
🎯 **Focus:** Caching Patterns • Memoization • Cache Invalidation • TTL Logic • async/await

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Use **Promise** or **async/await** where specified.
- If input is invalid → return a **rejected Promise** with `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🗃️ Basic Async Cache

⚠️ **Function Name:** `createAsyncCache()`

| Input      | `fetchFn` (function), `cache` (object) |
| :--------- | :------------------------------------- |
| **Output** | function (returns Promise when called) |

**Rules:**

`fetchFn` — a function that takes a `key` (string) and returns a Promise resolving with some data
`cache` — a plain object used as the cache store (passed in so state is trackable)

**Cache Rules:**

- Return a **wrapper function** that takes a `key` (string)
- When called with a key:
  - If `key` exists in `cache` → return `Promise.resolve({ key, data: cache[key], source: "CACHE" })`
  - If `key` NOT in cache → call `fetchFn(key)`, store result in `cache[key]`, return `{ key, data: result, source: "FETCH" }`
- If `key` is not a non-empty string → return rejected Promise `"Invalid Input"`

| Challenge 📢 | Return the wrapper function. Calling it returns a Promise resolving with `{ key, data, source }`. |
| :----------- | :------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const cache = {};
const fetchFn = (key) => Promise.resolve("data_for_" + key);
const cachedFetch = createAsyncCache(fetchFn, cache);

// First call — cache miss
cachedFetch("user-1");
// → resolves { key: "user-1", data: "data_for_user-1", source: "FETCH" }
// cache is now: { "user-1": "data_for_user-1" }

// Second call — cache hit
cachedFetch("user-1");
// → resolves { key: "user-1", data: "data_for_user-1", source: "CACHE" }
```

---

## 🧩 PROBLEM–02: ⏳ TTL (Time-To-Live) Cache

⚠️ **Function Name:** `createTTLCache()`

| Input      | `fetchFn` (function), `ttlMs` (number)           |
| :--------- | :----------------------------------------------- |
| **Output** | object with `get`, `invalidate`, `stats` methods |

**Rules:**

`fetchFn` — takes `key` (string), returns Promise
`ttlMs` must be number, > 0 — entries expire after this many milliseconds (simulated)

**TTL Cache Rules:**

- Internal store: `{ [key]: { data, storedAtMs, ttlMs } }`
- `get(key, currentTimeMs)` → async method:
  - If key exists AND `currentTimeMs - storedAtMs < ttlMs` → return `{ key, data, source: "CACHE", expired: false }`
  - If key exists BUT expired (`currentTimeMs - storedAtMs >= ttlMs`) → re-fetch, update store, return `{ key, data, source: "REFETCH", expired: true }`
  - If key not found → fetch, store with `storedAtMs: currentTimeMs`, return `{ key, data, source: "FETCH", expired: false }`
- `invalidate(key)` → removes key from store, returns `{ key, invalidated: true }`
- `stats()` → returns `{ totalEntries: count of keys in store }`

| Challenge 📢 | Return object with `{ get, invalidate, stats }` methods. If `ttlMs` invalid → throw `"Invalid Input"` synchronously |
| :----------- | :------------------------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const fetchFn = (key) => Promise.resolve("fresh_data_for_" + key);
const ttlCache = createTTLCache(fetchFn, 1000); // 1000ms TTL

// First fetch at t=0
await ttlCache.get("product-1", 0);
// → { key: "product-1", data: "fresh_data_for_product-1", source: "FETCH", expired: false }

// Cache hit at t=500 (not expired)
await ttlCache.get("product-1", 500);
// → { key: "product-1", data: "fresh_data_for_product-1", source: "CACHE", expired: false }

// Expired at t=1000
await ttlCache.get("product-1", 1000);
// → { key: "product-1", data: "fresh_data_for_product-1", source: "REFETCH", expired: true }
```

---

## 🧩 PROBLEM–03: 🧠 Async Memoizer

⚠️ **Function Name:** `memoizeAsync()`

| Input      | `asyncFn` (async function) |
| :--------- | :------------------------- |
| **Output** | memoized function          |

**Rules:**

`asyncFn` — an async function that takes any number of arguments and returns a Promise

**Memoization Rules:**

- Return a **memoized version** of `asyncFn`
- Cache key = JSON.stringify of the arguments array
- On first call with given args → execute `asyncFn`, store result in cache
- On subsequent calls with same args → return cached result immediately (no re-execution)
- Memoized function also exposes:
  - `.cacheSize()` → returns number of cached entries
  - `.clearCache()` → clears all cached entries, returns `{ cleared: true }`

| Challenge 📢 | Return the memoized function with `.cacheSize()` and `.clearCache()` methods attached. |
| :----------- | :------------------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
let callCount = 0;
const expensiveFn = async (x, y) => {
  callCount++;
  return x + y;
};

const memoized = memoizeAsync(expensiveFn);

await memoized(2, 3); // → 5, callCount=1
await memoized(2, 3); // → 5, callCount still 1 (cache hit)
await memoized(4, 5); // → 9, callCount=2

memoized.cacheSize(); // → 2
memoized.clearCache(); // → { cleared: true }
memoized.cacheSize(); // → 0
```

---

## 🧩 PROBLEM–04: 🔄 Cache-Aside Pattern

⚠️ **Function Name:** `implementCacheAside()`

| Input      | `operations` (array of objects), `cache` (object) |
| :--------- | :------------------------------------------------ |
| **Output** | Promise (async function)                          |

**Rules:**

`operations` — non-empty array, each:

- `type` (string: "READ", "WRITE", "DELETE")
- `key` (string, non-empty)
- `value` (any, only for WRITE)

`cache` — plain object as cache store

**Cache-Aside Rules:**

- **READ:** Check cache first → if hit: `{ key, data: cache[key], source: "CACHE" }`; if miss: simulate DB fetch `"db_value_for_" + key`, store in cache, `{ key, data, source: "DB" }`
- **WRITE:** Write to "DB" (simulated: store as `"written_" + value`), then **invalidate cache** for that key (delete from cache), return `{ key, written: true, cacheInvalidated: true }`
- **DELETE:** Remove from cache AND "DB" (just remove from cache store), return `{ key, deleted: true }`

Process all operations **sequentially** with `async/await`.

| Challenge 📢 | Return Promise resolving with `{ operationLog, finalCacheState }` where `operationLog` is array of each operation's result and `finalCacheState` is the cache object at the end. If invalid → reject `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `implementCacheAside([
  { type: "READ", key: "user-1" },
  { type: "WRITE", key: "user-1", value: "Rahim" },
  { type: "READ", key: "user-1" }
], {})`

→ resolves with:

`{
  operationLog: [
    { key: "user-1", data: "db_value_for_user-1", source: "DB" },
    { key: "user-1", written: true, cacheInvalidated: true },
    { key: "user-1", data: "db_value_for_user-1", source: "DB" }
  ],
  finalCacheState: { "user-1": "db_value_for_user-1" }
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Cache Orchestrator

⚠️ **Function Name:** `runCacheOrchestrator()`

| Input      | `config` (object)        |
| :--------- | :----------------------- |
| **Output** | Promise (async function) |

**Rules:**

`config` object:

- `cacheId` (string, non-empty)
- `keys` (array of strings, non-empty) — keys to fetch
- `ttlMs` (number, > 0)
- `currentTimeMs` (number, ≥ 0)
- `invalidateKeys` (array of strings) — keys to invalidate after fetching

**Orchestration Rules:**

1. **Step 1 — Batch Fetch with TTL Cache:** for each key in `keys`, use TTL cache logic (Problem-02):
   - Simulate `storedAtMs = 0` for all keys already in cache (to test TTL)
   - Use `currentTimeMs` for TTL check
   - `fetchFn(key)` → resolves `"fetched_data_for_" + key`
2. **Step 2 — Invalidate:** remove all keys in `invalidateKeys` from cache
3. **Step 3 — Re-fetch invalidated keys:** fetch the invalidated keys again (they are now cache misses) and return their fresh data
4. **Build summary:**
   - `initialFetchLog` → result of Step 1
   - `invalidatedKeys` → keys that were invalidated
   - `reFetchLog` → result of Step 3

| Challenge 📢 | Return Promise resolving with `{ cacheId, initialFetchLog, invalidatedKeys, reFetchLog }`. If invalid → reject `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runCacheOrchestrator({
  cacheId: "CACHE-01",
  keys: ["k1", "k2", "k3"],
  ttlMs: 1000,
  currentTimeMs: 500,
  invalidateKeys: ["k1", "k3"]
})`

→ resolves with:

`{
  cacheId: "CACHE-01",
  initialFetchLog: [
    { key: "k1", data: "fetched_data_for_k1", source: "FETCH", expired: false },
    { key: "k2", data: "fetched_data_for_k2", source: "FETCH", expired: false },
    { key: "k3", data: "fetched_data_for_k3", source: "FETCH", expired: false }
  ],
  invalidatedKeys: ["k1", "k3"],
  reFetchLog: [
    { key: "k1", data: "fetched_data_for_k1", source: "FETCH", expired: false },
    { key: "k3", data: "fetched_data_for_k3", source: "FETCH", expired: false }
  ]
}`

---
