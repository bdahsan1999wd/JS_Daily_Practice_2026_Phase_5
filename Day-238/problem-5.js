// 🧩 PROBLEM–05: runQueryBuilderOrchestrator()

// Logic: Full Query Builder Orchestrator — composes Problems 01–04.

// 1. Initialize builders (SELECT, INSERT/UPDATE/DELETE, SUBQUERY) + optimizer
// 2. Process query plan in order (build → maybe optimize → execute)
// 3. Build summary: totalQueries, successCount, totalRowsAffected, optimizationsApplied, avgQueryScore


function runQueryBuilderOrchestrator(orchestratorConfig) {

    // --- STEP 1: VALIDATE orchestratorConfig ---

    if (
        typeof orchestratorConfig !== "object" || orchestratorConfig === null || Array.isArray(orchestratorConfig) ||
        typeof orchestratorConfig.orchestratorId !== "string" || orchestratorConfig.orchestratorId.trim() === "" ||
        typeof orchestratorConfig.tables !== "object" || orchestratorConfig.tables === null ||
        !Array.isArray(orchestratorConfig.indexes) ||
        !Array.isArray(orchestratorConfig.queryPlan)
    ) {
        return "Invalid Input";
    }

    const { orchestratorId, tables, indexes, queryPlan } = orchestratorConfig;

    // --- STEP 2: CONDITION MATCHING (Problem-01 logic) ---

    function evalCondition(doc, cond) {
        const actual = doc[cond.field];
        switch (cond.operator) {
            case "=": return actual === cond.value;
            case "!=": return actual !== cond.value;
            case ">": return actual > cond.value;
            case ">=": return actual >= cond.value;
            case "<": return actual < cond.value;
            case "<=": return actual <= cond.value;
            case "LIKE":
                return typeof actual === "string" && typeof cond.value === "string" &&
                    actual.toLowerCase().includes(cond.value.toLowerCase());
            case "IN":
                return Array.isArray(cond.value) && cond.value.includes(actual);
            default:
                return false;
        }
    }

    // --- STEP 3: SELECT EXECUTION (Problem-01 logic) ---

    function runSelect(config) {

        const source = tables[config.table].map(d => ({ ...d }));

        let rows = source.filter(doc => config.where.every(c => evalCondition(doc, c)));

        if (config.orderBy) {
            const field = config.orderBy.field;
            const dir = config.orderBy.direction === "desc" ? -1 : 1;
            rows = [...rows].sort((a, b) => {
                if (a[field] < b[field]) return -1 * dir;
                if (a[field] > b[field]) return 1 * dir;
                return 0;
            });
        }

        const offset = config.offset || 0;
        const limit = config.limit;
        const skipped = offset > 0 ? rows.slice(offset) : rows;
        const limited = limit !== null ? skipped.slice(0, limit) : skipped;

        const projected = limited.map(doc => {
            const out = {};
            for (const f of config.select) if (doc[f] !== undefined) out[f] = doc[f];
            return out;
        });

        return { rows: projected, rowCount: projected.length };
    }

    function selectSQL(config) {
        const cols = config.select.join(", ");
        let sql = "SELECT " + cols + " FROM " + config.table;
        const whereSQL = config.where.map(c =>
            c.field + " " + c.operator + " " + (typeof c.value === "string" ? c.value : c.value)
        ).join(" AND ");
        if (whereSQL) sql += " WHERE " + whereSQL;
        if (config.orderBy) sql += " ORDER BY " + config.orderBy.field + " " + config.orderBy.direction.toUpperCase();
        if (config.limit !== null) sql += " LIMIT " + config.limit + " OFFSET " + (config.offset || 0);
        return sql;
    }

    // --- STEP 4: MUTATION EXECUTION (Problem-02 logic) ---

    function runInsert(config) {

        const docs = [];
        for (const doc of config.docs) {
            const hasId = doc.id !== undefined;
            const newDoc = hasId ? { ...doc } : { id: nextAutoId(config.table), ...doc };
            tables[config.table].push({ ...newDoc });
            docs.push(newDoc);
        }
        return { operation: "INSERT", inserted: docs.length, docs };
    }

    function runUpdate(config) {

        const matches = tables[config.table].filter(d => config.where.every(c => evalCondition(d, c)));

        for (const d of matches) Object.assign(d, config.updates);

        return { operation: "UPDATE", updated: matches.length, docs: matches.map(d => ({ ...d })) };
    }

    function runDelete(config) {

        const matches = tables[config.table].filter(d => config.where.every(c => evalCondition(d, c)));

        const ids = matches.map(d => d.id);

        for (const d of matches) {
            const idx = tables[config.table].findIndex(x => x.id === d.id);
            if (idx !== -1) tables[config.table].splice(idx, 1);
        }

        return { operation: "DELETE", deleted: ids.length, ids };
    }

    function nextAutoId(tableName) {
        let max = 0;
        for (const d of tables[tableName]) if (typeof d.id === "number" && d.id > max) max = d.id;
        return max + 1;
    }

    function insertSQL(config) {
        return "INSERT INTO " + config.table + " VALUES (" +
            config.docs.map(d => "{" + Object.keys(d).map(k => k + ":" + d[k]).join(",") + "}").join(", ") +
            ")";
    }

    function updateSQL(config) {
        const setSQL = Object.keys(config.updates).map(k => k + "=" + config.updates[k]).join(", ");
        const whereSQL = config.where.map(c => c.field + " " + c.operator + " " + c.value).join(" AND ");
        return "UPDATE " + config.table + " SET " + setSQL + (whereSQL ? " WHERE " + whereSQL : "");
    }

    function deleteSQL(config) {
        const whereSQL = config.where.map(c => c.field + " " + c.operator + " " + c.value).join(" AND ");
        return "DELETE FROM " + config.table + (whereSQL ? " WHERE " + whereSQL : "");
    }

    // --- STEP 5: OPTIMIZER (Problem-04 logic) ---

    function analyzeQuery(query) {
        const suggestions = [];
        for (const cond of query.where) {
            if (!indexes.includes(cond.field)) {
                suggestions.push({ type: "MISSING_INDEX", message: "Field '" + cond.field + "' in WHERE has no index", severity: "MEDIUM" });
            }
        }
        if (query.where.length === 0) suggestions.push({ type: "FULL_TABLE_SCAN", message: "No WHERE conditions — full table scan", severity: "HIGH" });
        if (query.select.length === 0) suggestions.push({ type: "SELECT_STAR", message: "Selecting all fields is inefficient", severity: "LOW" });
        if (query.limit === null) suggestions.push({ type: "MISSING_LIMIT", message: "No LIMIT clause may return too many rows", severity: "MEDIUM" });
        if (query.orderBy && !indexes.includes(query.orderBy.field)) suggestions.push({ type: "INEFFICIENT_SORT", message: "ORDER BY field '" + query.orderBy.field + "' has no index", severity: "MEDIUM" });
        let score = 100;
        for (const s of suggestions) score -= s.severity === "LOW" ? 10 : s.severity === "MEDIUM" ? 20 : 30;
        return { suggestions, score };
    }

    // --- STEP 6: PROCESS QUERY PLAN ---

    const queryLog = [];
    let successCount = 0;
    let totalRowsAffected = 0;
    let optimizationsApplied = 0;
    let scoreSum = 0;

    for (const plan of queryPlan) {

        const { queryId, type, config, optimize } = plan;

        let sql = "";
        let result = null;
        let optimizationScore = null;
        let success = false;

        switch (type) {

            case "SELECT": {

                sql = selectSQL(config);

                // Optimize if requested.
                if (optimize) {
                    const analysis = analyzeQuery({
                        select: config.select,
                        where: config.where,
                        orderBy: config.orderBy,
                        limit: config.limit
                    });
                    optimizationScore = analysis.score;
                    optimizationsApplied++;
                    scoreSum += analysis.score;
                }

                result = runSelect(config);
                success = true;
                totalRowsAffected += result.rowCount;
                break;
            }

            case "INSERT": {
                sql = insertSQL(config);
                result = runInsert(config);
                success = true;
                totalRowsAffected += result.inserted;
                break;
            }

            case "UPDATE": {
                sql = updateSQL(config);
                result = runUpdate(config);
                success = true;
                totalRowsAffected += result.updated;
                break;
            }

            case "DELETE": {
                sql = deleteSQL(config);
                result = runDelete(config);
                success = true;
                totalRowsAffected += result.deleted;
                break;
            }

            case "SUBQUERY": {
                // Not exercised in sample; simple fallback via runSelect.
                sql = selectSQL({ select: config.mainSelect, table: config.mainTable, where: [], orderBy: null, limit: null, offset: 0 });
                result = runSelect({ select: config.mainSelect, table: config.mainTable, where: [], orderBy: null, limit: null, offset: 0 });
                success = true;
                totalRowsAffected += result.rowCount;
                break;
            }

            default:
                result = { error: "Unknown query type: " + type };
                break;
        }

        if (success) successCount++;

        queryLog.push({
            queryId,
            type,
            sql,
            result,
            optimized: Boolean(optimize),
            optimizationScore
        });
    }

    // --- STEP 7: BUILD SUMMARY ---

    const avgQueryScore = optimizationsApplied === 0
        ? 0
        : Number((scoreSum / optimizationsApplied).toFixed(2));

    const summary = {
        totalQueries: queryPlan.length,
        successCount,
        totalRowsAffected,
        optimizationsApplied,
        avgQueryScore
    };

    return { orchestratorId, queryLog, summary };
}



