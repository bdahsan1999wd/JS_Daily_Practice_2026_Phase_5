// 🧩 PROBLEM–03: runAdvancedAggregation()

// Logic: Runs advanced aggregation stages on top of Problem-01 stages.

//   $group       — group stage (Problem-02 logic)
//   $unwind      — deconstruct array field into separate documents

//   $addFields   — add computed fields:
//                    $multiply: ["$field", value]
//                    $concat:   ["$f1", " ", "$f2"]
//                    $toUpper / $toLower: "$field"
//                    $subtract: ["$f1", "$f2"]

//   $replaceRoot — replace root with nested object field

// Plus all Problem-01 stages ($match, $project, $sort, $limit, $skip, $count).

// Returns { result, totalStages, stagesExecuted }.


function runAdvancedAggregation(collection, pipeline) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        !Array.isArray(collection) ||
        collection.length === 0 ||
        !collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc)) ||
        !Array.isArray(pipeline) ||
        pipeline.length === 0
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: MATCHING LOGIC ---

    function matches(doc, query) {

        for (const field of Object.keys(query)) {

            const condition = query[field];

            if (typeof condition === "object" && condition !== null && !Array.isArray(condition)) {

                for (const op of Object.keys(condition)) {

                    const expected = condition[op];
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

                if (doc[field] !== condition) return false;
            }
        }

        return true;
    }

    // --- STEP 3: EXPRESSION EVALUATION ---

    function evalExpr(expr, doc) {

        // {"$multiply": ["$field", value]}

        if (typeof expr === "object" && expr !== null && "$multiply" in expr) {
            return expr.$multiply.reduce((acc, item) => {
                const v = typeof item === "string" && item.startsWith("$") ? doc[item.slice(1)] : item;
                return acc * v;
            }, 1);
        }

        // {"$concat": ["$f1", " ", "$f2"]}

        if (typeof expr === "object" && expr !== null && "$concat" in expr) {
            return expr.$concat.map(item => {
                return typeof item === "string" && item.startsWith("$") ? doc[item.slice(1)] : item;
            }).join("");
        }

        // {"$toUpper": "$field"}

        if (typeof expr === "object" && expr !== null && "$toUpper" in expr) {
            const f = expr.$toUpper;
            const val = typeof f === "string" && f.startsWith("$") ? doc[f.slice(1)] : f;
            return String(val).toUpperCase();
        }

        // {"$toLower": "$field"}

        if (typeof expr === "object" && expr !== null && "$toLower" in expr) {
            const f = expr.$toLower;
            const val = typeof f === "string" && f.startsWith("$") ? doc[f.slice(1)] : f;
            return String(val).toLowerCase();
        }

        // {"$subtract": ["$f1", "$f2"]}

        if (typeof expr === "object" && expr !== null && "$subtract" in expr) {
            const [a, b] = expr.$subtract;
            const va = typeof a === "string" && a.startsWith("$") ? doc[a.slice(1)] : a;
            const vb = typeof b === "string" && b.startsWith("$") ? doc[b.slice(1)] : b;
            return va - vb;
        }

        return expr;
    }

    // --- STEP 4: GROUP LOGIC ---

    function groupStage(groupConfig, docs) {

        const groupField = groupConfig._id;

        // Accumulators can be given inline (as $group stage config) or nested.

        let accumulators = groupConfig.accumulators;

        if (typeof accumulators !== "object" || accumulators === null) {
            accumulators = {};
            for (const key of Object.keys(groupConfig)) {
                if (key !== "_id") accumulators[key] = groupConfig[key];
            }
        }

        const groups = new Map();
        const order = [];

        for (const doc of docs) {

            const key = groupField === null ? null : doc[groupField];

            if (!groups.has(key)) {
                groups.set(key, { _docs: [] });
                order.push(key);
            }

            groups.get(key)._docs.push(doc);
        }

        return order.map(key => {

            const entry = groups.get(key);
            const out = { _id: key };
            const gd = entry._docs;

            for (const outputField of Object.keys(accumulators)) {

                const acc = accumulators[outputField];
                const operator = acc.operator;
                const accField = acc.field;

                switch (operator) {

                    case "$sum":
                        if (accField === 1) out[outputField] = gd.length;
                        else out[outputField] = gd.reduce((s, d) => s + (d[accField] ?? 0), 0);
                        break;

                    case "$avg":
                        out[outputField] = Number((gd.reduce((s, d) => s + (d[accField] ?? 0), 0) / gd.length).toFixed(2));
                        break;

                    case "$min":
                        out[outputField] = Math.min(...gd.map(d => d[accField] ?? 0));
                        break;

                    case "$max":
                        out[outputField] = Math.max(...gd.map(d => d[accField] ?? 0));
                        break;

                    case "$count":
                        out[outputField] = gd.length;
                        break;

                    case "$push":
                        out[outputField] = gd.map(d => d[accField]);
                        break;

                    case "$first":
                        out[outputField] = gd[0][accField];
                        break;

                    case "$last":
                        out[outputField] = gd[gd.length - 1][accField];
                        break;
                }
            }

            return out;
        });
    }

    // --- STEP 5: EXECUTE PIPELINE ---

    let current = collection.map(doc => ({ ...doc }));

    const stagesExecuted = [];
    let totalStages = 0;

    for (const stage of pipeline) {

        const inputCount = current.length;
        const stageKey = Object.keys(stage)[0];

        // $match

        if (stage.$match !== undefined) {
            current = current.filter(doc => matches(doc, stage.$match));
        }

        // $project

        else if (stage.$project !== undefined) {

            const spec = stage.$project;

            current = current.map(doc => {

                const out = {};

                for (const key of Object.keys(doc)) {

                    if (spec[key] === 0) continue;

                    if (spec[key] === 1) {
                        out[key] = doc[key];
                    } else if (spec[key] === undefined && key === "_id") {
                        out[key] = doc[key];
                    }
                }

                return out;
            });
        }

        // $sort

        else if (stage.$sort !== undefined) {

            const field = Object.keys(stage.$sort)[0];
            const dir = stage.$sort[field];

            current = [...current].sort((a, b) => {
                if (a[field] < b[field]) return -1 * dir;
                if (a[field] > b[field]) return 1 * dir;
                return 0;
            });
        }

        // $limit

        else if (stage.$limit !== undefined) {
            current = current.slice(0, stage.$limit);
        }

        // $skip

        else if (stage.$skip !== undefined) {
            current = current.slice(stage.$skip);
        }

        // $count

        else if (stage.$count !== undefined) {
            current = [{ [stage.$count]: current.length }];
        }

        // $unwind

        else if (stage.$unwind !== undefined) {

            const fieldName = stage.$unwind;

            const unwound = [];

            for (const doc of current) {

                const arr = doc[fieldName];

                if (!Array.isArray(arr) || arr.length === 0) continue;

                for (const item of arr) {
                    unwound.push({ ...doc, [fieldName]: item });
                }
            }

            current = unwound;
        }

        // $addFields

        else if (stage.$addFields !== undefined) {

            current = current.map(doc => {

                const out = { ...doc };

                for (const newField of Object.keys(stage.$addFields)) {
                    out[newField] = evalExpr(stage.$addFields[newField], doc);
                }

                return out;
            });
        }

        // $group

        else if (stage.$group !== undefined) {
            current = groupStage(stage.$group, current);
        }

        // $replaceRoot

        else if (stage.$replaceRoot !== undefined) {

            const newRoot = stage.$replaceRoot.newRoot; // "$fieldName"

            const fieldName = newRoot.startsWith("$") ? newRoot.slice(1) : newRoot;

            current = current.map(doc => {
                const root = doc[fieldName];
                return typeof root === "object" && root !== null ? { ...root } : doc;
            });
        }

        stagesExecuted.push({ stage: stageKey, inputCount, outputCount: current.length });
        totalStages++;
    }

    return { result: current, totalStages, stagesExecuted };
}



// ------ EXAMPLE USAGE ------

console.log(runAdvancedAggregation([
    { _id: "1", name: "rahim", salary: 50000, bonus: 5000, tags: ["js", "node"] },
    { _id: "2", name: "karim", salary: 60000, bonus: 6000, tags: ["python"] },
    { _id: "3", name: "nadia", salary: 70000, bonus: 7000, tags: ["js", "react"] }
], [
    { $addFields: { fullName: { $toUpper: "$name" }, totalComp: { $multiply: ["$salary", 1.1] } } },
    { $unwind: "tags" },
    { $group: { _id: "tags", avgComp: { operator: "$avg", field: "totalComp" }, members: { operator: "$push", field: "fullName" } } },
    { $sort: { avgComp: -1 } }
]));


// --- INVALID ---
console.log(runAdvancedAggregation([], [{ $match: {} }]));