# 🎓 JS DAILY PRACTICE – DAY-236

📅 **Goal:** In-Memory DB Engine (Database Query Simulation)
🎯 **Focus:** Collection Management • CRUD Operations • Indexing • Query Operators • DB Lifecycle

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🗄️ Collection Manager

⚠️ **Function Name:** `createInMemoryDB()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (in-memory DB)   |

**Rules:**

Return an in-memory DB object with these methods:

- `createCollection(name)` — create a new collection
- `dropCollection(name)` — remove a collection and all its documents
- `listCollections()` — return all collection names
- `getCollection(name)` — return a collection object with CRUD methods
- `getDBStats()` — return stats about the entire DB

**Collection Object (returned by `getCollection`):**

Each collection has:

- `insert(doc)` — insert a document, auto-generate `_id: "col_" + autoIndex`
- `findById(id)` — find by `_id`
- `findAll()` — return all documents
- `update(id, updates)` — merge updates into existing document
- `delete(id)` — remove document
- `count()` — return document count

**Operation Rules:**

- `createCollection(name)`:
  - `name` must be non-empty string
  - If already exists → `{ created: false, reason: "Collection already exists: " + name }`
  - Else → `{ created: true, name }`

- `dropCollection(name)` → `{ dropped: true, name, documentsRemoved: count }` or `{ error: "Collection not found: " + name }`
- `listCollections()` → array of `{ name, documentCount }`
- `getCollection(name)` → collection object or `{ error: "Collection not found: " + name }`

- **Collection insert(doc)**:
  - `doc` must be non-null object
  - Auto-generate `_id`
  - Returns `{ inserted: true, doc: { _id, ...doc } }`

- **Collection findById(id)** → `{ found: true, doc }` or `{ found: false, _id: id }`
- **Collection update(id, updates)** → `{ updated: true, doc: mergedDoc }` or `{ error: "Document not found" }`
- **Collection delete(id)** → `{ deleted: true, _id: id }` or `{ error: "Document not found" }`
- **Collection count()** → number
- **Collection findAll()** → array of all documents

- `getDBStats()` → `{ totalCollections, totalDocuments, collections: { name: count } }`

**Validation:** method-level invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the in-memory DB object maintaining full internal state. |
| :----------- | :-------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const db = createInMemoryDB();

db.createCollection("users");
// → { created: true, name: "users" }

db.createCollection("users");
// → { created: false, reason: "Collection already exists: users" }

const users = db.getCollection("users");

users.insert({ name: "Rahim", age: 25 });
// → { inserted: true, doc: { _id: "users_1", name: "Rahim", age: 25 } }

users.insert({ name: "Karim", age: 30 });
// → { inserted: true, doc: { _id: "users_2", name: "Karim", age: 30 } }

users.findById("users_1");
// → { found: true, doc: { _id: "users_1", name: "Rahim", age: 25 } }

users.update("users_1", { age: 26 });
// → { updated: true, doc: { _id: "users_1", name: "Rahim", age: 26 } }

users.count(); // → 2

db.getDBStats();
// → { totalCollections: 1, totalDocuments: 2, collections: { users: 2 } }

db.dropCollection("users");
// → { dropped: true, name: "users", documentsRemoved: 2 }
```

---

## 🧩 PROBLEM–02: 🔍 Query Engine

⚠️ **Function Name:** `createQueryEngine()`

| Input      | `collection` (array of objects) |
| :--------- | :------------------------------ |
| **Output** | object (query engine)           |

**Rules:**

`collection` — non-empty array of document objects (each has `_id` field)

Return a query engine object with:

- `find(query)` — find documents matching a query object
- `findOne(query)` — return first matching document
- `count(query)` — count matching documents
- `distinct(field)` — return unique values for a field

**Query Operators:**

`query` is an object where each key is a field name and value can be:

- **Exact value** → `{ name: "Rahim" }` — strict equality
- **`$gt`** → `{ age: { $gt: 18 } }` — greater than
- **`$gte`** → greater than or equal
- **`$lt`** → less than
- **`$lte`** → less than or equal
- **`$ne`** → not equal
- **`$in`** → `{ role: { $in: ["ADMIN", "MOD"] } }` — value in array
- **`$nin`** → value NOT in array
- **`$contains`** → `{ name: { $contains: "ah" } }` — string contains substring (case-insensitive)
- **`$exists`** → `{ email: { $exists: true } }` — field exists (or not)

