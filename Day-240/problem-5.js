// 🧩 PROBLEM–05: runTransactionOrchestrator()

// Logic: Composes Problems 01–04 into a full transaction orchestrator.
// Setup: savepoint manager (P3) + lock manager (P2) + isolation simulator (P4).
// Transactions are processed operation-by-operation in round-robin order
// across all txns (interleaved). Reads go through the isolation simulator;
// writes through the savepoint manager. Lock manager tracks deadlocks.


function runTransactionOrchestrator(txnConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof txnConfig !== "object" ||
        txnConfig === null ||
        typeof txnConfig.orchestratorId !== "string" ||
        txnConfig.orchestratorId.length === 0 ||
        typeof txnConfig.initialData !== "object" ||
        txnConfig.initialData === null ||
        Array.isArray(txnConfig.initialData) ||
        !["READ_UNCOMMITTED", "READ_COMMITTED", "REPEATABLE_READ", "SERIALIZABLE"].includes(txnConfig.isolationLevel) ||
        !Array.isArray(txnConfig.transactions) ||
        txnConfig.transactions.length === 0
    ) {
        return "Invalid Input";
    }

    for (const table of Object.keys(txnConfig.initialData)) {
        if (!Array.isArray(txnConfig.initialData[table])) return "Invalid Input";
    }

    const orchestratorId = txnConfig.orchestratorId;
    const detectDeadlocks = txnConfig.detectDeadlocks === true;
    const initialData = txnConfig.initialData;

    // Mutable isolation level shared by the simulator closure.

    let isolationLevel = txnConfig.isolationLevel;

    // --- STEP 2: CLONE HELPERS ---

    function cloneData(data) {
        const out = {};
        for (const table of Object.keys(data)) {
            out[table] = data[table].map(rec => ({ ...rec }));
        }
        return out;
    }

    function getMainData() {
        return mainData;
    }

    // --- STEP 3: SAVEPOINT MANAGER (Problem-03) ---

    function createSavepointManager(initialData) {

        let mainData = cloneData(initialData);

        const txns = new Map();

        function activeTxn(txnId) {
            return txns.get(txnId) || null;
        }

        function applyWrite(working, table, operation, data) {

            if (!Array.isArray(working[table])) return null;

            const rows = working[table];

            switch (operation) {

                case "INSERT":
                    rows.push({ ...data });
                    return true;

                case "UPDATE": {
                    const { id, updates } = data;
                    const rec = rows.find(r => r.id === id);
                    if (!rec) return null;
                    Object.assign(rec, updates);
                    return true;
                }

                case "DELETE": {
                    const { id } = data;
                    const idx = rows.findIndex(r => r.id === id);
                    if (idx === -1) return null;
                    rows.splice(idx, 1);
                    return true;
                }

                default:
                    return null;
            }
        }

        return {

            begin(txnId) {
                if (txns.has(txnId)) return { error: "Transaction already active: " + txnId };
                txns.set(txnId, {
                    working: cloneData(mainData),
                    snapshot: cloneData(mainData),
                    operationCount: 0,
                    savepoints: new Map()
                });
                return { txnId, started: true, timestamp: "2025-01-01T00:00:00Z" };
            },

            savepoint(txnId, savepointName) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction" };
                txn.savepoints.set(savepointName, { data: cloneData(txn.working), opCount: txn.operationCount });
                return { txnId, savepointName, created: true };
            },

            rollbackToSavepoint(txnId, savepointName) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction" };
                if (!txn.savepoints.has(savepointName)) return { error: "Savepoint not found" };

                const sp = txn.savepoints.get(savepointName);
                const discarded = txn.operationCount - sp.opCount;

                txn.working = cloneData(sp.data);
                txn.operationCount = sp.opCount;

                const names = Array.from(txn.savepoints.keys());
                const idx = names.indexOf(savepointName);
                for (let i = idx + 1; i < names.length; i++) txn.savepoints.delete(names[i]);

                return { txnId, savepointName, rolledBack: true, operationsDiscarded: discarded };
            },

            releaseSavepoint(txnId, savepointName) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction" };
                if (!txn.savepoints.has(savepointName)) return { error: "Savepoint not found" };
                txn.savepoints.delete(savepointName);
                return { txnId, savepointName, released: true };
            },

            write(txnId, table, operation, data) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction: " + txnId };
                const ok = applyWrite(txn.working, table, operation, data);
                if (!ok) return "Invalid Input";
                txn.operationCount++;
                return { txnId, operation, table, applied: true };
            },

            commit(txnId) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction: " + txnId };

                // Apply only the records this txn actually changed (diff vs snapshot)
                // so concurrent committed writes from other txns are not lost.

                const snapshot = txn.snapshot;
                const working = txn.working;

                const tables = new Set([...Object.keys(snapshot), ...Object.keys(working)]);

                for (const table of tables) {

                    if (!Array.isArray(mainData[table])) {
                        mainData[table] = working[table] ? working[table].map(r => ({ ...r })) : [];
                        continue;
                    }

                    const snapRows = snapshot[table] || [];
                    const workRows = working[table] || [];

                    // Deleted rows: in snapshot but not in working.

                    for (const snapRec of snapRows) {
                        if (!workRows.find(r => r.id === snapRec.id)) {
                            mainData[table] = mainData[table].filter(r => r.id !== snapRec.id);
                        }
                    }

                    // Updated / inserted rows — only when the record actually
                    // differs from the snapshot (avoid clobbering other txns).

                    for (const workRec of workRows) {

                        const snapMatch = snapRows.find(r => r.id === workRec.id);
                        const same = snapMatch && JSON.stringify(snapMatch) === JSON.stringify(workRec);

                        if (same) continue; // untouched by this txn

                        const idx = mainData[table].findIndex(r => r.id === workRec.id);

                        if (idx !== -1) {
                            mainData[table][idx] = { ...workRec };
                        } else {
                            mainData[table].push({ ...workRec });
                        }
                    }
                }

                const count = txn.operationCount;
                txns.delete(txnId);
                return { txnId, committed: true, operationsApplied: count };
            },

            rollback(txnId) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction: " + txnId };
                const count = txn.operationCount;
                txns.delete(txnId);
                return { txnId, rolledBack: true, operationsDiscarded: count };
            },

            getSavepoints(txnId) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction" };
                return Array.from(txn.savepoints.keys());
            },

            getData() {
                return mainData;
            }
        };
    }

    // --- STEP 4: LOCK MANAGER (Problem-02) ---

    function createLockManager() {

        const locks = new Map();
        const blockedBy = new Map();

        function getLock(resourceId) {
            if (!locks.has(resourceId)) {
                locks.set(resourceId, { lockType: null, heldBy: [], waitingBy: [] });
            }
            return locks.get(resourceId);
        }

        function isCompatible(requestType, heldType) {
            return requestType === "SHARED" && heldType === "SHARED";
        }

        return {

            acquireLock(txnId, resourceId, lockType) {

                const lock = getLock(resourceId);

                // A transaction never blocks itself (re-acquire / upgrade).

                const incompatibleHolder = lock.heldBy.find(
                    holder => holder !== txnId && !isCompatible(lockType, lock.lockType)
                );

                if (incompatibleHolder !== undefined) {

                    if (!lock.waitingBy.includes(txnId)) lock.waitingBy.push(txnId);

                    if (!blockedBy.has(resourceId)) blockedBy.set(resourceId, {});
                    blockedBy.get(resourceId)[txnId] = incompatibleHolder;

                    return { granted: false, txnId, resourceId, lockType, blockedBy: incompatibleHolder };
                }

                if (!lock.heldBy.includes(txnId)) lock.heldBy.push(txnId);

                if (lock.lockType === null || lock.lockType === "SHARED") lock.lockType = lockType;

                const widx = lock.waitingBy.indexOf(txnId);
                if (widx !== -1) lock.waitingBy.splice(widx, 1);

                return { granted: true, txnId, resourceId, lockType };
            },

            releaseLock(txnId, resourceId) {

                const lock = locks.get(resourceId);
                if (!lock) return { error: "Lock not found" };

                const idx = lock.heldBy.indexOf(txnId);
                if (idx === -1) return { error: "Lock not found" };

                lock.heldBy.splice(idx, 1);
                if (lock.heldBy.length === 0) lock.lockType = null;

                if (blockedBy.has(resourceId)) delete blockedBy.get(resourceId)[txnId];

                return { released: true, txnId, resourceId };
            },

            releaseAllLocks(txnId) {

                let count = 0;

                for (const [resourceId, lock] of locks) {
                    const idx = lock.heldBy.indexOf(txnId);
                    if (idx !== -1) { lock.heldBy.splice(idx, 1); count++; }
                    const widx = lock.waitingBy.indexOf(txnId);
                    if (widx !== -1) lock.waitingBy.splice(widx, 1);
                    if (blockedBy.has(resourceId)) delete blockedBy.get(resourceId)[txnId];
                    if (lock.heldBy.length === 0) lock.lockType = null;
                }

                return { txnId, locksReleased: count };
            },

            isLocked(resourceId) {
                const lock = locks.get(resourceId);
                if (!lock || lock.heldBy.length === 0) {
                    return { resourceId, locked: false, lockType: null, heldBy: [] };
                }
                return { resourceId, locked: true, lockType: lock.lockType, heldBy: [...lock.heldBy] };
            },

            detectDeadlock() {

                const edges = new Map();

                for (const waiters of blockedBy.values()) {
                    for (const waiter of Object.keys(waiters)) {
                        const holder = waiters[waiter];
                        if (!edges.has(waiter)) edges.set(waiter, new Set());
                        edges.get(waiter).add(holder);
                    }
                }

                const cycles = [];

                for (const start of edges.keys()) {

                    const path = [];
                    const visited = new Set();

                    function dfs(node) {

                        if (path.includes(node)) {
                            const startIdx = path.indexOf(node);
                            const cycle = path.slice(startIdx);
                            cycle.push(node);
                            cycles.push(cycle);
                            return;
                        }

                        if (visited.has(node)) return;

                        visited.add(node);
                        path.push(node);

                        const next = edges.get(node);
                        if (next) for (const n of next) dfs(n);

                        path.pop();
                    }

                    dfs(start);
                }

                const unique = [];
                const seenKeys = new Set();

                for (const cycle of cycles) {

                    const nodes = cycle.slice(0, -1);
                    const minVal = nodes.reduce((m, t) => t < m ? t : m, nodes[0]);
                    const minIdx = nodes.indexOf(minVal);

                    let rotated = nodes.slice(minIdx).concat(nodes.slice(0, minIdx));
                    rotated.push(rotated[0]);

                    const key = rotated.join("->");

                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        unique.push(rotated);
                    }
                }

                const affectedTxns = [];

                for (const cycle of unique) {
                    for (const t of cycle) {
                        if (!affectedTxns.includes(t)) affectedTxns.push(t);
                    }
                }

                return { hasDeadlock: unique.length > 0, cycles: unique, affectedTxns };
            },

            getLockTable() {

                const table = [];

                for (const [resourceId, lock] of locks) {
                    table.push({ resourceId, lockType: lock.lockType, heldBy: [...lock.heldBy], waitingBy: [...lock.waitingBy] });
                }

                return table;
            }
        };
    }

    // --- STEP 5: ISOLATION SIMULATOR (Problem-04) ---

    function createIsolationSimulator(initialData) {

        const main = cloneData(initialData);

        const txns = new Map();

        function activeTxn(txnId) {
            return txns.get(txnId) || null;
        }

        function applyWrite(working, table, operation, data) {

            if (!Array.isArray(working[table])) return null;

            const rows = working[table];

            switch (operation) {

                case "INSERT":
                    rows.push({ ...data });
                    return true;

                case "UPDATE": {
                    const { id, updates } = data;
                    const rec = rows.find(r => r.id === id);
                    if (!rec) return null;
                    Object.assign(rec, updates);
                    return true;
                }

                case "DELETE": {
                    const { id } = data;
                    const idx = rows.findIndex(r => r.id === id);
                    if (idx === -1) return null;
                    rows.splice(idx, 1);
                    return true;
                }

                default:
                    return null;
            }
        }

        function latestWorkingRecord(table, id) {
            for (const txn of txns.values()) {
                const rows = txn.working[table];
                const rec = Array.isArray(rows) ? rows.find(r => r.id === id) : undefined;
                if (rec !== undefined) return rec;
            }
            return undefined;
        }

        return {

            setIsolationLevel(level) {
                isolationLevel = level;
                return { isolationLevel: level };
            },

            begin(txnId) {
                if (txns.has(txnId)) return { error: "Transaction already active: " + txnId };
                txns.set(txnId, { working: cloneData(main), snapshot: cloneData(main), reads: new Map(), operationCount: 0 });
                return { txnId, started: true, isolationLevel, timestamp: "2025-01-01T00:00:00Z" };
            },

            read(txnId, table, id) {

                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction: " + txnId };

                const key = table + ":" + id;
                let record;
                let meta = {};

                if (isolationLevel === "READ_UNCOMMITTED") {

                    const uncommitted = latestWorkingRecord(table, id);
                    record = uncommitted !== undefined ? { ...uncommitted } : null;
                    const inOwn = txn.working[table]?.find(r => r.id === id);
                    meta = { dirtyRead: uncommitted !== undefined && uncommitted !== inOwn };

                } else if (isolationLevel === "READ_COMMITTED") {

                    const rows = main[table];
                    const rec = Array.isArray(rows) ? rows.find(r => r.id === id) : undefined;
                    record = rec ? { ...rec } : null;
                    meta = { dirtyRead: false };

                } else if (isolationLevel === "REPEATABLE_READ") {

                    if (txn.reads.has(key)) {
                        const captured = txn.reads.get(key);
                        record = captured ? { ...captured } : null;
                    } else {
                        const rows = main[table];
                        const rec = Array.isArray(rows) ? rows.find(r => r.id === id) : undefined;
                        record = rec ? { ...rec } : null;
                        txn.reads.set(key, rec ? { ...rec } : null);
                    }

                    meta = { repeatedRead: true };

                } else { // SERIALIZABLE

                    const rows = main[table];
                    const rec = Array.isArray(rows) ? rows.find(r => r.id === id) : undefined;
                    record = rec ? { ...rec } : null;
                    meta = { serialized: true };
                }

                return { txnId, table, record, isolationLevel, ...meta };
            },

            write(txnId, table, operation, data) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction: " + txnId };
                const ok = applyWrite(txn.working, table, operation, data);
                if (!ok) return "Invalid Input";
                txn.operationCount++;
                return { txnId, operation, table, applied: true };
            },

            commit(txnId) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction: " + txnId };
                // Apply to main store of simulator.
                for (const t of Object.keys(main)) main[t] = [];
                Object.assign(main, cloneData(txn.working));
                const count = txn.operationCount;
                txns.delete(txnId);
                return { txnId, committed: true, operationsApplied: count };
            },

            rollback(txnId) {
                const txn = activeTxn(txnId);
                if (!txn) return { error: "No active transaction: " + txnId };
                const count = txn.operationCount;
                txns.delete(txnId);
                return { txnId, rolledBack: true, operationsDiscarded: count };
            }
        };
    }

    // --- STEP 6: SHARED MAIN STORE (single source of truth) ---

    let mainData = cloneData(initialData);

    // Savepoint manager operates on mainData (commit writes to mainData).
    // Isolation simulator reads committed state from a synchronized mirror.

    const spm = createSavepointManager(initialData);

    // --- STEP 7: PROCESS OPERATIONS (round-robin) ---

    const txnStates = {};   // txnId -> { finalStatus, started }

    const iso = createIsolationSimulator(initialData);
    iso.setIsolationLevel(isolationLevel);

    // We route reads through iso.read but writes through spm. To keep the
    // committed data consistent, mirror mainData after each commit.

    // Build interleaved operation plan: round-robin over txns.

    const txnOps = txnConfig.transactions.map(t => ({
        txnId: t.txnId,
        ops: t.operations,
        cursor: 0
    }));

    const txnLog = txnConfig.transactions.map(t => ({
        txnId: t.txnId,
        operations: [],
        finalStatus: null
    }));

    const txnLogMap = {};
    for (const entry of txnLog) txnLogMap[entry.txnId] = entry;

    let processed = 0;
    let totalOps = 0;
    for (const t of txnConfig.transactions) totalOps += t.operations.length;

    while (processed < totalOps) {

        for (const state of txnOps) {

            if (state.cursor >= state.ops.length) continue;

            const op = state.ops[state.cursor];
            const txnId = state.txnId;

            let result;

            switch (op.type) {

                case "BEGIN":
                    result = spm.begin(txnId);
                    iso.begin(txnId);
                    txnStates[txnId] = { finalStatus: null };
                    break;

                case "READ": {

                    const table = op.table;
                    const id = op.id;

                    // Acquire a SHARED lock on the resource for read.

                    // (locked simulation simplified — acquire SHARED)

                    result = iso.read(txnId, table, id);

                    // Ensure record reflects committed mainData if READ_COMMITTED+.
                    // iso.read already returns committed data for those levels.

                    break;
                }

                case "WRITE": {

                    const table = op.table;
                    const writeOp = op.writeOp;
                    const data = op.data;

                    result = spm.write(txnId, table, writeOp, data);

                    // Keep iso working copy in sync for dirty-read simulation.

                    const isoWrite = iso.write(txnId, table, writeOp, data);
                    if (isoWrite === "Invalid Input") {
                        result = "Invalid Input";
                    }

                    break;
                }

                case "SAVEPOINT":
                    result = spm.savepoint(txnId, op.savepointName);
                    break;

                case "ROLLBACK_TO":
                    result = spm.rollbackToSavepoint(txnId, op.savepointName);
                    break;

                case "COMMIT": {
                    result = spm.commit(txnId);
                    if (result.committed) {
                        txnStates[txnId].finalStatus = "COMMITTED";
                        // Sync iso main to committed state.
                        iso.commit(txnId);
                    }
                    break;
                }

                case "ROLLBACK": {
                    result = spm.rollback(txnId);
                    if (result.rolledBack) {
                        txnStates[txnId].finalStatus = "ROLLED_BACK";
                        iso.rollback(txnId);
                    }
                    break;
                }

                default:
                    result = "Invalid Input";
            }

            txnLogMap[txnId].operations.push({ type: op.type, result });

            state.cursor++;
            processed++;
        }
    }

    // --- STEP 8: DEADLOCK DETECTION ---

    const lockManager = createLockManager();

    // Simulate lock acquisition based on ops for deadlock reporting.

    for (const state of txnOps) {
        // Replay ops to build lock table.
        const txn = state.txnId;
        for (const op of state.ops) {
            if (op.type === "READ" && op.table) {
                lockManager.acquireLock(txn, op.table + ":" + op.id, "SHARED");
            } else if (op.type === "WRITE" && op.table) {
                const resource = op.table + ":" + (op.data && op.data.id);
                lockManager.acquireLock(txn, resource, "EXCLUSIVE");
            }
        }
    }

    let deadlockDetected = null;

    if (detectDeadlocks) {
        const dd = lockManager.detectDeadlock();
        deadlockDetected = dd.hasDeadlock;
    }

    // --- STEP 9: FINAL STATUS + REPORT ---

    for (const entry of txnLog) {
        entry.finalStatus = txnStates[entry.txnId] && txnStates[entry.txnId].finalStatus
            ? txnStates[entry.txnId].finalStatus
            : "ROLLED_BACK";
    }

    let committedCount = 0;
    let rolledBackCount = 0;

    for (const entry of txnLog) {
        if (entry.finalStatus === "COMMITTED") committedCount++;
        else rolledBackCount++;
    }

    const report = {
        totalTransactions: txnConfig.transactions.length,
        committedCount,
        rolledBackCount,
        totalOperations: totalOps,
        deadlockDetected,
        finalDataState: spm.getData()
    };

    return { orchestratorId, txnLog, report };
}



// ------ EXAMPLE USAGE ------

console.log(runTransactionOrchestrator({
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
}));


// --- INVALID ---
console.log(runTransactionOrchestrator({}));