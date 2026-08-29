// 🧩 PROBLEM–05: runFullDBOrchestrator()

// Logic: Composes migrations (P4), index building (Day-241), transactions
// (Day-240), query engine (P2), aggregations (Day-239), and monitoring (P3)
// into a full database bootstrap + execution run.


const TIMESTAMP = "2025-01-01T00:00:00Z";

function runFullDBOrchestrator(dbBlueprint) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof dbBlueprint !== "object" ||
        dbBlueprint === null ||
        Array.isArray(dbBlueprint) ||
        typeof dbBlueprint.dbId !== "string" ||
        dbBlueprint.dbId.length === 0 ||
        !Array.isArray(dbBlueprint.migrations) ||
        typeof dbBlueprint.targetVersion !== "number" ||
        typeof dbBlueprint.seedData !== "object" ||
        dbBlueprint.seedData === null ||
        Array.isArray(dbBlueprint.seedData) ||
        !Array.isArray(dbBlueprint.indexes) ||
        !Array.isArray(dbBlueprint.transactions) ||
        !Array.isArray(dbBlueprint.queries) ||
        !Array.isArray(dbBlueprint.aggregations) ||
        typeof dbBlueprint.monitorConfig !== "object" ||
        dbBlueprint.monitorConfig === null
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: MIGRATIONS (Problem-04) ---

    function createMigrationEngine(migrationConfig) {

        let currentVersion = migrationConfig.currentVersion;

        const migrations = new Map();
        const applied = new Set();
        const rolledBack = new Set();

        const db = { tables: {}, indexes: {} };

        return {

            addMigration(migration) {

                if (typeof migration !== "object" || migration === null ||
                    typeof migration.version !== "number" || !Number.isInteger(migration.version) ||
                    migration.version <= 0 ||
                    typeof migration.name !== "string" ||
                    typeof migration.up !== "function" ||
                    typeof migration.down !== "function") {
                    return "Invalid Input";
                }

                if (migrations.has(migration.version)) {
                    return { added: false, reason: "Version already registered: " + migration.version };
                }

                migrations.set(migration.version, migration);

                return { added: true, version: migration.version, name: migration.name };
            },

            runMigrations(targetVersion) {

                const versions = Array.from(migrations.keys()).sort((a, b) => a - b);

                const toRun = versions.filter(v => v > currentVersion && v <= targetVersion);

                const fromVersion = currentVersion;
                const log = [];

                for (const version of toRun) {

                    const migration = migrations.get(version);

                    let changes = [];
                    let status = "SUCCESS";

                    try {
                        const result = migration.up(db);
                        changes = result.changes;
                    } catch (e) {
                        status = "FAILED";
                    }

                    if (status === "SUCCESS") {
                        currentVersion = version;
                        applied.add(version);
                        rolledBack.delete(version);
                    }

                    log.push({ version, name: migration.name, changes, status });
                }

                return { migrationsRun: log.length, fromVersion, toVersion: currentVersion, log };
            },

            rollbackMigration(version) {

                if (version !== currentVersion) {
                    return { error: "Can only rollback latest version: " + currentVersion };
                }

                const migration = migrations.get(version);

                if (!migration) return { error: "Migration not found: " + version };

                const result = migration.down(db);

                applied.delete(version);
                rolledBack.add(version);
                currentVersion--;

                return { rolledBack: true, version, changes: result.changes };
            },

            getMigrationStatus() {

                const versions = Array.from(migrations.keys()).sort((a, b) => a - b);

                return versions.map(version => {

                    let status = "PENDING";

                    if (applied.has(version)) status = "APPLIED";
                    else if (rolledBack.has(version)) status = "ROLLED_BACK";

                    return { version, name: migrations.get(version).name, status };
                });
            },

            getCurrentVersion() {
                return currentVersion;
            }
        };
    }

    const migrationEngine = createMigrationEngine({
        engineId: dbBlueprint.dbId + "-MIG",
        currentVersion: 0
    });

    const migrationLog = [];

    for (const migration of dbBlueprint.migrations) {
        migrationEngine.addMigration(migration);
    }

    const runResult = migrationEngine.runMigrations(dbBlueprint.targetVersion);

    for (const entry of runResult.log) {
        migrationLog.push({ version: entry.version, name: entry.name, changes: entry.changes, status: entry.status });
    }

    // The migration engine maintains its own db state. Extract tables created.

    // --- STEP 3: SEED DATA ---

    // DB state: tableName -> [records]

    const db = {};

    for (const table of Object.keys(dbBlueprint.seedData)) {
        db[table] = dbBlueprint.seedData[table].map(r => ({ ...r }));
    }

    const seedSummary = {};

    for (const table of Object.keys(db)) {
        seedSummary[table] = db[table].length;
    }

    // --- STEP 4: TRANSACTIONS (Day-240 logic) ---
    // (Indexes are built after transactions so they reflect committed data.)

    const transactionLog = [];
    let committedCount = 0;
    let rolledBackCount = 0;

    function applyWrite(txnState, table, op) {

        if (!Array.isArray(db[table])) return false;

        if (op.type === "INSERT") {
            db[table].push({ ...op.data });
            return true;
        }

        if (op.type === "UPDATE") {
            const rec = db[table].find(r => r.id === op.id);
            if (!rec) return false;
            Object.assign(rec, op.updates);
            return true;
        }

        if (op.type === "DELETE") {
            const idx = db[table].findIndex(r => r.id === op.id);
            if (idx === -1) return false;
            db[table].splice(idx, 1);
            return true;
        }

        return false;
    }

    for (const txn of dbBlueprint.transactions) {

        const snapshot = {};

        for (const t of Object.keys(db)) {
            snapshot[t] = db[t].map(r => ({ ...r }));
        }

        let opsDone = 0;

        for (const op of txn.operations) {
            if (applyWrite(null, op.table, op)) opsDone++;
        }

        if (txn.shouldRollback === true) {

            // Restore snapshot.

            for (const t of Object.keys(snapshot)) {
                db[t] = snapshot[t].map(r => ({ ...r }));
            }

            rolledBackCount++;
            transactionLog.push({ txnId: txn.txnId, status: "ROLLED_BACK", operationsCount: opsDone });

        } else {

            committedCount++;
            transactionLog.push({ txnId: txn.txnId, status: "COMMITTED", operationsCount: opsDone });
        }
    }

    // --- STEP 5: BUILD INDEXES (Day-241 logic, after transactions) ---

    const indexMaps = {};

    const indexSummary = { built: 0, indexes: [] };

    for (const ix of dbBlueprint.indexes) {

        const { tableName, column, indexType } = ix;

        if (!db[tableName]) continue;

        if (!indexMaps[tableName]) indexMaps[tableName] = new Map();

        let structure;

        if (indexType === "HASH") {

            structure = new Map();

            db[tableName].forEach(row => {
                const v = row[column];
                if (!structure.has(v)) structure.set(v, []);
                structure.get(v).push(row);
            });

        } else { // BTREE

            structure = db[tableName]
                .map(row => ({ value: row[column], row }))
                .sort((a, b) => {
                    if (a.value < b.value) return -1;
                    if (a.value > b.value) return 1;
                    return 0;
                });
        }

        indexMaps[tableName].set(column, { indexType, structure });

        indexSummary.built++;
        indexSummary.indexes.push({ tableName, column, indexType });
    }

    // --- STEP 6: QUERY ENGINE (Problem-02 logic) ---

    const queryLog = [];
    let queryIndexScans = 0;
    let queryFullScans = 0;

    function evaluate(condition, row) {

        const field = condition.field;
        const op = condition.operator;
        const value = condition.value;

        switch (op) {
            case "=": return row[field] === value;
            case "!=": return row[field] !== value;
            case ">": return row[field] > value;
            case ">=": return row[field] >= value;
            case "<": return row[field] < value;
            case "<=": return row[field] <= value;
            case "IN": return Array.isArray(value) && value.includes(row[field]);
            default: return false;
        }
    }

    for (const query of dbBlueprint.queries) {

        if (query.type !== "SELECT") continue;

        const table = query.table;

        // WHERE with index detection.

        let filtered;
        let scanType = "FULL_SCAN";
        let usedIndexes = [];

        const im = indexMaps[table];

        const eqCond = (query.where || []).find(c => c.operator === "=" && im && im.has(c.field));

        if (eqCond) {

            const entry = im.get(eqCond.field);

            let candidates;

            if (entry.indexType === "HASH") {
                candidates = entry.structure.get(eqCond.value) || [];
            } else {
                candidates = entry.structure.filter(p => p.value === eqCond.value).map(p => p.row);
            }

            filtered = candidates.filter(row => (query.where || []).every(c => {
                if (c === eqCond) return true;
                return evaluate(c, row);
            }));

            scanType = "INDEX_SCAN";
            usedIndexes = [eqCond.field];

        } else {

            filtered = db[table].filter(row => (query.where || []).every(c => evaluate(c, row)));
        }

        if (scanType === "INDEX_SCAN") queryIndexScans++;
        else queryFullScans++;

        // ORDER BY.

        if (query.orderBy) {

            const field = query.orderBy.field;
            const dir = query.orderBy.direction === "desc" ? -1 : 1;

            filtered = [...filtered].sort((a, b) => {
                if (a[field] < b[field]) return -1 * dir;
                if (a[field] > b[field]) return 1 * dir;
                return 0;
            });
        }

        // OFFSET / LIMIT.

        let final = filtered;

        if (query.offset) final = final.slice(query.offset);
        if (query.limit !== null && query.limit !== undefined) final = final.slice(0, query.limit);

        // PROJECT.

        let result;

        if (query.select && query.select.length > 0) {
            result = final.map(row => {
                const out = {};
                for (const f of query.select) out[f] = row[f];
                return out;
            });
        } else {
            result = final.map(row => ({ ...row }));
        }

        queryLog.push({
            type: "SELECT",
            table,
            result,
            rowsAffected: result.length,
            executionPlan: { scanType, usedIndexes }
        });
    }

    // --- STEP 7: AGGREGATIONS (Day-239 logic) ---

    const aggregationLog = [];
    let totalStagesRun = 0;

    for (const agg of dbBlueprint.aggregations) {

        const result = runPipeline(agg.pipeline);

        aggregationLog.push({
            aggId: agg.aggId,
            result: result.result,
            totalStages: result.totalStages
        });

        totalStagesRun += result.totalStages;
    }

    // Pipeline executor operating on `db`.

    function runPipeline(pipeline) {

        let current = [];

        // Determine which table(s) the pipeline starts from: use first table
        // that appears in seed data (pipeline is table-agnostic here, run over
        // the products table if present).

        const sourceTable = dbBlueprint.aggregationsSource || null;

        // If aggregation has a table, use it; else default to first table.

        current = flattenDbForPipeline(pipeline);

        let totalStages = 0;

        for (const stage of pipeline) {

            const key = Object.keys(stage)[0];

            if (stage.$match !== undefined) {
                current = current.filter(doc => matches(doc, stage.$match));
            } else if (stage.$group !== undefined) {

                const cfg = stage.$group;
                const groupField = cfg._id;

                let accumulators = cfg.accumulators;

                if (typeof accumulators !== "object" || accumulators === null) {
                    accumulators = {};
                    for (const k of Object.keys(cfg)) {
                        if (k !== "_id") accumulators[k] = cfg[k];
                    }
                }

                const groups = new Map();
                const order = [];

                for (const doc of current) {
                    const keyV = groupField === null ? null : doc[groupField];
                    if (!groups.has(keyV)) { groups.set(keyV, []); order.push(keyV); }
                    groups.get(keyV).push(doc);
                }

                current = order.map(gkey => {

                    const docs = groups.get(gkey);
                    const out = { _id: gkey };

                    for (const outField of Object.keys(accumulators)) {

                        const acc = accumulators[outField];
                        const operator = acc.operator;
                        const accField = acc.field;

                        switch (operator) {
                            case "$sum":
                                out[outField] = accField === 1 ? docs.length : docs.reduce((s, d) => s + (d[accField] ?? 0), 0);
                                break;
                            case "$avg":
                                out[outField] = Number((docs.reduce((s, d) => s + (d[accField] ?? 0), 0) / docs.length).toFixed(2));
                                break;
                            case "$count":
                                out[outField] = docs.length;
                                break;
                            case "$min":
                                out[outField] = Math.min(...docs.map(d => d[accField] ?? 0));
                                break;
                            case "$max":
                                out[outField] = Math.max(...docs.map(d => d[accField] ?? 0));
                                break;
                            case "$push":
                                out[outField] = docs.map(d => d[accField]);
                                break;
                        }
                    }

                    return out;
                });

            } else if (stage.$sort !== undefined) {

                const field = Object.keys(stage.$sort)[0];
                const dir = stage.$sort[field];

                current = [...current].sort((a, b) => {
                    if (a[field] < b[field]) return -1 * dir;
                    if (a[field] > b[field]) return 1 * dir;
                    return 0;
                });
            } else if (stage.$limit !== undefined) {
                current = current.slice(0, stage.$limit);
            }

            totalStages++;
        }

        return { result: current, totalStages };
    }

    function flattenDbForPipeline() {

        // Aggregation runs over the seeded products table (or first available).

        const table = dbBlueprint.seedData.products ? "products" : Object.keys(db)[0];

        return (db[table] || []).map(doc => ({ ...doc }));
    }

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
                        default: return false;
                    }
                }

            } else {

                if (doc[field] !== condition) return false;
            }
        }

        return true;
    }

    // --- STEP 8: MONITOR (Problem-03) ---

    function createDBMonitor(monitorConfig) {

        const monitorId = monitorConfig.monitorId;
        const tables = monitorConfig.tables;
        const threshold = monitorConfig.slowQueryThreshold;

        const queryRecords = [];

        function pct(part, whole) {
            return Number(((part / whole) * 100).toFixed(2));
        }

        return {

            recordQuery(queryRecord) {

                queryRecords.push({ ...queryRecord });

                return { recorded: true, queryId: queryRecord.queryId };
            },

            getTableStats(tableName) {

                const records = queryRecords.filter(q => q.table === tableName);

                if (records.length === 0) return { error: "No data for table: " + tableName };

                const avgCost = Number((records.reduce((s, q) => s + q.cost, 0) / records.length).toFixed(2));
                const indexScans = records.filter(q => q.scanType === "INDEX_SCAN").length;
                const totalRowsScanned = records.reduce((s, q) => s + q.rowsScanned, 0);

                return {
                    tableName,
                    totalQueries: records.length,
                    selectCount: records.filter(q => q.type === "SELECT").length,
                    insertCount: records.filter(q => q.type === "INSERT").length,
                    updateCount: records.filter(q => q.type === "UPDATE").length,
                    deleteCount: records.filter(q => q.type === "DELETE").length,
                    avgCost,
                    indexScanRate: pct(indexScans, records.length),
                    totalRowsScanned,
                    currentRecordCount: Array.isArray(tables[tableName]) ? tables[tableName].length : 0
                };
            },

            getSlowQueries() {

                return queryRecords
                    .filter(q => q.cost > threshold)
                    .sort((a, b) => b.cost - a.cost)
                    .map(q => ({ ...q }));
            },

            getTopQueries(n) {

                const counts = {};

                for (const q of queryRecords) counts[q.table] = (counts[q.table] || 0) + 1;

                return Object.keys(counts)
                    .map(table => ({ table, queryCount: counts[table] }))
                    .sort((a, b) => b.queryCount - a.queryCount)
                    .slice(0, n);
            },

            getDBHealth() {

                const totalQueries = queryRecords.length;

                const slowQueries = queryRecords.filter(q => q.cost > threshold).length;
                const indexScans = queryRecords.filter(q => q.scanType === "INDEX_SCAN").length;

                const slowQueryRate = totalQueries ? pct(slowQueries, totalQueries) : 0;
                const indexUsageRate = totalQueries ? pct(indexScans, totalQueries) : 100;
                const avgCost = totalQueries ? Number((queryRecords.reduce((s, q) => s + q.cost, 0) / totalQueries).toFixed(2)) : 0;

                const issues = [];

                if (slowQueryRate > 20) issues.push("High slow query rate: " + slowQueryRate + "%");
                if (indexUsageRate < 50) issues.push("Low index usage: " + indexUsageRate + "%");

                let status = "HEALTHY";

                if (slowQueryRate > 50 || indexUsageRate < 20) status = "CRITICAL";
                else if (slowQueryRate > 20 || indexUsageRate < 50) status = "DEGRADED";

                return {
                    status,
                    metrics: { totalQueries, slowQueryRate, indexUsageRate, avgCost },
                    issues
                };
            },

            generateReport() {

                const health = this.getDBHealth();

                const tableBreakdown = {};

                for (const table of Object.keys(tables)) {

                    const stats = this.getTableStats(table);

                    if (stats !== "Invalid Input" && !stats.error) {
                        tableBreakdown[table] = stats;
                    }
                }

                const recommendations = [];

                for (const table of Object.keys(tableBreakdown)) {
                    if (tableBreakdown[table].indexScanRate < 50 && tableBreakdown[table].totalQueries > 0) {
                        recommendations.push("Consider adding indexes to table: " + table);
                    }
                }

                const slow = this.getSlowQueries();

                if (slow.length > 0) {
                    recommendations.push("Optimize slow queries: " + slow.map(q => q.queryId).join(", "));
                }

                return {
                    monitorId,
                    generatedAt: TIMESTAMP,
                    summary: health,
                    tableBreakdown,
                    slowQueries: slow.map(q => ({ ...q })),
                    recommendations
                };
            }
        };
    }

    const monitor = createDBMonitor({
        monitorId: dbBlueprint.dbId + "-MON",
        tables: db,
        slowQueryThreshold: dbBlueprint.monitorConfig.slowQueryThreshold
    });

    // Record each executed query with a cost estimate.

    const SLOW_THRESHOLD = dbBlueprint.monitorConfig.slowQueryThreshold;

    for (const q of queryLog) {

        const cost = q.executionPlan.scanType === "INDEX_SCAN"
            ? Math.ceil(Math.log2((db[q.table] || []).length)) || 1
            : Math.max((db[q.table] || []).length, 1) * 10;

        monitor.recordQuery({
            queryId: q.executionPlan.usedIndexes[0] || q.type,
            type: q.type,
            table: q.table,
            scanType: q.executionPlan.scanType,
            rowsScanned: q.rowsAffected,
            rowsReturned: q.rowsAffected,
            cost,
            executedAt: TIMESTAMP
        });
    }

    const dbHealth = monitor.getDBHealth();

    // --- STEP 9: REPORT ---

    const report = {
        migrationSummary: {
            versionsApplied: migrationLog.length,
            fromVersion: 0,
            toVersion: dbBlueprint.targetVersion
        },
        seedSummary,
        indexSummary,
        transactionSummary: {
            total: dbBlueprint.transactions.length,
            committed: committedCount,
            rolledBack: rolledBackCount
        },
        querySummary: {
            total: queryLog.length,
            indexScans: queryIndexScans,
            fullScans: queryFullScans
        },
        aggregationSummary: {
            total: dbBlueprint.aggregations.length,
            totalStagesRun
        },
        dbHealth,
        finalDataState: {}
    };

    for (const table of Object.keys(db)) {
        report.finalDataState[table] = db[table].length;
    }

    return { dbId: dbBlueprint.dbId, migrationLog, transactionLog, queryLog, aggregationLog, report };
}


