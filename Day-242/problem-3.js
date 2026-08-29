// 🧩 PROBLEM–03: createDBMonitor()

// Logic: Database monitoring & statistics.
//   recordQuery — log a query execution
//   getTableStats — per-table aggregates
//   getSlowQueries — cost > threshold, sorted desc
//   getTopQueries(n) — top N tables by query count
//   getDBHealth — HEALTHY / DEGRADED / CRITICAL
//   generateReport — full monitor report


const TIMESTAMP = "2025-01-01T00:00:00Z";

function createDBMonitor(monitorConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof monitorConfig !== "object" ||
        monitorConfig === null ||
        Array.isArray(monitorConfig) ||
        typeof monitorConfig.monitorId !== "string" ||
        monitorConfig.monitorId.length === 0 ||
        typeof monitorConfig.tables !== "object" ||
        monitorConfig.tables === null ||
        typeof monitorConfig.slowQueryThreshold !== "number"
    ) {
        return "Invalid Input";
    }

    const monitorId = monitorConfig.monitorId;
    const tables = monitorConfig.tables;
    const slowQueryThreshold = monitorConfig.slowQueryThreshold;

    const queryRecords = [];

    // --- STEP 2: HELPERS ---

    function pct(part, whole) {
        return Number(((part / whole) * 100).toFixed(2));
    }

    // --- STEP 3: PUBLIC API ---

    return {

        recordQuery(queryRecord) {

            if (
                typeof queryRecord !== "object" ||
                queryRecord === null ||
                typeof queryRecord.queryId !== "string" ||
                typeof queryRecord.table !== "string"
            ) {
                return "Invalid Input";
            }

            queryRecords.push({ ...queryRecord });

            return { recorded: true, queryId: queryRecord.queryId };
        },

        getTableStats(tableName) {

            if (typeof tableName !== "string" || tableName.length === 0) return "Invalid Input";

            const records = queryRecords.filter(q => q.table === tableName);

            if (records.length === 0) return { error: "No data for table: " + tableName };

            const selectCount = records.filter(q => q.type === "SELECT").length;
            const insertCount = records.filter(q => q.type === "INSERT").length;
            const updateCount = records.filter(q => q.type === "UPDATE").length;
            const deleteCount = records.filter(q => q.type === "DELETE").length;

            const avgCost = Number((records.reduce((s, q) => s + q.cost, 0) / records.length).toFixed(2));
            const indexScans = records.filter(q => q.scanType === "INDEX_SCAN").length;
            const indexScanRate = pct(indexScans, records.length);
            const totalRowsScanned = records.reduce((s, q) => s + q.rowsScanned, 0);

            const currentRecordCount = Array.isArray(tables[tableName]) ? tables[tableName].length : 0;

            return {
                tableName,
                totalQueries: records.length,
                selectCount,
                insertCount,
                updateCount,
                deleteCount,
                avgCost,
                indexScanRate,
                totalRowsScanned,
                currentRecordCount
            };
        },

        getSlowQueries() {

            return queryRecords
                .filter(q => q.cost > slowQueryThreshold)
                .sort((a, b) => b.cost - a.cost)
                .map(q => ({ ...q }));
        },

        getTopQueries(n) {

            if (typeof n !== "number" || n < 1) return "Invalid Input";

            const counts = {};

            for (const q of queryRecords) {
                counts[q.table] = (counts[q.table] || 0) + 1;
            }

            const list = Object.keys(counts).map(table => ({ table, queryCount: counts[table] }));

            list.sort((a, b) => b.queryCount - a.queryCount);

            return list.slice(0, n);
        },

        getDBHealth() {

            const totalQueries = queryRecords.length;

            const slowQueries = queryRecords.filter(q => q.cost > slowQueryThreshold).length;
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

            // Suggest indexes for low index usage tables.

            for (const table of Object.keys(tableBreakdown)) {

                const stats = tableBreakdown[table];

                if (stats.indexScanRate < 50 && stats.totalQueries > 0) {
                    recommendations.push("Consider adding indexes to table: " + table);
                }
            }

            // Suggest optimization for slow queries.

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


// ------ EXAMPLE USAGE ------

const monitor = createDBMonitor({
    monitorId: "MON-01",
    tables: { employees: [{}, {}, {}, {}, {}], orders: [{}, {}, {}] },
    slowQueryThreshold: 100
});


console.log(monitor.recordQuery({ queryId: "Q1", type: "SELECT", table: "employees", scanType: "INDEX_SCAN", rowsScanned: 2, rowsReturned: 2, cost: 20, executedAt: TIMESTAMP }));

console.log(monitor.recordQuery({ queryId: "Q2", type: "SELECT", table: "employees", scanType: "FULL_SCAN", rowsScanned: 5, rowsReturned: 3, cost: 150, executedAt: TIMESTAMP }));

console.log(monitor.recordQuery({ queryId: "Q3", type: "INSERT", table: "orders", scanType: "INDEX_SCAN", rowsScanned: 0, rowsReturned: 1, cost: 10, executedAt: TIMESTAMP }));


console.log(monitor.getSlowQueries());

console.log(monitor.getDBHealth());

console.log(monitor.getTableStats("employees"));

console.log(monitor.getTopQueries(1));

console.log(monitor.generateReport());


// --- INVALID ---
console.log(createDBMonitor(null));