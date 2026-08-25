// 🧩 PROBLEM–05: runRelationalDBOrchestrator()

// Logic: Full Relational DB Orchestrator — composes Problems 01–04.

// 1. Setup integrity engine (Problem-04) with schema
// 2. Seed initial data
// 3. Process operations sequentially: INSERT / DELETE / JOIN / VALIDATE
// 4. Final integrity check if requested
// 5. Build report: operationSummary, finalTableStats, integrityResult


function runRelationalDBOrchestrator(relationalConfig) {

    // --- STEP 1: VALIDATE relationalConfig ---

    if (
        typeof relationalConfig !== "object" || relationalConfig === null || Array.isArray(relationalConfig) ||
        typeof relationalConfig.dbId !== "string" || relationalConfig.dbId.trim() === "" ||
        !Array.isArray(relationalConfig.schema) ||
        typeof relationalConfig.seedData !== "object" || relationalConfig.seedData === null ||
        !Array.isArray(relationalConfig.operations) ||
        typeof relationalConfig.integrityCheck !== "boolean"
    ) {
        return "Invalid Input";
    }

    const { dbId, schema, seedData, operations, integrityCheck } = relationalConfig;

    // --- STEP 2: PROBLEM-04 INTEGRITY ENGINE (self-contained) ---

    const tables = {};
    const data = {};

    for (const t of schema) {
        tables[t.name] = { primaryKey: t.primaryKey, foreignKeys: t.foreignKeys || [] };
        data[t.name] = [];
    }

    function referencingTables(targetTableName) {
        const result = [];
        for (const name of Object.keys(tables)) {
            for (const fk of tables[name].foreignKeys) {
                const [refTable] = fk.references.split(".");
                if (refTable === targetTableName) result.push({ table: name, fk });
            }
        }
        return result;
    }

    function checkForeignKeys(tableName, record) {
        for (const fk of tables[tableName].foreignKeys) {
            const value = record[fk.field];
            if (value === null || value === undefined) continue;
            const [refTable, refKey] = fk.references.split(".");
            const exists = data[refTable] && data[refTable].some(r => r[refKey] === value);
            if (!exists) return { error: "Foreign key violation: " + fk.field + " references non-existent " + fk.references };
        }
        return null;
    }

    function engineDelete(tableName, id) {
        const record = data[tableName].find(r => r[tables[tableName].primaryKey] === id);
        if (!record) return { error: "Record not found" };
        const referencing = [];
        for (const { table, fk } of referencingTables(tableName)) {
            const refs = data[table].filter(r => r[fk.field] === id);
            for (const ref of refs) referencing.push({ table, fk, record: ref });
        }
        if (referencing.length > 0) {
            const onDelete = referencing[0].fk.onDelete;
            if (onDelete === "RESTRICT") return { error: "Cannot delete: referenced by " + referencing[0].table };
            if (onDelete === "CASCADE") {
                const cascadeDeleted = {};
                for (const ref of referencing) {
                    const result = engineDelete(ref.table, ref.record[tables[ref.table].primaryKey]);
                    if (result && result.deleted) {
                        cascadeDeleted[ref.table] = (cascadeDeleted[ref.table] || 0) + 1;
                        if (result.cascadeDeleted) {
                            for (const k of Object.keys(result.cascadeDeleted)) {
                                cascadeDeleted[k] = (cascadeDeleted[k] || 0) + result.cascadeDeleted[k];
                            }
                        }
                    }
                }
                data[tableName] = data[tableName].filter(r => r[tables[tableName].primaryKey] !== id);
                return { deleted: true, id, cascadeDeleted };
            }
            if (onDelete === "SET_NULL") {
                let setNullCount = 0;
                for (const ref of referencing) {
                    const idx = data[ref.table].findIndex(r => r[tables[ref.table].primaryKey] === ref.record[tables[ref.table].primaryKey]);
                    if (idx !== -1) { data[ref.table][idx] = { ...data[ref.table][idx], [ref.fk.field]: null }; setNullCount++; }
                }
                data[tableName] = data[tableName].filter(r => r[tables[tableName].primaryKey] !== id);
                return { deleted: true, id, setNullCount };
            }
        }
        data[tableName] = data[tableName].filter(r => r[tables[tableName].primaryKey] !== id);
        return { deleted: true, id };
    }

    function engineValidate() {
        const violations = [];
        for (const tableName of Object.keys(tables)) {
            for (const record of data[tableName]) {
                for (const fk of tables[tableName].foreignKeys) {
                    const value = record[fk.field];
                    if (value === null || value === undefined) continue;
                    const [refTable, refKey] = fk.references.split(".");
                    const exists = data[refTable] && data[refTable].some(r => r[refKey] === value);
                    if (!exists) violations.push({ table: tableName, field: fk.field, value, references: fk.references });
                }
            }
        }
        return { valid: violations.length === 0, violations };
    }

    // --- STEP 3: SEED DATA ---

    for (const tableName of Object.keys(seedData)) {
        if (data[tableName]) {
            for (const doc of seedData[tableName]) data[tableName].push({ ...doc });
        }
    }

    // --- STEP 4: PROBLEM-03 JOIN SIMULATOR (self-contained) ---

    function simulateJoins(tableA, tableB, onA, onB, joinType, selectFields) {

        const rowsA = data[tableA] || [];
        const rowsB = data[tableB] || [];

        function buildRow(a, b) {
            const merged = {};
            if (a) for (const key of Object.keys(a)) merged[tableA + "." + key] = a[key];
            if (b) for (const key of Object.keys(b)) merged[tableB + "." + key] = b[key];
            if (selectFields) {
                const filtered = {};
                for (const f of selectFields) if (merged[f] !== undefined) filtered[f] = merged[f];
                return filtered;
            }
            return merged;
        }

        const aMatches = (a, b) => a[onA] === b[onB];
        const rows = [];

        switch (joinType) {
            case "INNER":
                for (const a of rowsA) for (const b of rowsB) if (aMatches(a, b)) rows.push(buildRow(a, b));
                break;
            case "LEFT":
                for (const a of rowsA) {
                    const matched = rowsB.filter(b => aMatches(a, b));
                    if (matched.length > 0) for (const b of matched) rows.push(buildRow(a, b));
                    else rows.push(buildRow(a, null));
                }
                break;
            case "RIGHT":
                for (const b of rowsB) {
                    const matched = rowsA.filter(a => aMatches(a, b));
                    if (matched.length > 0) for (const a of matched) rows.push(buildRow(a, b));
                    else rows.push(buildRow(null, b));
                }
                break;
            case "FULL":
                for (const a of rowsA) {
                    const matched = rowsB.filter(b => aMatches(a, b));
                    if (matched.length > 0) for (const b of matched) rows.push(buildRow(a, b));
                    else rows.push(buildRow(a, null));
                }
                for (const b of rowsB) {
                    const matched = rowsA.filter(a => aMatches(a, b));
                    if (matched.length === 0) rows.push(buildRow(null, b));
                }
                break;
        }

        return { joinType, rowCount: rows.length, rows };
    }

    // --- STEP 5: PROCESS OPERATIONS ---

    const operationLog = [];
    let successCount = 0;
    let failedCount = 0;

    for (const op of operations) {

        let success = false;
        let result = null;

        switch (op.type) {

            case "INSERT": {
                const violation = checkForeignKeys(op.table, op.data);
                if (violation) {
                    result = violation;
                } else {
                    data[op.table].push({ ...op.data });
                    result = { inserted: true, doc: { ...op.data } };
                    success = true;
                }
                break;
            }

            case "DELETE": {
                result = engineDelete(op.table, op.id);
                success = result.deleted === true;
                break;
            }

            case "JOIN": {
                const jc = op.joinConfig;
                result = simulateJoins(jc.tableA, jc.tableB, jc.onA, jc.onB, jc.joinType, jc.selectFields);
                success = true;
                break;
            }

            case "VALIDATE": {
                result = engineValidate();
                success = result.valid === true;
                break;
            }

            default:
                result = { error: "Unknown operation type: " + op.type };
                break;
        }

        if (success) successCount++;
        else failedCount++;

        operationLog.push({ opId: op.opId, type: op.type, success, result });
    }

    // --- STEP 6: FINAL INTEGRITY CHECK + REPORT ---

    const integrityResult = integrityCheck ? engineValidate() : null;

    const finalTableStats = {};

    for (const name of Object.keys(data)) {
        finalTableStats[name] = data[name].length;
    }

    const report = {
        operationSummary: { total: operations.length, success: successCount, failed: failedCount },
        finalTableStats,
        integrityResult
    };

    return { dbId, operationLog, report };
}



