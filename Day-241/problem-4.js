// 🧩 PROBLEM–04: createIndexAdvisor()

// Logic: Analyzes query history to recommend indexes and estimate impact.

//   analyzeQueries   — field usage weighted by frequency (filter + sort)
//   recommendIndexes — fields with totalWeight >= 3 get a recommendation;
//                      filter+sort → BTREE, filter-only → HASH,
//                      priorityScore = totalWeight, sorted desc
//   simulateImpact   — % queries benefited + estimated scan reduction
//   getCoverageReport — which queries are covered by built indexes


function createIndexAdvisor(advisorConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof advisorConfig !== "object" ||
        advisorConfig === null ||
        Array.isArray(advisorConfig) ||
        !Array.isArray(advisorConfig.collection) ||
        advisorConfig.collection.length === 0 ||
        !advisorConfig.collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc)) ||
        !Array.isArray(advisorConfig.queryHistory) ||
        advisorConfig.queryHistory.length === 0
    ) {
        return "Invalid Input";
    }

    const collection = advisorConfig.collection;
    const queryHistory = advisorConfig.queryHistory;

    // Built indexes (start empty; added by simulateImpact? No — tracked separately).

    const builtIndexes = new Set();

    // --- STEP 2: FIELD USAGE ANALYSIS ---

    function analyzeQueries() {

        const fieldUsage = {};

        for (const q of queryHistory) {

            const freq = q.frequency;

            for (const field of Object.keys(q.filter)) {

                if (!fieldUsage[field]) {
                    fieldUsage[field] = { filterCount: 0, sortCount: 0, totalWeight: 0 };
                }

                fieldUsage[field].filterCount += freq;
                fieldUsage[field].totalWeight += freq;
            }

            if (q.sortField) {

                if (!fieldUsage[q.sortField]) {
                    fieldUsage[q.sortField] = { filterCount: 0, sortCount: 0, totalWeight: 0 };
                }

                fieldUsage[q.sortField].sortCount += freq;
                fieldUsage[q.sortField].totalWeight += freq;
            }
        }

        const fields = Object.keys(fieldUsage);

        let mostUsedField = fields[0] || null;
        let leastUsedField = fields[0] || null;

        for (const f of fields) {
            if (fieldUsage[f].totalWeight > fieldUsage[mostUsedField].totalWeight) mostUsedField = f;
            if (fieldUsage[f].totalWeight < fieldUsage[leastUsedField].totalWeight) leastUsedField = f;
        }

        return { fieldUsage, mostUsedField, leastUsedField };
    }

    // --- STEP 3: RECOMMEND INDEXES ---

    function recommendIndexes() {

        const usage = analyzeQueries();

        const recommendations = [];

        for (const field of Object.keys(usage.fieldUsage)) {

            const u = usage.fieldUsage[field];

            if (u.totalWeight < 3) continue;

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
                    reason: u.totalWeight >= 10
                        ? "High usage in equality filters"
                        : "Moderate usage in equality filters",
                    priorityScore: u.totalWeight
                });
            }
        }

        recommendations.sort((a, b) => b.priorityScore - a.priorityScore);

        return { recommendations };
    }

    // --- STEP 4: SIMULATE IMPACT ---

    function simulateImpact(fieldName, indexType) {

        if (typeof fieldName !== "string" || fieldName.length === 0) return "Invalid Input";

        if (indexType !== "HASH" && indexType !== "BTREE") return "Invalid Input";

        let queriesBenefited = 0;

        for (const q of queryHistory) {

            if (fieldName in q.filter) queriesBenefited++;

            if (q.sortField === fieldName) queriesBenefited++;
        }

        const reduction = indexType === "HASH" ? 99 : 90;

        const currentAvgCost = collection.length;

        const projectedAvgCost = Math.max(1, Math.round(currentAvgCost * (1 - reduction / 100)));

        return {
            fieldName,
            indexType,
            queriesBenefited,
            estimatedScanReduction: reduction + "%",
            currentAvgCost,
            projectedAvgCost
        };
    }

    // --- STEP 5: COVERAGE REPORT ---

    function getCoverageReport() {

        const queries = [];

        let fullyCovered = 0;
        let partiallyCovered = 0;
        let uncovered = 0;

        for (const q of queryHistory) {

            const filterFields = Object.keys(q.filter);

            const indexedFields = filterFields.filter(f => builtIndexes.has(f));

            const covered = indexedFields.length === filterFields.length && filterFields.length > 0;
            const partial = indexedFields.length > 0 && !covered;

            const missingIndexes = filterFields.filter(f => !builtIndexes.has(f));

            if (covered) fullyCovered++;
            else if (partial) partiallyCovered++;
            else uncovered++;

            queries.push({ queryId: q.queryId, covered, partial, missingIndexes });
        }

        return {
            totalQueries: queryHistory.length,
            fullyCovered,
            partiallyCovered,
            uncovered,
            queries
        };
    }

    // --- STEP 6: PUBLIC API ---

    return {
        analyzeQueries,
        recommendIndexes,
        simulateImpact,
        getCoverageReport,
        _addIndex(fieldName) {
            if (typeof fieldName === "string") builtIndexes.add(fieldName);
        }
    };
}



// ------ EXAMPLE USAGE ------

const advisor = createIndexAdvisor({
    collection: [
        { _id: "1", dept: "IT", salary: 70000, active: true },
        { _id: "2", dept: "HR", salary: 50000, active: false },
        { _id: "3", dept: "IT", salary: 80000, active: true }
    ],
    queryHistory: [
        { queryId: "Q1", filter: { dept: "IT" }, sortField: "salary", frequency: 10 },
        { queryId: "Q2", filter: { dept: "HR", active: true }, sortField: null, frequency: 5 },
        { queryId: "Q3", filter: { salary: { $gt: 60000 } }, sortField: "salary", frequency: 8 },
        { queryId: "Q4", filter: { active: true }, sortField: null, frequency: 3 }
    ]
});


console.log(advisor.analyzeQueries());

console.log(advisor.recommendIndexes());

console.log(advisor.simulateImpact("dept", "HASH"));

console.log(advisor.getCoverageReport());


// --- INVALID ---
console.log(createIndexAdvisor({ collection: [], queryHistory: [] }));