Multiple fields in query → AND logic (all conditions must match)

- `find(query)` → `{ docs: [matching documents], count }`
- `findOne(query)` → `{ doc: first match or null }`
- `count(query)` → number
- `distinct(field)` → `{ field, values: [unique values sorted], count }`

**Validation:** invalid `collection` → return `"Invalid Input"` from factory. Method invalid → return `"Invalid Input"`

| Challenge 📢 | Return the query engine object with all 4 methods. |
| :----------- | :------------------------------------------------- |

**Sample Input & Output:**

```javascript
const engine = createQueryEngine([
  { _id: "1", name: "Rahim", age: 25, role: "ADMIN", active: true },
  { _id: "2", name: "Karim", age: 17, role: "USER", active: true },
  { _id: "3", name: "Nadia", age: 30, role: "MOD", active: false },
  { _id: "4", name: "Sadia", age: 22, role: "USER", active: true },
]);

engine.find({ age: { $gte: 18 }, active: true });
// → { docs: [{ _id: "1", ... }, { _id: "4", ... }], count: 2 }

engine.find({ role: { $in: ["ADMIN", "MOD"] } });
// → { docs: [{ _id: "1", ... }, { _id: "3", ... }], count: 2 }

engine.find({ name: { $contains: "ah" } });
// → { docs: [{ _id: "1", name: "Rahim"... }, { _id: "3", name: "Nadia"... }], count: 2 }

engine.findOne({ role: "USER", active: true });
// → { doc: { _id: "2", name: "Karim", age: 17, role: "USER", active: true } }

engine.count({ active: false });
// → 1

engine.distinct("role");
// → { field: "role", values: ["ADMIN", "MOD", "USER"], count: 3 }
```

---

## 🧩 PROBLEM–03: 📊 Sort, Projection & Pagination

⚠️ **Function Name:** `createAdvancedQuery()`

| Input      | `collection` (array of objects) |
| :--------- | :------------------------------ |
| **Output** | object (advanced query)         |

**Rules:**

`collection` — non-empty array of document objects

Return an advanced query object with:

- `query(options)` — run a full query with filter + sort + project + paginate
- `aggregate(pipeline)` — run a simple aggregation pipeline

**`query(options)` Options:**

- `filter` (object or null) — same query operators as Problem-02
- `sort` (object or null) — `{ fieldName: 1 or -1 }` (1 = asc, -1 = desc), one field only
- `project` (array of strings or null) — fields to INCLUDE in output (always include `_id`)
- `skip` (number, ≥ 0) — documents to skip
- `limit` (number, ≥ 1 or null) — max documents to return

Returns `{ docs, totalMatched, returned, skip, limit }`

**`aggregate(pipeline)` — array of stage objects:**

- `{ $match: query }` — filter documents (same as `find`)
- `{ $group: { _id: field, count: { $sum: 1 }, total: { $sum: fieldName } } }` — group by field
- `{ $sort: { field: 1 or -1 } }` — sort
- `{ $limit: N }` — limit results
- `{ $project: { field: 1 } }` — include/exclude fields

Returns `{ result: array of output documents, stages: count }`

**Validation:** invalid `collection` → return `"Invalid Input"` from factory. Method invalid → return `"Invalid Input"`

| Challenge 📢 | Return the advanced query object with `query` and `aggregate` methods. |
| :----------- | :--------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const aq = createAdvancedQuery([
  { _id: "1", name: "Rahim", age: 25, dept: "IT", salary: 70000 },
  { _id: "2", name: "Karim", age: 30, dept: "HR", salary: 50000 },
  { _id: "3", name: "Nadia", age: 22, dept: "IT", salary: 80000 },
  { _id: "4", name: "Sadia", age: 28, dept: "HR", salary: 60000 },
  { _id: "5", name: "Rafiq", age: 35, dept: "IT", salary: 90000 },
]);

