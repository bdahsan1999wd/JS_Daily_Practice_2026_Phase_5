# 🎓 JS DAILY PRACTICE – DAY-241

📅 **Goal:** Index Simulator (Database Query Simulation)
🎯 **Focus:** Index Types • Index Building • Query Optimization with Indexes • Index Maintenance • Index Analysis

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🗂️ Basic Index Builder

⚠️ **Function Name:** `createIndexBuilder()`

| Input      | `collection` (array of objects) |
| :--------- | :------------------------------ |
| **Output** | object (index builder)          |

**Rules:**

`collection` — non-empty array of documents (each has `_id` field)

Return an index builder object with:

- `buildIndex(fieldName, indexType)` — create an index on a field
- `dropIndex(fieldName)` — remove an index
- `listIndexes()` — return all current indexes
- `search(fieldName, value)` — search using index (if available) or fallback to full scan
- `getIndexStats(fieldName)` — return statistics about an index

**Index Types:**

- `"HASH"` — maps exact values to document ids: `{ value: [_ids] }`
  - Fast for equality queries (`=`)
  - Cannot support range queries

- `"BTREE"` — sorted structure: array of `{ value, _id }` pairs sorted by value
  - Supports equality AND range queries
  - Default index type

**Operation Rules:**

- `buildIndex(fieldName, indexType)`:
  - `fieldName` must be non-empty string
  - `indexType` must be `"HASH"` or `"BTREE"`
  - If index already exists → `{ built: false, reason: "Index already exists on: " + fieldName }`
  - Build index from current collection data
  - Returns `{ built: true, fieldName, indexType, entriesIndexed: count, buildTimeSimulated: "O(n)" }`

- `dropIndex(fieldName)` → `{ dropped: true, fieldName }` or `{ error: "Index not found: " + fieldName }`

- `listIndexes()` → array of `{ fieldName, indexType, entriesIndexed, createdAt: "2025-01-01T00:00:00Z" }`

- `search(fieldName, value)`:
  - If index exists on field → use index (HASH: O(1) lookup, BTREE: O(log n))
  - If no index → full table scan O(n)
  - Returns `{ fieldName, value, results: [matching docs], count, usedIndex: boolean, scanType: "INDEX_SCAN" or "FULL_SCAN" }`

- `getIndexStats(fieldName)`:
  - If no index → `{ error: "No index on: " + fieldName }`
  - Returns `{ fieldName, indexType, totalEntries, uniqueValues, avgDocsPerValue: rounded to 2dp, selectivity: uniqueValues/totalEntries rounded to 2dp }`
  - High selectivity (close to 1.0) = good index candidate

**Validation:** invalid `collection` → return `"Invalid Input"` from factory. Method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the index builder object with all 5 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const ib = createIndexBuilder([
  { _id: "1", name: "Rahim", dept: "IT", age: 25 },
  { _id: "2", name: "Karim", dept: "HR", age: 30 },
  { _id: "3", name: "Nadia", dept: "IT", age: 22 },
  { _id: "4", name: "Sadia", dept: "HR", age: 28 },
  { _id: "5", name: "Rafiq", dept: "IT", age: 35 },
]);

ib.buildIndex("dept", "HASH");
// → { built: true, fieldName: "dept", indexType: "HASH", entriesIndexed: 5, buildTimeSimulated: "O(n)" }

ib.buildIndex("age", "BTREE");
// → { built: true, fieldName: "age", indexType: "BTREE", entriesIndexed: 5, buildTimeSimulated: "O(n)" }

ib.search("dept", "IT");
// Uses HASH index → O(1) lookup
// → { fieldName: "dept", value: "IT", results: [{ _id:"1",...}, { _id:"3",...}, { _id:"5",...}], count: 3, usedIndex: true, scanType: "INDEX_SCAN" }

ib.search("name", "Rahim");
// No index on name → full scan
// → { fieldName: "name", value: "Rahim", results: [{ _id:"1",...}], count: 1, usedIndex: false, scanType: "FULL_SCAN" }

ib.getIndexStats("dept");
// → { fieldName: "dept", indexType: "HASH", totalEntries: 5, uniqueValues: 2, avgDocsPerValue: 2.50, selectivity: 0.40 }

