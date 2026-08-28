// 🧩 PROBLEM–03: createSavepointManager()

// Logic: Transaction manager extended with named savepoints.

//   savepoint(txnId, name)        — snapshot current working copy
//   rollbackToSavepoint(txnId, n) — restore working copy; drop later savepoints
//   releaseSavepoint(txnId, n)    — remove savepoint
//   getSavepoints(txnId)          — active savepoints in creation order Plus
//   Problem-01 begin/write/commit/rollback.


function createSavepointManager(initialData) {

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

    function cloneData(data) {
        const out = {};
        for (const table of Object.keys(data)) {
            out[table] = data[table].map(rec => ({ ...rec }));
        }
        return out;
    }

    let mainData = cloneData(initialData);

    const txns = new Map(); // txnId -> { working, operationCount, savepoints: Map(name->snapshot) }

    const TIMESTAMP = "2025-01-01T00:00:00Z";

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

    // --- STEP 3: PUBLIC API ---

    return {

        begin(txnId) {

            if (typeof txnId !== "string" || txnId.length === 0) return "Invalid Input";

            if (txns.has(txnId)) {
                return { error: "Transaction already active: " + txnId };
            }

            txns.set(txnId, {
                working: cloneData(mainData),
                operationCount: 0,
                savepoints: new Map()
            });

            return { txnId, started: true, timestamp: TIMESTAMP };
        },

        savepoint(txnId, savepointName) {

            if (typeof txnId !== "string" || txnId.length === 0 ||
                typeof savepointName !== "string" || savepointName.length === 0) {
                return "Invalid Input";
            }

            const txn = activeTxn(txnId);

            if (!txn) return { error: "No active transaction" };

            txn.savepoints.set(savepointName, {
                data: cloneData(txn.working),
                opCount: txn.operationCount
            });

            return { txnId, savepointName, created: true };
        },

        rollbackToSavepoint(txnId, savepointName) {

            if (typeof txnId !== "string" || txnId.length === 0 ||
                typeof savepointName !== "string" || savepointName.length === 0) {
                return "Invalid Input";
            }

            const txn = activeTxn(txnId);

            if (!txn) return { error: "No active transaction" };

            if (!txn.savepoints.has(savepointName)) {
                return { error: "Savepoint not found" };
            }

            const snapshot = txn.savepoints.get(savepointName);

            const discarded = txn.operationCount - snapshot.opCount;

            txn.working = cloneData(snapshot.data);
            txn.operationCount = snapshot.opCount;

            // Remove savepoints created after this one (creation order).

            const names = Array.from(txn.savepoints.keys());
            const idx = names.indexOf(savepointName);

            for (let i = idx + 1; i < names.length; i++) {
                txn.savepoints.delete(names[i]);
            }

            return { txnId, savepointName, rolledBack: true, operationsDiscarded: discarded };
        },

        releaseSavepoint(txnId, savepointName) {

            if (typeof txnId !== "string" || txnId.length === 0 ||
                typeof savepointName !== "string" || savepointName.length === 0) {
                return "Invalid Input";
            }

            const txn = activeTxn(txnId);

            if (!txn) return { error: "No active transaction" };

            if (!txn.savepoints.has(savepointName)) {
                return { error: "Savepoint not found" };
            }

            txn.savepoints.delete(savepointName);

            return { txnId, savepointName, released: true };
        },

        write(txnId, table, operation, data) {

            if (typeof txnId !== "string" || txnId.length === 0 ||
                typeof table !== "string" || table.length === 0 ||
                !["INSERT", "UPDATE", "DELETE"].includes(operation)) {
                return "Invalid Input";
            }

            const txn = activeTxn(txnId);

            if (!txn) return { error: "No active transaction: " + txnId };

            const ok = applyWrite(txn.working, table, operation, data);

            if (!ok) return "Invalid Input";

            txn.operationCount++;

            return { txnId, operation, table, applied: true };
        },

        commit(txnId) {

            if (typeof txnId !== "string" || txnId.length === 0) return "Invalid Input";

            const txn = activeTxn(txnId);

            if (!txn) return { error: "No active transaction: " + txnId };

            mainData = cloneData(txn.working);

            const count = txn.operationCount;

            txns.delete(txnId);

            return { txnId, committed: true, operationsApplied: count };
        },

        rollback(txnId) {

            if (typeof txnId !== "string" || txnId.length === 0) return "Invalid Input";

            const txn = activeTxn(txnId);

            if (!txn) return { error: "No active transaction: " + txnId };

            const count = txn.operationCount;

            txns.delete(txnId);

            return { txnId, rolledBack: true, operationsDiscarded: count };
        },

        getSavepoints(txnId) {

            if (typeof txnId !== "string" || txnId.length === 0) return "Invalid Input";

            const txn = activeTxn(txnId);

            if (!txn) return { error: "No active transaction" };

            return Array.from(txn.savepoints.keys());
        }
    };
}



// ------ EXAMPLE USAGE ------

const spm = createSavepointManager({
    accounts: [{ id: "A1", balance: 1000 }, { id: "A2", balance: 2000 }]
});


console.log(spm.begin("TXN-1"));

console.log(spm.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 800 } }));

console.log(spm.savepoint("TXN-1", "SP1"));

console.log(spm.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 600 } }));

console.log(spm.savepoint("TXN-1", "SP2"));

console.log(spm.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 400 } }));

console.log(spm.getSavepoints("TXN-1"));

console.log(spm.rollbackToSavepoint("TXN-1", "SP1"));

console.log(spm.getSavepoints("TXN-1"));

console.log(spm.commit("TXN-1"));


// --- INVALID ---
console.log(createSavepointManager([]));