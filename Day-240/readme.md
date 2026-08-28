# 🎓 JS DAILY PRACTICE – DAY-240

📅 **Goal:** Transaction Manager (Database Query Simulation)
🎯 **Focus:** ACID Properties • Isolation Levels • Deadlock Detection • Savepoints • Transaction Logging

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔒 Basic Transaction Manager

⚠️ **Function Name:** `createTransactionManager()`

| Input      | `initialData` (object)       |
| :--------- | :--------------------------- |
| **Output** | object (transaction manager) |

**Rules:**

`initialData` — object where keys are table names and values are arrays of records:
```javascript
{ users: [...], orders: [...] }
```

Return a transaction manager object with:

- `begin(txnId)` — start a new transaction
- `commit(txnId)` — commit transaction changes permanently
- `rollback(txnId)` — undo all changes in the transaction
- `read(txnId, table, id)` — read a record within a transaction
- `write(txnId, table, operation, data)` — write within a transaction
- `getActiveTxns()` — return all active transaction ids
- `getTxnLog()` — return full transaction history

**Transaction Rules:**

- `begin(txnId)`:
  - `txnId` must be non-empty string
  - If already active → `{ error: "Transaction already active: " + txnId }`
  - Else → snapshot current data, return `{ txnId, started: true, timestamp: "2025-01-01T00:00:00Z" }`

- `read(txnId, table, id)`:
  - If txnId not active → `{ error: "No active transaction: " + txnId }`
  - Read from the transaction's working copy of data
  - Returns `{ txnId, table, record: doc or null }`

- `write(txnId, table, operation, data)`:
  - `operation`: `"INSERT"`, `"UPDATE"`, `"DELETE"`
  - If txnId not active → `{ error: "No active transaction: " + txnId }`
  - Apply changes to transaction's working copy (NOT committed yet)
  - Returns `{ txnId, operation, table, applied: true }`
  - For UPDATE: `data` = `{ id, updates }` | For DELETE: `data` = `{ id }` | For INSERT: `data` = doc object

- `commit(txnId)`:
  - Apply working copy to main data store
  - Returns `{ txnId, committed: true, operationsApplied: count }`

- `rollback(txnId)`:
  - Discard working copy, restore snapshot
  - Returns `{ txnId, rolledBack: true, operationsDiscarded: count }`

- `getActiveTxns()` → array of active txnIds
- `getTxnLog()` → array of `{ txnId, status: "COMMITTED"/"ROLLED_BACK"/"ACTIVE", operationCount, timestamp }`

**Validation:** invalid `initialData` → return `"Invalid Input"` from factory. Method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the transaction manager object with all 7 methods. |
| :----------- | :-------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const tm = createTransactionManager({
  accounts: [
    { id: "A1", owner: "Rahim", balance: 1000 },
    { id: "A2", owner: "Karim", balance: 2000 }
  ]
});

tm.begin("TXN-1");
// → { txnId: "TXN-1", started: true, timestamp: "2025-01-01T00:00:00Z" }

tm.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 500 } });
// → { txnId: "TXN-1", operation: "UPDATE", table: "accounts", applied: true }

tm.read("TXN-1", "accounts", "A1");
// Sees updated value within transaction
// → { txnId: "TXN-1", table: "accounts", record: { id: "A1", owner: "Rahim", balance: 500 } }


// Read from OUTSIDE transaction — still sees old value

tm.begin("TXN-2");
// { txnId: 'TXN-2', started: true, timestamp: '2025-01-01T00:00:00Z' }

tm.read("TXN-2", "accounts", "A1");
// → { txnId: "TXN-2", table: "accounts", record: { id: "A1", owner: "Rahim", balance: 1000 } }

tm.rollback("TXN-1");
// → { txnId: "TXN-1", rolledBack: true, operationsDiscarded: 1 }

tm.commit("TXN-2");
// → { txnId: "TXN-2", committed: true, operationsApplied: 0 }

