// 🧩 PROBLEM–02: createQueryExecutionEngine()

// Logic: Query execution engine with index awareness.
//   executeQuery — SELECT/INSERT/UPDATE/DELETE using indexes where available
//   getExecutionPlan — step-by-step plan without running
//   executeBatch — run multiple queries
//   getEngineStats — performance statistics
//   JOIN simulated via NESTED_LOOP.


const TIMESTAMP = "2025-01-01T00:00:00Z";

function createQueryExecutionEngine(engineConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof engineConfig !== "object" ||
        engineConfig === null ||
        Array.isArray(engineConfig) ||
        typeof engineConfig.tables !== "object" ||
        engineConfig.tables === null
    ) {
        return "Invalid Input";
    }

    for (const table of Object.keys(engineConfig.tables)) {
        if (!Array.isArray(engineConfig.tables[table])) return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    const tables = engineConfig.tables;
    const indexes = engineConfig.indexes || {};
    const schema = engineConfig.schema || {};

    // Deep-ish clones for mutation safety.

    for (const t of Object.keys(tables)) {
        tables[t] = tables[t].map(r => ({ ...r }));
    }

    // Build index structures per table: table -> Map(column -> Map(value -> [rowIdx]))
    // Only HASH indexes used for equality; BTREE for ranges.

    const indexMaps = {}; // table -> Map(column -> { type, map })

    for (const table of Object.keys(indexes)) {

        indexMaps[table] = new Map();

        for (const ix of indexes[table]) {

            const col = ix.column;
            const type = ix.type;

            const map = new Map();

            tables[table].forEach((row, idx) => {

                const value = row[col];

                if (!map.has(value)) map.set(value, []);
                map.get(value).push(idx);
            });

            indexMaps[table].set(col, { type, map });
        }
    }

    // --- STEP 3: STATS ---

    let totalQueries = 0;
    let indexScans = 0;
    let fullScans = 0;
    let totalRowsReturned = 0;
    const tableQueryCount = {}; // table -> count

    // --- STEP 4: HELPERS ---

    function evaluate(condition, row) {

        const field = condition.field;
        const op = condition.operator;
        const value = condition.value;
        const actual = row[field];

        switch (op) {
            case "=": return actual === value;
            case "!=": return actual !== value;
            case ">": return actual > value;
            case ">=": return actual >= value;
            case "<": return actual < value;
            case "<=": return actual <= value;
            case "IN": return Array.isArray(value) && value.includes(actual);
            case "LIKE": {
                if (typeof actual !== "string") return false;
                const pattern = value.replace(/%/g, ".*");
                return new RegExp("^" + pattern + "$", "i").test(actual);
            }
            default: return false;
        }
    }

    function applyWhere(table, where) {

        if (!where || where.length === 0) return { rows: tables[table], scanType: "FULL_SCAN", usedIndexes: [] };

        // Try to find an index on a WHERE equality field.

        let bestIndex = null;
        let bestRows = null;
        let usedIndexes = [];

        for (const cond of where) {

            const im = indexMaps[table];

            if (cond.operator === "=" && im && im.has(cond.field)) {

                const entry = im.get(cond.field);

                const idxs = entry.map.get(cond.value) || [];

                bestIndex = cond.field;
                bestRows = idxs.map(i => tables[table][i]);
                usedIndexes = [cond.field];
                break;
            }
        }

        if (bestRows !== null) {

            // Apply remaining conditions as filters.

            const filtered = bestRows.filter(row => {

                return where.every(cond => {
                    if (cond.field === bestIndex && cond.operator === "=") return true;
                    return evaluate(cond, row);
                });
            });

            return { rows: filtered, scanType: "INDEX_SCAN", usedIndexes };
        }

        return { rows: tables[table].filter(row => where.every(c => evaluate(c, row))), scanType: "FULL_SCAN", usedIndexes: [] };
    }

    // --- STEP 5: EXECUTE QUERY ---

    function executeQuery(query) {

        if (typeof query !== "object" || query === null || Array.isArray(query)) return "Invalid Input";

        const type = query.type;
        const table = query.table;

        if (!["SELECT", "INSERT", "UPDATE", "DELETE"].includes(type)) return "Invalid Input";

        if (typeof table !== "string" || table.length === 0 || !tables[table]) return "Invalid Input";

        totalQueries++;
        tableQueryCount[table] = (tableQueryCount[table] || 0) + 1;

        if (type === "SELECT") {

            // JOINS first (NESTED_LOOP).

            let baseRows = tables[table];

            if (query.joins) {

                for (const join of query.joins) {

                    const rightTable = join.table;
                    const onLeft = join.on.leftField;
                    const onRight = join.on.rightField;

                    const rightRows = tables[rightTable];

                    const joined = [];

                    for (const left of baseRows) {
                        for (const right of rightRows) {
                            if (left[onLeft] === right[onRight]) {
                                joined.push({ ...left, ...right });
                            }
                        }
                    }

                    baseRows = joined;
                    tableQueryCount[rightTable] = (tableQueryCount[rightTable] || 0) + 1;
                }
            }

            // WHERE.

            let filtered = baseRows;
            let scanType = "FULL_SCAN";
            let usedIndexes = [];

            if (query.joins) {
                // Joined rows have no index; filter directly.
                filtered = baseRows.filter(row => query.where ? query.where.every(c => evaluate(c, row)) : true);
            } else {

                const w = applyWhere(table, query.where);
                filtered = w.rows;
                scanType = w.scanType;
                usedIndexes = w.usedIndexes;
            }

            if (scanType === "INDEX_SCAN") indexScans++;
            else fullScans++;

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

            let finalRows = filtered;

            if (query.offset) finalRows = finalRows.slice(query.offset);

            if (query.limit !== null && query.limit !== undefined) finalRows = finalRows.slice(0, query.limit);

            // PROJECT.

            let result;

            if (query.select && query.select.length > 0) {
                result = finalRows.map(row => {
                    const out = {};
                    for (const f of query.select) out[f] = row[f];
                    return out;
                });
            } else {
                result = finalRows.map(row => ({ ...row }));
            }

            totalRowsReturned += result.length;

            return {
                type: "SELECT",
                table,
                result,
                rowsAffected: result.length,
                executionPlan: { scanType, usedIndexes },
                executedAt: TIMESTAMP
            };
        }

        if (type === "INSERT") {

            const values = Array.isArray(query.values) ? query.values : [query.values];

            for (const v of values) {
                tables[table].push({ ...v });
            }

            fullScans++;

            totalRowsReturned += values.length;

            return {
                type: "INSERT",
                table,
                result: null,
                rowsAffected: values.length,
                executionPlan: { scanType: "FULL_SCAN", usedIndexes: [] },
                executedAt: TIMESTAMP
            };
        }

        if (type === "UPDATE") {

            const w = applyWhere(table, query.where);

            if (w.scanType === "INDEX_SCAN") indexScans++;
            else fullScans++;

            const rows = w.rows;

            for (const row of rows) {
                Object.assign(row, query.set);
            }

            totalRowsReturned += rows.length;

            return {
                type: "UPDATE",
                table,
                result: null,
                rowsAffected: rows.length,
                executionPlan: { scanType: w.scanType, usedIndexes: w.usedIndexes },
                executedAt: TIMESTAMP
            };
        }

        if (type === "DELETE") {

            const w = applyWhere(table, query.where);

            if (w.scanType === "INDEX_SCAN") indexScans++;
            else fullScans++;

            const ids = new Set(w.rows.map(r => tables[table].indexOf(r)));

            tables[table] = tables[table].filter((_, i) => !ids.has(i));

            totalRowsReturned += w.rows.length;

            return {
                type: "DELETE",
                table,
                result: null,
                rowsAffected: w.rows.length,
                executionPlan: { scanType: w.scanType, usedIndexes: w.usedIndexes },
                executedAt: TIMESTAMP
            };
        }

        return "Invalid Input";
    }

    // --- STEP 6: EXECUTION PLAN ---

    function getExecutionPlan(query) {

        if (typeof query !== "object" || query === null || Array.isArray(query)) return "Invalid Input";

        const table = query.table;

        if (typeof table !== "string" || table.length === 0 || !tables[table]) return "Invalid Input";

        const steps = [];
        let totalCost = 0;

        // Determine indexed fields in WHERE.

        const whereFields = (query.where || []).map(c => c.field);

        const indexed = whereFields.filter(f => {
            const im = indexMaps[table];
            return im && im.has(f);
        });

        const useIndex = whereFields.some(f => {
            const im = indexMaps[table];
            return im && im.has(f);
        });

        const rowCount = tables[table].length;

        if (useIndex) {
            steps.push({ stepName: "INDEX_SCAN", description: "Index lookup on " + table + " (" + rowCount + " rows)", cost: Math.ceil(Math.log2(rowCount)) || 1 });
        } else {
            steps.push({ stepName: "TABLE_SCAN", description: "Full scan of " + table + " (" + rowCount + " rows)", cost: rowCount });
        }

        totalCost += steps[steps.length - 1].cost;

        if (query.where && query.where.length > 0) {
            steps.push({
                stepName: "FILTER",
                description: "Apply WHERE " + query.where.map(c => c.field + " " + c.operator + " " + c.value).join(" AND "),
                cost: rowCount
            });
            totalCost += rowCount;
        }

        if (query.orderBy) {
            steps.push({ stepName: "SORT", description: "Sort by " + query.orderBy.field + " " + query.orderBy.direction, cost: rowCount });
            totalCost += rowCount;
        }

        if (query.limit !== null && query.limit !== undefined) {
            steps.push({ stepName: "LIMIT", description: "Apply limit " + query.limit, cost: query.limit });
            totalCost += query.limit;
        }

        const recommendedIndexes = whereFields.filter(f => {
            const im = indexMaps[table];
            return !(im && im.has(f));
        });

        return { steps, totalEstimatedCost: totalCost, recommendedIndexes };
    }

    // --- STEP 7: BATCH + STATS ---

    function executeBatch(queries) {

        if (!Array.isArray(queries)) return "Invalid Input";

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const q of queries) {

            const r = executeQuery(q);

            if (r === "Invalid Input") {
                results.push({ type: q && q.type, table: q && q.table, result: "Invalid Input" });
                failureCount++;
            } else {
                results.push(r);
                successCount++;
            }
        }

        return { results, totalExecuted: queries.length, successCount, failureCount };
    }

    function getEngineStats() {

        let mostQueriedTable = null;
        let maxCount = 0;

        for (const t of Object.keys(tableQueryCount)) {
            if (tableQueryCount[t] > maxCount) {
                maxCount = tableQueryCount[t];
                mostQueriedTable = t;
            }
        }

        return {
            totalQueries,
            indexScans,
            fullScans,
            avgRowsPerQuery: Number((totalQueries ? totalRowsReturned / totalQueries : 0).toFixed(2)),
            mostQueriedTable
        };
    }

    return { executeQuery, executeBatch, getExecutionPlan, getEngineStats };
}



// ------ EXAMPLE USAGE ------

const engine = createQueryExecutionEngine({
    tables: {
        employees: [
            { id: "E1", name: "Rahim", dept: "IT", salary: 70000 },
            { id: "E2", name: "Karim", dept: "HR", salary: 50000 },
            { id: "E3", name: "Nadia", dept: "IT", salary: 80000 }
        ]
    },
    indexes: { employees: [{ column: "dept", type: "HASH" }] },
    schema: {}
});

console.log(engine.executeQuery({
    type: "SELECT",
    table: "employees",
    select: ["name", "salary"],
    where: [{ field: "dept", operator: "=", value: "IT" }],
    orderBy: { field: "salary", direction: "desc" },
    limit: 2,
    offset: 0,
    joins: null
}));


console.log(engine.getExecutionPlan({
    type: "SELECT",
    table: "employees",
    select: null,
    where: [{ field: "salary", operator: ">", value: 60000 }],
    orderBy: null, limit: null, offset: 0, joins: null
}));


// --- INVALID ---
console.log(createQueryExecutionEngine(null));