// 🧩 PROBLEM–05: runAggregationOrchestrator()

// Logic: Composes Problems 01–04 as an orchestration engine.

// Each pipeline runs independently on the ORIGINAL collection.

//   BASIC    → runBasicAggregation     (config.pipeline)
//   GROUP    → runGroupAggregation     (config.groupConfig)
//   ADVANCED → runAdvancedAggregation  (config.pipeline)
//   ANALYTICS→ runAnalyticsPipeline    (config.analyticsConfig)

// Builds cross-pipeline summary with totalPipelines, totalDocumentsProcessed
// (sum of first-stage input counts), pipelineTypeBreakdown, largestResultSet.


function runAggregationOrchestrator(orchestratorConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof orchestratorConfig !== "object" ||
        orchestratorConfig === null ||
        typeof orchestratorConfig.orchestratorId !== "string" ||
        orchestratorConfig.orchestratorId.length === 0 ||
        !Array.isArray(orchestratorConfig.collection) ||
        orchestratorConfig.collection.length === 0 ||
        !orchestratorConfig.collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc)) ||
        !Array.isArray(orchestratorConfig.pipelines) ||
        orchestratorConfig.pipelines.length === 0
    ) {
        return "Invalid Input";
    }

    const collection = orchestratorConfig.collection;

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

        if (typeof expr === "object" && expr !== null && "$multiply" in expr) {
            return expr.$multiply.reduce((acc, item) => {
                const v = typeof item === "string" && item.startsWith("$") ? doc[item.slice(1)] : item;
                return acc * v;
            }, 1);
        }

        if (typeof expr === "object" && expr !== null && "$concat" in expr) {
            return expr.$concat.map(item =>
                typeof item === "string" && item.startsWith("$") ? doc[item.slice(1)] : item
            ).join("");
        }

        if (typeof expr === "object" && expr !== null && "$toUpper" in expr) {
            const f = expr.$toUpper;
            return String(typeof f === "string" && f.startsWith("$") ? doc[f.slice(1)] : f).toUpperCase();
        }

        if (typeof expr === "object" && expr !== null && "$toLower" in expr) {
            const f = expr.$toLower;
            return String(typeof f === "string" && f.startsWith("$") ? doc[f.slice(1)] : f).toLowerCase();
        }

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

    // --- STEP 5: PIPELINE EXECUTOR (Problem-01 + Problem-03 stages) ---

    function runPipeline(collection, pipeline) {

        let current = collection.map(doc => ({ ...doc }));

        const stagesExecuted = [];
        let totalStages = 0;

        for (const stage of pipeline) {

            const inputCount = current.length;
            const stageKey = Object.keys(stage)[0];

            if (stage.$match !== undefined) {
                current = current.filter(doc => matches(doc, stage.$match));
            } else if (stage.$project !== undefined) {

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
            } else if (stage.$sort !== undefined) {

                const field = Object.keys(stage.$sort)[0];
                const dir = stage.$sort[field];

                current = [...current].sort((a, b) => {
                    if (a[field] < b[field]) return -1 * dir;
                    if (a[field] > b[field]) return 1 * dir;
                    return 0;
                });
            } else if (stage.$limit !== undefined) {
                current = current.slice(0, stage.$limit);
            } else if (stage.$skip !== undefined) {
                current = current.slice(stage.$skip);
            } else if (stage.$count !== undefined) {
                current = [{ [stage.$count]: current.length }];
            } else if (stage.$unwind !== undefined) {

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
            } else if (stage.$addFields !== undefined) {

                current = current.map(doc => {
                    const out = { ...doc };
                    for (const newField of Object.keys(stage.$addFields)) {
                        out[newField] = evalExpr(stage.$addFields[newField], doc);
                    }
                    return out;
                });
            } else if (stage.$group !== undefined) {
                current = groupStage(stage.$group, current);
            } else if (stage.$replaceRoot !== undefined) {

                const newRoot = stage.$replaceRoot.newRoot;
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

    // --- STEP 6: GROUP AGGREGATOR (Problem-02) ---

    function runGroup(collection, groupConfig) {

        const result = groupStage(groupConfig, collection);

        return { result, groupCount: result.length };
    }

    // --- STEP 7: ANALYTICS (Problem-04) ---

    function runAnalytics(collection, analyticsConfig) {

        const field = analyticsConfig.field;
        const secondField = analyticsConfig.secondField;
        const bucketSize = analyticsConfig.bucketSize;

        const analytics = [];

        for (const metric of analyticsConfig.metrics) {

            if (metric === "DISTRIBUTION") {

                const counts = {};

                for (const doc of collection) {
                    const v = doc[field];
                    counts[v] = (counts[v] || 0) + 1;
                }

                const sortedKeys = Object.keys(counts).sort((a, b) => Number(a) - Number(b));

                const distribution = {};
                for (const k of sortedKeys) distribution[k] = counts[k];

                const maxCount = Math.max(...sortedKeys.map(k => counts[k]));
                const minCount = Math.min(...sortedKeys.map(k => counts[k]));

                const mostCommon = sortedKeys.find(k => counts[k] === maxCount);
                const leastCommon = sortedKeys.find(k => counts[k] === minCount);

                analytics.push({ metric: "DISTRIBUTION", field, distribution, mostCommon, leastCommon });
            } else if (metric === "PERCENTILE") {

                const values = collection
                    .map(doc => doc[field])
                    .filter(v => typeof v === "number")
                    .sort((a, b) => a - b);

                const n = values.length;

                function pct(p) {
                    const index = Math.floor((p / 100) * n);
                    return values[index];
                }

                analytics.push({
                    metric: "PERCENTILE",
                    field,
                    p25: pct(25),
                    p50: pct(50),
                    p75: pct(75),
                    p90: pct(90),
                    min: values[0],
                    max: values[n - 1]
                });
            } else if (metric === "TREND") {

                const buckets = {};

                for (const doc of collection) {
                    const bucket = Math.floor(doc[field] / bucketSize) * bucketSize;
                    buckets[bucket] = (buckets[bucket] || 0) + 1;
                }

                const bucketList = Object.keys(buckets)
                    .map(k => ({ bucket: Number(k), count: buckets[k] }))
                    .sort((a, b) => a.bucket - b.bucket);

                analytics.push({ metric: "TREND", field, bucketSize, buckets: bucketList });
            } else if (metric === "CORRELATION") {

                const avgField = collection.reduce((s, d) => s + d[field], 0) / collection.length;
                const avgSecond = collection.reduce((s, d) => s + d[secondField], 0) / collection.length;

                let sameDirCount = 0;

                for (const doc of collection) {
                    const above = doc[field] > avgField && doc[secondField] > avgSecond;
                    const below = doc[field] < avgField && doc[secondField] < avgSecond;
                    if (above || below) sameDirCount++;
                }

                const score = Number(((sameDirCount / collection.length) * 2 - 1).toFixed(2));

                const direction = score > 0.3 ? "POSITIVE"
                    : score < -0.3 ? "NEGATIVE"
                        : "WEAK";

                analytics.push({ metric: "CORRELATION", field, secondField, correlationScore: score, direction });
            }
        }

        return { result: { analytics, totalDocuments: collection.length }, stagesExecuted: null };
    }

    // --- STEP 8: ORCHESTRATE PIPELINES ---

    const pipelineResults = [];
    let totalDocuments = 0;
    let largestSize = -1;
    let largestId = null;

    const breakdown = { BASIC: 0, GROUP: 0, ADVANCED: 0, ANALYTICS: 0 };

    for (const p of orchestratorConfig.pipelines) {

        const { pipelineId, type, config } = p;

        if (typeof pipelineId !== "string" || pipelineId.length === 0) return "Invalid Input";

        let entry;

        if (type === "BASIC") {
            const r = runPipeline(collection, config.pipeline);
            entry = { pipelineId, type, result: r.result, stagesExecuted: r.stagesExecuted };
            totalDocuments += r.stagesExecuted[0].inputCount;
        } else if (type === "GROUP") {
            const r = runGroup(collection, config.groupConfig);
            entry = { pipelineId, type, result: r.result, groupCount: r.groupCount };
            totalDocuments += collection.length;
        } else if (type === "ADVANCED") {
            const r = runPipeline(collection, config.pipeline);
            entry = { pipelineId, type, result: r.result, stagesExecuted: r.stagesExecuted };
            totalDocuments += r.stagesExecuted[0].inputCount;
        } else if (type === "ANALYTICS") {
            const r = runAnalytics(collection, config.analyticsConfig);
            entry = { pipelineId, type, result: r.result, stagesExecuted: r.stagesExecuted };
            totalDocuments += collection.length;
        } else {
            return "Invalid Input";
        }

        breakdown[type]++;

        const size = Array.isArray(entry.result) ? entry.result.length : entry.result.analytics.length;

        if (size > largestSize) {
            largestSize = size;
            largestId = pipelineId;
        }

        pipelineResults.push(entry);
    }

    const summary = {
        totalPipelines: pipelineResults.length,
        totalDocumentsProcessed: totalDocuments,
        pipelineTypeBreakdown: breakdown,
        largestResultSet: largestId
    };

    return { orchestratorId: orchestratorConfig.orchestratorId, pipelineResults, summary };
}



// ------ EXAMPLE USAGE ------

console.log(runAggregationOrchestrator({
    orchestratorId: "AGG-ORCH-01",
    collection: [
        { _id: "1", name: "Rahim", dept: "IT", salary: 70000, active: true },
        { _id: "2", name: "Karim", dept: "HR", salary: 50000, active: false },
        { _id: "3", name: "Nadia", dept: "IT", salary: 80000, active: true },
        { _id: "4", name: "Sadia", dept: "HR", salary: 60000, active: true }
    ],
    pipelines: [
        {
            pipelineId: "P1",
            type: "BASIC",
            config: {
                pipeline: [
                    { $match: { active: true } },
                    { $sort: { salary: -1 } },
                    { $project: { name: 1, salary: 1, _id: 0 } }
                ]
            }
        },
        {
            pipelineId: "P2",
            type: "GROUP",
            config: {
                groupConfig: {
                    _id: "dept",
                    accumulators: {
                        count: { operator: "$count", field: null },
                        avgSalary: { operator: "$avg", field: "salary" }
                    }
                }
            }
        },
        {
            pipelineId: "P3",
            type: "ANALYTICS",
            config: {
                analyticsConfig: {
                    metrics: ["DISTRIBUTION", "PERCENTILE"],
                    field: "salary",
                    secondField: null,
                    bucketSize: null
                }
            }
        }
    ]
}));


// --- INVALID ---
console.log(runAggregationOrchestrator({ orchestratorId: "", collection: [], pipelines: [] }));