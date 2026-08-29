# 🎓 JS DAILY PRACTICE – DAY-242

📅 **Goal:** Full DB Orchestrator (Database Query Simulation)
🎯 **Focus:** Complete Database System • Schema Management • Query Execution • Transaction + Index + Aggregation Integration

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🗂️ Schema Manager

⚠️ **Function Name:** `createSchemaManager()`

| Input      | None (factory function)    |
| :--------- | :------------------------- |
| **Output** | object (schema manager)    |

**Rules:**

Return a schema manager object with:

- `defineTable(tableConfig)` — define a table schema
- `alterTable(tableName, alteration)` — modify an existing schema
- `dropTable(tableName)` — remove a table definition
- `validateDocument(tableName, doc)` — validate a document against schema
- `getSchema(tableName)` — return schema for a table
- `listTables()` — return all defined table names

**Table Config:**

```javascript
{
  tableName: string,
  columns: [{ name, type, required, default, unique }],
  primaryKey: string,
  foreignKeys: [{ column, references: "table.column" }] or null,
  indexes: [{ column, type: "HASH" or "BTREE" }] or null
}
```

**Operation Rules:**

- `defineTable(tableConfig)`:
  - If already exists → `{ defined: false, reason: "Table already exists: " + tableName }`
  - Else → `{ defined: true, tableName, columnCount: columns.length }`

- `alterTable(tableName, alteration)`:
  - `alteration` object:
    - `addColumn` (object or null) — `{ name, type, required, default, unique }`
    - `dropColumn` (string or null) — column name to remove
    - `addIndex` (object or null) — `{ column, type }`
    - `dropIndex` (string or null) — column name of index to remove
  - Returns `{ altered: true, tableName, changes: [description strings] }` or `{ error: "Table not found" }`

- `dropTable(tableName)` → `{ dropped: true, tableName }` or `{ error: "Table not found" }`

- `validateDocument(tableName, doc)`:
  - Check required columns, types, unique constraints (against provided existingDocs if needed)
  - Returns `{ valid: boolean, errors: [string], warnings: [string] }`
  - Warning: field in doc not in schema → `"Unknown column: fieldName"`

- `getSchema(tableName)` → full schema object or `{ error: "Table not found" }`
- `listTables()` → array of `{ tableName, columnCount, hasIndexes: boolean, hasForeignKeys: boolean }`

**Validation:** method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the schema manager object with all 6 methods. |
| :----------- | :--------------------------------------------------- |

**Sample Input & Output:**

```javascript
const sm = createSchemaManager();

sm.defineTable({
  tableName: "users",
  columns: [
    { name: "id", type: "string", required: true, default: null, unique: true },
    { name: "name", type: "string", required: true, default: null, unique: false },
    { name: "age", type: "number", required: false, default: 18, unique: false },
    { name: "email", type: "string", required: true, default: null, unique: true }
  ],
  primaryKey: "id",
  foreignKeys: null,
  indexes: [{ column: "email", type: "HASH" }]
});
// → { defined: true, tableName: "users", columnCount: 4 }

sm.validateDocument("users", { id: "U1", name: "Rahim", email: "r@mail.com", unknownField: "x" });
// → { valid: true, errors: [], warnings: ["Unknown column: unknownField"] }

sm.validateDocument("users", { name: "Karim" });
// id required, email required
// → { valid: false, errors: ["id: required field missing", "email: required field missing"], warnings: [] }

sm.alterTable("users", { addColumn: { name: "active", type: "boolean", required: false, default: true, unique: false }, dropColumn: null, addIndex: null, dropIndex: null });
// → { altered: true, tableName: "users", changes: ["Added column: active"] }

sm.listTables();
// → [{ tableName: "users", columnCount: 5, hasIndexes: true, hasForeignKeys: false }]
```

---

## 🧩 PROBLEM–02: ⚙️ Query Execution Engine

⚠️ **Function Name:** `createQueryExecutionEngine()`

| Input      | `engineConfig` (object)    |
| :--------- | :------------------------- |
| **Output** | object (execution engine)  |

**Rules:**

`engineConfig` object:

- `tables` (object) — `{ tableName: [records] }`
- `indexes` (object) — `{ tableName: [{ column, type }] }`
- `schema` (object) — `{ tableName: tableConfig }` (optional, for validation)

Return a query execution engine with:

- `executeQuery(query)` — parse and execute a query object
- `executeBatch(queries)` — execute multiple queries
- `getExecutionPlan(query)` — return execution plan without running
- `getEngineStats()` — return performance statistics

