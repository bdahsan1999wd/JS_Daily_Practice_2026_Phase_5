// 🧩 PROBLEM–01: createTransactionManager()

// Logic: ACID-style transaction manager with snapshot isolation.

//   begin    — snapshot current data into a working copy
//   read     — read from txn working copy (uncommitted state)
//   write    — INSERT/UPDATE/DELETE on working copy
//   commit   — apply working copy to main store
//   rollback — discard working copy
//   getActiveTxns / getTxnLog


function createTransactionManager(initialData) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof initialData !== "object" ||
        initialData === null ||
        Array.isArray(initialData)
    ) {
        return "Invalid Input";
    }

    for (const table of Object.keys(initialData)) {
        if (!Array.isArray(initialData[table])) return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    // Deep-ish clone: clone each record object.

    function cloneData(data) {
        const out = {};
        for (const table of Object.keys(data)) {
            out[table] = data[table].map(rec => ({ ...rec }));
        }
        return out;
    }

    let mainData = cloneData(initialData);

    const txns = new Map(); // txnId -> { working, snapshot, operationCount, status }
    const log = [];

    const TIMESTAMP = "2025-01-01T00:00:00Z";

    // --- STEP 3: HELPERS ---

    function activeTxn(txnId) {
        return txns.get(txnId) || null;
    }

    function applyWrite(working, table, operation, data) {

        if (!Array.isArray(working[table])) return null; // unknown table

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

    // --- STEP 4: PUBLIC API ---

    return {

        begin(txnId) {

            if (typeof txnId !== "string" || txnId.length === 0) return "Invalid Input";

            if (txns.has(txnId)) {
                return { error: "Transaction already active: " + txnId };
            }

            txns.set(txnId, {
                working: cloneData(mainData),
                snapshot: cloneData(mainData),
                operationCount: 0,
                status: "ACTIVE"
            });

            return { txnId, started: true, timestamp: TIMESTAMP };
        },

        read(txnId, table, id) {

            if (typeof txnId !== "string" || txnId.length === 0 ||
                typeof table !== "string" || table.length === 0 ||
                id === undefined || id === null) {
                return "Invalid Input";
            }

            const txn = activeTxn(txnId);

            if (!txn) {
                return { error: "No active transaction: " + txnId };
            }

            const rows = txn.working[table];
            const record = Array.isArray(rows) ? rows.find(r => r.id === id) || null : null;

            return { txnId, table, record: record ? { ...record } : null };
        },

        write(txnId, table, operation, data) {

            if (typeof txnId !== "string" || txnId.length === 0 ||
                typeof table !== "string" || table.length === 0 ||
                !["INSERT", "UPDATE", "DELETE"].includes(operation)) {
                return "Invalid Input";
            }

            const txn = activeTxn(txnId);

            if (!txn) {
                return { error: "No active transaction: " + txnId };
            }

            const ok = applyWrite(txn.working, table, operation, data);

            if (!ok) return "Invalid Input";

            txn.operationCount++;

            return { txnId, operation, table, applied: true };
        },

        commit(txnId) {

            if (typeof txnId !== "string" || txnId.length === 0) return "Invalid Input";

            const txn = activeTxn(txnId);

            if (!txn) {
                return { error: "No active transaction: " + txnId };
            }

            // Apply working copy to main store.

            mainData = cloneData(txn.working);

            const count = txn.operationCount;

            txn.status = "COMMITTED";
            txns.delete(txnId);

            log.push({ txnId, status: "COMMITTED", operationCount: count, timestamp: TIMESTAMP });

            return { txnId, committed: true, operationsApplied: count };
        },

        rollback(txnId) {

            if (typeof txnId !== "string" || txnId.length === 0) return "Invalid Input";

            const txn = activeTxn(txnId);

            if (!txn) {
                return { error: "No active transaction: " + txnId };
            }

            const count = txn.operationCount;

            txn.status = "ROLLED_BACK";
            txns.delete(txnId);

            log.push({ txnId, status: "ROLLED_BACK", operationCount: count, timestamp: TIMESTAMP });

            return { txnId, rolledBack: true, operationsDiscarded: count };
        },

        getActiveTxns() {
            return Array.from(txns.keys());
        },

        getTxnLog() {
            return log.map(entry => ({ ...entry }));
        }
    };
}



// ------ EXAMPLE USAGE ------

const tm = createTransactionManager({
    accounts: [
        { id: "A1", owner: "Rahim", balance: 1000 },
        { id: "A2", owner: "Karim", balance: 2000 }
    ]
});


console.log(tm.begin("TXN-1"));

console.log(tm.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 500 } }));

console.log(tm.read("TXN-1", "accounts", "A1"));


// Read from OUTSIDE transaction — still sees old value
console.log(tm.begin("TXN-2"));

console.log(tm.read("TXN-2", "accounts", "A1"));

console.log(tm.rollback("TXN-1"));

console.log(tm.commit("TXN-2"));

console.log(tm.getActiveTxns());

console.log(tm.getTxnLog());


// --- INVALID ---
console.log(createTransactionManager(null));