# 🎓 JS DAILY PRACTICE – DAY-239

📅 **Goal:** Aggregation Pipeline (Database Query Simulation)
🎯 **Focus:** Pipeline Stages • Grouping • Accumulator Functions • Data Transformation • Analytics

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔢 Basic Aggregation Stages

⚠️ **Function Name:** `runBasicAggregation()`

| Input      | `collection` (array of objects), `pipeline` (array of objects) |
| :--------- | :------------------------------------------------------------- |
| **Output** | object                                                         |

**Rules:**

`collection` — non-empty array of documents
`pipeline` — array of stage objects, each with ONE stage key

**Supported Stages:**

- **`{ $match: queryObj }`** — filter documents (same operators as Day-238 Problem-01)
- **`{ $project: { field: 1 or 0 } }`** — include (`1`) or exclude (`0`) fields; `_id` included by default unless explicitly set to `0`
- **`{ $sort: { field: 1 or -1 } }`** — sort (1=asc, -1=desc)
- **`{ $limit: N }`** — keep only first N documents
- **`{ $skip: N }`** — skip first N documents
- **`{ $count: "fieldName" }`** — return single doc with count: `{ fieldName: totalDocs }`

**Pipeline Execution Rules:**

- Each stage receives output of the previous stage as input
- Stages are applied in order
- Track `stagesExecuted` — array of `{ stage, inputCount, outputCount }`

Returns `{ result: finalArray, totalStages, stagesExecuted }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the aggregation result object. |
| :----------- | :------------------------------------ |

**Sample Input & Output:**

- `runBasicAggregation([
  { _id: "1", name: "Rahim", dept: "IT", salary: 70000, active: true },
  { _id: "2", name: "Karim", dept: "HR", salary: 50000, active: false },
  { _id: "3", name: "Nadia", dept: "IT", salary: 80000, active: true },
  { _id: "4", name: "Sadia", dept: "HR", salary: 60000, active: true },
  { _id: "5", name: "Rafiq", dept: "IT", salary: 90000, active: true }
], [
  { $match: { active: true } },
  { $sort: { salary: -1 } },
  { $limit: 3 },
  { $project: { name: 1, salary: 1, dept: 1, _id: 0 } }
])` →

  **Manual Verify:**
  - $match active=true: 4 docs (Rahim, Nadia, Sadia, Rafiq)
  - $sort salary desc: [Rafiq(90k), Nadia(80k), Rahim(70k), Sadia(60k)]
  - $limit 3: [Rafiq, Nadia, Rahim]
  - $project: keep name, salary, dept; remove _id

  `{
  result: [
    { name: "Rafiq", salary: 90000, dept: "IT" },
    { name: "Nadia", salary: 80000, dept: "IT" },
    { name: "Rahim", salary: 70000, dept: "IT" }
  ],
  totalStages: 4,
  stagesExecuted: [
    { stage: "$match", inputCount: 5, outputCount: 4 },
    { stage: "$sort", inputCount: 4, outputCount: 4 },
    { stage: "$limit", inputCount: 4, outputCount: 3 },
    { stage: "$project", inputCount: 3, outputCount: 3 }
  ]
}`

---

## 🧩 PROBLEM–02: 📊 Group & Accumulator Stage

⚠️ **Function Name:** `runGroupAggregation()`

| Input      | `collection` (array of objects), `groupConfig` (object) |
| :--------- | :------------------------------------------------------ |
| **Output** | object                                                  |

**Rules:**

`collection` — non-empty array of documents
`groupConfig` object:

- `_id` (string) — field to group by (e.g. `"dept"`) or `null` for global aggregation
- `accumulators` (object) — `{ outputField: { operator, field } }`

**Supported Accumulator Operators:**

- **`$sum`** → sum of field values (if field is `1` → count documents)
- **`$avg`** → average of field values (rounded to 2dp)
- **`$min`** → minimum field value
- **`$max`** → maximum field value
- **`$count`** → count documents in group (same as `$sum: 1`)
- **`$push`** → collect all field values into an array
- **`$first`** → first value in group
- **`$last`** → last value in group

**Group Rules:**

- Group documents by `_id` field value
- If `_id: null` → all documents form one group
- For each group, compute each accumulator
- Returns `{ groups: [{ _id: groupValue, ...accumulatorResults }], groupCount }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the group aggregation result. |
| :----------- | :----------------------------------- |