**Query Object:**

```javascript
{
  type: "SELECT" | "INSERT" | "UPDATE" | "DELETE",
  table: string,
  // For SELECT:
  select: [...fields] or null,   // null = all fields
  where: [...conditions] or null,
  orderBy: { field, direction } or null,
  limit: number or null,
  offset: number or 0,
  joins: [{ type, table, on: { leftField, rightField } }] or null,
  // For INSERT:
  values: object or [objects],
  // For UPDATE:
  set: object,
  // For DELETE: uses where
}
```

**Execution Rules:**

- `executeQuery(query)`:
  - Use available indexes for WHERE conditions (if index exists on field → INDEX_SCAN, else FULL_SCAN)
  - Track `executionTime: "O(log n)" or "O(n)"` based on whether index used
  - For JOIN: simulate NESTED_LOOP join
  - Returns `{ type, table, result, rowsAffected, executionPlan: { scanType, usedIndexes: [] }, executedAt: "2025-01-01T00:00:00Z" }`

- `getExecutionPlan(query)`:
  - Returns `{ steps: [{ stepName, description, cost }], totalEstimatedCost, recommendedIndexes: [fields not indexed but used in WHERE] }`

- `executeBatch(queries)` → `{ results: [execute result per query], totalExecuted, successCount, failureCount }`

- `getEngineStats()` → `{ totalQueries, indexScans, fullScans, avgRowsPerQuery: rounded to 2dp, mostQueriedTable }`

**Validation:** invalid `engineConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the execution engine object with all 4 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const engine = createQueryExecutionEngine({
  tables: {
    employees: [
      { id: "E1", name: "Rahim", dept: "IT", salary: 70000 },
      { id: "E2", name: "Karim", dept: "HR", salary: 50000 },
      { id: "E3", name: "Nadia", dept: "IT", salary: 80000 }
    ]
  },
  indexes: { employees: [{ column: "dept", type: "HASH" }] },
  schema: {}
});

engine.executeQuery({
  type: "SELECT",
  table: "employees",
  select: ["name", "salary"],
  where: [{ field: "dept", operator: "=", value: "IT" }],
  orderBy: { field: "salary", direction: "desc" },
  limit: 2,
  offset: 0,
  joins: null
});
// dept has HASH index → INDEX_SCAN
// → {
//   type: "SELECT", table: "employees",
//   result: [{ name: "Nadia", salary: 80000 }, { name: "Rahim", salary: 70000 }],
//   rowsAffected: 2,
//   executionPlan: { scanType: "INDEX_SCAN", usedIndexes: ["dept"] },
//   executedAt: "2025-01-01T00:00:00Z"
// }

engine.getExecutionPlan({
  type: "SELECT",
  table: "employees",
  select: null,
  where: [{ field: "salary", operator: ">", value: 60000 }],
  orderBy: null, limit: null, offset: 0, joins: null
});
// salary not indexed → full scan
// → {
//   steps: [
//     { stepName: "TABLE_SCAN", description: "Full scan of employees (3 rows)", cost: 3 },
//     { stepName: "FILTER", description: "Apply WHERE salary > 60000", cost: 3 }
//   ],
//   totalEstimatedCost: 6,
//   recommendedIndexes: ["salary"]
// }
```

---

## 🧩 PROBLEM–03: 📊 DB Statistics & Monitoring

⚠️ **Function Name:** `createDBMonitor()`

| Input      | `monitorConfig` (object)  |
| :--------- | :------------------------ |
| **Output** | object (DB monitor)       |

**Rules:**

`monitorConfig` object:

- `monitorId` (string, non-empty)
- `tables` (object) — `{ tableName: [records] }`
- `slowQueryThreshold` (number) — queries with cost > this are "slow"

Return a DB monitor object with:

- `recordQuery(queryRecord)` — record a query execution
- `getTableStats(tableName)` — return statistics for a table
- `getSlowQueries()` — return queries exceeding threshold
- `getTopQueries(n)` — return top N most frequent queries
- `getDBHealth()` — return overall DB health report
- `generateReport()` — generate comprehensive DB report

**Query Record:**

```javascript
{
  queryId: string,
  type: "SELECT" | "INSERT" | "UPDATE" | "DELETE",
  table: string,
  scanType: "INDEX_SCAN" | "FULL_SCAN",
  rowsScanned: number,
  rowsReturned: number,
  cost: number,
  executedAt: string
}
```

**Monitor Rules:**

