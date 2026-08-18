# 🎓 JS DAILY PRACTICE – DAY-230

📅 **Goal:** Repository + Service Layer (Full Stack Integration Patterns)
🎯 **Focus:** Repository Pattern • Service Layer • Separation of Concerns • Business Logic • Data Access Abstraction

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🗄️ Base Repository

⚠️ **Function Name:** `createRepository()`

| Input      | `repoConfig` (object)   |
| :--------- | :---------------------- |
| **Output** | object (repository)     |

**Rules:**

`repoConfig` object:

- `entityName` (string, non-empty) — e.g. `"User"`, `"Order"`
- `primaryKey` (string, non-empty) — field used as unique identifier (e.g. `"id"`)

Return a repository object with these methods:

- `save(entity)` — insert or update (upsert) an entity
- `findById(id)` — find entity by primary key value
- `findAll(filterFn)` — return all entities, optionally filtered by a predicate function
- `deleteById(id)` — remove entity by primary key
- `exists(id)` — check if entity with given id exists
- `count(filterFn)` — count entities, optionally filtered

**Operation Rules:**

- `save(entity)`:
  - `entity` must be a non-null object with the `primaryKey` field present
  - If entity with same id exists → UPDATE (merge fields), return `{ operation: "UPDATE", entity }`
  - If not exists → INSERT, return `{ operation: "INSERT", entity }`
  - If `primaryKey` field missing → `{ error: "Primary key field missing: " + primaryKey }`

- `findById(id)` → `{ found: true, entity }` or `{ found: false, id }`
- `findAll(filterFn)` → if `filterFn` provided, return only matching entities; else return all; returns `{ entities, count }`
- `deleteById(id)` → `{ deleted: true, id }` or `{ error: "Entity not found" }`
- `exists(id)` → `{ id, exists: boolean }`
- `count(filterFn)` → number (filtered or total)

**Validation:** invalid `repoConfig` → return `"Invalid Input"` from factory. Method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the repository object maintaining internal entity store. |
| :----------- | :------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const userRepo = createRepository({ entityName: "User", primaryKey: "id" });

userRepo.save({ id: "U1", name: "Rahim", age: 25 });
// → { operation: "INSERT", entity: { id: "U1", name: "Rahim", age: 25 } }

userRepo.save({ id: "U2", name: "Karim", age: 30 });
// → { operation: "INSERT", entity: { id: "U2", name: "Karim", age: 30 } }

userRepo.save({ id: "U1", age: 26 });
// → { operation: "UPDATE", entity: { id: "U1", name: "Rahim", age: 26 } }

userRepo.findById("U1");
// → { found: true, entity: { id: "U1", name: "Rahim", age: 26 } }

userRepo.findAll(e => e.age > 25);
// → { entities: [{ id: "U2", name: "Karim", age: 30 }], count: 1 }

userRepo.exists("U3");
// → { id: "U3", exists: false }

userRepo.count(); // → 2
userRepo.count(e => e.age >= 26); // → 2

userRepo.deleteById("U2");
// → { deleted: true, id: "U2" }
```

---

## 🧩 PROBLEM–02: 🔍 Specialized Repository

⚠️ **Function Name:** `createSpecializedRepository()`

| Input      | `repoConfig` (object)  |
| :--------- | :--------------------- |
| **Output** | object (repository)    |

**Rules:**

`repoConfig` object:

- `entityName` (string, non-empty)
- `primaryKey` (string, non-empty)
- `indexes` (array of strings) — fields to create indexes on for fast lookup

Extend the base repository (Problem-01 logic) with these additional methods:

- `findByField(fieldName, value)` — find all entities where `field === value`
- `findByRange(fieldName, min, max)` — find entities where `min <= field <= max`
- `findWithPagination(page, limit, sortBy, sortOrder)` — paginated + sorted results
- `bulkSave(entities)` — save multiple entities at once
- `bulkDelete(ids)` — delete multiple entities by id array

**Additional Operation Rules:**

- `findByField(fieldName, value)` → `{ fieldName, value, entities, count }`
- `findByRange(fieldName, min, max)`:
  - `min`/`max` can be null (no bound)
  - Returns `{ fieldName, min, max, entities, count }`
- `findWithPagination(page, limit, sortBy, sortOrder)`:
  - Same pagination logic as Day-208 Problem-04
  - Returns `{ entities: pagedData, pagination: { page, limit, totalItems, totalPages, hasNextPage, hasPrevPage } }`
- `bulkSave(entities)` → `{ saved: count, results: [{ operation: "INSERT"/"UPDATE", entity }] }`
- `bulkDelete(ids)` → `{ deleted: count, failed: count, results: [{ id, deleted: boolean }] }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the specialized repository object with all base + additional methods. |
| :----------- | :--------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const productRepo = createSpecializedRepository({
  entityName: "Product",
  primaryKey: "id",
  indexes: ["category", "price"]
});

