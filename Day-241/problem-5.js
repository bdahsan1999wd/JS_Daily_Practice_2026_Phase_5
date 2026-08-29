// 🧩 PROBLEM–05: runIndexOrchestrator()

// Logic: Composes Problems 01–04 into a full index orchestrator.

// Builds HASH/BTREE indexes (P1), a B-tree for range queries (P2),
// optional composite index (P3), then executes queries using the best
// available index. If runAdvisor, recommends additional indexes (P4).


function runIndexOrchestrator(indexConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof indexConfig !== "object" ||
        indexConfig === null ||
        Array.isArray(indexConfig) ||
        typeof indexConfig.orchestratorId !== "string" ||
        indexConfig.orchestratorId.length === 0 ||
        !Array.isArray(indexConfig.collection) ||
        indexConfig.collection.length === 0 ||
        !indexConfig.collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc)) ||
        !indexConfig.collection.every(doc => "_id" in doc) ||
        !Array.isArray(indexConfig.indexesToBuild) ||
        !Array.isArray(indexConfig.queries)
    ) {
        return "Invalid Input";
    }

    const orchestratorId = indexConfig.orchestratorId;
    const collection = indexConfig.collection;

    // --- STEP 2: HASH / BTREE INDEX BUILDER (Problem-01) ---

    function buildStructure(fieldName, indexType) {

        if (indexType === "HASH") {

            const map = new Map();

            for (const doc of collection) {
                const value = doc[fieldName];
                if (!map.has(value)) map.set(value, []);
                map.get(value).push(doc._id);
            }

            return map;
        }

        const pairs = collection
            .filter(doc => doc[fieldName] !== undefined)
            .map(doc => ({ value: doc[fieldName], _id: doc._id }))
            .sort((a, b) => {
                if (a.value < b.value) return -1;
                if (a.value > b.value) return 1;
                return 0;
            });

        return pairs;
    }

    const indexes = new Map(); // fieldName -> { indexType, structure, entriesIndexed }

    // --- STEP 3: COMPOSITE INDEX (Problem-03) ---

    let compositeIndex = null;
    let compositeConfig = null;

    // --- STEP 4: BUILD INDEXES ---

    const indexLog = [];

    for (const spec of indexConfig.indexesToBuild) {

        if (spec.composite) {

            // Build composite index.

            const cfg = {
                fields: spec.compositeFields || [],
                unique: spec.unique === true,
                sparse: spec.sparse === true
            };

            compositeConfig = cfg;

            const entries = new Map();

            for (const doc of collection) {

                if (cfg.sparse && cfg.fields.some(f => doc[f] === null || doc[f] === undefined)) continue;

                const key = cfg.fields.map(f => String(doc[f])).join("|");

                if (!entries.has(key)) entries.set(key, []);
                entries.get(key).push(doc._id);
            }

            compositeIndex = { fields: cfg.fields, entries };

            indexLog.push({
                fieldName: cfg.fields.join("+"),
                indexType: "COMPOSITE",
                built: true,
                entriesIndexed: collection.length
            });

            continue;
        }

        if (spec.indexType !== "HASH" && spec.indexType !== "BTREE") return "Invalid Input";

        if (indexes.has(spec.fieldName)) {
            indexLog.push({ fieldName: spec.fieldName, indexType: spec.indexType, built: false, entriesIndexed: 0 });
            continue;
        }

        indexes.set(spec.fieldName, {
            indexType: spec.indexType,
            structure: buildStructure(spec.fieldName, spec.indexType),
            entriesIndexed: collection.length
        });

        indexLog.push({
            fieldName: spec.fieldName,
            indexType: spec.indexType,
            built: true,
            entriesIndexed: collection.length
        });
    }

    // --- STEP 5: QUERY EXECUTION ---

    function findDocById(id) {
        return collection.find(doc => doc._id === id) || null;
    }

    const queryLog = [];
    let indexScanCount = 0;
    let fullScanCount = 0;

    for (const q of indexConfig.queries) {

        const { queryId, type } = q;

        if (type === "EXACT") {

            const field = q.field;
            const value = q.value;

            const idx = indexes.get(field);

            if (idx) {

                let ids;

                if (idx.indexType === "HASH") {
                    ids = idx.structure.get(value) || [];
                } else {
                    ids = idx.structure.filter(p => p.value === value).map(p => p._id);
                }

                const results = ids.map(findDocById);

                indexScanCount++;

                queryLog.push({ queryId, type, field, results, count: results.length, scanType: "INDEX_SCAN" });

            } else {

                const results = collection.filter(doc => doc[field] === value);

                fullScanCount++;

                queryLog.push({ queryId, type, field, results, count: results.length, scanType: "FULL_SCAN" });
            }

        } else if (type === "RANGE") {

            const field = q.field;
            const min = q.min;
            const max = q.max;

            const idx = indexes.get(field);

            if (idx && idx.indexType === "BTREE") {

                const results = idx.structure
                    .filter(pair => {
                        if (min !== null && min !== undefined && pair.value < min) return false;
                        if (max !== null && max !== undefined && pair.value > max) return false;
                        return true;
                    })
                    .map(pair => findDocById(pair._id));

                indexScanCount++;

                queryLog.push({ queryId, type, field, results, count: results.length, scanType: "RANGE_SCAN" });

            } else {

                const results = collection.filter(doc => {
                    if (min !== null && min !== undefined && doc[field] < min) return false;
                    if (max !== null && max !== undefined && doc[field] > max) return false;
                    return true;
                });

                fullScanCount++;

                queryLog.push({ queryId, type, field, results, count: results.length, scanType: "FULL_SCAN" });
            }

        } else if (type === "PREFIX") {

            const field = q.field;
            const prefix = q.prefix;

            const idx = indexes.get(field);

            if (idx && idx.indexType === "BTREE") {

                const lower = prefix.toLowerCase();

                const results = idx.structure
                    .filter(pair => typeof pair.value === "string" && pair.value.toLowerCase().startsWith(lower))
                    .map(pair => findDocById(pair._id));

                indexScanCount++;

                queryLog.push({ queryId, type, field, results, count: results.length, scanType: "INDEX_SCAN" });

            } else {

                const lower = prefix.toLowerCase();

                const results = collection.filter(doc =>
                    typeof doc[field] === "string" && doc[field].toLowerCase().startsWith(lower)
                );

                fullScanCount++;

                queryLog.push({ queryId, type, field, results, count: results.length, scanType: "FULL_SCAN" });
            }

        } else if (type === "COMPOSITE") {

            const query = q.compositeQuery;

            const cfg = compositeConfig;
            const fields = cfg ? cfg.fields : [];

            let provided = [];

            for (const f of fields) {
                if (f in query) provided.push(f);
                else break;
            }

            const results = collection.filter(doc => provided.every(f => doc[f] === query[f]));

            const scanType = compositeIndex ? "INDEX_SCAN" : "FULL_SCAN";

            if (scanType === "INDEX_SCAN") indexScanCount++;
            else fullScanCount++;

            queryLog.push({
                queryId,
                type,
                field: fields.join("+"),
                results,
                count: results.length,
                scanType
            });

        } else {
            return "Invalid Input";
        }
    }

    // --- STEP 6: ADVISOR (Problem-04) ---

    let advisorRecommendations = null;

    if (indexConfig.runAdvisor === true) {

        const usage = {};

        for (const q of indexConfig.queryHistory) {

            const freq = q.frequency;

            for (const field of Object.keys(q.filter)) {

                if (!usage[field]) usage[field] = { filterCount: 0, sortCount: 0, totalWeight: 0 };

                usage[field].filterCount += freq;
                usage[field].totalWeight += freq;
            }

            if (q.sortField) {

                if (!usage[q.sortField]) usage[q.sortField] = { filterCount: 0, sortCount: 0, totalWeight: 0 };

                usage[q.sortField].sortCount += freq;
                usage[q.sortField].totalWeight += freq;
            }
        }

        const recommendations = [];

        for (const field of Object.keys(usage)) {

            const u = usage[field];

            if (u.totalWeight < 3) continue;

            // Skip fields that already have an index built.

            if (indexes.has(field)) continue;

            const filtersAndSorts = u.filterCount > 0 && u.sortCount > 0;

            if (filtersAndSorts) {
                recommendations.push({
                    fields: [field],
                    indexType: "BTREE",
                    reason: "High usage for filtering and sorting",
                    priorityScore: u.totalWeight
                });
            } else {
                recommendations.push({
                    fields: [field],
                    indexType: "HASH",
                    reason: "High usage in equality filters",
                    priorityScore: u.totalWeight
                });
            }
        }

        recommendations.sort((a, b) => b.priorityScore - a.priorityScore);

        advisorRecommendations = recommendations;
    }

    // --- STEP 7: REPORT ---

    const report = {
        indexesBuild: indexConfig.indexesToBuild.length,
        queriesExecuted: queryLog.length,
        indexScanCount,
        fullScanCount,
        advisorRecommendations
    };

    return { orchestratorId, indexLog, queryLog, report };
}



