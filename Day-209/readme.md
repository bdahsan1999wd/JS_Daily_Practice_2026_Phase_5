# 🎓 JS DAILY PRACTICE – DAY-209

📅 **Goal:** Query Filter Engine (API Design & Data Transformation)
🎯 **Focus:** Query Parameter Parsing • Multi-Field Filtering • Range Filters • Search • Dynamic Filter Composition

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔍 Basic Field Filter

⚠️ **Function Name:** `filterByField()`

| Input      | `records` (array of objects), `filters` (object) |
| :--------- | :----------------------------------------------- |
| **Output** | array of objects                                 |

**Rules:**

`records` — non-empty array of objects
`filters` — object where each key is a field name and value is the exact value to match

**Filter Rules:**

- A record PASSES if it matches ALL filter conditions (AND logic)
- Comparison is **strict equality** (`===`) for strings and numbers
- For boolean values — match exactly
- If a filter key does not exist on a record → that record FAILS
- Empty `filters` object → return all records unchanged

| Challenge 📢 | Return filtered array. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------- |

**Sample Input & Output:**

- `filterByField([
  { id: "U1", role: "ADMIN", status: "ACTIVE" },
  { id: "U2", role: "USER", status: "ACTIVE" },
  { id: "U3", role: "ADMIN", status: "INACTIVE" }
], { role: "ADMIN", status: "ACTIVE" })` ➔

  `[{ id: "U1", role: "ADMIN", status: "ACTIVE" }]`

---

## 🧩 PROBLEM–02: 📏 Range Filter Engine

⚠️ **Function Name:** `filterByRange()`

| Input      | `records` (array of objects), `rangeFilters` (object) |
| :--------- | :---------------------------------------------------- |
| **Output** | object                                                |

**Rules:**

`records` — non-empty array of objects
`rangeFilters` — object where each key is a field name and value is `{ min, max }`:

- `min` (number or null) — if provided, field value must be `>= min`
- `max` (number or null) — if provided, field value must be `<= max`
- Both can be provided (range), or just one

**Filter Rules:**

- A record PASSES if ALL range conditions are satisfied
- If a field doesn't exist on a record → that record FAILS that filter
- `filteredRecords` → records that pass ALL range filters
- `rejectedRecords` → records that fail ANY range filter

| Challenge 📢 | Return `{ filteredRecords, rejectedRecords, filteredCount, rejectedCount }`. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `filterByRange([
  { name: "A", age: 25, salary: 50000 },
  { name: "B", age: 17, salary: 80000 },
  { name: "C", age: 30, salary: 45000 }
], { age: { min: 18, max: null }, salary: { min: 48000, max: 90000 } })` ➔

  `{
  filteredRecords: [{ name: "A", age: 25, salary: 50000 }],
  rejectedRecords: [
    { name: "B", age: 17, salary: 80000 },
    { name: "C", age: 30, salary: 45000 }
  ],
  filteredCount: 1,
  rejectedCount: 2
}`

---

## 🧩 PROBLEM–03: 🔎 Full-Text Search Engine

⚠️ **Function Name:** `searchRecords()`

| Input      | `records` (array of objects), `searchConfig` (object) |
| :--------- | :---------------------------------------------------- |
| **Output** | object                                                |

**Rules:**

`records` — non-empty array of objects
`searchConfig` object:

- `query` (string, non-empty) — search term
- `searchFields` (array of strings) — which fields to search in
- `caseSensitive` (boolean) — default `false`

**Search Rules:**

- A record MATCHES if the `query` appears as a **substring** in ANY of the `searchFields` values
- If `caseSensitive === false` → convert both query and field value to lowercase before comparison
- Only search fields that exist on the record AND have string values
- `matchScore` → count of how many `searchFields` contain the query (for ranking)
- Sort results by `matchScore` descending