// ------ EXAMPLE USAGE ------

console.log(runFullDBOrchestrator({
    dbId: "FULL-DB-01",
    migrations: [
        { version: 1, name: "CreateProducts", up: (db) => { db.tables.products = []; return { changes: ["Created products table"] }; }, down: (db) => { delete db.tables.products; return { changes: ["Dropped products table"] }; } },
        { version: 2, name: "CreateOrders", up: (db) => { db.tables.orders = []; return { changes: ["Created orders table"] }; }, down: (db) => { delete db.tables.orders; return { changes: ["Dropped orders table"] }; } }
    ],
    targetVersion: 2,
    seedData: {
        products: [
            { id: "P1", name: "JS Book", category: "TECH", price: 500 },
            { id: "P2", name: "CSS Guide", category: "TECH", price: 300 },
            { id: "P3", name: "Design Basics", category: "DESIGN", price: 450 }
        ],
        orders: [
            { id: "O1", productId: "P1", qty: 2, total: 1000 },
            { id: "O2", productId: "P2", qty: 1, total: 300 }
        ]
    },
    indexes: [
        { tableName: "products", column: "category", indexType: "HASH" },
        { tableName: "products", column: "price", indexType: "BTREE" }
    ],
    transactions: [
        {
            txnId: "TXN-1",
            operations: [
                { type: "INSERT", table: "products", data: { id: "P4", name: "Node.js Handbook", category: "TECH", price: 600 }, id: null, updates: null }
            ],
            shouldRollback: false
        }
    ],
    queries: [
        { type: "SELECT", table: "products", select: ["name", "price"], where: [{ field: "category", operator: "=", value: "TECH" }], orderBy: { field: "price", direction: "desc" }, limit: 3, offset: 0, joins: null }
    ],
    aggregations: [
        {
            aggId: "AGG-1",
            pipeline: [
                { $match: { category: "TECH" } },
                { $group: { _id: "category", count: { operator: "$count", field: null }, avgPrice: { operator: "$avg", field: "price" } } }
            ]
        }
    ],
    monitorConfig: { slowQueryThreshold: 50 }
}));


// --- INVALID ---
console.log(runFullDBOrchestrator({}));