productRepo.bulkSave([
  { id: "P1", name: "JS Book", category: "TECH", price: 500 },
  { id: "P2", name: "CSS Guide", category: "TECH", price: 300 },
  { id: "P3", name: "Design Basics", category: "DESIGN", price: 450 }
]);
// → { saved: 3, results: [{ operation: "INSERT", entity: {...} }, ...] }

productRepo.findByField("category", "TECH");
// → { fieldName: "category", value: "TECH", entities: [{ id: "P1", ... }, { id: "P2", ... }], count: 2 }

productRepo.findByRange("price", 350, 600);
// → { fieldName: "price", min: 350, max: 600, entities: [{ id: "P1", price: 500 }, { id: "P3", price: 450 }], count: 2 }

productRepo.findWithPagination(1, 2, "price", "asc");
// → {
//   entities: [{ id: "P2", price: 300 }, { id: "P3", price: 450 }],
//   pagination: { page: 1, limit: 2, totalItems: 3, totalPages: 2, hasNextPage: true, hasPrevPage: false }
// }

productRepo.bulkDelete(["P1", "P99"]);
// → { deleted: 1, failed: 1, results: [{ id: "P1", deleted: true }, { id: "P99", deleted: false }] }
```

---

## 🧩 PROBLEM–03: ⚙️ Service Layer

⚠️ **Function Name:** `createService()`

| Input      | `serviceConfig` (object) |
| :--------- | :----------------------- |
| **Output** | object (service)         |

**Rules:**

`serviceConfig` object:

- `serviceName` (string, non-empty)
- `repository` (object) — a repository instance (from Problem-01 or 02)
- `businessRules` (array of objects):
  - `ruleName` (string)
  - `validate` (function) — takes entity data, returns `{ valid: boolean, reason: string or null }`

Return a service object with these methods:

- `create(data)` — apply business rules then save via repository
- `getById(id)` — fetch from repository
- `getAll(filterFn)` — fetch all from repository with optional filter
- `update(id, data)` — validate + update via repository
- `remove(id)` — delete via repository
- `applyBusinessRules(data)` — run all rules against data, return validation result

**Service Layer Rules:**

- `applyBusinessRules(data)`:
  - Run each rule's `validate(data)` function
  - Collect ALL failing rules
  - Returns `{ valid: boolean, violations: [{ ruleName, reason }] }`

- `create(data)`:
  - First run `applyBusinessRules(data)`
  - If any violation → return `{ created: false, violations }`
  - If all pass → call `repository.save(data)`, return `{ created: true, entity }`

- `update(id, data)`:
  - First check if entity exists via `repository.findById(id)`
  - If not found → `{ updated: false, reason: "Entity not found" }`
  - Merge existing entity with new `data`, run `applyBusinessRules` on merged entity
  - If violation → `{ updated: false, violations }`
  - If pass → `repository.save(mergedEntity)`, return `{ updated: true, entity }`

- `getById(id)` → repository result directly
- `getAll(filterFn)` → repository result directly
- `remove(id)` → repository result directly

**Validation:** invalid `serviceConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the service object with all 6 methods. |
| :----------- | :--------------------------------------------- |

