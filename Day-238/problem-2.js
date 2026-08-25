// 🧩 PROBLEM–02: createMutationBuilder()

// Logic: Returns a chainable mutation builder (INSERT/UPDATE/DELETE).

//   insert(doc) — stage INSERT
//   insertMany(docs) — stage multiple INSERTs
//   update(doc) — stage UPDATE (merge into matching records)
//   delete(id)  — stage DELETE by id (or via where())
//   where(field, operator, value) — filter for UPDATE/DELETE
//   execute() — apply staged mutations, return result
//   toSQL()   — SQL-like string
//   reset()   — clear staged mutations

// One builder instance handles ONE mutation type at a time.


function createMutationBuilder(initialData) {

    // --- STEP 1: VALIDATE initialData ---

    if (
        !Array.isArray(initialData) ||
        initialData.length === 0 ||
        !initialData.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc))
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    const operators = ["=", "!=", ">", ">=", "<", "<=", "LIKE", "IN"];

    const data = initialData.map(doc => ({ ...doc }));

    let operation = null; // "INSERT" | "UPDATE" | "DELETE"
    let insertDocs = [];
    let updateDoc = null;
    let deleteId = null;
    let whereList = [];

    // Next auto id.
    let nextId = 1;
    for (const doc of data) {
        if (typeof doc.id === "number" && doc.id >= nextId) nextId = doc.id + 1;
    }

    // --- STEP 3: CONDITION MATCHING ---

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

    function whereMatches(doc) {
        return whereList.every(c => evalCondition(doc, c));
    }

    // --- STEP 4: SQL BUILDING ---

    function conditionSQL(cond) {
        const val = typeof cond.value === "string" ? "'" + cond.value + "'" : String(cond.value);
        return cond.field + " " + cond.operator + " " + val;
    }

    function whereSQL() {
        return whereList.map(conditionSQL).join(" AND ");
    }

    function buildSQL() {

        if (operation === "INSERT") {
            return "INSERT INTO data VALUES (" + insertDocs.map(doc =>
                "{" + Object.keys(doc).map(k => k + ":" + doc[k]).join(",") + "}"
            ).join(", ") + ")";
        }

        if (operation === "UPDATE") {
            const setSQL = Object.keys(updateDoc).map(k => k + "=" + updateDoc[k]).join(", ");
            const wSQL = whereSQL();
            return "UPDATE data SET " + setSQL + (wSQL ? " WHERE " + wSQL : "");
        }

        if (operation === "DELETE") {
            const wSQL = whereSQL();
            return "DELETE FROM data" + (wSQL ? " WHERE " + wSQL : "");
        }

        return "";
    }

    // --- STEP 5: RETURN BUILDER ---

    return {

        insert(doc) {

            if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";

            operation = "INSERT";
            insertDocs = [];
            insertDocs.push({ ...doc });

            return this;
        },

        insertMany(docs) {

            if (!Array.isArray(docs) || !docs.every(d => typeof d === "object" && d !== null)) return "Invalid Input";

            operation = "INSERT";
            insertDocs = [];
            for (const d of docs) insertDocs.push({ ...d });

            return this;
        },

        update(doc) {

            if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";

            operation = "UPDATE";
            updateDoc = { ...doc };

            return this;
        },

        delete(id) {

            if (id !== undefined && typeof id !== "number" && typeof id !== "string") return "Invalid Input";

            operation = "DELETE";
            deleteId = id ?? null;

            return this;
        },

        where(field, operator, value) {

            if (typeof field !== "string" || !operators.includes(operator)) return "Invalid Input";

            whereList.push({ field, operator, value });

            return this;
        },

        execute() {

            if (operation === "INSERT") {

                const newDocs = insertDocs.map(doc => {
                    const hasId = doc.id !== undefined;
                    return hasId ? { ...doc } : { id: nextId++, ...doc };
                });

                for (const doc of newDocs) data.push({ ...doc });

                return { operation: "INSERT", inserted: newDocs.length, docs: newDocs.map(d => ({ ...d })) };
            }

            if (operation === "UPDATE") {

                const matches = data.filter(doc => whereMatches(doc));

                for (const doc of matches) {
                    Object.assign(doc, updateDoc);
                }

                return { operation: "UPDATE", updated: matches.length, docs: matches.map(d => ({ ...d })) };
            }

            if (operation === "DELETE") {

                let toDelete;

                if (deleteId !== null) {
                    toDelete = data.filter(doc => doc.id === deleteId);
                } else {
                    toDelete = data.filter(doc => whereMatches(doc));
                }

                const ids = toDelete.map(doc => doc.id);

                for (const doc of toDelete) {
                    const idx = data.findIndex(d => d.id === doc.id);
                    if (idx !== -1) data.splice(idx, 1);
                }

                return { operation: "DELETE", deleted: ids.length, ids };
            }

            return { error: "No operation staged" };
        },

        toSQL() {
            return buildSQL();
        },

        reset() {

            operation = null;
            insertDocs = [];
            updateDoc = null;
            deleteId = null;
            whereList = [];

            return { reset: true };
        }
    };
}


// ------ EXAMPLE USAGE ------

const mb = createMutationBuilder([
    { id: 1, name: "Rahim", dept: "IT", salary: 50000 },
    { id: 2, name: "Karim", dept: "HR", salary: 40000 },
    { id: 3, name: "Nadia", dept: "IT", salary: 60000 }
]);

// INSERT
console.log(mb.insert({ name: "Sadia", dept: "IT", salary: 55000 }).execute());


// UPDATE
mb.reset();
console.log(mb.update({ salary: 65000 }).where("dept", "=", "IT").execute());

// DELETE
mb.reset();
console.log(mb.where("dept", "=", "HR").delete().execute());


// --- INVALID ---
console.log(createMutationBuilder([]));