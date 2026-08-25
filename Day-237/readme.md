# 🎓 JS DAILY PRACTICE – DAY-237

📅 **Goal:** Relational Data Manager (Database Query Simulation)
🎯 **Focus:** One-to-Many • Many-to-Many • JOIN Simulation • Foreign Keys • Relational Integrity

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔗 One-to-Many Relation

⚠️ **Function Name:** `createOneToManyRelation()`

| Input      | `relationConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object (relation manager) |

**Rules:**

`relationConfig` object:

- `parentEntity` (string, non-empty) — e.g. `"User"`
- `childEntity` (string, non-empty) — e.g. `"Order"`
- `foreignKey` (string, non-empty) — field in child that references parent (e.g. `"userId"`)

Return a relation manager object with:

- `addParent(doc)` — add a parent record, auto-generate `id: parentEntity + "_" + autoIndex`
- `addChild(doc)` — add a child record (must have `foreignKey` field pointing to valid parent id)
- `getChildren(parentId)` — get all children belonging to a parent
- `getParent(childId)` — get the parent of a child record
- `deleteParent(parentId, cascade)` — delete parent; if `cascade: true` delete its children too
- `getRelationStats()` — return counts and orphan info

**Operation Rules:**

- `addParent(doc)` → auto-id, returns `{ inserted: true, doc: { id, ...doc } }`
- `addChild(doc)`:
  - Must have `foreignKey` field
  - `foreignKey` value must match an existing parent id
  - Auto-generate `id: childEntity + "_" + autoIndex`
  - If parent not found → `{ error: "Parent not found: " + foreignKeyValue }`
  - Else → `{ inserted: true, doc: { id, ...doc } }`
- `getChildren(parentId)` → `{ parentId, children: [docs], count }`
- `getParent(childId)`:
  - Find child by id, then find its parent via `foreignKey`
  - Returns `{ childId, parent: doc }` or `{ error: "Child not found" }`
- `deleteParent(parentId, cascade)`:
  - If `cascade: false` AND children exist → `{ error: "Cannot delete parent with children. Use cascade: true" }`
  - If `cascade: true` → delete parent and all children, return `{ deleted: true, parentId, childrenDeleted: count }`
  - If parent not found → `{ error: "Parent not found" }`
- `getRelationStats()` → `{ parentCount, childCount, avgChildrenPerParent: rounded to 2dp, parentsWithNoChildren: count }`

**Validation:** invalid `relationConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the relation manager object with all 6 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const rel = createOneToManyRelation({
  parentEntity: "User",
  childEntity: "Order",
  foreignKey: "userId",
});

rel.addParent({ name: "Rahim" });
// → { inserted: true, doc: { id: "User_1", name: "Rahim" } }

rel.addParent({ name: "Karim" });
// → { inserted: true, doc: { id: "User_2", name: "Karim" } }

rel.addChild({ userId: "User_1", amount: 500 });
// → { inserted: true, doc: { id: "Order_1", userId: "User_1", amount: 500 } }

rel.addChild({ userId: "User_1", amount: 300 });
// → { inserted: true, doc: { id: "Order_2", userId: "User_1", amount: 300 } }

rel.addChild({ userId: "User_99", amount: 100 });
// → { error: "Parent not found: User_99" }

rel.getChildren("User_1");
// → { parentId: "User_1", children: [{ id: "Order_1", ... }, { id: "Order_2", ... }], count: 2 }

rel.getParent("Order_1");
// → { childId: "Order_1", parent: { id: "User_1", name: "Rahim" } }

rel.deleteParent("User_1", false);
// → { error: "Cannot delete parent with children. Use cascade: true" }

rel.deleteParent("User_1", true);
// → { deleted: true, parentId: "User_1", childrenDeleted: 2 }

rel.getRelationStats();
// → { parentCount: 1, childCount: 0, avgChildrenPerParent: 0.00, parentsWithNoChildren: 1 }
```

---

## 🧩 PROBLEM–02: 🔀 Many-to-Many Relation

⚠️ **Function Name:** `createManyToManyRelation()`

| Input      | `relationConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object (relation manager) |

**Rules:**

`relationConfig` object:

- `entityA` (string, non-empty) — e.g. `"Student"`
- `entityB` (string, non-empty) — e.g. `"Course"`
- `junctionTable` (string, non-empty) — e.g. `"StudentCourse"`

Return a relation manager with:

- `addEntityA(doc)` — add entity A record
- `addEntityB(doc)` — add entity B record
- `link(entityAId, entityBId, metadata)` — create a junction record linking A and B
- `unlink(entityAId, entityBId)` — remove the junction record
- `getLinkedB(entityAId)` — get all B records linked to an A
- `getLinkedA(entityBId)` — get all A records linked to a B
- `getJunctionStats()` — return stats about the junction table