- `recordQuery(queryRecord)` → `{ recorded: true, queryId }`

- `getTableStats(tableName)`:
  - If no queries for this table → `{ error: "No data for table: " + tableName }`
  - Returns `{ tableName, totalQueries, selectCount, insertCount, updateCount, deleteCount, avgCost: rounded to 2dp, indexScanRate: percentage rounded to 2dp, totalRowsScanned, currentRecordCount }`

- `getSlowQueries()` → array of query records where `cost > slowQueryThreshold`, sorted by cost desc

- `getTopQueries(n)` → top N tables by query count: `[{ table, queryCount }]`

- `getDBHealth()` → `{ status: "HEALTHY"/"DEGRADED"/"CRITICAL", metrics: { totalQueries, slowQueryRate: percentage, indexUsageRate: percentage, avgCost }, issues: [string descriptions] }`
  - `"DEGRADED"` if slowQueryRate > 20% or indexUsageRate < 50%
  - `"CRITICAL"` if slowQueryRate > 50% or indexUsageRate < 20%
  - Otherwise `"HEALTHY"`

- `generateReport()` → `{ monitorId, generatedAt: "2025-01-01T00:00:00Z", summary: getDBHealth(), tableBreakdown: { tableName: getTableStats() }, slowQueries: getSlowQueries(), recommendations: [string] }`
  - Recommendations: suggest indexes for tables with low indexUsageRate, suggest query optimization for slow queries

**Validation:** invalid `monitorConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the DB monitor object with all 6 methods. |
| :----------- | :----------------------------------------------- |

**Sample Input & Output:**

```javascript
const monitor = createDBMonitor({
  monitorId: "MON-01",
  tables: { employees: [...5 records...], orders: [...3 records...] },
  slowQueryThreshold: 100
});

monitor.recordQuery({ queryId: "Q1", type: "SELECT", table: "employees", scanType: "INDEX_SCAN", rowsScanned: 2, rowsReturned: 2, cost: 20, executedAt: "2025-01-01T00:00:00Z" });
monitor.recordQuery({ queryId: "Q2", type: "SELECT", table: "employees", scanType: "FULL_SCAN", rowsScanned: 5, rowsReturned: 3, cost: 150, executedAt: "2025-01-01T00:00:00Z" });
monitor.recordQuery({ queryId: "Q3", type: "INSERT", table: "orders", scanType: "INDEX_SCAN", rowsScanned: 0, rowsReturned: 1, cost: 10, executedAt: "2025-01-01T00:00:00Z" });

monitor.getSlowQueries();
// → [{ queryId: "Q2", type: "SELECT", table: "employees", scanType: "FULL_SCAN", cost: 150, ... }]

monitor.getDBHealth();
// slowQueryRate = 1/3 = 33.33% > 20% → DEGRADED
// indexUsageRate = 2/3 = 66.67% > 50% → OK
// → { status: "DEGRADED", metrics: { totalQueries: 3, slowQueryRate: 33.33, indexUsageRate: 66.67, avgCost: 60.00 }, issues: ["High slow query rate: 33.33%"] }
```

---

## 🧩 PROBLEM–04: 🔄 Database Migration Engine

⚠️ **Function Name:** `createMigrationEngine()`

| Input      | `migrationConfig` (object)  |
| :--------- | :--------------------------- |
| **Output** | object (migration engine)    |

**Rules:**

`migrationConfig` object:

- `engineId` (string, non-empty)
- `currentVersion` (number, integer, ≥ 0)

Return a migration engine object with:

- `addMigration(migration)` — register a migration
- `runMigrations(targetVersion)` — run all pending migrations up to target version
- `rollbackMigration(version)` — undo a specific migration
- `getMigrationStatus()` — return status of all migrations
- `getCurrentVersion()` — return current DB version

**Migration Object:**

```javascript
{
  version: number,   // must be > current version, sequential
  name: string,
  up: function(db) → { changes: [string] },    // apply migration
  down: function(db) → { changes: [string] }   // undo migration
}
```

**Migration Rules:**

- Migrations run in ascending version order
- `addMigration(migration)`:
  - `version` must be positive integer
  - Duplicate version → `{ added: false, reason: "Version already registered: " + version }`
  - Else → `{ added: true, version, name }`

- `runMigrations(targetVersion)`:
  - Run all registered migrations with `version > currentVersion && version <= targetVersion` in order
  - Each migration calls `up(db)` where `db` is a simple state object `{ tables: {}, indexes: {} }`
  - After each → update `currentVersion`
  - Returns `{ migrationsRun, fromVersion, toVersion, log: [{ version, name, changes, status: "SUCCESS" or "FAILED" }] }`

- `rollbackMigration(version)`:
  - Can only rollback the LATEST applied migration
  - Calls `down(db)`, decrements `currentVersion`
  - Returns `{ rolledBack: true, version, changes }` or `{ error: "Can only rollback latest version: " + currentVersion }`

- `getMigrationStatus()` → array of `{ version, name, status: "APPLIED"/"PENDING"/"ROLLED_BACK" }`
- `getCurrentVersion()` → number

**Validation:** invalid `migrationConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the migration engine object with all 5 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const engine = createMigrationEngine({ engineId: "MIG-01", currentVersion: 0 });

