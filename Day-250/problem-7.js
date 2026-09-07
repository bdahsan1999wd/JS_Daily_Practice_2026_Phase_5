// 🧩 PROBLEM–07: buildDBSecurityLayer()

//  Logic: DB layer with indexes, transactions (snapshot/commit/rollback),
//  and query processing with SQLI detection.

const __SQLI_PATTERNS = ["' OR", "--", "UNION SELECT", "DROP TABLE", "DROP"];

function __deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
}

function __hasSQLI(value) {
    const str = String(value);
    return __SQLI_PATTERNS.some(pattern => str.toUpperCase().includes(pattern.toUpperCase()));
}


function buildDBSecurityLayer(dbConfig) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof dbConfig !== "object" ||
        dbConfig === null ||
        Array.isArray(dbConfig) ||
        typeof dbConfig.tables !== "object" ||
        dbConfig.tables === null ||
        Array.isArray(dbConfig.tables) ||
        !Array.isArray(dbConfig.indexes) ||
        !Array.isArray(dbConfig.transactions) ||
        !Array.isArray(dbConfig.queries)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: MAIN STATE ---

    const tables = {}; // tableName -> [records]

    for (const [tableName, records] of Object.entries(dbConfig.tables)) {
        tables[tableName] = __deepCopy(records);
    }

    const indexMap = {}; // "table.field" -> index

    for (const index of dbConfig.indexes) {
        indexMap[index.table + "." + index.field] = index;
    }

    // --- STEP 3: TRANSACTION PROCESSING ---

    const transactionLog = [];

    let committedCount = 0;
    let rolledBackCount = 0;

    for (const txn of dbConfig.transactions) {
        const snapshot = __deepCopy(tables);

        const workingCopy = __deepCopy(tables);

        for (const op of txn.operations) {
            const records = workingCopy[op.table];

            if (op.type === "WRITE") {
                const existing = records.find(r => r.id === op.data.id);
                if (existing) {
                    Object.assign(existing, op.data);
                } else {
                    records.push(__deepCopy(op.data));
                }
            } else if (op.type === "DELETE") {
                const idx = records.findIndex(r => r.id === op.id);
                if (idx !== -1) records.splice(idx, 1);
            } else if (op.type === "READ") {
                // no modification
            }
        }

        if (txn.shouldRollback) {
            rolledBackCount++;
            transactionLog.push({
                txnId: txn.txnId,
                status: "ROLLED_BACK",
                operationsDiscarded: txn.operations.length
            });
        } else {
            committedCount++;
            for (const [tableName, records] of Object.entries(workingCopy)) {
                tables[tableName] = records;
            }
            transactionLog.push({
                txnId: txn.txnId,
                status: "COMMITTED",
                operationsApplied: txn.operations.length
            });
        }

        void snapshot;
    }

    // --- STEP 4: QUERY PROCESSING ---

    const queryLog = [];

    let indexScans = 0;
    let fullScans = 0;
    let blockedQueries = 0;

    for (const query of dbConfig.queries) {
        const filter = query.filter;
        const tableRecords = tables[query.table] || [];

        const hasIndex = indexMap[query.table + "." + filter.field] != null;
        const scanType = hasIndex ? "INDEX_SCAN" : "FULL_SCAN";

        if (scanType === "INDEX_SCAN") indexScans++;
        else fullScans++;

        let blocked = false;
        let reason = null;

        if (query.sanitize === true && __hasSQLI(filter.value)) {
            blocked = true;
            blockedQueries++;
            reason = "SQLI_DETECTED";
            queryLog.push({ queryId: query.queryId, results: [], count: 0, scanType, blocked: true, reason });
            continue;
        }

        const field = filter.field;
        const operator = filter.operator || "=";
        const expected = filter.value;

        const results = tableRecords.filter(record => {
            const actual = record[field];
            switch (operator) {
                case "=": return actual === expected;
                case "!=": return actual !== expected;
                case ">": return actual > expected;
                case "<": return actual < expected;
                case ">=": return actual >= expected;
                case "<=": return actual <= expected;
                case "LIKE": return String(actual).includes(String(expected));
                default: return actual === expected;
            }
        });

        queryLog.push({
            queryId: query.queryId,
            results: __deepCopy(results),
            count: results.length,
            scanType,
            blocked: false
        });
    }

    // --- STEP 5: SUMMARY ---

    const finalTableStats = {};

    for (const [tableName, records] of Object.entries(tables)) {
        finalTableStats[tableName] = records.length;
    }

    return {
        transactionLog,
        queryLog,
        summary: {
            transactionSummary: { committed: committedCount, rolledBack: rolledBackCount },
            querySummary: { total: queryLog.length, indexScans, fullScans, blocked: blockedQueries },
            finalTableStats
        }
    };
}


// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(buildDBSecurityLayer({
    tables: {
        users: [{ id: "U1", name: "Rahim", dept: "IT" }, { id: "U2", name: "Karim", dept: "HR" }]
    },
    indexes: [{ table: "users", field: "dept", type: "HASH" }],
    transactions: [
        { txnId: "T1", isolationLevel: "READ_COMMITTED", operations: [{ type: "WRITE", table: "users", id: null, data: { id: "U3", name: "Nadia", dept: "IT" } }], shouldRollback: false }
    ],
    queries: [
        { queryId: "Q1", table: "users", filter: { field: "dept", operator: "=", value: "IT" }, sanitize: true },
        { queryId: "Q2", table: "users", filter: { field: "name", operator: "=", value: "' OR 1=1 --" }, sanitize: true }
    ]
}), null, 2));


// --- INVALID ---
console.log(buildDBSecurityLayer(null));