**Operation Rules:**

- `addEntityA(doc)` → auto-id: `entityA + "_" + autoIndex`, returns `{ inserted: true, doc }`
- `addEntityB(doc)` → auto-id: `entityB + "_" + autoIndex`, returns `{ inserted: true, doc }`
- `link(entityAId, entityBId, metadata)`:
  - Both ids must exist in their respective stores
  - If link already exists → `{ linked: false, reason: "Link already exists" }`
  - Else → create junction: `{ junctionId: junctionTable + "_" + autoIndex, entityAId, entityBId, ...metadata, linkedAt: "2025-01-01T00:00:00Z" }`
  - Returns `{ linked: true, junction: junctionDoc }`
- `unlink(entityAId, entityBId)`:
  - Returns `{ unlinked: true, entityAId, entityBId }` or `{ error: "Link not found" }`
- `getLinkedB(entityAId)` → `{ entityAId, linkedB: [B docs with junction metadata], count }`
- `getLinkedA(entityBId)` → `{ entityBId, linkedA: [A docs with junction metadata], count }`
- `getJunctionStats()` → `{ totalLinks, uniqueAIds: count, uniqueBIds: count, avgLinksPerA: rounded to 2dp }`

**Validation:** invalid `relationConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the many-to-many relation manager with all 7 methods. |
| :----------- | :----------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const rel = createManyToManyRelation({
  entityA: "Student",
  entityB: "Course",
  junctionTable: "StudentCourse",
});

rel.addEntityA({ name: "Rahim" });
// → { inserted: true, doc: { id: "Student_1", name: "Rahim" } }

rel.addEntityA({ name: "Karim" });
// → { inserted: true, doc: { id: "Student_2", name: "Karim" } }

rel.addEntityB({ title: "JavaScript" });
// → { inserted: true, doc: { id: "Course_1", title: "JavaScript" } }

rel.addEntityB({ title: "Python" });
// → { inserted: true, doc: { id: "Course_2", title: "Python" } }

rel.link("Student_1", "Course_1", { grade: null });
// → { linked: true, junction: { junctionId: "StudentCourse_1", entityAId: "Student_1", entityBId: "Course_1", grade: null, linkedAt: "2025-01-01T00:00:00Z" } }

rel.link("Student_1", "Course_2", { grade: null });
rel.link("Student_2", "Course_1", { grade: "A" });

rel.getLinkedB("Student_1");
// → { entityAId: "Student_1", linkedB: [{ id: "Course_1", title: "JavaScript", junction: { grade: null } }, { id: "Course_2", title: "Python", junction: { grade: null } }], count: 2 }

rel.getLinkedA("Course_1");
// → { entityBId: "Course_1", linkedA: [{ id: "Student_1", name: "Rahim", junction: { grade: null } }, { id: "Student_2", name: "Karim", junction: { grade: "A" } }], count: 2 }

rel.getJunctionStats();
// → { totalLinks: 3, uniqueAIds: 2, uniqueBIds: 2, avgLinksPerA: 1.50 }
```

---

## 🧩 PROBLEM–03: 🔄 JOIN Simulator

⚠️ **Function Name:** `simulateJoins()`

| Input      | `tables` (object), `joinConfig` (object) |
| :--------- | :--------------------------------------- |
| **Output** | object                                   |

**Rules:**

`tables` — object where each key is a table name and value is array of row objects
`joinConfig` object:

- `joinType` (string: `"INNER"`, `"LEFT"`, `"RIGHT"`, `"FULL"`)
- `tableA` (string) — left table name
- `tableB` (string) — right table name
- `onA` (string) — field in tableA to join on
- `onB` (string) — field in tableB to join on
- `selectFields` (array of strings or null) — fields to include (prefix with `"tableA."` or `"tableB."`)

**JOIN Definitions:**

- **`"INNER"`** — only rows where `tableA[onA] === tableB[onB]` (both match)
- **`"LEFT"`** — all rows from tableA; if no match in B → B fields are `null`
- **`"RIGHT"`** — all rows from tableB; if no match in A → A fields are `null`
- **`"FULL"`** — all rows from both; unmatched sides filled with `null`

**Output Row Format:**

Merge matched rows: prefix fields with table name to avoid collisions:

- `tableA.fieldName` → keep as-is if `selectFields` null; else filter by `selectFields`
- If `selectFields` provided → only include those fields (use dot notation as key)

Returns `{ joinType, rowCount, rows: [merged row objects] }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the join result object. If tables not found → return `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------- |

**Sample Input & Output:**