**Sample Input & Output:**

- `runGroupAggregation([
  { _id: "1", name: "Rahim", dept: "IT", salary: 70000 },
  { _id: "2", name: "Karim", dept: "HR", salary: 50000 },
  { _id: "3", name: "Nadia", dept: "IT", salary: 80000 },
  { _id: "4", name: "Sadia", dept: "HR", salary: 60000 },
  { _id: "5", name: "Rafiq", dept: "IT", salary: 90000 }
], {
  _id: "dept",
  accumulators: {
    totalEmployees: { operator: "$count", field: null },
    totalSalary: { operator: "$sum", field: "salary" },
    avgSalary: { operator: "$avg", field: "salary" },
    maxSalary: { operator: "$max", field: "salary" },
    minSalary: { operator: "$min", field: "salary" },
    names: { operator: "$push", field: "name" }
  }
})` →

  **Manual Verify:**
  - IT group: Rahim(70k), Nadia(80k), Rafiq(90k) → count=3, total=240k, avg=80k, max=90k, min=70k
  - HR group: Karim(50k), Sadia(60k) → count=2, total=110k, avg=55k, max=60k, min=50k

  `{
  groups: [
    { _id: "IT", totalEmployees: 3, totalSalary: 240000, avgSalary: 80000.00, maxSalary: 90000, minSalary: 70000, names: ["Rahim", "Nadia", "Rafiq"] },
    { _id: "HR", totalEmployees: 2, totalSalary: 110000, avgSalary: 55000.00, maxSalary: 60000, minSalary: 50000, names: ["Karim", "Sadia"] }
  ],
  groupCount: 2
}`

- `runGroupAggregation([
  { _id: "1", salary: 70000 },
  { _id: "2", salary: 50000 }
], { _id: null, accumulators: { total: { operator: "$sum", field: "salary" }, count: { operator: "$count", field: null } } })` →

  `{ groups: [{ _id: null, total: 120000, count: 2 }], groupCount: 1 }`

---

## 🧩 PROBLEM–03: 🔄 Advanced Pipeline Stages

⚠️ **Function Name:** `runAdvancedAggregation()`

| Input      | `collection` (array of objects), `pipeline` (array of objects) |
| :--------- | :------------------------------------------------------------- |
| **Output** | object                                                         |

**Rules:**

`collection` — non-empty array of documents
`pipeline` — array of stage objects

**Additional Supported Stages (on top of Problem-01):**

- **`{ $group: groupConfig }`** — group stage (Problem-02 logic)
- **`{ $unwind: "fieldName" }`** — deconstruct array field into separate documents
  - If doc has `tags: ["js", "node"]` → produces 2 docs, one with `tags: "js"` and one with `tags: "node"`
  - Docs without the field or with empty array → excluded
- **`{ $addFields: { newField: expression } }`** — add computed fields
  - Supported expressions:
    - `{ $multiply: ["$field1", value] }` → multiply field by value
    - `{ $concat: ["$field1", " ", "$field2"] }` → string concatenation (prefix field names with `$`)
    - `{ $toUpper: "$field" }` → uppercase string field
    - `{ $toLower: "$field" }` → lowercase string field
    - `{ $subtract: ["$field1", "$field2"] }` → subtraction
- **`{ $replaceRoot: { newRoot: "$fieldName" } }`** — replace document root with nested object field

