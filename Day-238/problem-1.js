// 🧩 PROBLEM–01: createQueryBuilder()

// Logic: Returns a chainable fluent query builder (SELECT).

//   select(...fields) — fields to include
//   where(field, operator, value)   — AND filter condition
//   orWhere(field, operator, value) — OR filter condition
//   orderBy(field, direction) — sort ("asc"/"desc")
//   limit(n) / offset(n) — pagination
//   execute() — run built query, returns { rows, rowCount, query }
//   toSQL()   — SQL-like string
//   reset()   — clear query state

// Operators: =, !=, >, >=, <, <=, LIKE (substring), IN (array).
// Final filter: (AND conditions) OR (orWhere conditions).


function createQueryBuilder(data) {

    // --- STEP 1: VALIDATE data ---

    if (
        !Array.isArray(data) ||
        data.length === 0 ||
        !data.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc))
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    const operators = ["=", "!=", ">", ">=", "<", "<=", "LIKE", "IN"];

    let selectFields = null;
    let whereList = [];
    let orWhereList = [];
    let orderField = null;
    let orderDirection = "asc";
    let limitCount = null;
    let offsetCount = 0;

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

    // --- STEP 4: SQL BUILDING ---

    function conditionSQL(cond) {
        const val = typeof cond.value === "string"
            ? "'" + cond.value + "'"
            : String(cond.value);
        return cond.field + " " + cond.operator + " " + val;
    }

    function buildSQL() {

        const cols = selectFields && selectFields.length > 0
            ? selectFields.join(", ")
            : "*";

        let sql = "SELECT " + cols + " FROM data";

        const whereSQL = whereList.map(conditionSQL).join(" AND ");
        const orSQL = orWhereList.map(conditionSQL).join(" OR ");

        if (whereSQL && orSQL) {
            sql += " WHERE " + whereSQL + " OR " + orSQL;
        } else if (whereSQL) {
            sql += " WHERE " + whereSQL;
        } else if (orSQL) {
            sql += " WHERE " + orSQL;
        }

        if (orderField) {
            sql += " ORDER BY " + orderField + " " + orderDirection.toUpperCase();
        }

        if (limitCount !== null) {
            sql += " LIMIT " + limitCount + " OFFSET " + offsetCount;
        }

        return sql;
    }

    // --- STEP 5: RETURN BUILDER ---

    return {

        select(...fields) {

            if (fields.some(f => typeof f !== "string")) return "Invalid Input";

            selectFields = fields;

            return this;
        },

        where(field, operator, value) {

            if (typeof field !== "string" || !operators.includes(operator)) return "Invalid Input";

            whereList.push({ field, operator, value });

            return this;
        },

        orWhere(field, operator, value) {

            if (typeof field !== "string" || !operators.includes(operator)) return "Invalid Input";

            orWhereList.push({ field, operator, value });

            return this;
        },

        orderBy(field, direction) {

            if (typeof field !== "string" || !["asc", "desc"].includes(direction)) return "Invalid Input";

            orderField = field;
            orderDirection = direction;

            return this;
        },

        limit(n) {

            if (typeof n !== "number" || !Number.isInteger(n) || n < 1) return "Invalid Input";

            limitCount = n;

            return this;
        },

        offset(n) {

            if (typeof n !== "number" || !Number.isInteger(n) || n < 0) return "Invalid Input";

            offsetCount = n;

            return this;
        },

        execute() {

            // Filter.
            let rows = data.filter(doc => {
                const andMatch = whereList.every(c => evalCondition(doc, c));
                const orMatch = orWhereList.some(c => evalCondition(doc, c));

                if (whereList.length > 0 && orWhereList.length > 0) return andMatch || orMatch;
                if (whereList.length > 0) return andMatch;
                if (orWhereList.length > 0) return orMatch;
                return true;
            });

            // Sort.
            if (orderField) {
                rows = [...rows].sort((a, b) => {
                    if (a[orderField] < b[orderField]) return orderDirection === "asc" ? -1 : 1;
                    if (a[orderField] > b[orderField]) return orderDirection === "asc" ? 1 : -1;
                    return 0;
                });
            }

            // Paginate.
            const skipped = offsetCount > 0 ? rows.slice(offsetCount) : rows;
            const limited = limitCount !== null ? skipped.slice(0, limitCount) : skipped;

            // Project.
            const output = limited.map(doc => {
                if (selectFields && selectFields.length > 0) {
                    const out = {};
                    for (const f of selectFields) {
                        if (doc[f] !== undefined) out[f] = doc[f];
                    }
                    return out;
                }
                return { ...doc };
            });

            return { rows: output, rowCount: output.length, query: buildSQL() };
        },

        toSQL() {
            return buildSQL();
        },

        reset() {

            selectFields = null;
            whereList = [];
            orWhereList = [];
            orderField = null;
            orderDirection = "asc";
            limitCount = null;
            offsetCount = 0;

            return { reset: true };
        }
    };
}



// ------ EXAMPLE USAGE ------

const qb = createQueryBuilder([
    { id: 1, name: "Rahim", age: 25, dept: "IT", active: true },
    { id: 2, name: "Karim", age: 17, dept: "HR", active: true },
    { id: 3, name: "Nadia", age: 30, dept: "IT", active: false },
    { id: 4, name: "Sadia", age: 22, dept: "HR", active: true },
    { id: 5, name: "Rafiq", age: 35, dept: "IT", active: true }
]);


console.log(qb.select("name", "age", "dept")
    .where("age", ">=", 18)
    .where("active", "=", true)
    .orderBy("age", "asc")
    .limit(3)
    .execute());


console.log(qb.reset());


console.log(qb.select("name")
    .where("dept", "=", "IT")
    .orWhere("age", "<", 20)
    .execute());


// --- INVALID ---
console.log(createQueryBuilder([]));