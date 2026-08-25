// 🧩 PROBLEM–03: createSubqueryBuilder()

// Logic: Returns a subquery builder.

//   from(tableName)      — set main table
//   select(...fields)    — select fields
//   where(field, operator, value) — filter
//   whereIn(field, subquery)    — field IN subquery result
//   whereNotIn(field, subquery) — field NOT IN subquery result
//   subquery(tableName)  — create a nested subquery builder
//   execute()            — run main query + resolve subqueries
//   toSQL()              — SQL-like string with inline subquery

// whereIn executes subquery first → get values → filter main WHERE field IN values.


function createSubqueryBuilder(tables) {

    // --- STEP 1: VALIDATE tables ---

    if (
        typeof tables !== "object" || tables === null || Array.isArray(tables) ||
        !Object.values(tables).every(arr => Array.isArray(arr))
    ) {
        return "Invalid Input";
    }

    const operators = ["=", "!=", ">", ">=", "<", "<=", "LIKE", "IN"];

    // --- STEP 2: BUILDER STATE ---

    let mainTable = null;
    let selectFields = [];
    const conditions = []; // { field, operator, value } (AND)
    const subConditions = []; // { field, subquery } whereIn / whereNotIn

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

    // --- STEP 4: SUBQUERY RESOLUTION ---

    function resolveSubquery(sub) {

        // sub is a builder instance with its own state.
        const result = sub.execute();

        // Extract the subquery select field values from result rows.
        const values = result.rows.map(r => {
            // The single selected value is the first non-_id field value.
            const keys = Object.keys(r);
            return r[keys[0]];
        });

        return values;
    }

    // --- STEP 5: SQL BUILDING ---

    function conditionSQL(cond) {
        const val = typeof cond.value === "string" ? "'" + cond.value + "'" : String(cond.value);
        return cond.field + " " + cond.operator + " " + val;
    }

    function subquerySQL(sc) {

        const sub = sc.subquery;
        const subSQL = sub.toSQL();

        // Wrap nested SELECT as "(SELECT ...)".
        const inline = "(" + subSQL + ")";

        const keyword = sc.notIn ? "NOT IN" : "IN";

        return sc.field + " " + keyword + " " + inline;
    }

    function buildSQL() {

        const cols = selectFields.length > 0 ? selectFields.join(", ") : "*";

        let sql = "SELECT " + cols + " FROM " + mainTable;

        const parts = [];

        for (const c of conditions) parts.push(conditionSQL(c));
        for (const sc of subConditions) parts.push(subquerySQL(sc));

        if (parts.length > 0) sql += " WHERE " + parts.join(" AND ");

        return sql;
    }

    // --- STEP 6: RETURN BUILDER ---

    return {

        from(tableName) {

            if (typeof tableName !== "string" || !tables[tableName]) return "Invalid Input";

            mainTable = tableName;

            return this;
        },

        select(...fields) {

            if (fields.some(f => typeof f !== "string")) return "Invalid Input";

            selectFields = fields;

            return this;
        },

        where(field, operator, value) {

            if (typeof field !== "string" || !operators.includes(operator)) return "Invalid Input";

            conditions.push({ field, operator, value });

            return this;
        },

        whereIn(field, subquery) {

            if (typeof field !== "string" || typeof subquery !== "object" || subquery === null) return "Invalid Input";

            subConditions.push({ field, subquery, notIn: false });

            return this;
        },

        whereNotIn(field, subquery) {

            if (typeof field !== "string" || typeof subquery !== "object" || subquery === null) return "Invalid Input";

            subConditions.push({ field, subquery, notIn: true });

            return this;
        },

        subquery(tableName) {

            if (typeof tableName !== "string" || !tables[tableName]) return "Invalid Input";

            const child = createSubqueryBuilder(tables);

            child.from(tableName);

            return child;
        },

        execute() {

            if (!mainTable) return "Invalid Input";

            const source = tables[mainTable];

            // Resolve subquery conditions first.

            const subValues = {};

            for (const sc of subConditions) {
                subValues[sc.field] = resolveSubquery(sc.subquery);
            }

            let rows = source.filter(doc => {

                for (const c of conditions) {
                    if (!evalCondition(doc, c)) return false;
                }

                for (const sc of subConditions) {
                    const vals = subValues[sc.field];
                    if (sc.notIn) {
                        if (vals.includes(doc[sc.field])) return false;
                    } else {
                        if (!vals.includes(doc[sc.field])) return false;
                    }
                }

                return true;
            });

            // Project.

            rows = rows.map(doc => {
                if (selectFields.length > 0) {
                    const out = {};
                    for (const f of selectFields) if (doc[f] !== undefined) out[f] = doc[f];
                    return out;
                }
                return { ...doc };
            });

            return { rows, rowCount: rows.length, query: buildSQL() };
        },

        toSQL() {
            return buildSQL();
        }
    };
}


// ------ EXAMPLE USAGE ------

const sqb = createSubqueryBuilder({
    users: [
        { id: "U1", name: "Rahim", dept: "IT" },
        { id: "U2", name: "Karim", dept: "HR" },
        { id: "U3", name: "Nadia", dept: "IT" }
    ],
    orders: [
        { id: "O1", userId: "U1", amount: 500 },
        { id: "O2", userId: "U3", amount: 200 },
        { id: "O3", userId: "U2", amount: 50 }
    ]
});


// Find users who have orders with amount > 100
const ordersSubquery = sqb.subquery("orders")
    .select("userId")
    .where("amount", ">", 100);


console.log(sqb.from("users")
    .select("name", "dept")
    .whereIn("id", ordersSubquery)
    .execute());


// --- INVALID ---
console.log(createSubqueryBuilder({ users: "not-an-array" }));