**Sample Input & Output:**

```javascript
const userRepo = createRepository({ entityName: "User", primaryKey: "id" });

const userService = createService({
  serviceName: "UserService",
  repository: userRepo,
  businessRules: [
    {
      ruleName: "AgeRule",
      validate: (data) => data.age >= 18
        ? { valid: true, reason: null }
        : { valid: false, reason: "User must be at least 18 years old" }
    },
    {
      ruleName: "NameRule",
      validate: (data) => data.name && data.name.length >= 3
        ? { valid: true, reason: null }
        : { valid: false, reason: "Name must be at least 3 characters" }
    }
  ]
});

userService.create({ id: "U1", name: "Rahim", age: 25 });
// → { created: true, entity: { id: "U1", name: "Rahim", age: 25 } }

userService.create({ id: "U2", name: "Al", age: 15 });
// Both rules fail:
// → { created: false, violations: [
//     { ruleName: "AgeRule", reason: "User must be at least 18 years old" },
//     { ruleName: "NameRule", reason: "Name must be at least 3 characters" }
//   ] }

userService.update("U1", { age: 17 });
// AgeRule fails on merged entity:
// → { updated: false, violations: [{ ruleName: "AgeRule", reason: "User must be at least 18 years old" }] }

userService.applyBusinessRules({ id: "U3", name: "Nadia", age: 22 });
// → { valid: true, violations: [] }
```

---

## 🧩 PROBLEM–04: 🔗 Unit of Work Pattern

⚠️ **Function Name:** `createUnitOfWork()`

| Input      | `repositories` (object) |
| :--------- | :---------------------- |
| **Output** | object (unit of work)   |

**Rules:**

`repositories` — object where each key is an entity name and value is a repository instance:
```javascript
{ User: userRepo, Order: orderRepo }
```

Return a unit of work object with:

- `getRepository(entityName)` — return a specific repository
- `beginTransaction()` — start a transaction (snapshot current state)
- `commitTransaction()` — finalize all changes since `beginTransaction`
- `rollbackTransaction()` — revert all changes to the snapshot
- `executeTransaction(operationsFn)` — run a function of operations atomically

**Transaction Rules:**

- `beginTransaction()`:
  - Snapshot the current state of ALL repositories
  - Returns `{ transactionId: "TXN-" + autoIndex, started: true }`
  - If transaction already active → `{ error: "Transaction already in progress" }`

- `commitTransaction()`:
  - If no active transaction → `{ error: "No active transaction" }`
  - Clear snapshot, return `{ transactionId, committed: true }`

- `rollbackTransaction()`:
  - If no active transaction → `{ error: "No active transaction" }`
  - Restore all repositories to snapshot state
  - Returns `{ transactionId, rolledBack: true }`

- `executeTransaction(operationsFn)`:
  - `operationsFn` takes `repositories` object and performs operations
  - Auto begin → run operations → if operations return `{ success: false }` → auto rollback
  - Else → auto commit
  - Returns `{ transactionId, committed: boolean, rolledBack: boolean, result }`

**Validation:** invalid `repositories` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the unit of work object with all 4 methods. |
| :----------- | :------------------------------------------------- |

**Sample Input & Output:**

