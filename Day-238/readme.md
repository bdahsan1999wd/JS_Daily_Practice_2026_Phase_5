# 🎓 JS DAILY PRACTICE – DAY-238

📅 **Goal:** Query Builder Simulator (Database Query Simulation)
🎯 **Focus:** Fluent Query Builder • Method Chaining • SQL-like Query Generation • Query Execution • Query Optimization

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔗 Fluent Query Builder (SELECT)

⚠️ **Function Name:** `createQueryBuilder()`

| Input      | `data` (array of objects) |
| :--------- | :------------------------ |
| **Output** | object (query builder)    |

**Rules:**

`data` — non-empty array of objects (acts as the data source / table)

Return a query builder object with **chainable** methods:

- `select(...fields)` — specify fields to include (like SQL SELECT)
- `where(field, operator, value)` — add a filter condition (AND logic for multiple)
- `orWhere(field, operator, value)` — add OR filter condition
- `orderBy(field, direction)` — sort results (`"asc"` or `"desc"`)
- `limit(n)` — max records to return
- `offset(n)` — skip n records
- `execute()` — run the built query and return results
- `toSQL()` — return a human-readable SQL-like string representing the query
- `reset()` — clear all query state

**Supported Operators for `where` / `orWhere`:**

`"="`, `"!="`, `">"`, `">="`, `"<"`, `"<="`, `"LIKE"` (substring match), `"IN"` (value is array)

**Chaining Rules:**

- Every method except `execute()`, `toSQL()`, `reset()` returns `this` (the builder itself)
- `where` conditions are ANDed together
- `orWhere` conditions are ORed with the AND block
- Final filter: `(AND conditions) OR (orWhere conditions)`

**execute() returns:** `{ rows, rowCount, query: toSQL() }`
**toSQL() returns:** SQL-like string e.g.:
`"SELECT name, age FROM data WHERE age > 18 AND active = true ORDER BY age DESC LIMIT 10 OFFSET 0"`

**reset()** → clears all state, returns `{ reset: true }`

**Validation:** invalid `data` → return `"Invalid Input"` from factory. Method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the query builder object with full method chaining support. |
| :----------- | :----------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const qb = createQueryBuilder([
  { id: 1, name: "Rahim", age: 25, dept: "IT", active: true },
  { id: 2, name: "Karim", age: 17, dept: "HR", active: true },
  { id: 3, name: "Nadia", age: 30, dept: "IT", active: false },
  { id: 4, name: "Sadia", age: 22, dept: "HR", active: true },
  { id: 5, name: "Rafiq", age: 35, dept: "IT", active: true },
]);

qb.select("name", "age", "dept")
  .where("age", ">=", 18)
  .where("active", "=", true)
  .orderBy("age", "asc")
  .limit(3)
  .execute();
// → {
//   rows: [
//     { name: "Sadia", age: 22, dept: "HR" },
//     { name: "Rahim", age: 25, dept: "IT" },
//     { name: "Rafiq", age: 35, dept: "IT" }
//   ],
//   rowCount: 3,
//   query: "SELECT name, age, dept FROM data WHERE age >= 18 AND active = true ORDER BY age ASC LIMIT 3 OFFSET 0"
// }

qb.reset();
qb.select("name").where("dept", "=", "IT").orWhere("age", "<", 20).execute();
// (dept=IT) OR (age<20)
// → { rows: [{ name: "Rahim" }, { name: "Karim" }, { name: "Nadia" }, { name: "Rafiq" }], rowCount: 4, query: "..." }
```

---

## 🧩 PROBLEM–02: ✏️ Query Builder (INSERT, UPDATE, DELETE)

⚠️ **Function Name:** `createMutationBuilder()`

| Input      | `initialData` (array of objects) |
| :--------- | :------------------------------- |
| **Output** | object (mutation builder)        |

**Rules:**

`initialData` — non-empty array of objects

Return a mutation builder with chainable methods:

- `insert(doc)` — stage an INSERT operation
- `insertMany(docs)` — stage multiple INSERTs
- `update(doc)` — stage an UPDATE (merges with existing doc where id matches)
- `delete(id)` — stage a DELETE by id field
- `where(field, operator, value)` — filter for UPDATE/DELETE (same operators as Problem-01)
- `execute()` — apply all staged mutations to the data, return result
- `toSQL()` — return SQL-like string for the staged operation
- `reset()` — clear staged mutations

**Rules:**

- Each builder instance handles ONE mutation type at a time (INSERT OR UPDATE OR DELETE)
- `insert(doc)`:
  - Auto-generate `id: autoIndex + 1` if not provided
  - Returns builder (chainable)
- `update(doc)`:
  - Requires `where()` to specify which records to update
  - Merges `doc` fields into all matching records
- `delete(id)`:
  - If `id` provided → delete by that specific id
  - If `where()` used instead → delete all matching records
- `execute()` returns:
  - INSERT: `{ operation: "INSERT", inserted: count, docs: [new docs] }`
  - UPDATE: `{ operation: "UPDATE", updated: count, docs: [updated docs] }`
  - DELETE: `{ operation: "DELETE", deleted: count, ids: [deleted ids] }`
- `toSQL()`:
  - INSERT: `"INSERT INTO data VALUES (...)"`
  - UPDATE: `"UPDATE data SET field=value WHERE conditions"`
  - DELETE: `"DELETE FROM data WHERE conditions"`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the mutation builder object. |
| :----------- | :---------------------------------- |

**Sample Input & Output:**

```javascript
const mb = createMutationBuilder([
  { id: 1, name: "Rahim", dept: "IT", salary: 50000 },
  { id: 2, name: "Karim", dept: "HR", salary: 40000 },
  { id: 3, name: "Nadia", dept: "IT", salary: 60000 },
]);

