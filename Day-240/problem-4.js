// 🧩 PROBLEM–04: createIsolationSimulator()

// Logic: Simulates DB isolation levels with a shared main store and per-transaction
// working copies.

//   READ_UNCOMMITTED — read() sees LATEST working copy of ANY active txn
//                      (metadata: dirtyRead: true/false)

//   READ_COMMITTED   — read() sees only committed data (main store)

//   REPEATABLE_READ  — first read of a record captures the value; later
//                      reads of same record return the captured value

//   SERIALIZABLE     — reads appear serialized (uses main store, fully isolated)

// demonstratePhenomenon(phenomenon) returns steps + whether current level prevents it.


const LEVELS = ["READ_UNCOMMITTED", "READ_COMMITTED", "REPEATABLE_READ", "SERIALIZABLE"];

function createIsolationSimulator(initialData) {

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

    let isolationLevel = "READ_COMMITTED";

    // txnId -> { working, snapshot, reads: Map(table:id -> capturedRecord) }

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

    // Find a record in the latest working copy of any active txn.

    function latestWorkingRecord(table, id) {

        for (const txn of txns.values()) {

            const rows = txn.working[table];
            const rec = Array.isArray(rows) ? rows.find(r => r.id === id) : undefined;

            if (rec !== undefined) return rec;
        }

        return undefined;
    }

    // --- STEP 3: PUBLIC API ---

    return {

        setIsolationLevel(level) {

            if (!LEVELS.includes(level)) return "Invalid Input";

            isolationLevel = level;

            return { isolationLevel: level };
        },

        begin(txnId) {

            if (typeof txnId !== "string" || txnId.length === 0) return "Invalid Input";

            if (txns.has(txnId)) {
                return { error: "Transaction already active: " + txnId };
            }

            txns.set(txnId, {
                working: cloneData(mainData),
                snapshot: cloneData(mainData),
                reads: new Map(),
                operationCount: 0
            });

            return { txnId, started: true, isolationLevel, timestamp: "2025-01-01T00:00:00Z" };
        },

        read(txnId, table, id) {

            if (typeof txnId !== "string" || txnId.length === 0 ||
                typeof table !== "string" || table.length === 0 ||
                id === undefined || id === null) {
                return "Invalid Input";
            }

            const txn = activeTxn(txnId);

            if (!txn) return { error: "No active transaction: " + txnId };

            const key = table + ":" + id;

            let record;
            let meta = {};

            if (isolationLevel === "READ_UNCOMMITTED") {

                const uncommitted = latestWorkingRecord(table, id);

                record = uncommitted !== undefined ? { ...uncommitted } : null;

                // dirtyRead: true only when a different txn wrote it uncommitted.

                const inOwn = txn.working[table]?.find(r => r.id === id);
                meta = { dirtyRead: uncommitted !== undefined && uncommitted !== inOwn };

            } else if (isolationLevel === "READ_COMMITTED") {

                const rows = mainData[table];
                const rec = Array.isArray(rows) ? rows.find(r => r.id === id) : undefined;

                record = rec ? { ...rec } : null;
                meta = { dirtyRead: false };

            } else if (isolationLevel === "REPEATABLE_READ") {

                if (txn.reads.has(key)) {
                    // Return captured value.
                    const captured = txn.reads.get(key);
                    record = captured ? { ...captured } : null;
                } else {
                    const rows = mainData[table];
                    const rec = Array.isArray(rows) ? rows.find(r => r.id === id) : undefined;
                    record = rec ? { ...rec } : null;
                    txn.reads.set(key, rec ? { ...rec } : null);
                }

                meta = { repeatedRead: true };

            } else { // SERIALIZABLE

                const rows = mainData[table];
                const rec = Array.isArray(rows) ? rows.find(r => r.id === id) : undefined;

                record = rec ? { ...rec } : null;
                meta = { serialized: true };
            }

            return {
                txnId,
                table,
                record,
                isolationLevel,
                ...meta
            };
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

        demonstratePhenomenon(phenomenon) {

            if (!["DIRTY_READ", "NON_REPEATABLE_READ", "PHANTOM_READ"].includes(phenomenon)) {
                return "Invalid Input";
            }

            let demonstrationSteps = [];
            let prevented = false;

            if (phenomenon === "DIRTY_READ") {

                demonstrationSteps = [
                    "TXN-A updates balance to 500 (not committed)",
                    "TXN-B reads balance = 500 (dirty read)",
                    "TXN-A rolls back — balance was never 500",
                    "TXN-B has read incorrect data"
                ];

                prevented = isolationLevel !== "READ_UNCOMMITTED";

            } else if (phenomenon === "NON_REPEATABLE_READ") {

                demonstrationSteps = [
                    "TXN-A reads balance = 1000",
                    "TXN-B commits balance = 800",
                    "TXN-A reads balance again = 800 (non-repeatable)",
                    "Same query returned different values within one transaction"
                ];

                prevented = ["REPEATABLE_READ", "SERIALIZABLE"].includes(isolationLevel);

            } else if (phenomenon === "PHANTOM_READ") {

                demonstrationSteps = [
                    "TXN-A queries accounts with balance > 500 → returns 2 rows",
                    "TXN-B inserts a new account matching the predicate and commits",
                    "TXN-A re-queries → returns 3 rows (phantom row appeared)",
                    "New rows appeared that were invisible at transaction start"
                ];

                prevented = isolationLevel === "SERIALIZABLE";
            }

            return { phenomenon, demonstrationSteps, prevented };
        }
    };
}



// ------ EXAMPLE USAGE ------

const iso = createIsolationSimulator({
    accounts: [{ id: "A1", balance: 1000 }]
});


console.log(iso.setIsolationLevel("READ_UNCOMMITTED"));

console.log(iso.begin("TXN-1"));
console.log(iso.begin("TXN-2"));

console.log(iso.write("TXN-1", "accounts", "UPDATE", { id: "A1", updates: { balance: 500 } }));

console.log(iso.read("TXN-2", "accounts", "A1"));

console.log(iso.rollback("TXN-1"));

console.log(iso.demonstratePhenomenon("DIRTY_READ"));

console.log(iso.setIsolationLevel("READ_COMMITTED"));

console.log(iso.demonstratePhenomenon("DIRTY_READ"));

console.log(iso.demonstratePhenomenon("NON_REPEATABLE_READ"));

console.log(iso.demonstratePhenomenon("PHANTOM_READ"));


// --- INVALID ---
console.log(iso.setIsolationLevel("WRONG"));