tm.getActiveTxns(); // → []
```

---

## 🧩 PROBLEM–02: 🔑 Lock Manager

⚠️ **Function Name:** `createLockManager()`

| Input      | None (factory function)  |
| :--------- | :----------------------- |
| **Output** | object (lock manager)    |

**Rules:**

Return a lock manager object with:

- `acquireLock(txnId, resourceId, lockType)` — acquire a lock on a resource
- `releaseLock(txnId, resourceId)` — release a specific lock
- `releaseAllLocks(txnId)` — release all locks held by a transaction
- `isLocked(resourceId)` — check lock status of a resource
- `detectDeadlock()` — detect circular lock dependencies
- `getLockTable()` — return all current locks

**Lock Types:**

- `"SHARED"` (S) — multiple transactions can hold SHARED locks on same resource simultaneously
- `"EXCLUSIVE"` (X) — only ONE transaction can hold EXCLUSIVE lock; blocks all others

**Locking Rules:**

- `acquireLock(txnId, resourceId, lockType)`:
  - Check compatibility:
    - S + S → compatible (both granted)
    - S + X → incompatible (X blocked)
    - X + anything → incompatible (blocked)
  - If compatible → grant lock, return `{ granted: true, txnId, resourceId, lockType }`
  - If blocked → return `{ granted: false, txnId, resourceId, lockType, blockedBy: txnId of holder }`
  - Track lock wait graph (who is waiting for whom) for deadlock detection

- `releaseLock(txnId, resourceId)`:
  - Returns `{ released: true, txnId, resourceId }` or `{ error: "Lock not found" }`

- `releaseAllLocks(txnId)` → `{ txnId, locksReleased: count }`

- `isLocked(resourceId)` → `{ resourceId, locked: boolean, lockType: type or null, heldBy: [txnIds] }`

- `detectDeadlock()`:
  - Build wait-for graph: if TXN-A is waiting for a resource held by TXN-B → A→B edge
  - Detect cycles in the graph
  - Returns `{ hasDeadlock: boolean, cycles: [[txnId cycle path]], affectedTxns: [txnIds in cycles] }`

- `getLockTable()` → array of `{ resourceId, lockType, heldBy: [txnIds], waitingBy: [txnIds] }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the lock manager object with all 6 methods. |
| :----------- | :------------------------------------------------- |

**Sample Input & Output:**

```javascript
const lm = createLockManager();

lm.acquireLock("TXN-1", "resource-A", "SHARED");
// → { granted: true, txnId: "TXN-1", resourceId: "resource-A", lockType: "SHARED" }

lm.acquireLock("TXN-2", "resource-A", "SHARED");
// S+S compatible → granted
// → { granted: true, txnId: "TXN-2", resourceId: "resource-A", lockType: "SHARED" }

lm.acquireLock("TXN-3", "resource-A", "EXCLUSIVE");
// X blocked by existing S locks
// → { granted: false, txnId: "TXN-3", resourceId: "resource-A", lockType: "EXCLUSIVE", blockedBy: "TXN-1" }

lm.acquireLock("TXN-1", "resource-B", "EXCLUSIVE");
// → { granted: true, ... }

lm.acquireLock("TXN-2", "resource-B", "EXCLUSIVE");
// X blocked by TXN-1's X
// → { granted: false, txnId: "TXN-2", resourceId: "resource-B", lockType: "EXCLUSIVE", blockedBy: "TXN-1" }

// Now: TXN-3 waits for resource-A (held by TXN-1, TXN-2)
//      TXN-2 waits for resource-B (held by TXN-1)
// No deadlock yet (TXN-1 not waiting for anyone)

lm.detectDeadlock();
// → { hasDeadlock: false, cycles: [], affectedTxns: [] }

// Create deadlock: TXN-1 tries to acquire resource-C held by TXN-3
lm.acquireLock("TXN-3", "resource-C", "EXCLUSIVE");
lm.acquireLock("TXN-1", "resource-C", "EXCLUSIVE");
// TXN-1 waits for TXN-3, TXN-3 waits for TXN-1 (via resource-A) → DEADLOCK

lm.detectDeadlock();
// → { hasDeadlock: true, cycles: [["TXN-1", "TXN-3", "TXN-1"]], affectedTxns: ["TXN-1", "TXN-3"] }
```

---

## 🧩 PROBLEM–03: 💾 Savepoint Manager