engine.addMigration({
  version: 1,
  name: "CreateUsersTable",
  up: (db) => { db.tables.users = []; return { changes: ["Created table: users"] }; },
  down: (db) => { delete db.tables.users; return { changes: ["Dropped table: users"] }; }
});

engine.addMigration({
  version: 2,
  name: "AddEmailIndex",
  up: (db) => { db.indexes.users = ["email"]; return { changes: ["Added index on users.email"] }; },
  down: (db) => { db.indexes.users = []; return { changes: ["Removed index on users.email"] }; }
});

engine.addMigration({
  version: 3,
  name: "CreateOrdersTable",
  up: (db) => { db.tables.orders = []; return { changes: ["Created table: orders"] }; },
  down: (db) => { delete db.tables.orders; return { changes: ["Dropped table: orders"] }; }
});

engine.runMigrations(2);
// → {
//   migrationsRun: 2,
//   fromVersion: 0,
//   toVersion: 2,
//   log: [
//     { version: 1, name: "CreateUsersTable", changes: ["Created table: users"], status: "SUCCESS" },
//     { version: 2, name: "AddEmailIndex", changes: ["Added index on users.email"], status: "SUCCESS" }
//   ]
// }

engine.getCurrentVersion(); // → 2

engine.rollbackMigration(2);
// → { rolledBack: true, version: 2, changes: ["Removed index on users.email"] }

engine.getCurrentVersion(); // → 1