aq.query({
  filter: { dept: "IT" },
  sort: { salary: -1 },
  project: ["name", "salary"],
  skip: 0,
  limit: 2,
});
// Filter: IT dept (3 docs) → Sort by salary desc → Project name+_id+salary → Skip 0, Limit 2 →

// {
//   docs: [{ _id: "5", name: "Rafiq", salary: 90000 }, { _id: "3", name: "Nadia", salary: 80000 }],
//   totalMatched: 3, returned: 2, skip: 0, limit: 2
// }

aq.aggregate([
  { $match: { dept: "IT" } },
  { $group: { _id: "dept", count: { $sum: 1 }, total: { $sum: "salary" } } },
  { $sort: { total: -1 } },
]);
// IT dept: 3 docs, total salary = 70000+80000+90000 = 240000 →

// { result: [{ _id: "IT", count: 3, total: 240000 }], stages: 3 }
```

---

## 🧩 PROBLEM–04: 🔐 DB Transaction Simulator

⚠️ **Function Name:** `createTransactionalDB()`

| Input      | None (factory function)   |
| :--------- | :------------------------ |
| **Output** | object (transactional DB) |

**Rules:**

Return a transactional DB object — extends the in-memory DB (Problem-01) with:

- `createCollection(name)` — same as Problem-01
- `getCollection(name)` — same as Problem-01
- `beginTransaction()` — start a transaction
- `commit()` — commit all pending changes
- `rollback()` — undo all changes since `beginTransaction`
- `runTransaction(operationsFn)` — execute operations atomically
- `getTransactionLog()` — return history of all transactions

**Transaction Rules:**

- `beginTransaction()`:
  - Snapshot current state of ALL collections
  - Returns `{ txnId: "TXN-" + autoIndex, started: true }`
  - If already in transaction → `{ error: "Transaction already active" }`

- `commit()`:
  - If no active transaction → `{ error: "No active transaction" }`
  - Clear snapshot, return `{ txnId, committed: true, operationsCount }`
  - Track how many insert/update/delete happened since beginTransaction

- `rollback()`:
  - Restore all collections to snapshot
  - Returns `{ txnId, rolledBack: true, operationsUndone: count }`

- `runTransaction(operationsFn)`:
  - Auto begin → run `operationsFn(db)` → if throws or returns `{ abort: true }` → rollback, else → commit
  - Returns `{ txnId, committed: boolean, rolledBack: boolean, result }`

- `getTransactionLog()` → array of `{ txnId, status: "COMMITTED" or "ROLLED_BACK", operationsCount, timestamp: "2025-01-01T00:00:00Z" }`

**Validation:** method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the transactional DB object with all 7 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const tdb = createTransactionalDB();
tdb.createCollection("accounts");
const accounts = tdb.getCollection("accounts");
accounts.insert({ _id: "A1", owner: "Rahim", balance: 1000 });

tdb.beginTransaction();
// → { txnId: "TXN-1", started: true }

accounts.update("A1", { balance: 500 });
accounts.insert({ _id: "A2", owner: "Karim", balance: 2000 });

accounts.findById("A1");
// Within transaction: →
// { found: true, doc: { _id: "A1", balance: 500 } }

tdb.rollback();
// → { txnId: "TXN-1", rolledBack: true, operationsUndone: 2 }

accounts.findById("A1");
// After rollback: balance restored →

// { found: true, doc: { _id: "A1", owner: "Rahim", balance: 1000 } }

accounts.count(); // → 1 (A2 insertion was rolled back)

// Atomic transaction:
tdb.runTransaction((db) => {
  const col = db.getCollection("accounts");
  col.insert({ _id: "A3", owner: "Nadia", balance: 3000 });
  return { abort: false };
});
// → { txnId: "TXN-2", committed: true, rolledBack: false, result: { abort: false } }

accounts.count(); // → 2 (A1 + A3)
```

---

## 🧩 PROBLEM–05: 🏗️ Full DB Engine Orchestrator

⚠️ **Function Name:** `runDBEngineOrchestrator()`

| Input      | `dbConfig` (object) |
| :--------- | :------------------ |
| **Output** | object              |

**Rules:**

`dbConfig` object:

- `dbId` (string, non-empty)
- `collections` (array of objects):
  - `name` (string)
  - `seedDocuments` (array of objects) — initial documents to insert
- `transactions` (array of objects):
  - `txnId` (string)
  - `operations` (array of objects):
    - `collection` (string)
    - `type` (string: `"INSERT"`, `"UPDATE"`, `"DELETE"`, `"FIND"`)
    - `data` (object or null) — for INSERT
    - `id` (string or null) — for UPDATE/DELETE/FIND
    - `updates` (object or null) — for UPDATE
  - `shouldRollback` (boolean)
- `queries` (array of objects):
  - `queryId` (string)
  - `collection` (string)
  - `filter` (object or null)
  - `sort` (object or null)
  - `project` (array or null)
  - `limit` (number or null)

**Orchestration Rules (compose all previous concepts):**

1. **Create DB** and all collections (Problem-01)
2. **Seed** initial documents into each collection
3. **Process Transactions** (Problem-04):
   - Execute each operation in the transaction
   - If `shouldRollback: true` OR any operation errors → rollback
   - Else → commit
4. **Run Queries** (Problem-03) on final DB state
5. **Build Report:**
   - `dbStats` → final `getDBStats()`
   - `transactionSummary` → `{ total, committed, rolledBack }`
   - `querySummary` → `{ total, results: [{ queryId, count }] }`

**Validation:** invalid `dbConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ dbId, transactionLog, queryLog, report }`. |
| :----------- | :--------------------------------------------------- |

**Sample Input & Output:**

- `runDBEngineOrchestrator({
  dbId: "DB-01",
  collections: [
    { name: "products", seedDocuments: [
      { name: "JS Book", price: 500, category: "TECH" },
      { name: "CSS Guide", price: 300, category: "TECH" },
      { name: "Design Basics", price: 450, category: "DESIGN" }
    ]}
  ],
  transactions: [
    {
      txnId: "TXN-A",
      operations: [
        { collection: "products", type: "INSERT", data: { name: "Node.js Handbook", price: 600, category: "TECH" }, id: null, updates: null }
      ],
      shouldRollback: false
    },
    {
      txnId: "TXN-B",
      operations: [
        { collection: "products", type: "UPDATE", data: null, id: "products_1", updates: { price: 550 } }
      ],
      shouldRollback: true
    }
  ],
  queries: [
    { queryId: "Q1", collection: "products", filter: { category: "TECH" }, sort: { price: -1 }, project: ["name", "price"], limit: null },
    { queryId: "Q2", collection: "products", filter: null, sort: null, project: null, limit: 2 }
  ]
})` →

  **Manual Verify:**
  - Seed: 3 products (products_1, products_2, products_3)
  - TXN-A: INSERT Node.js Handbook → commit → products_4 added
  - TXN-B: UPDATE products_1 price→550 → shouldRollback → rollback → price stays 500
  - Q1: TECH filter → [products_4(600), products_1(500), products_2(300)] → name+price projected
  - Q2: all products, limit 2 → [products_1, products_2]
  - Final: 4 products total

  `{
  dbId: "DB-01",
  transactionLog: [
    { txnId: "TXN-A", status: "COMMITTED", operationsCount: 1 },
    { txnId: "TXN-B", status: "ROLLED_BACK", operationsCount: 1 }
  ],
  queryLog: [
    { queryId: "Q1", result: { docs: [{ _id: "products_4", name: "Node.js Handbook", price: 600 }, { _id: "products_1", name: "JS Book", price: 500 }, { _id: "products_2", name: "CSS Guide", price: 300 }], totalMatched: 3, returned: 3 } },
    { queryId: "Q2", result: { docs: [{ _id: "products_1", name: "JS Book", price: 500, category: "TECH" }, { _id: "products_2", name: "CSS Guide", price: 300, category: "TECH" }], totalMatched: 4, returned: 2 } }
  ],
  report: {
    dbStats: { totalCollections: 1, totalDocuments: 4, collections: { products: 4 } },
    transactionSummary: { total: 2, committed: 1, rolledBack: 1 },
    querySummary: { total: 2, results: [{ queryId: "Q1", count: 3 }, { queryId: "Q2", count: 2 }] }
  }
}`

---