⚠️ **Function Name:** `createSavepointManager()`

| Input      | `initialData` (object)      |
| :--------- | :-------------------------- |
| **Output** | object (savepoint manager)  |

**Rules:**

`initialData` — same shape as Problem-01

Return a savepoint manager — extends transaction with savepoints:

- `begin(txnId)` — start transaction
- `savepoint(txnId, savepointName)` — create a named savepoint at current state
- `rollbackToSavepoint(txnId, savepointName)` — undo changes back to savepoint (keep transaction active)
- `releaseSavepoint(txnId, savepointName)` — remove a savepoint (cannot rollback to it anymore)
- `write(txnId, table, operation, data)` — same as Problem-01
- `commit(txnId)` — commit all changes
- `rollback(txnId)` — full rollback
- `getSavepoints(txnId)` — return active savepoints for a transaction

**Savepoint Rules:**

- `savepoint(txnId, savepointName)`:
  - Capture current state of working copy
  - Returns `{ txnId, savepointName, created: true }` or `{ error: "No active transaction" }`
  - If name already used in this txn → overwrite

- `rollbackToSavepoint(txnId, savepointName)`:
  - Restore working copy to the savepoint state (discard changes after savepoint)
  - Savepoints AFTER this one are also removed
  - Returns `{ txnId, savepointName, rolledBack: true, operationsDiscarded: count }` or `{ error: "Savepoint not found" }`

- `releaseSavepoint(txnId, savepointName)` → `{ txnId, savepointName, released: true }` or `{ error: "Savepoint not found" }`

- `getSavepoints(txnId)` → array of savepoint names (in creation order) or `{ error: "No active transaction" }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the savepoint manager object with all 8 methods. |
| :----------- | :------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const spm = createSavepointManager({
  accounts: [{ id: "A1", balance: 1000 }, { id: "A2", balance: 2000 }]
});

spm.begin("TXN-1");

spm.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 800 } });
spm.savepoint("TXN-1", "SP1");
// → { txnId: "TXN-1", savepointName: "SP1", created: true }

spm.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 600 } });
spm.savepoint("TXN-1", "SP2");

spm.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 400 } });

spm.getSavepoints("TXN-1");
// → ["SP1", "SP2"]

spm.rollbackToSavepoint("TXN-1", "SP1");
// Undo changes after SP1 → balance back to 800
// SP2 removed
// → { txnId: "TXN-1", savepointName: "SP1", rolledBack: true, operationsDiscarded: 2 }

spm.getSavepoints("TXN-1");
// → ["SP1"] (SP2 removed)

spm.commit("TXN-1");
// Commits balance=800 for A1
// → { txnId: "TXN-1", committed: true, operationsApplied: 1 }
```

---

## 🧩 PROBLEM–04: 🔁 Isolation Level Simulator

⚠️ **Function Name:** `createIsolationSimulator()`

| Input      | `initialData` (object)        |
| :--------- | :---------------------------- |
| **Output** | object (isolation simulator)  |

**Rules:**

`initialData` — same shape as Problem-01

Return an isolation simulator with:

- `setIsolationLevel(level)` — set the isolation level
- `begin(txnId)` — start transaction with current isolation level
- `read(txnId, table, id)` — read with isolation rules applied
- `write(txnId, table, operation, data)` — write within transaction
- `commit(txnId)` — commit
- `rollback(txnId)` — rollback
- `demonstratePhenomenon(phenomenon)` — demonstrate a DB phenomenon

**Isolation Levels (in ascending strictness):**

- `"READ_UNCOMMITTED"` — can read uncommitted changes from other transactions (dirty reads allowed)
- `"READ_COMMITTED"` — can only read committed data (no dirty reads)
- `"REPEATABLE_READ"` — same read returns same result within transaction (no non-repeatable reads)
- `"SERIALIZABLE"` — full isolation (no phantom reads)

**Read Rules per level:**

- `"READ_UNCOMMITTED"`:
  - `read()` sees the LATEST working copy of ANY active transaction (including uncommitted)
  - Returns data with `{ isolationLevel, dirtyRead: boolean }` metadata