engine.getMigrationStatus();
// → [
//   { version: 1, name: "CreateUsersTable", status: "APPLIED" },
//   { version: 2, name: "AddEmailIndex", status: "ROLLED_BACK" },
//   { version: 3, name: "CreateOrdersTable", status: "PENDING" }
// ]
```

---

## 🧩 PROBLEM–05: 🏗️ Full DB Orchestrator

⚠️ **Function Name:** `runFullDBOrchestrator()`

| Input      | `dbBlueprint` (object) |
| :--------- | :--------------------- |
| **Output** | object                 |

**Rules:**

`dbBlueprint` object:

- `dbId` (string, non-empty)
- `migrations` (array of objects) — migration definitions (same as Problem-04)
- `targetVersion` (number) — version to migrate to
- `seedData` (object) — `{ tableName: [records] }` to insert after migrations
- `indexes` (array of objects):
  - `tableName` (string)
  - `column` (string)
  - `indexType` (string: `"HASH"` or `"BTREE"`)
- `transactions` (array of objects):
  - `txnId` (string)
  - `operations` (array of `{ type, table, data, id, updates }`)
  - `shouldRollback` (boolean)
- `queries` (array of objects) — same shape as Problem-02 query object
- `aggregations` (array of objects):
  - `aggId` (string)
  - `pipeline` (array of stage objects — same as Day-239)
- `monitorConfig` (object): `{ slowQueryThreshold: number }`

**Orchestration Rules (compose ALL Module 6 concepts):**

1. **Run Migrations** (Problem-04) — set up DB schema up to `targetVersion`
2. **Seed Data** — insert initial records into tables
3. **Build Indexes** (Day-241 logic) — create indexes on specified columns
4. **Execute Transactions** (Day-240 logic) — process each transaction with commit/rollback
5. **Execute Queries** (Problem-02) — run queries using indexes where available
6. **Run Aggregations** (Day-239 logic) — run aggregation pipelines
7. **Monitor** (Problem-03) — record all query executions, generate health report
8. **Build Final Report:**
   - `migrationSummary` → versions applied
   - `seedSummary` → records seeded per table
   - `indexSummary` → indexes built
   - `transactionSummary` → committed/rolled back
   - `querySummary` → index scans vs full scans
   - `aggregationSummary` → pipelines run
   - `dbHealth` → from monitor
   - `finalDataState` → record counts per table

**Validation:** invalid `dbBlueprint` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ dbId, migrationLog, transactionLog, queryLog, aggregationLog, report }`. |
| :----------- | :---------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runFullDBOrchestrator({
  dbId: "FULL-DB-01",
  migrations: [
    { version: 1, name: "CreateProducts", up: (db) => { db.tables.products = []; return { changes: ["Created products table"] }; }, down: (db) => { delete db.tables.products; return { changes: ["Dropped products table"] }; } },
    { version: 2, name: "CreateOrders", up: (db) => { db.tables.orders = []; return { changes: ["Created orders table"] }; }, down: (db) => { delete db.tables.orders; return { changes: ["Dropped orders table"] }; } }
  ],
  targetVersion: 2,
  seedData: {
    products: [
      { id: "P1", name: "JS Book", category: "TECH", price: 500 },
      { id: "P2", name: "CSS Guide", category: "TECH", price: 300 },
      { id: "P3", name: "Design Basics", category: "DESIGN", price: 450 }
    ],
    orders: [
      { id: "O1", productId: "P1", qty: 2, total: 1000 },
      { id: "O2", productId: "P2", qty: 1, total: 300 }
    ]
  },
  indexes: [
    { tableName: "products", column: "category", indexType: "HASH" },
    { tableName: "products", column: "price", indexType: "BTREE" }
  ],
  transactions: [
    {
      txnId: "TXN-1",
      operations: [
        { type: "INSERT", table: "products", data: { id: "P4", name: "Node.js Handbook", category: "TECH", price: 600 }, id: null, updates: null }
      ],
      shouldRollback: false
    }
  ],
  queries: [
    { type: "SELECT", table: "products", select: ["name", "price"], where: [{ field: "category", operator: "=", value: "TECH" }], orderBy: { field: "price", direction: "desc" }, limit: 3, offset: 0, joins: null }
  ],
  aggregations: [
    {
      aggId: "AGG-1",
      pipeline: [
        { $match: { category: "TECH" } },
        { $group: { _id: "category", count: { operator: "$count", field: null }, avgPrice: { operator: "$avg", field: "price" } } }
      ]
    }
  ],
  monitorConfig: { slowQueryThreshold: 50 }
})` →

  **Manual Verify:**
  - Migrations: v1(products) + v2(orders) → both applied
  - Seed: 3 products, 2 orders
  - Indexes: HASH on category, BTREE on price
  - TXN-1: INSERT P4 → committed → 4 products total
  - Query: TECH products sorted by price desc → P4(600), P1(500), P2(300) → INDEX_SCAN (category has HASH)
  - AGG-1: match TECH(P1,P2,P4) → group → count=3, avg=(500+300+600)/3=466.67
  - Monitor: 1 query, cost low → HEALTHY

  `{
  dbId: "FULL-DB-01",
  migrationLog: [
    { version: 1, name: "CreateProducts", changes: ["Created products table"], status: "SUCCESS" },
    { version: 2, name: "CreateOrders", changes: ["Created orders table"], status: "SUCCESS" }
  ],
  transactionLog: [
    { txnId: "TXN-1", status: "COMMITTED", operationsCount: 1 }
  ],
  queryLog: [
    { type: "SELECT", table: "products", result: [{ name: "Node.js Handbook", price: 600 }, { name: "JS Book", price: 500 }, { name: "CSS Guide", price: 300 }], rowsAffected: 3, executionPlan: { scanType: "INDEX_SCAN", usedIndexes: ["category"] } }
  ],
  aggregationLog: [
    { aggId: "AGG-1", result: [{ _id: "TECH", count: 3, avgPrice: 466.67 }], totalStages: 2 }
  ],
  report: {
    migrationSummary: { versionsApplied: 2, fromVersion: 0, toVersion: 2 },
    seedSummary: { products: 3, orders: 2 },
    indexSummary: { built: 2, indexes: [{ tableName: "products", column: "category", indexType: "HASH" }, { tableName: "products", column: "price", indexType: "BTREE" }] },
    transactionSummary: { total: 1, committed: 1, rolledBack: 0 },
    querySummary: { total: 1, indexScans: 1, fullScans: 0 },
    aggregationSummary: { total: 1, totalStagesRun: 2 },
    dbHealth: { status: "HEALTHY", metrics: { totalQueries: 1, slowQueryRate: 0.00, indexUsageRate: 100.00, avgCost: 20.00 }, issues: [] },
    finalDataState: { products: 4, orders: 2 }
  }
}`

---