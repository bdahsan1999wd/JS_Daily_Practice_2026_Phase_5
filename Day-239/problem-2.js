// 🧩 PROBLEM–02: runGroupAggregation()

// Logic: Groups documents by a field (_id) or all documents (_id: null), then computes accumulator operators for each group.

//   $sum   — sum of field (field: 1 → count)
//   $avg   — average rounded to 2dp
//   $min   — minimum
//   $max   — maximum
//   $count — count documents in group
//   $push  — collect field values into array
//   $first — first value in group
//   $last  — last value in group

// Returns { groups, groupCount }.


function runGroupAggregation(collection, groupConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        !Array.isArray(collection) ||
        collection.length === 0 ||
        !collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc)) ||
        typeof groupConfig !== "object" ||
        groupConfig === null ||
        !("_id" in groupConfig) ||
        typeof groupConfig.accumulators !== "object" ||
        groupConfig.accumulators === null
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: GROUP DOCUMENTS ---

    const groupField = groupConfig._id;
    const accumulators = groupConfig.accumulators;

    const groups = new Map(); // key → accumulated doc
    const order = [];         // preserve first-seen group order

    for (const doc of collection) {

        const key = groupField === null ? null : doc[groupField];

        if (!groups.has(key)) {
            groups.set(key, { _id: key, _docs: [], _seen: 0 });
            order.push(key);
        }

        const entry = groups.get(key);
        entry._docs.push(doc);
        entry._seen++;
    }

    // --- STEP 3: COMPUTE ACCUMULATORS PER GROUP ---

    const resultGroups = order.map(key => {

        const entry = groups.get(key);
        const out = { _id: entry._id };
        const docs = entry._docs;

        for (const outputField of Object.keys(accumulators)) {

            const acc = accumulators[outputField];
            const operator = acc.operator;
            const accField = acc.field;

            switch (operator) {

                case "$sum":
                    if (accField === 1) out[outputField] = docs.length;
                    else out[outputField] = docs.reduce((s, d) => s + (d[accField] ?? 0), 0);
                    break;

                case "$avg": {
                    const sum = docs.reduce((s, d) => s + (d[accField] ?? 0), 0);
                    out[outputField] = Number((sum / docs.length).toFixed(2));
                    break;
                }

                case "$min":
                    out[outputField] = Math.min(...docs.map(d => d[accField] ?? 0));
                    break;

                case "$max":
                    out[outputField] = Math.max(...docs.map(d => d[accField] ?? 0));
                    break;

                case "$count":
                    out[outputField] = docs.length;
                    break;

                case "$push":
                    out[outputField] = docs.map(d => d[accField]);
                    break;

                case "$first":
                    out[outputField] = docs[0][accField];
                    break;

                case "$last":
                    out[outputField] = docs[docs.length - 1][accField];
                    break;

                default:
                    out[outputField] = undefined;
            }
        }

        return out;
    });

    return { groups: resultGroups, groupCount: resultGroups.length };
}



// ------ EXAMPLE USAGE ------

console.log(runGroupAggregation([
    { _id: "1", name: "Rahim", dept: "IT", salary: 70000 },
    { _id: "2", name: "Karim", dept: "HR", salary: 50000 },
    { _id: "3", name: "Nadia", dept: "IT", salary: 80000 },
    { _id: "4", name: "Sadia", dept: "HR", salary: 60000 },
    { _id: "5", name: "Rafiq", dept: "IT", salary: 90000 }
], {
    _id: "dept",
    accumulators: {
        totalEmployees: { operator: "$count", field: null },
        totalSalary: { operator: "$sum", field: "salary" },
        avgSalary: { operator: "$avg", field: "salary" },
        maxSalary: { operator: "$max", field: "salary" },
        minSalary: { operator: "$min", field: "salary" },
        names: { operator: "$push", field: "name" }
    }
}));



console.log(runGroupAggregation([
    { _id: "1", salary: 70000 },
    { _id: "2", salary: 50000 }
], { _id: null, accumulators: { total: { operator: "$sum", field: "salary" }, count: { operator: "$count", field: null } } }));



// --- INVALID ---
console.log(runGroupAggregation(null, {}));