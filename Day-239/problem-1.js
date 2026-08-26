// 🧩 PROBLEM–01: runBasicAggregation()

// Logic: Runs a basic aggregation pipeline over a collection.

//   $match   — filter documents (Day-238 Problem-01 operators)
//   $project — include (1) or exclude (0) fields; _id default on unless 0
//   $sort    — sort by field (1 asc, -1 desc)
//   $limit   — keep first N
//   $skip    — skip first N
//   $count   — single doc { fieldName: totalDocs }

// Tracks stagesExecuted: [{ stage, inputCount, outputCount }].


function runBasicAggregation(collection, pipeline) {

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

    // --- STEP 2: MATCHING LOGIC (Day-238 Problem-01 operators) ---

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

    // --- STEP 3: EXECUTE PIPELINE ---

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

                    if (spec[key] === 0) continue; // exclude

                    if (spec[key] === 1) {
                        out[key] = doc[key];
                    } else if (spec[key] === undefined) {
                        // Not specified → keep only if _id (included by default)
                        if (key === "_id") out[key] = doc[key];
                    }
                }

                // If _id explicitly 0, drop it (handled above).

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

        stagesExecuted.push({ stage: stageKey, inputCount, outputCount: current.length });
        totalStages++;
    }

    return { result: current, totalStages, stagesExecuted };
}


// ------ EXAMPLE USAGE ------

console.log(runBasicAggregation([
    { _id: "1", name: "Rahim", dept: "IT", salary: 70000, active: true },
    { _id: "2", name: "Karim", dept: "HR", salary: 50000, active: false },
    { _id: "3", name: "Nadia", dept: "IT", salary: 80000, active: true },
    { _id: "4", name: "Sadia", dept: "HR", salary: 60000, active: true },
    { _id: "5", name: "Rafiq", dept: "IT", salary: 90000, active: true }
], [
    { $match: { active: true } },
    { $sort: { salary: -1 } },
    { $limit: 3 },
    { $project: { name: 1, salary: 1, dept: 1, _id: 0 } }
]));


// --- INVALID ---
console.log(runBasicAggregation([], []));