- `simulateJoins(
  {
    users: [
      { id: "U1", name: "Rahim", deptId: "D1" },
      { id: "U2", name: "Karim", deptId: "D2" },
      { id: "U3", name: "Nadia", deptId: "D3" }
    ],
    departments: [
      { id: "D1", deptName: "IT" },
      { id: "D2", deptName: "HR" }
    ]
  },
  { joinType: "LEFT", tableA: "users", tableB: "departments", onA: "deptId", onB: "id", selectFields: null }
)` →

  **Manual Verify:**
  - U1 deptId=D1 → matches D1(IT) ✓
  - U2 deptId=D2 → matches D2(HR) ✓
  - U3 deptId=D3 → no match → B fields null

  `{
  joinType: "LEFT",
  rowCount: 3,
  rows: [
    { "users.id": "U1", "users.name": "Rahim", "users.deptId": "D1", "departments.id": "D1", "departments.deptName": "IT" },
    { "users.id": "U2", "users.name": "Karim", "users.deptId": "D2", "departments.id": "D2", "departments.deptName": "HR" },
    { "users.id": "U3", "users.name": "Nadia", "users.deptId": "D3", "departments.id": null, "departments.deptName": null }
  ]
}`

- `simulateJoins(
  {
    users: [{ id: "U1", name: "Rahim", deptId: "D1" }],
    departments: [{ id: "D1", deptName: "IT" }, { id: "D2", deptName: "HR" }]
  },
  { joinType: "INNER", tableA: "users", tableB: "departments", onA: "deptId", onB: "id", selectFields: ["users.name", "departments.deptName"] }
)` →

  `{
  joinType: "INNER",
  rowCount: 1,
  rows: [{ "users.name": "Rahim", "departments.deptName": "IT" }]
}`

---

## 🧩 PROBLEM–04: 🛡️ Referential Integrity Engine

⚠️ **Function Name:** `createIntegrityEngine()`

| Input      | `schemaConfig` (object)   |
| :--------- | :------------------------ |
| **Output** | object (integrity engine) |

**Rules:**

`schemaConfig` object:

- `tables` (array of objects):
  - `name` (string)
  - `primaryKey` (string)
  - `foreignKeys` (array of objects or null):
    - `field` (string) — field in this table
    - `references` (string) — `"tableName.primaryKeyField"` format
    - `onDelete` (string: `"RESTRICT"`, `"CASCADE"`, `"SET_NULL"`)

Return an integrity engine object with:

- `insert(tableName, doc)` — insert with FK validation
- `delete(tableName, id)` — delete with referential integrity check
- `seed(tableName, docs)` — bulk insert without FK validation (for setup)
- `validate()` — check entire DB for integrity violations
- `getTableData(tableName)` — return all records in a table

**Integrity Rules:**

- `insert(tableName, doc)`:
  - For each FK field in the table's schema:
    - If FK value is not null → check that referenced record exists
    - If not found → `{ error: "Foreign key violation: " + field + " references non-existent " + references }`
  - If all pass → insert, return `{ inserted: true, doc }`

- `delete(tableName, id)`:
  - Find all tables that have FK referencing this table
  - Check if any records in those tables reference this id
  - Based on `onDelete`:
    - `"RESTRICT"` → `{ error: "Cannot delete: referenced by " + referencing table }`
    - `"CASCADE"` → delete this record AND all referencing records, return `{ deleted: true, id, cascadeDeleted: { tableName: count } }`
    - `"SET_NULL"` → delete this record, set FK field to null in referencing records, return `{ deleted: true, id, setNullCount: count }`

- `validate()` → check all FKs in all tables, return `{ valid: boolean, violations: [{ table, field, value, references }] }`
- `getTableData(tableName)` → array of all records or `{ error: "Table not found" }`

