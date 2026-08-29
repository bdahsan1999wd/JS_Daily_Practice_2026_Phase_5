// 🧩 PROBLEM–01: createSchemaManager()

// Logic: Schema (DDL) manager for tables.
//   defineTable / alterTable / dropTable
//   validateDocument — required, type, unique, unknown-column warnings
//   getSchema / listTables


function createSchemaManager() {

    // --- INTERNAL STATE ---

    const tables = new Map(); // tableName -> schema config

    // --- HELPERS ---

    function typeMatches(type, value) {

        switch (type) {
            case "string": return typeof value === "string";
            case "number": return typeof value === "number";
            case "boolean": return typeof value === "boolean";
            default: return true;
        }
    }

    // --- PUBLIC API ---

    return {

        defineTable(tableConfig) {

            if (
                typeof tableConfig !== "object" ||
                tableConfig === null ||
                typeof tableConfig.tableName !== "string" ||
                tableConfig.tableName.length === 0 ||
                !Array.isArray(tableConfig.columns) ||
                tableConfig.columns.length === 0
            ) {
                return "Invalid Input";
            }

            const name = tableConfig.tableName;

            if (tables.has(name)) {
                return { defined: false, reason: "Table already exists: " + name };
            }

            tables.set(name, {
                tableName: name,
                columns: tableConfig.columns.map(c => ({ ...c })),
                primaryKey: tableConfig.primaryKey || null,
                foreignKeys: tableConfig.foreignKeys ? tableConfig.foreignKeys.map(fk => ({ ...fk })) : null,
                indexes: tableConfig.indexes ? tableConfig.indexes.map(ix => ({ ...ix })) : null
            });

            return { defined: true, tableName: name, columnCount: tableConfig.columns.length };
        },

        alterTable(tableName, alteration) {

            if (typeof tableName !== "string" || tableName.length === 0 ||
                typeof alteration !== "object" || alteration === null) {
                return "Invalid Input";
            }

            const schema = tables.get(tableName);

            if (!schema) return { error: "Table not found" };

            const changes = [];

            if (alteration.addColumn) {

                const col = alteration.addColumn;

                schema.columns.push({ ...col });

                changes.push("Added column: " + col.name);
            }

            if (alteration.dropColumn) {

                const name = alteration.dropColumn;

                schema.columns = schema.columns.filter(c => c.name !== name);

                changes.push("Dropped column: " + name);
            }

            if (alteration.addIndex) {

                if (!schema.indexes) schema.indexes = [];

                schema.indexes.push({ ...alteration.addIndex });

                changes.push("Added index: " + alteration.addIndex.column);
            }

            if (alteration.dropIndex) {

                const col = alteration.dropIndex;

                schema.indexes = (schema.indexes || []).filter(ix => ix.column !== col);

                changes.push("Dropped index: " + col);
            }

            return { altered: true, tableName, changes };
        },

        dropTable(tableName) {

            if (typeof tableName !== "string" || tableName.length === 0) return "Invalid Input";

            if (!tables.has(tableName)) return { error: "Table not found" };

            tables.delete(tableName);

            return { dropped: true, tableName };
        },

        validateDocument(tableName, doc) {

            if (typeof tableName !== "string" || tableName.length === 0 ||
                typeof doc !== "object" || doc === null || Array.isArray(doc)) {
                return "Invalid Input";
            }

            const schema = tables.get(tableName);

            if (!schema) return { error: "Table not found" };

            const errors = [];
            const warnings = [];

            for (const col of schema.columns) {

                const value = doc[col.name];

                if (col.required && (value === undefined || value === null)) {
                    errors.push(col.name + ": required field missing");
                    continue;
                }

                if (value !== undefined && value !== null && !typeMatches(col.type, value)) {
                    errors.push(col.name + ": type mismatch, expected " + col.type);
                }
            }

            // Unknown columns → warnings.

            const knownColumns = new Set(schema.columns.map(c => c.name));

            for (const field of Object.keys(doc)) {

                if (!knownColumns.has(field)) {
                    warnings.push("Unknown column: " + field);
                }
            }

            return { valid: errors.length === 0, errors, warnings };
        },

        getSchema(tableName) {

            if (typeof tableName !== "string" || tableName.length === 0) return "Invalid Input";

            const schema = tables.get(tableName);

            if (!schema) return { error: "Table not found" };

            return {
                tableName: schema.tableName,
                columns: schema.columns.map(c => ({ ...c })),
                primaryKey: schema.primaryKey,
                foreignKeys: schema.foreignKeys ? schema.foreignKeys.map(fk => ({ ...fk })) : null,
                indexes: schema.indexes ? schema.indexes.map(ix => ({ ...ix })) : null
            };
        },

        listTables() {

            const list = [];

            for (const schema of tables.values()) {
                list.push({
                    tableName: schema.tableName,
                    columnCount: schema.columns.length,
                    hasIndexes: Array.isArray(schema.indexes) && schema.indexes.length > 0,
                    hasForeignKeys: Array.isArray(schema.foreignKeys) && schema.foreignKeys.length > 0
                });
            }

            return list;
        }
    };
}


// ------ EXAMPLE USAGE ------

const sm = createSchemaManager();

console.log(sm.defineTable({
    tableName: "users",
    columns: [
        { name: "id", type: "string", required: true, default: null, unique: true },
        { name: "name", type: "string", required: true, default: null, unique: false },
        { name: "age", type: "number", required: false, default: 18, unique: false },
        { name: "email", type: "string", required: true, default: null, unique: true }
    ],
    primaryKey: "id",
    foreignKeys: null,
    indexes: [{ column: "email", type: "HASH" }]
}));


console.log(sm.validateDocument("users", { id: "U1", name: "Rahim", email: "r@mail.com", unknownField: "x" }));

console.log(sm.validateDocument("users", { name: "Karim" }));

console.log(sm.alterTable("users", { addColumn: { name: "active", type: "boolean", required: false, default: true, unique: false }, dropColumn: null, addIndex: null, dropIndex: null }));

console.log(sm.listTables());

console.log(sm.getSchema("users"));


// --- INVALID ---
console.log(sm.dropTable("nonexistent"));