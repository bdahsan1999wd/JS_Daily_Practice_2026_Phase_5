// 🧩 PROBLEM–04: createIntegrityEngine()

// Logic: Returns a referential integrity engine.
//   insert(tableName, doc) — insert with FK validation
//   delete(tableName, id)  — delete with referential integrity check
//   seed(tableName, docs)  — bulk insert without FK validation
//   validate()             — check entire DB for integrity violations
//   getTableData(tableName) — all records in a table

// onDelete behaviors: RESTRICT (block), CASCADE (delete referencing rows),
// SET_NULL (set FK fields to null in referencing rows).


function createIntegrityEngine(schemaConfig) {

    // --- STEP 1: VALIDATE schemaConfig ---

    if (
        typeof schemaConfig !== "object" || schemaConfig === null || Array.isArray(schemaConfig) ||
        !Array.isArray(schemaConfig.tables)
    ) {
        return "Invalid Input";
    }


    for (const t of schemaConfig.tables) {
        if (
            typeof t.name !== "string" || t.name.trim() === "" ||
            typeof t.primaryKey !== "string" || t.primaryKey.trim() === "" ||
            (t.foreignKeys !== null && !Array.isArray(t.foreignKeys))
        ) {
            return "Invalid Input";
        }
        if (t.foreignKeys) {
            for (const fk of t.foreignKeys) {
                if (
                    typeof fk.field !== "string" ||
                    typeof fk.references !== "string" ||
                    !["RESTRICT", "CASCADE", "SET_NULL"].includes(fk.onDelete)
                ) {
                    return "Invalid Input";
                }
            }
        }
    }


    // --- STEP 2: INTERNAL STATE ---

    const tables = {};   // name -> { primaryKey, foreignKeys }
    const data = {};     // name -> [records]

    for (const t of schemaConfig.tables) {
        tables[t.name] = { primaryKey: t.primaryKey, foreignKeys: t.foreignKeys || [] };
        data[t.name] = [];
    }

    // --- STEP 3: HELPER: find FK config that references this table ---

    function referencingTables(targetTableName) {

        const result = [];

        for (const name of Object.keys(tables)) {
            for (const fk of tables[name].foreignKeys) {
                const [refTable] = fk.references.split(".");
                if (refTable === targetTableName) {
                    result.push({ table: name, fk });
                }
            }
        }

        return result;
    }


    // Check FK validity for a record in a table.

    function checkForeignKeys(tableName, record) {

        for (const fk of tables[tableName].foreignKeys) {

            const value = record[fk.field];

            if (value === null || value === undefined) continue;

            const [refTable, refKey] = fk.references.split(".");

            const exists = data[refTable] && data[refTable].some(r => r[refKey] === value);

            if (!exists) {
                return { error: "Foreign key violation: " + fk.field + " references non-existent " + fk.references };
            }
        }

        return null;
    }


    // --- STEP 4: RETURN INTEGRITY ENGINE ---

    return {

        insert(tableName, doc) {

            if (typeof tableName !== "string" || typeof doc !== "object" || doc === null || Array.isArray(doc)) {
                return "Invalid Input";
            }

            if (!tables[tableName]) return { error: "Table not found: " + tableName };

            const violation = checkForeignKeys(tableName, doc);

            if (violation) return violation;

            data[tableName].push({ ...doc });

            return { inserted: true, doc: { ...doc } };
        },

        delete(tableName, id) {

            if (typeof tableName !== "string" || typeof id !== "string") return "Invalid Input";

            if (!tables[tableName]) return { error: "Table not found: " + tableName };

            const record = data[tableName].find(r => r[tables[tableName].primaryKey] === id);

            if (!record) return { error: "Record not found" };

            // Gather referencing records across all tables.

            const referencing = [];

            for (const { table, fk } of referencingTables(tableName)) {
                const refs = data[table].filter(r => r[fk.field] === id);
                for (const ref of refs) referencing.push({ table, fk, record: ref });
            }

            if (referencing.length > 0) {

                const onDelete = referencing[0].fk.onDelete;

                if (onDelete === "RESTRICT") {
                    return { error: "Cannot delete: referenced by " + referencing[0].table };
                }

                if (onDelete === "CASCADE") {
                    // Delete referencing records recursively (respecting their own FKs).
                    const cascadeDeleted = {};

                    for (const ref of referencing) {
                        const result = this.delete(ref.table, ref.record[tables[ref.table].primaryKey]);
                        if (result && result.deleted) {
                            cascadeDeleted[ref.table] = (cascadeDeleted[ref.table] || 0) + 1;
                            if (result.cascadeDeleted) {
                                for (const k of Object.keys(result.cascadeDeleted)) {
                                    cascadeDeleted[k] = (cascadeDeleted[k] || 0) + result.cascadeDeleted[k];
                                }
                            }
                        }
                    }

                    // Now delete the record itself.
                    data[tableName] = data[tableName].filter(r => r[tables[tableName].primaryKey] !== id);

                    return { deleted: true, id, cascadeDeleted };
                }

                if (onDelete === "SET_NULL") {
                    // Set FK field to null in referencing records.
                    let setNullCount = 0;

                    for (const ref of referencing) {
                        const idx = data[ref.table].findIndex(r => r[tables[ref.table].primaryKey] === ref.record[tables[ref.table].primaryKey]);
                        if (idx !== -1) {
                            data[ref.table][idx] = { ...data[ref.table][idx], [ref.fk.field]: null };
                            setNullCount++;
                        }
                    }

                    data[tableName] = data[tableName].filter(r => r[tables[tableName].primaryKey] !== id);

                    return { deleted: true, id, setNullCount };
                }
            }

            // No referencing records → simple delete.

            data[tableName] = data[tableName].filter(r => r[tables[tableName].primaryKey] !== id);

            return { deleted: true, id };
        },

        seed(tableName, docs) {

            if (typeof tableName !== "string" || !Array.isArray(docs)) return "Invalid Input";

            if (!tables[tableName]) return { error: "Table not found: " + tableName };

            for (const doc of docs) data[tableName].push({ ...doc });

            return { seeded: true, table: tableName, count: docs.length };
        },

        validate() {

            const violations = [];

            for (const tableName of Object.keys(tables)) {
                for (const record of data[tableName]) {
                    for (const fk of tables[tableName].foreignKeys) {
                        const value = record[fk.field];
                        if (value === null || value === undefined) continue;
                        const [refTable, refKey] = fk.references.split(".");
                        const exists = data[refTable] && data[refTable].some(r => r[refKey] === value);
                        if (!exists) {
                            violations.push({ table: tableName, field: fk.field, value, references: fk.references });
                        }
                    }
                }
            }

            return { valid: violations.length === 0, violations };
        },

        getTableData(tableName) {

            if (typeof tableName !== "string") return "Invalid Input";

            if (!tables[tableName]) return { error: "Table not found" };

            return data[tableName].map(r => ({ ...r }));
        }
    };
}



// ------ EXAMPLE USAGE ------

const engine = createIntegrityEngine({
    tables: [
        { name: "users", primaryKey: "id", foreignKeys: null },
        { name: "orders", primaryKey: "id", foreignKeys: [{ field: "userId", references: "users.id", onDelete: "CASCADE" }] },
        { name: "items", primaryKey: "id", foreignKeys: [{ field: "orderId", references: "orders.id", onDelete: "SET_NULL" }] }
    ]
});


engine.seed("users", [{ id: "U1", name: "Rahim" }, { id: "U2", name: "Karim" }]);
engine.seed("orders", [{ id: "O1", userId: "U1", amount: 500 }]);
engine.seed("items", [{ id: "I1", orderId: "O1", product: "Book" }]);


console.log(engine.insert("orders", { id: "O2", userId: "U99", amount: 100 }));

console.log(engine.insert("orders", { id: "O2", userId: "U2", amount: 300 }));

console.log(engine.delete("users", "U1"));

console.log(engine.getTableData("items"));

console.log(engine.validate());


// --- INVALID ---
console.log(createIntegrityEngine({ tables: [{ name: "", primaryKey: "id", foreignKeys: null }] }));