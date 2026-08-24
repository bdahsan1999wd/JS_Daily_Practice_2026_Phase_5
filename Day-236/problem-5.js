// 🧩 PROBLEM–05: runDBEngineOrchestrator()

// Logic: Full DB Engine Orchestrator — composes Problems 01–04.
// 1. Create DB + collections, seed initial documents
// 2. Process transactions (begin → ops → commit/rollback)
// 3. Run queries on final state
// 4. Build report: dbStats, transactionSummary, querySummary


function runDBEngineOrchestrator(dbConfig) {

    // --- STEP 1: VALIDATE dbConfig ---

    if (
        typeof dbConfig !== "object" || dbConfig === null || Array.isArray(dbConfig) ||
        typeof dbConfig.dbId !== "string" || dbConfig.dbId.trim() === "" ||
        !Array.isArray(dbConfig.collections) ||
        !Array.isArray(dbConfig.transactions) ||
        !Array.isArray(dbConfig.queries)
    ) {
        return "Invalid Input";
    }

    const { dbId, collections, transactions, queries } = dbConfig;

    // --- STEP 2: PROBLEM-01 IN-MEMORY DB (self-contained) ---

    const store = {}; // name -> { docs: [], autoIndex }
    const transactionLog = [];

    function createCollection(name) {
        if (store[name]) return { created: false, reason: "Collection already exists: " + name };
        store[name] = { docs: [], autoIndex: 0 };
        return { created: true, name };
    }

    function collectionView(name) {
        const s = store[name];
        return {
            insert(doc) {
                if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";
                s.autoIndex++;
                const newDoc = { _id: name + "_" + s.autoIndex, ...doc };
                s.docs.push(newDoc);
                return { inserted: true, doc: { ...newDoc } };
            },
            findById(id) {
                const doc = s.docs.find(d => d._id === id);
                return doc ? { found: true, doc: { ...doc } } : { found: false, _id: id };
            },
            findAll() { return s.docs.map(d => ({ ...d })); },
            update(id, updates) {
                const idx = s.docs.findIndex(d => d._id === id);
                if (idx === -1) return { error: "Document not found" };
                s.docs[idx] = { ...s.docs[idx], ...updates };
                return { updated: true, doc: { ...s.docs[idx] } };
            },
            delete(id) {
                const idx = s.docs.findIndex(d => d._id === id);
                if (idx === -1) return { error: "Document not found" };
                s.docs.splice(idx, 1);
                return { deleted: true, _id: id };
            },
            count() { return s.docs.length; }
        };
    }

    function getDBStats() {
        const c = {};
        let total = 0;
        for (const name of Object.keys(store)) {
            c[name] = store[name].docs.length;
            total += store[name].docs.length;
        }
        return { totalCollections: Object.keys(store).length, totalDocuments: total, collections: c };
    }

    // --- STEP 3: SEED DATA (Problem-04 logic for _id generation) ---

    for (const col of collections) {
        createCollection(col.name);
        for (const doc of col.seedDocuments) {
            collectionView(col.name).insert(doc);
        }
    }

    // --- STEP 4: TRANSACTION MANAGEMENT (Problem-04 logic) ---

    let txnCounter = 0;

    function snapshot() {
        const copy = {};
        for (const name of Object.keys(store)) {
            copy[name] = { docs: store[name].docs.map(d => ({ ...d })), autoIndex: store[name].autoIndex };
        }
        return copy;
    }

    function restore(snap) {
        for (const name of Object.keys(store)) {
            if (snap[name]) {
                store[name].docs = snap[name].docs.map(d => ({ ...d }));
                store[name].autoIndex = snap[name].autoIndex;
            } else {
                delete store[name];
            }
        }
        for (const name of Object.keys(snap)) {
            if (!store[name]) {
                store[name] = { docs: snap[name].docs.map(d => ({ ...d })), autoIndex: snap[name].autoIndex };
            }
        }
    }

    // Process a transaction's operations against the live store, counting ops.

    function applyOperations(operations) {

        let opCount = 0;

        for (const op of operations) {

            const view = collectionView(op.collection);

            if (!view) return { error: true };

            let result;

            switch (op.type) {
                case "INSERT":
                    result = view.insert(op.data || {});
                    if (result.inserted) opCount++;
                    break;
                case "UPDATE":
                    result = view.update(op.id, op.updates || {});
                    if (result.updated) opCount++;
                    break;
                case "DELETE":
                    result = view.delete(op.id);
                    if (result.deleted) opCount++;
                    break;
                case "FIND":
                    result = view.findById(op.id);
                    break;
                default:
                    return { error: true };
            }
        }

        return { error: false, operationsCount: opCount };
    }

    for (const txn of transactions) {

        const txnId = txn.txnId || ("TXN-" + (++txnCounter));

        // Snapshot pre-transaction state.
        const snap = snapshot();

        const applied = applyOperations(txn.operations);

        if (txn.shouldRollback || applied.error) {
            restore(snap);
            transactionLog.push({ txnId, status: "ROLLED_BACK", operationsCount: applied.operationsCount || 0 });
        } else {
            transactionLog.push({ txnId, status: "COMMITTED", operationsCount: applied.operationsCount });
        }
    }

    // --- STEP 5: QUERY ENGINE (Problem-02/03 logic) ---

    function matches(doc, query) {
        for (const field of Object.keys(query)) {
            const condition = query[field];
            if (typeof condition === "object" && condition !== null && !Array.isArray(condition)) {
                for (const op of Object.keys(condition)) {
                    const expected = condition[op];
                    const actual = doc[field];
                    switch (op) {
                        case "$gt": if (!(actual > expected)) return false; break;
                        case "$gte": if (!(actual >= expected)) return false; break;
                        case "$lt": if (!(actual < expected)) return false; break;
                        case "$lte": if (!(actual <= expected)) return false; break;
                        case "$ne": if (actual === expected) return false; break;
                        case "$in": if (!(Array.isArray(expected) && expected.includes(actual))) return false; break;
                        case "$nin": if (Array.isArray(expected) && expected.includes(actual)) return false; break;
                        case "$contains":
                            if (typeof actual !== "string" || typeof expected !== "string" ||
                                !actual.toLowerCase().includes(expected.toLowerCase())) return false;
                            break;
                        case "$exists":
                            if (expected === true && actual === undefined) return false;
                            if (expected === false && actual !== undefined) return false;
                            break;
                        default: return false;
                    }
                }
            } else {
                if (doc[field] !== condition) return false;
            }
        }
        return true;
    }

    function runQuery(q) {

        const docs = store[q.collection].docs.filter(d => matches(d, q.filter || {}));

        // Sort.
        let sorted = docs;
        if (q.sort) {
            const field = Object.keys(q.sort)[0];
            const dir = q.sort[field];
            sorted = [...docs].sort((a, b) => {
                if (a[field] < b[field]) return -1 * dir;
                if (a[field] > b[field]) return 1 * dir;
                return 0;
            });
        }

        // Limit.
        let limited = sorted;
        if (q.limit) limited = sorted.slice(0, q.limit);

        // Project.
        const result = limited.map(doc => {
            if (!q.project) return { ...doc };
            const out = { _id: doc._id };
            for (const f of q.project) {
                if (f !== "_id" && doc[f] !== undefined) out[f] = doc[f];
            }
            return out;
        });

        return { docs: result, totalMatched: docs.length, returned: result.length };
    }

    const queryLog = [];

    for (const q of queries) {
        queryLog.push({ queryId: q.queryId, result: runQuery(q) });
    }

    // --- STEP 6: BUILD REPORT ---

    const report = {
        dbStats: getDBStats(),
        transactionSummary: {
            total: transactionLog.length,
            committed: transactionLog.filter(t => t.status === "COMMITTED").length,
            rolledBack: transactionLog.filter(t => t.status === "ROLLED_BACK").length
        },
        querySummary: {
            total: queryLog.length,
            results: queryLog.map(q => ({ queryId: q.queryId, count: q.result.returned }))
        }
    };

    return { dbId, transactionLog, queryLog, report };
}



// ------ EXAMPLE USAGE ------

console.log(runDBEngineOrchestrator({
    dbId: "DB-01",
    collections: [
        {
            name: "products", seedDocuments: [
                { name: "JS Book", price: 500, category: "TECH" },
                { name: "CSS Guide", price: 300, category: "TECH" },
                { name: "Design Basics", price: 450, category: "DESIGN" }
            ]
        }
    ],
    transactions: [
        {
            txnId: "TXN-A",
            operations: [
                { collection: "products", type: "INSERT", data: { name: "Node.js Handbook", price: 600, category: "TECH" }, id: null, updates: null }
            ],
            shouldRollback: false
        },
        {
            txnId: "TXN-B",
            operations: [
                { collection: "products", type: "UPDATE", data: null, id: "products_1", updates: { price: 550 } }
            ],
            shouldRollback: true
        }
    ],
    queries: [
        { queryId: "Q1", collection: "products", filter: { category: "TECH" }, sort: { price: -1 }, project: ["name", "price"], limit: null },
        { queryId: "Q2", collection: "products", filter: null, sort: null, project: null, limit: 2 }
    ]
}));


// --- INVALID ---
console.log(runDBEngineOrchestrator({ dbId: "", collections: [], transactions: [], queries: [] }));