// INSERT
mb.insert({ name: "Sadia", dept: "IT", salary: 55000 }).execute();
// → { operation: "INSERT", inserted: 1, docs: [{ id: 4, name: "Sadia", dept: "IT", salary: 55000 }] }

// UPDATE
mb.reset();
mb.update({ salary: 65000 }).where("dept", "=", "IT").execute();
// → { operation: "UPDATE", updated: 3, docs: [{ id: 1, salary: 65000, ... }, { id: 3, salary: 65000, ... }, { id: 4, salary: 65000, ... }] }

// DELETE
mb.reset();
mb.where("dept", "=", "HR").delete().execute();
// → { operation: "DELETE", deleted: 1, ids: [2] }
```

---

## 🧩 PROBLEM–03: 🔗 Subquery & Nested Query Builder

⚠️ **Function Name:** `createSubqueryBuilder()`

| Input      | `tables` (object)         |
| :--------- | :------------------------ |
| **Output** | object (subquery builder) |

**Rules:**

`tables` — object where keys are table names and values are arrays of row objects

Return a subquery builder with:

- `from(tableName)` — set main table
- `select(...fields)` — select fields
- `where(field, operator, value)` — filter
- `whereIn(field, subquery)` — filter where field value is IN subquery result
- `whereNotIn(field, subquery)` — filter where field value is NOT IN subquery result
- `subquery(tableName)` — create a nested subquery builder for that table (returns new builder)
- `execute()` — run main query + resolve subqueries
- `toSQL()` — return SQL-like string with subquery representation

**Subquery Rules:**

- `whereIn(field, subquery)`:
  - `subquery` is another builder instance (created via `.subquery(tableName).select(field)...`)
  - Execute subquery first → get list of values → filter main query where `field IN [values]`

- `whereNotIn(field, subquery)` → same but NOT IN

- Nested subquery `toSQL()` should show inline:
  e.g. `"SELECT name FROM users WHERE id IN (SELECT userId FROM orders WHERE amount > 100)"`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the subquery builder object with all methods. |
| :----------- | :--------------------------------------------------- |

**Sample Input & Output:**

```javascript
const sqb = createSubqueryBuilder({
  users: [
    { id: "U1", name: "Rahim", dept: "IT" },
    { id: "U2", name: "Karim", dept: "HR" },
    { id: "U3", name: "Nadia", dept: "IT" },
  ],
  orders: [
    { id: "O1", userId: "U1", amount: 500 },
    { id: "O2", userId: "U3", amount: 200 },
    { id: "O3", userId: "U2", amount: 50 },
  ],
});

// Find users who have orders with amount > 100
const ordersSubquery = sqb
  .subquery("orders")
  .select("userId")
  .where("amount", ">", 100);

sqb
  .from("users")
  .select("name", "dept")
  .whereIn("id", ordersSubquery)
  .execute();
// Subquery: orders where amount > 100 → userId: ["U1", "U3"]
// Main: users where id IN ["U1", "U3"] →

// {
//   rows: [{ name: "Rahim", dept: "IT" }, { name: "Nadia", dept: "IT" }],
//   rowCount: 2,
//   query: "SELECT name, dept FROM users WHERE id IN (SELECT userId FROM orders WHERE amount > 100)"
// }
```

---

## 🧩 PROBLEM–04: ⚡ Query Optimizer

⚠️ **Function Name:** `createQueryOptimizer()`

| Input      | `optimizerConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (query optimizer)   |