Returns `{ result: finalArray, totalStages, stagesExecuted }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the advanced aggregation result. |
| :----------- | :-------------------------------------- |

**Sample Input & Output:**

- `runAdvancedAggregation([
  { _id: "1", name: "rahim", salary: 50000, bonus: 5000, tags: ["js", "node"] },
  { _id: "2", name: "karim", salary: 60000, bonus: 6000, tags: ["python"] },
  { _id: "3", name: "nadia", salary: 70000, bonus: 7000, tags: ["js", "react"] }
], [
  { $addFields: { fullName: { $toUpper: "$name" }, totalComp: { $multiply: ["$salary", 1.1] } } },
  { $unwind: "tags" },
  { $group: { _id: "tags", avgComp: { operator: "$avg", field: "totalComp" }, members: { operator: "$push", field: "fullName" } } },
  { $sort: { avgComp: -1 } }
])` →

  **Manual Verify:**
  - $addFields: fullName=uppercase(name), totalComp=salary*1.1
    - Rahim: fullName=RAHIM, totalComp=55000
    - Karim: fullName=KARIM, totalComp=66000
    - Nadia: fullName=NADIA, totalComp=77000
  - $unwind tags:
    - {RAHIM, 55000, "js"}, {RAHIM, 55000, "node"}, {KARIM, 66000, "python"}, {NADIA, 77000, "js"}, {NADIA, 77000, "react"}
  - $group by tags:
    - js: avg=(55000+77000)/2=66000, members=[RAHIM, NADIA]
    - node: avg=55000, members=[RAHIM]
    - python: avg=66000, members=[KARIM]
    - react: avg=77000, members=[NADIA]
  - $sort avgComp desc: react(77k), js(66k), python(66k), node(55k)

  `{
  result: [
    { _id: "react", avgComp: 77000.00, members: ["NADIA"] },
    { _id: "js", avgComp: 66000.00, members: ["RAHIM", "NADIA"] },
    { _id: "python", avgComp: 66000.00, members: ["KARIM"] },
    { _id: "node", avgComp: 55000.00, members: ["RAHIM"] }
  ],
  totalStages: 4,
  stagesExecuted: [
    { stage: "$addFields", inputCount: 3, outputCount: 3 },
    { stage: "$unwind", inputCount: 3, outputCount: 5 },
    { stage: "$group", inputCount: 5, outputCount: 4 },
    { stage: "$sort", inputCount: 4, outputCount: 4 }
  ]
}`

---

## 🧩 PROBLEM–04: 📈 Analytics Pipeline

⚠️ **Function Name:** `runAnalyticsPipeline()`

| Input      | `collection` (array of objects), `analyticsConfig` (object) |
| :--------- | :---------------------------------------------------------- |
| **Output** | object                                                      |

**Rules:**

`collection` — non-empty array of documents
`analyticsConfig` object:

- `metrics` (array of strings) — analytics to compute:
  - `"DISTRIBUTION"` — value distribution for a field
  - `"PERCENTILE"` — 25th, 50th, 75th, 90th percentiles for a numeric field
  - `"TREND"` — count documents per time bucket (by a date-like numeric field)
  - `"CORRELATION"` — basic correlation indicator between two numeric fields
- `field` (string) — primary field for analysis
- `secondField` (string or null) — second field (for CORRELATION)
- `bucketSize` (number or null) — for TREND bucketing

**Metric Definitions:**

- **`"DISTRIBUTION"`** — count occurrences of each unique value of `field`
  - Returns `{ metric: "DISTRIBUTION", field, distribution: { value: count }, mostCommon: value, leastCommon: value }`

- **`"PERCENTILE"`** — sort numeric values, compute percentiles
  - P25 = value at 25% index, P50 = median, P75 = 75% index, P90 = 90% index
  - `index = Math.floor(percentile/100 * array.length)`
  - Returns `{ metric: "PERCENTILE", field, p25, p50, p75, p90, min, max }`

- **`"TREND"`** — group by `Math.floor(doc[field] / bucketSize) * bucketSize` (bucket start)
  - Returns `{ metric: "TREND", field, bucketSize, buckets: [{ bucket: startValue, count }] sorted asc }`

- **`"CORRELATION"`** — simple indicator: compute if fields move together
  - Calculate avg of field and secondField
  - Count docs where BOTH above avg (positive) or BOTH below avg (negative)
  - `correlationScore = (sameDirCount / totalDocs) * 2 - 1` (range -1 to 1, rounded to 2dp)
  - `direction`: `"POSITIVE"` if score > 0.3, `"NEGATIVE"` if < -0.3, else `"WEAK"`
  - Returns `{ metric: "CORRELATION", field, secondField, correlationScore, direction }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return `{ analytics: [metric results], totalDocuments }`. |
