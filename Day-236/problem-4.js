// 🧩 PROBLEM–04: createTransactionalDB()

// Logic: Extends the in-memory DB (Problem-01) with transactions.
//   createCollection(name) — same as Problem-01
//   getCollection(name)    — same as Problem-01
//   beginTransaction()     — snapshot all collections, return txnId
//   commit()               — commit pending changes, clear snapshot
//   rollback()             — restore all collections to snapshot
//   runTransaction(fn)     — auto begin → run fn(db) → commit/rollback
//   getTransactionLog()    — history of all transactions

// Snapshot approach: commit/rollback track operationsCount via deep-copy of the store before vs after.


function createTransactionalDB() {

    // --- STEP 1: INTERNAL STATE ---

    // name -> { docs: [], autoIndex }
    const collections = {};

    let txnIndex = 0;

    // Active transaction snapshot: { snapshot: deep copy, operationsCount, txnId }
    let activeTxn = null;

    const txnLog = [];

    // --- STEP 2: COLLECTION VIEW FACTORY (Problem-01 logic) ---

    function createCollectionView(name, store) {

        function record() {
            if (activeTxn) activeTxn.operationsCount++;
        }

        return {
            insert(doc) {
                if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";
                store.autoIndex++;
                const newDoc = { _id: name + "_" + store.autoIndex, ...doc };
                store.docs.push(newDoc);
                record();
                return { inserted: true, doc: { ...newDoc } };
            },
            findById(id) {
                if (typeof id !== "string") return "Invalid Input";
                const doc = store.docs.find(d => d._id === id);
                return doc ? { found: true, doc: { ...doc } } : { found: false, _id: id };
            },
            findAll() {
                return store.docs.map(d => ({ ...d }));
            },
            update(id, updates) {
                if (typeof id !== "string" || typeof updates !== "object" || updates === null || Array.isArray(updates)) return "Invalid Input";
                const idx = store.docs.findIndex(d => d._id === id);
                if (idx === -1) return { error: "Document not found" };
                store.docs[idx] = { ...store.docs[idx], ...updates };
                record();
                return { updated: true, doc: { ...store.docs[idx] } };
            },
            delete(id) {
                if (typeof id !== "string") return "Invalid Input";
                const idx = store.docs.findIndex(d => d._id === id);
                if (idx === -1) return { error: "Document not found" };
                store.docs.splice(idx, 1);
                record();
                return { deleted: true, _id: id };
            },
            count() {
                return store.docs.length;
            }
        };
    }

    // --- STEP 3: SNAPSHOT HELPERS ---

    function snapshotState() {
        // Deep-copy collections into a plain map: name -> { docs, autoIndex }.
        const copy = {};
        for (const name of Object.keys(collections)) {
            copy[name] = {
                docs: collections[name].docs.map(d => ({ ...d })),
                autoIndex: collections[name].autoIndex
            };
        }
        return copy;
    }

    function restoreState(snapshot) {
        // Mutate existing collection objects in place so live views stay valid.
        for (const name of Object.keys(collections)) {
            if (snapshot[name]) {
                collections[name].docs = snapshot[name].docs.map(d => ({ ...d }));
                collections[name].autoIndex = snapshot[name].autoIndex;
            } else {
                delete collections[name];
            }
        }
        // Restore collections that existed in the snapshot but not now.
        for (const name of Object.keys(snapshot)) {
            if (!collections[name]) {
                collections[name] = {
                    docs: snapshot[name].docs.map(d => ({ ...d })),
                    autoIndex: snapshot[name].autoIndex
                };
            }
        }
    }

    // Count mutating operations is handled by the collection view's record() hook,
    // which increments activeTxn.operationsCount on insert/update/delete.

    // --- STEP 4: RETURN TRANSACTIONAL DB OBJECT ---

    return {

        createCollection(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            if (collections[name]) {
                return { created: false, reason: "Collection already exists: " + name };
            }

            collections[name] = { docs: [], autoIndex: 0 };

            return { created: true, name };
        },

        getCollection(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            if (!collections[name]) return { error: "Collection not found: " + name };

            return createCollectionView(name, collections[name]);
        },

        beginTransaction() {

            if (activeTxn) return { error: "Transaction already active" };

            txnIndex++;

            activeTxn = {
                txnId: "TXN-" + txnIndex,
                snapshot: snapshotState(),
                operationsCount: 0
            };

            return { txnId: activeTxn.txnId, started: true };
        },

        commit() {

            if (!activeTxn) return { error: "No active transaction" };

            const txn = activeTxn;

            activeTxn = null;

            txnLog.push({
                txnId: txn.txnId,
                status: "COMMITTED",
                operationsCount: txn.operationsCount,
                timestamp: "2025-01-01T00:00:00Z"
            });

            return { txnId: txn.txnId, committed: true, operationsCount: txn.operationsCount };
        },

        rollback() {

            if (!activeTxn) return { error: "No active transaction" };

            const txn = activeTxn;

            const operationsUndone = txn.operationsCount;

            restoreState(txn.snapshot);

            activeTxn = null;

            txnLog.push({
                txnId: txn.txnId,
                status: "ROLLED_BACK",
                operationsCount: operationsUndone,
                timestamp: "2025-01-01T00:00:00Z"
            });

            return { txnId: txn.txnId, rolledBack: true, operationsUndone };
        },

        runTransaction(operationsFn) {

            if (typeof operationsFn !== "function") return "Invalid Input";

            const started = this.beginTransaction();

            if (started.error) return started;

            let result;
            let shouldRollback = false;

            try {
                result = operationsFn(this);
                shouldRollback = result && typeof result === "object" && result.abort === true;
            } catch (e) {
                shouldRollback = true;
            }

            if (shouldRollback) {
                const rb = this.rollback();
                return { txnId: rb.txnId, committed: false, rolledBack: true, result: result ?? null };
            }

            const cm = this.commit();

            return { txnId: cm.txnId, committed: true, rolledBack: false, result: result ?? null };
        },

        getTransactionLog() {
            return txnLog.slice();
        }
    };
}


// ------ EXAMPLE USAGE ------

const tdb = createTransactionalDB();
tdb.createCollection("accounts");

const accounts = tdb.getCollection("accounts");
accounts.insert({ _id: "A1", owner: "Rahim", balance: 1000 });

console.log(tdb.beginTransaction());


accounts.update("A1", { balance: 500 });
accounts.insert({ _id: "A2", owner: "Karim", balance: 2000 });

console.log(accounts.findById("A1"));

console.log(tdb.rollback());

console.log(accounts.findById("A1"));

console.log(accounts.count());


// Atomic transaction:
console.log(tdb.runTransaction((db) => {
    const col = db.getCollection("accounts");
    col.insert({ _id: "A3", owner: "Nadia", balance: 3000 });
    return { abort: false };
}));

console.log(accounts.count());

console.log(tdb.getTransactionLog());

// --- INVALID ---
console.log(tdb.commit());