ib.getIndexStats("age");
// → { fieldName: "age", indexType: "BTREE", totalEntries: 5, uniqueValues: 5, avgDocsPerValue: 1.00, selectivity: 1.00 }
```

---

## 🧩 PROBLEM–02: 📏 Range Index (B-Tree Simulation)

⚠️ **Function Name:** `createBTreeIndex()`

| Input      | `collection` (array of objects), `fieldName` (string) |
| :--------- | :---------------------------------------------------- |
| **Output** | object (B-tree index)                                 |

**Rules:**

`collection` — non-empty array of documents
`fieldName` — field to index (must contain numeric or string values)

Return a B-tree index object with:

- `rangeSearch(min, max)` — find documents where `min <= field <= max` (null = no bound)
- `exactSearch(value)` — find documents with exact value
- `prefixSearch(prefix)` — find string field values starting with prefix
- `getMin()` — return document with minimum field value
- `getMax()` — return document with maximum field value
- `getNth(n)` — return Nth smallest document (1-based)
- `getIndexSize()` — return number of indexed entries

**B-Tree Rules (simulate with sorted array):**

- Internal structure: sorted array of `{ value, _id }` pairs
- `rangeSearch(min, max)`:
  - Binary search to find start and end positions
  - Returns `{ min, max, results: [matching docs], count, scanType: "RANGE_SCAN" }`
- `exactSearch(value)` → `{ value, results: [docs], count, scanType: "INDEX_SCAN" }`
- `prefixSearch(prefix)` → only for string fields; find all values starting with `prefix` (case-insensitive)
  - Returns `{ prefix, results: [docs], count }`
- `getMin()` → `{ fieldName, minValue, doc }`
- `getMax()` → `{ fieldName, maxValue, doc }`
- `getNth(n)` → `{ n, value, doc }` or `{ error: "Index out of range" }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the B-tree index object with all 7 methods. |
| :----------- | :------------------------------------------------- |

**Sample Input & Output:**

```javascript
const btree = createBTreeIndex(
  [
    { _id: "1", name: "Rahim", salary: 70000 },
    { _id: "2", name: "Karim", salary: 50000 },
    { _id: "3", name: "Nadia", salary: 80000 },
    { _id: "4", name: "Sadia", salary: 60000 },
    { _id: "5", name: "Rafiq", salary: 90000 },
  ],
  "salary",
);

btree.rangeSearch(55000, 80000);
// → { min: 55000, max: 80000, results: [{ _id:"4",...}, { _id:"1",...}, { _id:"3",...}], count: 3, scanType: "RANGE_SCAN" }

btree.exactSearch(70000);
// → { value: 70000, results: [{ _id:"1", name:"Rahim", salary:70000 }], count: 1, scanType: "INDEX_SCAN" }

btree.getMin();
// → { fieldName: "salary", minValue: 50000, doc: { _id:"2", name:"Karim", salary:50000 } }

btree.getMax();
// → { fieldName: "salary", maxValue: 90000, doc: { _id:"5", name:"Rafiq", salary:90000 } }

btree.getNth(2);
// 2nd smallest salary = 60000
// → { n: 2, value: 60000, doc: { _id:"4", name:"Sadia", salary:60000 } }

// String B-tree:
const nameBtree = createBTreeIndex(
  [
    { _id: "1", name: "Rahim" },
    { _id: "2", name: "Rafiq" },
    { _id: "3", name: "Nadia" },
  ],
  "name",
);

nameBtree.prefixSearch("ra");
// → { prefix: "ra", results: [{ _id:"1", name:"Rahim" }, { _id:"2", name:"Rafiq" }], count: 2 }
```

---

## 🧩 PROBLEM–03: 🔗 Composite & Unique Index

⚠️ **Function Name:** `createCompositeIndex()`

| Input      | `collection` (array of objects), `indexConfig` (object) |
| :--------- | :------------------------------------------------------ |
| **Output** | object (composite index)                                |

**Rules:**

`collection` — non-empty array of documents
`indexConfig` object:

