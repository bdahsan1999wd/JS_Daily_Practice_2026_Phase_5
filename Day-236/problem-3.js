// 🧩 PROBLEM–03: createAdvancedQuery()

// Logic: Returns an advanced query object over an array of documents.
//   query(options)      — filter + sort + project + paginate
//   aggregate(pipeline) — simple aggregation pipeline

// query options: { filter, sort: {field: 1|-1}, project: [fields], skip, limit } always includes _id in projection.

// aggregate stages: $match, $group ({ _id, count:{ $sum:1 }, total:{ $sum:field } }), $sort, $limit, $project.


function createAdvancedQuery(collection) {

    // --- STEP 1: VALIDATE collection ---

    if (
        !Array.isArray(collection) ||
        collection.length === 0 ||
        !collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc))
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: MATCHING LOGIC (Problem-02 operators) ---

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

    // --- STEP 3: HELPERS ---

    function sortDocs(docs, sort) {

        if (!sort) return docs;

        const field = Object.keys(sort)[0];
        const dir = sort[field];

        return [...docs].sort((a, b) => {
            if (a[field] < b[field]) return -1 * dir;
            if (a[field] > b[field]) return 1 * dir;
            return 0;
        });
    }

    function projectDoc(doc, project) {

        if (!project) return { ...doc };

        const out = { _id: doc._id };

        for (const f of project) {
            if (f !== "_id" && doc[f] !== undefined) out[f] = doc[f];
        }

        return out;
    }

    // --- STEP 4: RETURN ADVANCED QUERY OBJECT ---

    return {

        query(options) {

            if (
                typeof options !== "object" || options === null || Array.isArray(options) ||
                (options.filter !== null && (typeof options.filter !== "object" || options.filter === null)) ||
                (options.sort !== null && (typeof options.sort !== "object" || options.sort === null || Object.keys(options.sort).length !== 1)) ||
                (options.project !== null && !Array.isArray(options.project)) ||
                (typeof options.skip !== "number" || options.skip < 0) ||
                (options.limit !== null && (typeof options.limit !== "number" || options.limit < 1))
            ) {
                return "Invalid Input";
            }

            const filter = options.filter || {};
            const skip = options.skip || 0;

            // Filter.

            const matched = collection.filter(doc => matches(doc, filter));

            // Sort.

            const sorted = sortDocs(matched, options.sort);

            // Paginate.

            const paginated = skip > 0 ? sorted.slice(skip) : sorted;

            const limited = options.limit !== null ? paginated.slice(0, options.limit) : paginated;

            // Project.

            const docs = limited.map(doc => projectDoc(doc, options.project));

            return {
                docs,
                totalMatched: matched.length,
                returned: docs.length,
                skip,
                limit: options.limit
            };
        },

        aggregate(pipeline) {

            if (!Array.isArray(pipeline)) return "Invalid Input";

            let current = collection.map(doc => ({ ...doc }));

            const stagesCount = pipeline.length;

            for (const stage of pipeline) {

                // $match

                if (stage.$match !== undefined) {
                    current = current.filter(doc => matches(doc, stage.$match));
                }

                // $group

                else if (stage.$group !== undefined) {
                    const group = stage.$group;
                    const groups = {};

                    for (const doc of current) {
                        const key = String(doc[group._id]);
                        if (!groups[key]) {
                            groups[key] = { _id: key, count: 0 };
                            // Initialize sum accumulators.
                            for (const aggKey of Object.keys(group)) {
                                if (aggKey === "_id") continue;
                                groups[key][aggKey] = 0;
                            }
                        }

                        for (const aggKey of Object.keys(group)) {
                            if (aggKey === "_id") continue;
                            const agg = group[aggKey];
                            if (agg.$sum !== undefined) {
                                const field = agg.$sum;
                                const value = field === 1 ? 1 : (doc[field] || 0);
                                groups[key][aggKey] += value;
                            }
                        }
                    }

                    current = Object.keys(groups).map(key => ({ ...groups[key] }));
                }

                // $sort

                else if (stage.$sort !== undefined) {
                    current = sortDocs(current, stage.$sort);
                }

                // $limit

                else if (stage.$limit !== undefined) {
                    current = current.slice(0, stage.$limit);
                }

                // $project

                else if (stage.$project !== undefined) {
                    current = current.map(doc => {
                        const out = { _id: doc._id };
                        for (const f of Object.keys(stage.$project)) {
                            if (stage.$project[f] === 1 && doc[f] !== undefined) out[f] = doc[f];
                        }
                        return out;
                    });
                }
            }

            return { result: current, stages: stagesCount };
        }
    };
}



// ------ EXAMPLE USAGE ------

const aq = createAdvancedQuery([
    { _id: "1", name: "Rahim", age: 25, dept: "IT", salary: 70000 },
    { _id: "2", name: "Karim", age: 30, dept: "HR", salary: 50000 },
    { _id: "3", name: "Nadia", age: 22, dept: "IT", salary: 80000 },
    { _id: "4", name: "Sadia", age: 28, dept: "HR", salary: 60000 },
    { _id: "5", name: "Rafiq", age: 35, dept: "IT", salary: 90000 }
]);


console.log(aq.query({
    filter: { dept: "IT" },
    sort: { salary: -1 },
    project: ["name", "salary"],
    skip: 0,
    limit: 2
}));

console.log(aq.aggregate([
    { $match: { dept: "IT" } },
    { $group: { _id: "dept", count: { $sum: 1 }, total: { $sum: "salary" } } },
    { $sort: { total: -1 } }
]));


// --- INVALID ---
console.log(createAdvancedQuery([]));