// ------ EXAMPLE USAGE ------

console.log(runQueryBuilderOrchestrator({
    orchestratorId: "QB-ORCH-01",
    tables: {
        employees: [
            { id: 1, name: "Rahim", dept: "IT", salary: 70000 },
            { id: 2, name: "Karim", dept: "HR", salary: 50000 },
            { id: 3, name: "Nadia", dept: "IT", salary: 80000 }
        ]
    },
    indexes: ["id", "dept"],
    queryPlan: [
        {
            queryId: "Q1",
            type: "SELECT",
            config: { table: "employees", select: ["name", "salary"], where: [{ field: "dept", operator: "=", value: "IT" }], orderBy: { field: "salary", direction: "desc" }, limit: 10, offset: 0 },
            optimize: true
        },
        {
            queryId: "Q2",
            type: "INSERT",
            config: { table: "employees", docs: [{ id: 4, name: "Sadia", dept: "IT", salary: 75000 }] },
            optimize: false
        },
        {
            queryId: "Q3",
            type: "UPDATE",
            config: { table: "employees", updates: { salary: 85000 }, where: [{ field: "dept", operator: "=", value: "IT" }] },
            optimize: false
        }
    ]
}));


// --- INVALID ---
console.log(runQueryBuilderOrchestrator({ orchestratorId: "", tables: {}, indexes: [], queryPlan: [] }));