- `"READ_COMMITTED"`:
  - `read()` sees only COMMITTED data (main store)
  - Returns `{ isolationLevel, dirtyRead: false }`

- `"REPEATABLE_READ"`:
  - First `read()` of a record within txn captures the value
  - Subsequent reads of same record return the captured value (even if committed by others)
  - Returns `{ isolationLevel, repeatedRead: boolean }`

- `"SERIALIZABLE"`:
  - Transactions execute as if completely serial (no concurrent access)
  - Returns `{ isolationLevel, serialized: true }`

**demonstratePhenomenon(phenomenon):**

- `"DIRTY_READ"` — show that READ_UNCOMMITTED can read uncommitted data
- `"NON_REPEATABLE_READ"` — show that READ_COMMITTED can get different values on repeated reads
- `"PHANTOM_READ"` — show that REPEATABLE_READ can miss new rows inserted by other txns
- Returns `{ phenomenon, demonstrationSteps: [string descriptions], prevented: boolean (true if current level prevents it) }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the isolation simulator object with all 6 methods. |
| :----------- | :--------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const iso = createIsolationSimulator({
  accounts: [{ id: "A1", balance: 1000 }]
});

iso.setIsolationLevel("READ_UNCOMMITTED");
iso.begin("TXN-1");
iso.begin("TXN-2");

iso.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 500 } });
// TXN-1 has uncommitted change: balance=500

iso.read("TXN-2", "accounts", "A1");
// READ_UNCOMMITTED sees TXN-1's uncommitted change
// → { txnId: "TXN-2", table: "accounts", record: { id: "A1", balance: 500 }, isolationLevel: "READ_UNCOMMITTED", dirtyRead: true }

iso.rollback("TXN-1");
// TXN-1 rolled back — balance never actually changed in main store

iso.demonstratePhenomenon("DIRTY_READ");
// → {
//   phenomenon: "DIRTY_READ",
//   demonstrationSteps: [
//     "TXN-A updates balance to 500 (not committed)",
//     "TXN-B reads balance = 500 (dirty read)",
//     "TXN-A rolls back — balance was never 500",
//     "TXN-B has read incorrect data"
//   ],
//   prevented: false
// }

iso.setIsolationLevel("READ_COMMITTED");
iso.demonstratePhenomenon("DIRTY_READ");
// → { ..., prevented: true }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Transaction Orchestrator

⚠️ **Function Name:** `runTransactionOrchestrator()`

| Input      | `txnConfig` (object) |
| :--------- | :------------------- |
| **Output** | object               |

**Rules:**

`txnConfig` object:

- `orchestratorId` (string, non-empty)
- `initialData` (object) — `{ tableName: [records] }`
- `isolationLevel` (string: `"READ_UNCOMMITTED"`, `"READ_COMMITTED"`, `"REPEATABLE_READ"`, `"SERIALIZABLE"`)
- `transactions` (array of objects):
  - `txnId` (string)
  - `operations` (array of objects):
    - `type` (string: `"BEGIN"`, `"READ"`, `"WRITE"`, `"SAVEPOINT"`, `"ROLLBACK_TO"`, `"COMMIT"`, `"ROLLBACK"`)
    - `table` (string or null)
    - `id` (string or null)
    - `data` (object or null)
    - `savepointName` (string or null)
    - `writeOp` (string or null: `"INSERT"`, `"UPDATE"`, `"DELETE"`)
- `detectDeadlocks` (boolean) — if true, run deadlock detection after all txns

**Orchestration Rules (compose all previous concepts):**

1. **Setup** — create transaction manager with savepoints (Problem-03 logic) + lock manager (Problem-02) + isolation simulator (Problem-04) with given `isolationLevel`
2. **Process transactions** — execute each operation in order across all transactions (interleaved — process operation by operation across all txns in round-robin)
3. **Deadlock detection** — if `detectDeadlocks: true`, run after all operations
4. **Build Report:**
   - `totalTransactions`
   - `committedCount`
   - `rolledBackCount`
   - `totalOperations`
   - `deadlockDetected` → boolean (or null if not checked)
   - `finalDataState` → `{ tableName: [records] }` after all committed txns

**Validation:** invalid `txnConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, txnLog, report }` where `txnLog` is array of `{ txnId, operations: [{ type, result }], finalStatus }`. |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runTransactionOrchestrator({
  orchestratorId: "TXN-ORCH-01",
  initialData: {
    accounts: [
      { id: "A1", owner: "Rahim", balance: 1000 },
      { id: "A2", owner: "Karim", balance: 2000 }
    ]
  },
  isolationLevel: "READ_COMMITTED",
  transactions: [
    {
      txnId: "TXN-1",
      operations: [
        { type: "BEGIN", table: null, id: null, data: null, savepointName: null, writeOp: null },
        { type: "WRITE", table: "accounts", id: null, data: { id: "A1", updates: { balance: 800 } }, savepointName: null, writeOp: "UPDATE" },
        { type: "SAVEPOINT", table: null, id: null, data: null, savepointName: "SP1", writeOp: null },
        { type: "WRITE", table: "accounts", id: null, data: { id: "A1", updates: { balance: 600 } }, savepointName: null, writeOp: "UPDATE" },
        { type: "ROLLBACK_TO", table: null, id: null, data: null, savepointName: "SP1", writeOp: null },
        { type: "COMMIT", table: null, id: null, data: null, savepointName: null, writeOp: null }
      ]
    },
    {
      txnId: "TXN-2",
      operations: [
        { type: "BEGIN", table: null, id: null, data: null, savepointName: null, writeOp: null },
        { type: "READ", table: "accounts", id: "A1", data: null, savepointName: null, writeOp: null },
        { type: "WRITE", table: "accounts", id: null, data: { id: "A2", updates: { balance: 1500 } }, savepointName: null, writeOp: "UPDATE" },
        { type: "COMMIT", table: null, id: null, data: null, savepointName: null, writeOp: null }
      ]
    }
  ],
  detectDeadlocks: true
})` →

  **Manual Verify:**
  - TXN-1: begin → update A1(1000→800) → savepoint SP1 → update A1(800→600) → rollbackTo SP1(balance=800) → commit(balance=800)
  - TXN-2: begin → read A1(sees committed=1000, READ_COMMITTED) → update A2(2000→1500) → commit
  - No deadlock (independent resources)
  - Final: A1.balance=800, A2.balance=1500

  `{
  orchestratorId: "TXN-ORCH-01",
  txnLog: [
    {
      txnId: "TXN-1",
      operations: [
        { type: "BEGIN", result: { txnId: "TXN-1", started: true } },
        { type: "WRITE", result: { txnId: "TXN-1", operation: "UPDATE", table: "accounts", applied: true } },
        { type: "SAVEPOINT", result: { txnId: "TXN-1", savepointName: "SP1", created: true } },
        { type: "WRITE", result: { txnId: "TXN-1", operation: "UPDATE", table: "accounts", applied: true } },
        { type: "ROLLBACK_TO", result: { txnId: "TXN-1", savepointName: "SP1", rolledBack: true, operationsDiscarded: 1 } },
        { type: "COMMIT", result: { txnId: "TXN-1", committed: true, operationsApplied: 1 } }
      ],
      finalStatus: "COMMITTED"
    },
    {
      txnId: "TXN-2",
      operations: [
        { type: "BEGIN", result: { txnId: "TXN-2", started: true } },
        { type: "READ", result: { txnId: "TXN-2", table: "accounts", record: { id: "A1", owner: "Rahim", balance: 1000 }, isolationLevel: "READ_COMMITTED", dirtyRead: false } },
        { type: "WRITE", result: { txnId: "TXN-2", operation: "UPDATE", table: "accounts", applied: true } },
        { type: "COMMIT", result: { txnId: "TXN-2", committed: true, operationsApplied: 1 } }
      ],
      finalStatus: "COMMITTED"
    }
  ],
  report: {
    totalTransactions: 2,
    committedCount: 2,
    rolledBackCount: 0,
    totalOperations: 10,
    deadlockDetected: false,
    finalDataState: {
      accounts: [
        { id: "A1", owner: "Rahim", balance: 800 },
        { id: "A2", owner: "Karim", balance: 1500 }
      ]
    }
  }
}`

---