| :----------- | :--------------------------------------------------------- |

**Sample Input & Output:**

- `runAnalyticsPipeline([
  { _id: "1", dept: "IT", salary: 70000, experience: 5 },
  { _id: "2", dept: "HR", salary: 50000, experience: 3 },
  { _id: "3", dept: "IT", salary: 80000, experience: 7 },
  { _id: "4", dept: "HR", salary: 60000, experience: 4 },
  { _id: "5", dept: "IT", salary: 90000, experience: 9 },
  { _id: "6", dept: "IT", salary: 55000, experience: 2 }
], {
  metrics: ["DISTRIBUTION", "PERCENTILE", "CORRELATION"],
  field: "salary",
  secondField: "experience",
  bucketSize: null
})` →

  **Manual Verify:**
  - DISTRIBUTION of salary: each is unique → each count=1 (or group dept)
  - Actually DISTRIBUTION on salary: { 70000:1, 50000:1, 80000:1, 60000:1, 90000:1, 55000:1 } → mostCommon=50000 (first alphabetically), all tied
  - PERCENTILE: sorted=[50000,55000,60000,70000,80000,90000]
    - P25=index 1=55000, P50=index 3=70000, P75=index 4=80000, P90=index 5=90000
  - CORRELATION salary vs experience:
    - avgSalary=(70k+50k+80k+60k+90k+55k)/6=67500, avgExp=(5+3+7+4+9+2)/6=5
    - Same dir (both above or both below avg):
      - Doc1: salary70k>67.5k✓, exp5=5(not>5)✗ → different
      - Doc2: salary50k<avg✓, exp3<avg✓ → same (negative)
      - Doc3: salary80k>avg✓, exp7>avg✓ → same (positive)
      - Doc4: salary60k<avg✓, exp4<avg✓ → same (negative)
      - Doc5: salary90k>avg✓, exp9>avg✓ → same (positive)
      - Doc6: salary55k<avg✓, exp2<avg✓ → same (negative)
    - sameDirCount=5, score=(5/6)*2-1=0.67 → POSITIVE

  `{
  analytics: [
    { metric: "DISTRIBUTION", field: "salary", distribution: { "50000": 1, "55000": 1, "60000": 1, "70000": 1, "80000": 1, "90000": 1 }, mostCommon: "50000", leastCommon: "50000" },
    { metric: "PERCENTILE", field: "salary", p25: 55000, p50: 70000, p75: 80000, p90: 90000, min: 50000, max: 90000 },
    { metric: "CORRELATION", field: "salary", secondField: "experience", correlationScore: 0.67, direction: "POSITIVE" }
  ],
  totalDocuments: 6
}`

---

## 🧩 PROBLEM–05: 🏗️ Full Aggregation Orchestrator

⚠️ **Function Name:** `runAggregationOrchestrator()`

| Input      | `orchestratorConfig` (object) |
| :--------- | :---------------------------- |
| **Output** | object                        |

**Rules:**

`orchestratorConfig` object:

- `orchestratorId` (string, non-empty)
- `collection` (array of objects, non-empty)
- `pipelines` (array of objects):
  - `pipelineId` (string)
  - `type` (string: `"BASIC"`, `"GROUP"`, `"ADVANCED"`, `"ANALYTICS"`)
  - `config` (object):
    - `"BASIC"` → `{ pipeline: [stages] }` (Problem-01)
    - `"GROUP"` → `{ groupConfig: object }` (Problem-02)
    - `"ADVANCED"` → `{ pipeline: [stages] }` (Problem-03)
    - `"ANALYTICS"` → `{ analyticsConfig: object }` (Problem-04)

**Orchestration Rules (compose all previous concepts):**