- `fields` (array of strings) — ordered list of fields to index together (max 3)
- `unique` (boolean) — if true, enforce uniqueness of the field combination
- `sparse` (boolean) — if true, skip documents where any indexed field is null/undefined

Return a composite index object with:

- `search(query)` — search using composite key
- `insert(doc)` — validate uniqueness + sparse constraint before inserting
- `validateCollection()` — check entire collection for uniqueness violations
- `getIndexInfo()` — return index metadata

**Composite Key:** concatenate field values with `"|"` separator: e.g. `"IT|Rahim"` for `(dept, name)`

**Operation Rules:**

- `search(query)`:
  - `query` object with keys matching indexed fields (can be partial — first N fields)
  - Build composite key prefix from provided fields
  - Returns `{ query, results: [matching docs], count, compositeKey: key used }`

- `insert(doc)`:
  - If `sparse: true` AND any indexed field is null/undefined → skip index, return `{ indexed: false, reason: "Sparse: null field skipped" }`
  - Build composite key for doc
  - If `unique: true` AND key already exists → `{ inserted: false, reason: "Unique constraint violation: " + compositeKey }`
  - Else → add to index, return `{ inserted: true, compositeKey }`

- `validateCollection()`:
  - Check all documents for uniqueness violations
  - Returns `{ valid: boolean, violations: [{ compositeKey, conflictingIds: [_ids] }] }`

- `getIndexInfo()` → `{ fields, unique, sparse, totalEntries, uniqueKeys }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the composite index object with all 4 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const ci = createCompositeIndex(
  [
    { _id: "1", dept: "IT", name: "Rahim", level: "SR" },
    { _id: "2", dept: "HR", name: "Karim", level: "JR" },
    { _id: "3", dept: "IT", name: "Nadia", level: "SR" },
    { _id: "4", dept: "IT", name: "Rahim", level: "JR" }, // same dept+name as _id:1
  ],
  { fields: ["dept", "name"], unique: true, sparse: false },
);

ci.validateCollection();
// _id:1 and _id:4 share composite key "IT|Rahim"
// → { valid: false, violations: [{ compositeKey: "IT|Rahim", conflictingIds: ["1", "4"] }] }

ci.search({ dept: "IT" });
// All IT docs
// → { query: { dept: "IT" }, results: [{ _id:"1",...}, { _id:"3",...}, { _id:"4",...}], count: 3, compositeKey: "IT" }

ci.insert({ _id: "5", dept: "HR", name: "Sadia", level: "MID" });
// New unique key "HR|Sadia" → OK
// → { inserted: true, compositeKey: "HR|Sadia" }

ci.insert({ _id: "6", dept: "HR", name: "Karim", level: "SR" });
// "HR|Karim" already exists (_id:2)
// → { inserted: false, reason: "Unique constraint violation: HR|Karim" }

ci.getIndexInfo();
// → { fields: ["dept", "name"], unique: true, sparse: false, totalEntries: 5, uniqueKeys: 4 }
```

---

## 🧩 PROBLEM–04: 📊 Index Advisor

⚠️ **Function Name:** `createIndexAdvisor()`

| Input      | `advisorConfig` (object) |
| :--------- | :----------------------- |
| **Output** | object (index advisor)   |

**Rules:**

`advisorConfig` object:

- `collection` (array of objects, non-empty)
- `queryHistory` (array of objects):
  - `queryId` (string)
  - `filter` (object) — fields used in WHERE clause
  - `sortField` (string or null)
  - `frequency` (number, ≥ 1) — how often this query runs

Return an index advisor object with:

- `analyzeQueries()` — analyze query history to find indexing opportunities
- `recommendIndexes()` — suggest optimal indexes based on analysis
- `simulateImpact(fieldName, indexType)` — estimate performance improvement if index added
- `getCoverageReport()` — show which queries are covered by existing indexes

**Analysis Rules:**

- `analyzeQueries()`:
  - Count how many times each field appears in filters (weighted by frequency)
  - Count how many times each field is used for sorting (weighted by frequency)
  - Returns `{ fieldUsage: { fieldName: { filterCount, sortCount, totalWeight } }, mostUsedField, leastUsedField }`