// ------ EXAMPLE USAGE ------

console.log(runIndexOrchestrator({
    orchestratorId: "IDX-ORCH-01",
    collection: [
        { _id: "1", name: "Rahim", dept: "IT", salary: 70000 },
        { _id: "2", name: "Karim", dept: "HR", salary: 50000 },
        { _id: "3", name: "Nadia", dept: "IT", salary: 80000 },
        { _id: "4", name: "Sadia", dept: "HR", salary: 60000 }
    ],
    indexesToBuild: [
        { fieldName: "dept", indexType: "HASH", composite: false, compositeFields: null, unique: false, sparse: false },
        { fieldName: "salary", indexType: "BTREE", composite: false, compositeFields: null, unique: false, sparse: false }
    ],
    queries: [
        { queryId: "Q1", type: "EXACT", field: "dept", value: "IT", min: null, max: null, prefix: null, compositeQuery: null },
        { queryId: "Q2", type: "RANGE", field: "salary", value: null, min: 55000, max: 75000, prefix: null, compositeQuery: null },
        { queryId: "Q3", type: "EXACT", field: "name", value: "Rahim", min: null, max: null, prefix: null, compositeQuery: null }
    ],
    queryHistory: [
        { queryId: "Q1", filter: { dept: "IT" }, sortField: "salary", frequency: 10 },
        { queryId: "Q3", filter: { name: "Rahim" }, sortField: null, frequency: 7 }
    ],
    runAdvisor: true
}));


// --- INVALID ---
console.log(runIndexOrchestrator({}));