**Validation:** invalid `schemaConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the integrity engine object with all 5 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const engine = createIntegrityEngine({
  tables: [
    { name: "users", primaryKey: "id", foreignKeys: null },
    {
      name: "orders",
      primaryKey: "id",
      foreignKeys: [
        { field: "userId", references: "users.id", onDelete: "CASCADE" },
      ],
    },
    {
      name: "items",
      primaryKey: "id",
      foreignKeys: [
        { field: "orderId", references: "orders.id", onDelete: "SET_NULL" },
      ],
    },
  ],
});

engine.seed("users", [
  { id: "U1", name: "Rahim" },
  { id: "U2", name: "Karim" },
]);
engine.seed("orders", [{ id: "O1", userId: "U1", amount: 500 }]);
engine.seed("items", [{ id: "I1", orderId: "O1", product: "Book" }]);

engine.insert("orders", { id: "O2", userId: "U99", amount: 100 });
// U99 doesn't exist → FK violation
// → { error: "Foreign key violation: userId references non-existent users.id" }

engine.insert("orders", { id: "O2", userId: "U2", amount: 300 });
// → { inserted: true, doc: { id: "O2", userId: "U2", amount: 300 } }

engine.delete("users", "U1");
// CASCADE: delete U1 → cascade delete O1 → SET_NULL on items (I1.orderId = null) →

// { deleted: true, id: "U1", cascadeDeleted: { orders: 1 } }

engine.getTableData("items");
// I1.orderId was SET_NULL when O1 was cascade-deleted
// → [{ id: "I1", orderId: null, product: "Book" }]

engine.validate();
// → { valid: true, violations: [] }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Relational DB Orchestrator

⚠️ **Function Name:** `runRelationalDBOrchestrator()`

| Input      | `relationalConfig` (object) |
| :--------- | :-------------------------- |
| **Output** | object                      |

**Rules:**

`relationalConfig` object:

- `dbId` (string, non-empty)
- `schema` (array of objects) — same shape as Problem-04 `tables`
- `seedData` (object) — `{ tableName: [records] }` for initial seeding
- `operations` (array of objects):
  - `opId` (string)
  - `type` (string: `"INSERT"`, `"DELETE"`, `"JOIN"`, `"VALIDATE"`)
  - `table` (string, for INSERT/DELETE)
  - `data` (object, for INSERT)
  - `id` (string, for DELETE)
  - `joinConfig` (object, for JOIN — same as Problem-03)
- `integrityCheck` (boolean) — if true, run `validate()` after all operations

**Orchestration Rules (compose all previous concepts):**

1. **Setup integrity engine** (Problem-04) with schema
2. **Seed** initial data using `seed()`
3. **Process operations** sequentially:
   - `"INSERT"` → `engine.insert(table, data)`
   - `"DELETE"` → `engine.delete(table, id)` (with integrity rules)
   - `"JOIN"` → `simulateJoins(allTableData, joinConfig)` (Problem-03)
   - `"VALIDATE"` → `engine.validate()`
4. **Final integrity check** if `integrityCheck: true`
5. **Build Report:**
   - `operationSummary` → `{ total, success, failed }`
   - `finalTableStats` → `{ tableName: recordCount }` for each table
   - `integrityResult` → result of final validate (or null if not requested)

**Validation:** invalid `relationalConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ dbId, operationLog, report }` where `operationLog` is array of `{ opId, type, success, result }`. |
| :----------- | :---------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runRelationalDBOrchestrator({
  dbId: "REL-DB-01",
  schema: [
    { name: "users", primaryKey: "id", foreignKeys: null },
    { name: "posts", primaryKey: "id", foreignKeys: [{ field: "authorId", references: "users.id", onDelete: "CASCADE" }] }
  ],
  seedData: {
    users: [{ id: "U1", name: "Rahim" }, { id: "U2", name: "Karim" }],
    posts: [{ id: "P1", authorId: "U1", title: "JS Tips" }, { id: "P2", authorId: "U1", title: "Node Guide" }]
  },
  operations: [
    { opId: "OP-1", type: "INSERT", table: "posts", data: { id: "P3", authorId: "U2", title: "Python Basics" }, id: null, joinConfig: null },
    { opId: "OP-2", type: "DELETE", table: "users", id: "U1", data: null, joinConfig: null },
    { opId: "OP-3", type: "JOIN", table: null, data: null, id: null, joinConfig: { joinType: "LEFT", tableA: "users", tableB: "posts", onA: "id", onB: "authorId", selectFields: ["users.name", "posts.title"] } },
    { opId: "OP-4", type: "VALIDATE", table: null, data: null, id: null, joinConfig: null }
  ],
  integrityCheck: true
})` →

  **Manual Verify:**
  - OP-1: INSERT P3 with authorId=U2 → U2 exists ✓ → success
  - OP-2: DELETE U1 → CASCADE → P1 and P2 deleted
  - OP-3: LEFT JOIN users+posts on id=authorId → only U2+P3 match; (U1 gone)
  - OP-4: VALIDATE → all FKs valid
  - Final: users=[U2], posts=[P3]

  `{
  dbId: "REL-DB-01",
  operationLog: [
    { opId: "OP-1", type: "INSERT", success: true, result: { inserted: true, doc: { id: "P3", authorId: "U2", title: "Python Basics" } } },
    { opId: "OP-2", type: "DELETE", success: true, result: { deleted: true, id: "U1", cascadeDeleted: { posts: 2 } } },
    { opId: "OP-3", type: "JOIN", success: true, result: { joinType: "LEFT", rowCount: 1, rows: [{ "users.name": "Karim", "posts.title": "Python Basics" }] } },
    { opId: "OP-4", type: "VALIDATE", success: true, result: { valid: true, violations: [] } }
  ],
  report: {
    operationSummary: { total: 4, success: 4, failed: 0 },
    finalTableStats: { users: 1, posts: 1 },
    integrityResult: { valid: true, violations: [] }
  }
}`

---