// ------ EXAMPLE USAGE ------

console.log(runRelationalDBOrchestrator({
    dbId: "REL-DB-01",
    schema: [
        { name: "users", primaryKey: "id", foreignKeys: null },
        { name: "posts", primaryKey: "id", foreignKeys: [{ field: "authorId", references: "users.id", onDelete: "CASCADE" }] }
    ],
    seedData: {
        users: [{ id: "U1", name: "Rahim" }, { id: "U2", name: "Karim" }],
        posts: [{ id: "P1", authorId: "U1", title: "JS Tips" }, { id: "P2", authorId: "U1", title: "Node Guide" }]
    },
    operations: [
        { opId: "OP-1", type: "INSERT", table: "posts", data: { id: "P3", authorId: "U2", title: "Python Basics" }, id: null, joinConfig: null },
        { opId: "OP-2", type: "DELETE", table: "users", id: "U1", data: null, joinConfig: null },
        { opId: "OP-3", type: "JOIN", table: null, data: null, id: null, joinConfig: { joinType: "LEFT", tableA: "users", tableB: "posts", onA: "id", onB: "authorId", selectFields: ["users.name", "posts.title"] } },
        { opId: "OP-4", type: "VALIDATE", table: null, data: null, id: null, joinConfig: null }
    ],
    integrityCheck: true
}));


// --- INVALID ---
console.log(runRelationalDBOrchestrator({ dbId: "", schema: [], seedData: {}, operations: [], integrityCheck: true }));