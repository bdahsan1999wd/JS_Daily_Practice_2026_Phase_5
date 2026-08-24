// 🧩 PROBLEM–02: createQueryEngine()

// Logic: Returns a query engine over an array of documents.
//   find(query)      — documents matching a query object
//   findOne(query)   — first matching document
//   count(query)     — number of matching documents
//   distinct(field)  — unique values for a field (sorted)

// Query operators: exact value, $gt, $gte, $lt, $lte, $ne, $in, $nin, $contains (case-insensitive), $exists. Multiple fields = AND logic.


function createQueryEngine(collection) {

    // --- STEP 1: VALIDATE collection ---

    if (
        !Array.isArray(collection) ||
        collection.length === 0 ||
        !collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc) && doc._id !== undefined)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: MATCHING LOGIC ---

    function matches(doc, query) {

        for (const field of Object.keys(query)) {

            const condition = query[field];

            if (typeof condition === "object" && condition !== null && !Array.isArray(condition)) {

                // Operator object.

                const ops = condition;

                for (const op of Object.keys(ops)) {

                    const expected = ops[op];
                    const actual = doc[field];

                    switch (op) {
                        case "$gt": if (!(actual > expected)) return false; break;
                        case "$gte": if (!(actual >= expected)) return false; break;
                        case "$lt": if (!(actual < expected)) return false; break;
                        case "$lte": if (!(actual <= expected)) return false; break;
                        case "$ne": if (actual === expected) return false; break;
                        case "$in": if (!(Array.isArray(expected) && expected.includes(actual))) return false; break;
                        case "$nin": if (Array.isArray(expected) && expected.includes(actual)) return false; break;
                        case "$contains":
                            if (typeof actual !== "string" || typeof expected !== "string" ||
                                !actual.toLowerCase().includes(expected.toLowerCase())) return false;
                            break;
                        case "$exists":
                            if (expected === true && actual === undefined) return false;
                            if (expected === false && actual !== undefined) return false;
                            break;
                        default:
                            return false;
                    }
                }

            } else {

                // Exact equality.

                if (doc[field] !== condition) return false;
            }
        }

        return true;
    }

    // --- STEP 3: RETURN QUERY ENGINE OBJECT ---

    return {

        find(query) {

            if (typeof query !== "object" || query === null || Array.isArray(query)) return "Invalid Input";

            const docs = collection.filter(doc => matches(doc, query)).map(doc => ({ ...doc }));

            return { docs, count: docs.length };
        },

        findOne(query) {

            if (typeof query !== "object" || query === null || Array.isArray(query)) return "Invalid Input";

            const doc = collection.find(doc => matches(doc, query));

            return { doc: doc ? { ...doc } : null };
        },

        count(query) {

            if (typeof query !== "object" || query === null || Array.isArray(query)) return "Invalid Input";

            return collection.filter(doc => matches(doc, query)).length;
        },

        distinct(field) {

            if (typeof field !== "string" || field.trim() === "") return "Invalid Input";

            const values = [];

            for (const doc of collection) {
                const value = doc[field];
                if (value !== undefined && !values.includes(value)) values.push(value);
            }

            values.sort();

            return { field, values, count: values.length };
        }
    };
}



// ------ EXAMPLE USAGE ------

const engine = createQueryEngine([
    { _id: "1", name: "Rahim", age: 25, role: "ADMIN", active: true },
    { _id: "2", name: "Karim", age: 17, role: "USER", active: true },
    { _id: "3", name: "Nadia", age: 30, role: "MOD", active: false },
    { _id: "4", name: "Sadia", age: 22, role: "USER", active: true }
]);

console.log(engine.find({ age: { $gte: 18 }, active: true }));

console.log(engine.find({ role: { $in: ["ADMIN", "MOD"] } }));

console.log(engine.find({ name: { $contains: "ah" } }));

console.log(engine.findOne({ role: "USER", active: true }));

console.log(engine.count({ active: false }));

console.log(engine.distinct("role"));


// --- INVALID ---
console.log(createQueryEngine([]));