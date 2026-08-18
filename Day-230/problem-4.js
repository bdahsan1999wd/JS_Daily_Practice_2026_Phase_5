// 🧩 PROBLEM–04: createUnitOfWork()

// Logic: Implements the Unit of Work pattern.

// Wraps multiple repositories and provides transactional operations:

//   getRepository(entityName) — return a specific repository
//   beginTransaction()        — snapshot all repository states
//   commitTransaction()       — finalize changes since begin
//   rollbackTransaction()     — restore snapshot state
//   executeTransaction(fn)    — run operations atomically

function createUnitOfWork(repositories) {

    // --- STEP 1: VALIDATE repositories ---
    // Must be a non-null object whose values are repository instances.

    if (
        typeof repositories !== "object" ||
        repositories === null ||
        Array.isArray(repositories)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    let activeTransaction = null;
    let txnIndex = 0;

    // Helper: discover the primary key field for a set of records.
    // Prefers "id"; otherwise a field with unique values across records.

    function detectPrimaryKey(records) {
        if (records.length === 0) return "id";

        const fields = new Set();
        for (const record of records) {
            for (const key of Object.keys(record)) fields.add(key);
        }

        for (const field of fields) {
            const seen = new Set();
            let unique = true;
            for (const record of records) {
                if (seen.has(record[field])) { unique = false; break; }
                seen.add(record[field]);
            }
            if (unique) return field;
        }

        return "id";
    }

    // Helper: capture a snapshot of ALL repositories.
    // Snapshot is a deep copy of each repository's current records.

    function takeSnapshot() {

        const snapshot = {};

        for (const entityName of Object.keys(repositories)) {
            const repo = repositories[entityName];
            const all = repo.findAll().entities;

            snapshot[entityName] = {
                primaryKey: detectPrimaryKey(all),
                records: all.map(r => ({ ...r }))
            };
        }

        return snapshot;
    }

    // Helper: restore a snapshot into ALL repositories.

    function restoreSnapshot(snapshot) {

        for (const entityName of Object.keys(repositories)) {
            const repo = repositories[entityName];
            const { primaryKey, records } = snapshot[entityName];

            // 1. Delete records that exist now but not in the snapshot.

            const current = repo.findAll().entities;
            const snapshotIds = new Set(records.map(r => r[primaryKey]));

            for (const cur of current) {
                if (!snapshotIds.has(cur[primaryKey])) {
                    repo.deleteById(cur[primaryKey]);
                }
            }

            // 2. Upsert snapshot records (restores values of changed records).

            for (const record of records) {
                repo.save({ ...record });
            }
        }
    }

    // --- STEP 3: UNIT OF WORK METHODS ---

    return {
        // getRepository(entityName): return a specific repository.
        getRepository(entityName) {

            if (typeof entityName !== "string" || !(entityName in repositories)) {
                return "Invalid Input";
            }

            return repositories[entityName];
        },

        // beginTransaction(): snapshot all repositories.
        beginTransaction() {

            if (activeTransaction !== null) {
                return { error: "Transaction already in progress" };
            }

            txnIndex++;
            const transactionId = "TXN-" + txnIndex;

            activeTransaction = {
                transactionId,
                snapshot: takeSnapshot()
            };

            return { transactionId, started: true };
        },

        // commitTransaction(): finalize changes.
        commitTransaction() {

            if (activeTransaction === null) {
                return { error: "No active transaction" };
            }

            const { transactionId } = activeTransaction;

            // Clear snapshot without restoring.

            activeTransaction = null;

            return { transactionId, committed: true };
        },

        // rollbackTransaction(): restore snapshot.
        rollbackTransaction() {

            if (activeTransaction === null) {
                return { error: "No active transaction" };
            }

            const { transactionId, snapshot } = activeTransaction;

            restoreSnapshot(snapshot);
            activeTransaction = null;

            return { transactionId, rolledBack: true };
        },

        // executeTransaction(operationsFn): run atomically.
        executeTransaction(operationsFn) {

            if (typeof operationsFn !== "function") {
                return "Invalid Input";
            }

            const begin = this.beginTransaction();

            if (begin.error) return begin;

            const transactionId = begin.transactionId;

            let result;
            let shouldRollback = false;

            try {
                result = operationsFn(repositories);

                // Explicit rollback request.

                if (result && result.success === false) {
                    shouldRollback = true;
                }
            } catch (err) {
                shouldRollback = true;
            }

            if (shouldRollback) {
                const rb = this.rollbackTransaction();
                return { transactionId, committed: false, rolledBack: true, result };
            }

            const cm = this.commitTransaction();

            return { transactionId, committed: cm.committed, rolledBack: false, result };
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Mini repository stub (full version in problem-1.js) ---
function createRepository(cfg) {
    const entities = [];
    return {
        save(entity) {
            const i = entities.findIndex(e => e[cfg.primaryKey] === entity[cfg.primaryKey]);
            if (i !== -1) { Object.assign(entities[i], entity); return { operation: "UPDATE", entity: entities[i] }; }
            entities.push(entity);
            return { operation: "INSERT", entity };
        },
        findById(id) {
            const i = entities.findIndex(e => e[cfg.primaryKey] === id);
            if (i === -1) return { found: false, id };
            return { found: true, entity: entities[i] };
        },
        findAll(fn) {
            const r = fn ? entities.filter(fn) : [...entities];
            return { entities: r, count: r.length };
        },
        deleteById(id) {
            const i = entities.findIndex(e => e[cfg.primaryKey] === id);
            if (i === -1) return { error: "Entity not found" };
            entities.splice(i, 1);
            return { deleted: true, id };
        },
        exists(id) { return { id, exists: entities.some(e => e[cfg.primaryKey] === id) }; },
        count() { return entities.length; }
    };
}

// --- Build repositories + unit of work ---
const userRepo = createRepository({ entityName: "User", primaryKey: "id" });
const orderRepo = createRepository({ entityName: "Order", primaryKey: "id" });


const uow = createUnitOfWork({ User: userRepo, Order: orderRepo });


// --- Initial data ---
console.log(userRepo.save({ id: "U1", name: "Rahim" }));

// --- beginTransaction ---
console.log(uow.beginTransaction());

// --- Make uncommitted changes ---
console.log(userRepo.save({ id: "U2", name: "Karim" }));
console.log(orderRepo.save({ id: "O1", userId: "U2", amount: 500 }));

console.log(userRepo.count());

// --- rollbackTransaction: restores snapshot ---
console.log(uow.rollbackTransaction());

console.log(userRepo.count());

// --- executeTransaction: atomic commit ---
console.log(uow.executeTransaction((repos) => {
    repos.User.save({ id: "U3", name: "Nadia" });
    repos.Order.save({ id: "O2", userId: "U3", amount: 200 });
    return { success: true };
}));

// --- executeTransaction: explicit rollback ---
console.log(uow.executeTransaction((repos) => {
    repos.User.save({ id: "U4", name: "Abort" });
    return { success: false };
}));

// --- INVALID: bad repositories ---
console.log(createUnitOfWork([]));