1. Run each pipeline on the ORIGINAL collection (pipelines are independent)
2. For each pipeline, record: `{ pipelineId, type, result, stagesExecuted or groupCount or null }`
3. Build cross-pipeline analytics summary:
   - `totalPipelines` → count
   - `totalDocumentsProcessed` → sum of input documents across all pipeline first stages
   - `pipelineTypeBreakdown` → `{ BASIC: N, GROUP: N, ADVANCED: N, ANALYTICS: N }`
   - `largestResultSet` → pipelineId with most output documents/groups

**Validation:** invalid `orchestratorConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, pipelineResults, summary }`. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

- `runAggregationOrchestrator({
  orchestratorId: "AGG-ORCH-01",
  collection: [
    { _id: "1", name: "Rahim", dept: "IT", salary: 70000, active: true },
    { _id: "2", name: "Karim", dept: "HR", salary: 50000, active: false },
    { _id: "3", name: "Nadia", dept: "IT", salary: 80000, active: true },
    { _id: "4", name: "Sadia", dept: "HR", salary: 60000, active: true }
  ],
  pipelines: [
    {
      pipelineId: "P1",
      type: "BASIC",
      config: {
        pipeline: [
          { $match: { active: true } },
          { $sort: { salary: -1 } },
          { $project: { name: 1, salary: 1, _id: 0 } }
        ]
      }
    },
    {
      pipelineId: "P2",
      type: "GROUP",
      config: {
        groupConfig: {
          _id: "dept",
          accumulators: {
            count: { operator: "$count", field: null },
            avgSalary: { operator: "$avg", field: "salary" }
          }
        }
      }
    },
    {
      pipelineId: "P3",
      type: "ANALYTICS",
      config: {
        analyticsConfig: {
          metrics: ["DISTRIBUTION", "PERCENTILE"],
          field: "salary",
          secondField: null,
          bucketSize: null
        }
      }
    }
  ]
})` →

  **Manual Verify:**
  - P1: match active(3 docs) → sort salary desc → project → 3 rows
  - P2: group by dept → IT(Rahim70k,Nadia80k)=count2,avg75k | HR(Karim50k,Sadia60k)=count2,avg55k → 2 groups
  - P3: DISTRIBUTION salary(all unique,count=1 each) + PERCENTILE
  - largestResultSet: P1 (3 rows) vs P2 (2 groups) vs P3 (2 metrics) → P1

  `{
  orchestratorId: "AGG-ORCH-01",
  pipelineResults: [
    {
      pipelineId: "P1",
      type: "BASIC",
      result: [{ name: "Nadia", salary: 80000 }, { name: "Rahim", salary: 70000 }, { name: "Sadia", salary: 60000 }],
      stagesExecuted: [
        { stage: "$match", inputCount: 4, outputCount: 3 },
        { stage: "$sort", inputCount: 3, outputCount: 3 },
        { stage: "$project", inputCount: 3, outputCount: 3 }
      ]
    },
    {
      pipelineId: "P2",
      type: "GROUP",
      result: [
        { _id: "IT", count: 2, avgSalary: 75000.00 },
        { _id: "HR", count: 2, avgSalary: 55000.00 }
      ],
      groupCount: 2
    },
    {
      pipelineId: "P3",
      type: "ANALYTICS",
      result: {
        analytics: [
          { metric: "DISTRIBUTION", field: "salary", distribution: { "50000": 1, "60000": 1, "70000": 1, "80000": 1 }, mostCommon: "50000", leastCommon: "50000" },
          { metric: "PERCENTILE", field: "salary", p25: 55000, p50: 65000, p75: 75000, p90: 80000, min: 50000, max: 80000 }
        ],
        totalDocuments: 4
      },
      stagesExecuted: null
    }
  ],
  summary: {
    totalPipelines: 3,
    totalDocumentsProcessed: 12,
    pipelineTypeBreakdown: { BASIC: 1, GROUP: 1, ADVANCED: 0, ANALYTICS: 1 },
    largestResultSet: "P1"
  }
}`

---