```javascript
const userRepo = createRepository({ entityName: "User", primaryKey: "id" });
const orderRepo = createRepository({ entityName: "Order", primaryKey: "id" });

const uow = createUnitOfWork({ User: userRepo, Order: orderRepo });

userRepo.save({ id: "U1", name: "Rahim" });

uow.beginTransaction();
// → { transactionId: "TXN-1", started: true }

userRepo.save({ id: "U2", name: "Karim" });
orderRepo.save({ id: "O1", userId: "U2", amount: 500 });

userRepo.count(); // → 2 (U1 + U2)

uow.rollbackTransaction();
// → { transactionId: "TXN-1", rolledBack: true }

userRepo.count(); // → 1 (U2 reverted, only U1 remains)

// Execute transaction atomically:
uow.executeTransaction((repos) => {
  repos.User.save({ id: "U3", name: "Nadia" });
  repos.Order.save({ id: "O2", userId: "U3", amount: 200 });
  return { success: true };
});
// → { transactionId: "TXN-2", committed: true, rolledBack: false, result: { success: true } }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Repository-Service Orchestrator

⚠️ **Function Name:** `runRepoServiceOrchestrator()`

| Input      | `orchestratorConfig` (object) |
| :--------- | :---------------------------- |
| **Output** | object                        |

**Rules:**

`orchestratorConfig` object:

- `orchestratorId` (string, non-empty)
- `entities` (array of objects):
  - `entityName` (string)
  - `primaryKey` (string)
  - `businessRules` (array of `{ ruleName, validate }`)
- `transactions` (array of objects):
  - `transactionId` (string)
  - `operations` (array of objects):
    - `entityName` (string)
    - `type` (string: `"CREATE"`, `"UPDATE"`, `"DELETE"`)
    - `data` (object)
    - `id` (string, for UPDATE/DELETE)
  - `shouldRollback` (boolean) — if true, simulate rollback after operations

**Orchestration Rules (compose all previous concepts):**

1. **Setup** — create a repository and service for each entity in `entities`
2. **Create Unit of Work** — wrap all repositories
3. **Process Transactions** — for each transaction:
   - Begin transaction
   - Execute each operation via the appropriate service (applying business rules)
   - If `shouldRollback: true` OR any operation returns violations → rollback
   - Else → commit
4. **Build Summary:**
   - `totalTransactions` → count
   - `committedCount` → transactions committed
   - `rolledBackCount` → transactions rolled back
   - `finalEntityCounts` → object: `{ entityName: count }` for each entity

**Validation:** invalid `orchestratorConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, transactionLog, summary }` where `transactionLog` is array of `{ transactionId, status: "COMMITTED" or "ROLLED_BACK", operationResults }`. |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runRepoServiceOrchestrator({
  orchestratorId: "ORCH-01",
  entities: [
    {
      entityName: "User",
      primaryKey: "id",
      businessRules: [
        { ruleName: "AgeRule", validate: (d) => d.age >= 18 ? { valid: true, reason: null } : { valid: false, reason: "Must be 18+" } }
      ]
    }
  ],
  transactions: [
    {
      transactionId: "TXN-A",
      operations: [
        { entityName: "User", type: "CREATE", data: { id: "U1", name: "Rahim", age: 25 } },
        { entityName: "User", type: "CREATE", data: { id: "U2", name: "Karim", age: 30 } }
      ],
      shouldRollback: false
    },
    {
      transactionId: "TXN-B",
      operations: [
        { entityName: "User", type: "CREATE", data: { id: "U3", name: "Nadia", age: 15 } }
      ],
      shouldRollback: false
    }
  ]
})` →

  **Manual Verify:**
  - TXN-A: U1(age 25 ✓) + U2(age 30 ✓) → both pass → COMMITTED
  - TXN-B: U3(age 15 ✗ AgeRule) → violation → ROLLED_BACK
  - finalEntityCounts: { User: 2 } (U1 and U2 committed, U3 rolled back)

  `{
  orchestratorId: "ORCH-01",
  transactionLog: [
    {
      transactionId: "TXN-A",
      status: "COMMITTED",
      operationResults: [
        { type: "CREATE", created: true, entity: { id: "U1", name: "Rahim", age: 25 } },
        { type: "CREATE", created: true, entity: { id: "U2", name: "Karim", age: 30 } }
      ]
    },
    {
      transactionId: "TXN-B",
      status: "ROLLED_BACK",
      operationResults: [
        { type: "CREATE", created: false, violations: [{ ruleName: "AgeRule", reason: "Must be 18+" }] }
      ]
    }
  ],
  summary: {
    totalTransactions: 2,
    committedCount: 1,
    rolledBackCount: 1,
    finalEntityCounts: { User: 2 }
  }
}`

---