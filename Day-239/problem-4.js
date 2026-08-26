// 🧩 PROBLEM–04: runAnalyticsPipeline()

// Logic: Computes requested analytics metrics over a collection.

//   DISTRIBUTION — count occurrences of each unique field value
//   PERCENTILE   — p25/p50/p75/p90 (index = floor(pct/100 * len)) + min/max
//   TREND        — group by bucket start (floor(value/bucketSize)*bucketSize)
//   CORRELATION  — same-direction indicator between two numeric fields score = (sameDirCount / total) * 2 - 1 (2dp)

// Returns { analytics, totalDocuments }.


function runAnalyticsPipeline(collection, analyticsConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        !Array.isArray(collection) ||
        collection.length === 0 ||
        !collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc)) ||
        typeof analyticsConfig !== "object" ||
        analyticsConfig === null ||
        !Array.isArray(analyticsConfig.metrics) ||
        analyticsConfig.metrics.length === 0 ||
        typeof analyticsConfig.field !== "string"
    ) {
        return "Invalid Input";
    }

    const field = analyticsConfig.field;
    const secondField = analyticsConfig.secondField;
    const bucketSize = analyticsConfig.bucketSize;

    // --- STEP 2: METRIC COMPUTATIONS ---

    const analytics = [];

    for (const metric of analyticsConfig.metrics) {

        // DISTRIBUTION

        if (metric === "DISTRIBUTION") {

            const counts = {};

            for (const doc of collection) {
                const v = doc[field];
                counts[v] = (counts[v] || 0) + 1;
            }

            // Sort keys ascending (numeric) for deterministic output.

            const sortedKeys = Object.keys(counts).sort((a, b) => Number(a) - Number(b));

            const distribution = {};
            for (const k of sortedKeys) distribution[k] = counts[k];

            const maxCount = Math.max(...sortedKeys.map(k => counts[k]));
            const minCount = Math.min(...sortedKeys.map(k => counts[k]));

            const mostCommon = sortedKeys.find(k => counts[k] === maxCount);
            const leastCommon = sortedKeys.find(k => counts[k] === minCount);

            analytics.push({ metric: "DISTRIBUTION", field, distribution, mostCommon, leastCommon });
        }

        // PERCENTILE

        else if (metric === "PERCENTILE") {

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
        }

        // TREND

        else if (metric === "TREND") {

            const buckets = {};

            for (const doc of collection) {
                const bucket = Math.floor(doc[field] / bucketSize) * bucketSize;
                buckets[bucket] = (buckets[bucket] || 0) + 1;
            }

            const bucketList = Object.keys(buckets)
                .map(k => ({ bucket: Number(k), count: buckets[k] }))
                .sort((a, b) => a.bucket - b.bucket);

            analytics.push({ metric: "TREND", field, bucketSize, buckets: bucketList });
        }

        // CORRELATION

        else if (metric === "CORRELATION") {

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

    return { analytics, totalDocuments: collection.length };
}



// ------ EXAMPLE USAGE ------

console.log(runAnalyticsPipeline([
    { _id: "1", dept: "IT", salary: 70000, experience: 5 },
    { _id: "2", dept: "HR", salary: 50000, experience: 3 },
    { _id: "3", dept: "IT", salary: 80000, experience: 7 },
    { _id: "4", dept: "HR", salary: 60000, experience: 4 },
    { _id: "5", dept: "IT", salary: 90000, experience: 9 },
    { _id: "6", dept: "IT", salary: 55000, experience: 2 }
], {
    metrics: ["DISTRIBUTION", "PERCENTILE", "CORRELATION"],
    field: "salary",
    secondField: "experience",
    bucketSize: null
}));


// --- INVALID ---
console.log(runAnalyticsPipeline([], { metrics: ["DISTRIBUTION"], field: "salary" }));