**Rules:**

`optimizerConfig` object:

- `indexes` (array of strings) — field names that have indexes available

Return a query optimizer object with:

- `analyze(query)` — analyze a query object and return optimization suggestions
- `optimize(query)` — return an optimized version of the query
- `estimateCost(query, dataSize)` — estimate query execution cost
- `getOptimizationLog()` — return history of all optimizations

**Query Object Shape (same as Problem-01 builder state):**

```javascript
{
  select: [...fields],
  where: [{ field, operator, value }],
  orderBy: { field, direction },
  limit: number or null,
  offset: number
}
```

**Analysis Rules:**

- `analyze(query)` checks for:
  - `"MISSING_INDEX"` → if any `where` field is NOT in `indexes` → suggest adding index
  - `"FULL_TABLE_SCAN"` → if no `where` conditions → warns full scan
  - `"SELECT_STAR"` → if `select` is empty (select all) → suggest selecting specific fields
  - `"MISSING_LIMIT"` → if no `limit` set → suggest adding limit
  - `"INEFFICIENT_SORT"` → if `orderBy` field is not in `indexes` → suggest index on sort field
  - Returns `{ suggestions: [{ type, message, severity: "LOW"/"MEDIUM"/"HIGH" }], score: 0-100 }`
    - score = 100 - (10 per LOW + 20 per MEDIUM + 30 per HIGH suggestion)

- `optimize(query)` → apply automatic fixes where possible:
  - Add `limit: 100` if missing
  - Reorder `where` conditions: indexed fields first
  - Returns `{ original: query, optimized: modifiedQuery, changesApplied: [string descriptions] }`

- `estimateCost(query, dataSize)`:
  - `dataSize` — total number of rows in data source
  - Base cost = `dataSize`
  - Each indexed `where` field → multiply cost by `0.1` (index scan)
  - Each non-indexed `where` field → multiply cost by `0.5` (partial scan)
  - No `where` → cost stays at `dataSize` (full scan)
  - `orderBy` on non-indexed field → add `dataSize * 0.2` (sort cost)
  - `limit` → multiply final cost by `limit / dataSize` (but min 0.01)
  - Returns `{ estimatedCost: rounded to 2dp, dataSize, costBreakdown: { baseCost, indexSavings, sortCost, limitSavings } }`

- `getOptimizationLog()` → array of all `optimize()` call results

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the query optimizer object with all 4 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const optimizer = createQueryOptimizer({ indexes: ["id", "dept", "age"] });

optimizer.analyze({
  select: [],
  where: [
    { field: "dept", operator: "=", value: "IT" },
    { field: "salary", operator: ">", value: 50000 },
  ],
  orderBy: { field: "salary", direction: "desc" },
  limit: null,
  offset: 0,
});
// → {
//   suggestions: [
//     { type: "MISSING_INDEX", message: "Field 'salary' in WHERE has no index", severity: "MEDIUM" },
//     { type: "SELECT_STAR", message: "Selecting all fields is inefficient", severity: "LOW" },
//     { type: "MISSING_LIMIT", message: "No LIMIT clause may return too many rows", severity: "MEDIUM" },
//     { type: "INEFFICIENT_SORT", message: "ORDER BY field 'salary' has no index", severity: "MEDIUM" }
//   ],
//   score: 20
// }

optimizer.estimateCost(
  {
    select: ["name"],
    where: [{ field: "dept", operator: "=", value: "IT" }],
    orderBy: null,
    limit: 10,
    offset: 0,
  },
  1000,
);
// dept is indexed → cost = 1000 * 0.1 = 100
// limit = 10/1000 = 0.01 → min 0.01 → 100 * 0.01 = 1.00 →

//  { estimatedCost: 1.00, dataSize: 1000, costBreakdown: { baseCost: 1000, indexSavings: 900, sortCost: 0, limitSavings: 99 } }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Query Builder Orchestrator

⚠️ **Function Name:** `runQueryBuilderOrchestrator()`

| Input      | `orchestratorConfig` (object) |
| :--------- | :---------------------------- |
| **Output** | object                        |

**Rules:**

`orchestratorConfig` object:

- `orchestratorId` (string, non-empty)
- `tables` (object) — `{ tableName: [records] }`
- `indexes` (array of strings) — indexed fields for optimizer
- `queryPlan` (array of objects):
  - `queryId` (string)
  - `type` (string: `"SELECT"`, `"INSERT"`, `"UPDATE"`, `"DELETE"`, `"SUBQUERY"`)
  - `config` (object):
    - For `"SELECT"`: `{ table, select, where, orderBy, limit, offset }`
    - For `"INSERT"`: `{ table, docs: [array of docs] }`
    - For `"UPDATE"`: `{ table, updates, where }`
    - For `"DELETE"`: `{ table, where }`
    - For `"SUBQUERY"`: `{ mainTable, mainSelect, mainWhereIn: { field, subTable, subSelect, subWhere } }`
  - `optimize` (boolean) — if true, run optimizer before executing

**Orchestration Rules (compose all previous concepts):**

1. **Initialize** query builder, mutation builder, subquery builder, optimizer for each table
2. **Process query plan** in order:
   - Build the appropriate query using the builder
   - If `optimize: true` → run optimizer, apply optimizations
   - Execute the query
   - Record result and SQL string
3. **Build Summary:**
   - `totalQueries` → count
   - `successCount`
   - `totalRowsAffected` → sum of rowCount/inserted/updated/deleted across all queries
   - `optimizationsApplied` → count of queries that were optimized
   - `avgQueryScore` → average optimization score (only for optimized queries, rounded to 2dp)

**Validation:** invalid `orchestratorConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, queryLog, summary }` where `queryLog` is array of `{ queryId, type, sql, result, optimized, optimizationScore or null }`. |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runQueryBuilderOrchestrator({
  orchestratorId: "QB-ORCH-01",
  tables: {
    employees: [
      { id: 1, name: "Rahim", dept: "IT", salary: 70000 },
      { id: 2, name: "Karim", dept: "HR", salary: 50000 },
      { id: 3, name: "Nadia", dept: "IT", salary: 80000 }
    ]
  },
  indexes: ["id", "dept"],
  queryPlan: [
    {
      queryId: "Q1",
      type: "SELECT",
      config: { table: "employees", select: ["name", "salary"], where: [{ field: "dept", operator: "=", value: "IT" }], orderBy: { field: "salary", direction: "desc" }, limit: 10, offset: 0 },
      optimize: true
    },
    {
      queryId: "Q2",
      type: "INSERT",
      config: { table: "employees", docs: [{ id: 4, name: "Sadia", dept: "IT", salary: 75000 }] },
      optimize: false
    },
    {
      queryId: "Q3",
      type: "UPDATE",
      config: { table: "employees", updates: { salary: 85000 }, where: [{ field: "dept", operator: "=", value: "IT" }] },
      optimize: false
    }
  ]
})` →

  **Manual Verify:**
  - Q1: SELECT name,salary FROM employees WHERE dept=IT ORDER BY salary DESC LIMIT 10
    - dept is indexed → no MISSING_INDEX, has LIMIT → score is high
    - Result: [{ name: "Nadia", salary: 80000 }, { name: "Rahim", salary: 70000 }]
  - Q2: INSERT 1 employee
  - Q3: UPDATE dept=IT → affects Rahim, Nadia, Sadia (3 records after Q2 insert)
  - totalRowsAffected: 2+1+3 = 6

  `{
  orchestratorId: "QB-ORCH-01",
  queryLog: [
    {
      queryId: "Q1",
      type: "SELECT",
      sql: "SELECT name, salary FROM employees WHERE dept = IT ORDER BY salary DESC LIMIT 10 OFFSET 0",
      result: { rows: [{ name: "Nadia", salary: 80000 }, { name: "Rahim", salary: 70000 }], rowCount: 2 },
      optimized: true,
      optimizationScore: 80
    },
    {
      queryId: "Q2",
      type: "INSERT",
      sql: "INSERT INTO employees VALUES ({id:4, name:Sadia, dept:IT, salary:75000})",
      result: { operation: "INSERT", inserted: 1, docs: [{ id: 4, name: "Sadia", dept: "IT", salary: 75000 }] },
      optimized: false,
      optimizationScore: null
    },
    {
      queryId: "Q3",
      type: "UPDATE",
      sql: "UPDATE employees SET salary=85000 WHERE dept = IT",
      result: { operation: "UPDATE", updated: 3, docs: [{ id: 1, salary: 85000 }, { id: 3, salary: 85000 }, { id: 4, salary: 85000 }] },
      optimized: false,
      optimizationScore: null
    }
  ],
  summary: {
    totalQueries: 3,
    successCount: 3,
    totalRowsAffected: 6,
    optimizationsApplied: 1,
    avgQueryScore: 80.00
  }
}`

---