| Challenge 📢 | Return `{ results, totalMatches }` where each result is `{ record, matchScore }`. If invalid → return `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `searchRecords([
  { id: "P1", name: "JavaScript Guide", description: "Learn JavaScript basics" },
  { id: "P2", name: "Python Tutorial", description: "JavaScript vs Python" },
  { id: "P3", name: "Java Cookbook", description: "Advanced Java recipes" }
], { query: "javascript", searchFields: ["name", "description"], caseSensitive: false })` ➔

  `{
  results: [
    { record: { id: "P1", name: "JavaScript Guide", description: "Learn JavaScript basics" }, matchScore: 2 },
    { record: { id: "P2", name: "Python Tutorial", description: "JavaScript vs Python" }, matchScore: 1 }
  ],
  totalMatches: 2
}`

---

## 🧩 PROBLEM–04: 🧩 Composite Filter Builder

⚠️ **Function Name:** `applyCompositeFilter()`

| Input      | `records` (array of objects), `filterConfig` (object) |
| :--------- | :---------------------------------------------------- |
| **Output** | object                                                |

**Rules:**

`records` — non-empty array of objects
`filterConfig` object:

- `exactMatch` (object or null) — field: value pairs (AND logic, Problem-01 style)
- `ranges` (object or null) — field: `{ min, max }` pairs (Problem-02 style)
- `search` (object or null) — `{ query, searchFields, caseSensitive }` (Problem-03 style)
- `operator` (string: "AND" or "OR") — how to combine the three filter types

**Composite Rules:**

- Apply each non-null filter independently to get a set of matching records
- If `operator === "AND"` → record must pass ALL active filters
- If `operator === "OR"` → record must pass AT LEAST ONE active filter (deduplicate results)
- `appliedFilters` → array of filter type names that were active (non-null)

| Challenge 📢 | Return `{ results, totalResults, appliedFilters }`. If invalid → return `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `applyCompositeFilter([
  { id: "E1", department: "IT", salary: 70000, name: "Rahim Dev" },
  { id: "E2", department: "HR", salary: 45000, name: "Karim Manager" },
  { id: "E3", department: "IT", salary: 40000, name: "Nadia Dev" }
], {
  exactMatch: { department: "IT" },
  ranges: { salary: { min: 60000, max: null } },
  search: null,
  operator: "AND"
})` ➔

  `{
  results: [{ id: "E1", department: "IT", salary: 70000, name: "Rahim Dev" }],
  totalResults: 1,
  appliedFilters: ["exactMatch", "ranges"]
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Query Engine

⚠️ **Function Name:** `runQueryEngine()`

| Input      | `dataset` (array of objects), `query` (object) |
| :--------- | :--------------------------------------------- |
| **Output** | object                                         |

**Rules:**

`dataset` — non-empty array of objects
`query` object:

- `filters` (object) — composite filter config (same as Problem-04's `filterConfig`)
- `sortBy` (string or null) — field to sort by
- `sortOrder` (string: "asc" or "desc") — fallback: `"asc"`
- `page` (number, ≥ 1) — fallback: `1`
- `limit` (number, 1–100) — fallback: `10`
- `fields` (array of strings or null) — if provided, only include these fields in output

**Full Query Pipeline:**

1. **Filter** using Problem-04 composite filter logic
2. **Sort** by `sortBy` field if provided
3. **Paginate** — slice for `page` and `limit`
4. **Project** — if `fields` provided, keep only those fields per record

| Challenge 📢 | Return `{ data, pagination: { page, limit, totalMatches, totalPages }, appliedFilters }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `runQueryEngine([
  { id: "P1", category: "TECH", price: 1200, title: "JS Book" },
  { id: "P2", category: "TECH", price: 800, title: "CSS Book" },
  { id: "P3", category: "DESIGN", price: 950, title: "Design Guide" }
], {
  filters: { exactMatch: { category: "TECH" }, ranges: null, search: null, operator: "AND" },
  sortBy: "price",
  sortOrder: "asc",
  page: 1,
  limit: 10,
  fields: ["id", "title", "price"]
})` ➔

  `{
  data: [
    { id: "P2", title: "CSS Book", price: 800 },
    { id: "P1", title: "JS Book", price: 1200 }
  ],
  pagination: {
    page: 1,
    limit: 10,
    totalMatches: 2,
    totalPages: 1
  },
  appliedFilters: ["exactMatch"]
}`

---