- `recommendIndexes()`:
  - Fields with `totalWeight >= 3` → recommend index
  - If field used for sorting AND filtering → recommend `BTREE`
  - If field used only for exact filtering → recommend `HASH`
  - If multiple high-usage fields often appear together → recommend composite index
  - Returns `{ recommendations: [{ fields: [fieldName], indexType, reason, priorityScore }], sorted by priorityScore desc }`

- `simulateImpact(fieldName, indexType)`:
  - Calculate how many queries would benefit from this index
  - Estimate scan reduction: HASH → 99% reduction for equality queries, BTREE → 90% reduction for range queries
  - Returns `{ fieldName, indexType, queriesBenefited, estimatedScanReduction: percentage, currentAvgCost: dataSize, projectedAvgCost: reduced }`

- `getCoverageReport()`:
  - Based on currently built indexes (start with none)
  - For each query in history: `covered: true` if all filter fields are indexed, `partial: true` if some are
  - Returns `{ totalQueries, fullyCovered: count, partiallyCovered: count, uncovered: count, queries: [{ queryId, covered, partial, missingIndexes }] }`

**Validation:** invalid `advisorConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the index advisor object with all 4 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const advisor = createIndexAdvisor({
  collection: [
    { _id: "1", dept: "IT", salary: 70000, active: true },
    { _id: "2", dept: "HR", salary: 50000, active: false },
    { _id: "3", dept: "IT", salary: 80000, active: true },
  ],
  queryHistory: [
    {
      queryId: "Q1",
      filter: { dept: "IT" },
      sortField: "salary",
      frequency: 10,
    },
    {
      queryId: "Q2",
      filter: { dept: "HR", active: true },
      sortField: null,
      frequency: 5,
    },
    {
      queryId: "Q3",
      filter: { salary: { $gt: 60000 } },
      sortField: "salary",
      frequency: 8,
    },
    { queryId: "Q4", filter: { active: true }, sortField: null, frequency: 3 },
  ],
});

advisor.analyzeQueries();
// dept: filterCount=(Q1×10 + Q2×5)=15, sortCount=0, totalWeight=15
// salary: filterCount=(Q3×8)=8, sortCount=(Q1×10 + Q3×8)=18, totalWeight=26
// active: filterCount=(Q2×5 + Q4×3)=8, sortCount=0, totalWeight=8
// → { fieldUsage: { dept: { filterCount: 15, sortCount: 0, totalWeight: 15 }, salary: { filterCount: 8, sortCount: 18, totalWeight: 26 }, active: { filterCount: 8, sortCount: 0, totalWeight: 8 } }, mostUsedField: "salary", leastUsedField: "active" }

advisor.recommendIndexes();
// All fields weight >= 3 → recommend
// salary: filter+sort → BTREE (highest priority)
// dept: filter only → HASH
// active: filter only → HASH (low cardinality but still used)
// → { recommendations: [
//   { fields: ["salary"], indexType: "BTREE", reason: "High usage for filtering and sorting", priorityScore: 26 },
//   { fields: ["dept"], indexType: "HASH", reason: "High usage in equality filters", priorityScore: 15 },
//   { fields: ["active"], indexType: "HASH", reason: "Moderate usage in equality filters", priorityScore: 8 }
// ] }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Index Orchestrator

⚠️ **Function Name:** `runIndexOrchestrator()`

| Input      | `indexConfig` (object) |
| :--------- | :--------------------- |
| **Output** | object                 |

**Rules:**

`indexConfig` object:

- `orchestratorId` (string, non-empty)
- `collection` (array of objects, non-empty)
- `indexesToBuild` (array of objects):
  - `fieldName` (string)
  - `indexType` (string: `"HASH"`, `"BTREE"`)
  - `composite` (boolean) — if true, use composite index config
  - `compositeFields` (array of strings or null)
  - `unique` (boolean)
  - `sparse` (boolean)
- `queries` (array of objects):
  - `queryId` (string)
  - `type` (string: `"EXACT"`, `"RANGE"`, `"PREFIX"`, `"COMPOSITE"`)
  - `field` (string)
  - `value` (any, for EXACT)
  - `min` (any or null, for RANGE)
  - `max` (any or null, for RANGE)
  - `prefix` (string or null, for PREFIX)
  - `compositeQuery` (object or null, for COMPOSITE)
- `queryHistory` (array of objects) — for advisor analysis
- `runAdvisor` (boolean) — if true, run index advisor after queries

**Orchestration Rules (compose all previous concepts):**

1. **Build indexes** — create each index using appropriate builder (Problem-01/02/03)
2. **Execute queries** — run each query using the best available index
3. **Run advisor** — if `runAdvisor: true`, analyze and recommend additional indexes
4. **Build Report:**
   - `indexesBuild` → count
   - `queriesExecuted` → count
   - `indexScanCount` → queries that used an index
   - `fullScanCount` → queries that did full scan
   - `advisorRecommendations` → from advisor (or null)

**Validation:** invalid `indexConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, indexLog, queryLog, report }`. |
| :----------- | :------------------------------------------------------- |

**Sample Input & Output:**

- `runIndexOrchestrator({
  orchestratorId: "IDX-ORCH-01",
  collection: [
    { _id: "1", name: "Rahim", dept: "IT", salary: 70000 },
    { _id: "2", name: "Karim", dept: "HR", salary: 50000 },
    { _id: "3", name: "Nadia", dept: "IT", salary: 80000 },
    { _id: "4", name: "Sadia", dept: "HR", salary: 60000 }
  ],
  indexesToBuild: [
    { fieldName: "dept", indexType: "HASH", composite: false, compositeFields: null, unique: false, sparse: false },
    { fieldName: "salary", indexType: "BTREE", composite: false, compositeFields: null, unique: false, sparse: false }
  ],
  queries: [
    { queryId: "Q1", type: "EXACT", field: "dept", value: "IT", min: null, max: null, prefix: null, compositeQuery: null },
    { queryId: "Q2", type: "RANGE", field: "salary", value: null, min: 55000, max: 75000, prefix: null, compositeQuery: null },
    { queryId: "Q3", type: "EXACT", field: "name", value: "Rahim", min: null, max: null, prefix: null, compositeQuery: null }
  ],
  queryHistory: [
    { queryId: "Q1", filter: { dept: "IT" }, sortField: "salary", frequency: 10 },
    { queryId: "Q3", filter: { name: "Rahim" }, sortField: null, frequency: 7 }
  ],
  runAdvisor: true
})` →

  **Manual Verify:**
  - Build HASH on dept, BTREE on salary
  - Q1: dept=IT → HASH index scan → [Rahim, Nadia]
  - Q2: salary 55k-75k → BTREE range scan → [Karim(50k)✗, Sadia(60k)✓, Rahim(70k)✓]
  - Q3: name=Rahim → no index → full scan → [Rahim]
  - Advisor: name field freq=7 → recommend HASH on name
  - indexScanCount: 2, fullScanCount: 1

  `{
  orchestratorId: "IDX-ORCH-01",
  indexLog: [
    { fieldName: "dept", indexType: "HASH", built: true, entriesIndexed: 4 },
    { fieldName: "salary", indexType: "BTREE", built: true, entriesIndexed: 4 }
  ],
  queryLog: [
    { queryId: "Q1", type: "EXACT", field: "dept", results: [{ _id: "1", name: "Rahim", dept: "IT", salary: 70000 }, { _id: "3", name: "Nadia", dept: "IT", salary: 80000 }], count: 2, scanType: "INDEX_SCAN" },
    { queryId: "Q2", type: "RANGE", field: "salary", results: [{ _id: "4", name: "Sadia", salary: 60000, dept: "HR" }, { _id: "1", name: "Rahim", salary: 70000, dept: "IT" }], count: 2, scanType: "RANGE_SCAN" },
    { queryId: "Q3", type: "EXACT", field: "name", results: [{ _id: "1", name: "Rahim", dept: "IT", salary: 70000 }], count: 1, scanType: "FULL_SCAN" }
  ],
  report: {
    indexesBuild: 2,
    queriesExecuted: 3,
    indexScanCount: 2,
    fullScanCount: 1,
    advisorRecommendations: [
      { fields: ["name"], indexType: "HASH", reason: "High usage in equality filters", priorityScore: 7 }
    ]
  }
}`

---
