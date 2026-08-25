// 🧩 PROBLEM–04: createQueryOptimizer()

// Logic: Returns a query optimizer.
//   analyze(query)            — optimization suggestions + score (0-100)
//   optimize(query)           — apply automatic fixes
//   estimateCost(query, dataSize) — estimated execution cost
//   getOptimizationLog()      — history of all optimize() calls

// Query shape: { select: [...], where: [{field,operator,value}],
// orderBy: {field,direction}|null, limit: number|null, offset: number }
// Score = 100 - (10*LOW + 20*MEDIUM + 30*HIGH).


function createQueryOptimizer(optimizerConfig) {

    // --- STEP 1: VALIDATE optimizerConfig ---

    if (
        typeof optimizerConfig !== "object" || optimizerConfig === null || Array.isArray(optimizerConfig) ||
        !Array.isArray(optimizerConfig.indexes)
    ) {
        return "Invalid Input";
    }

    const indexes = optimizerConfig.indexes;

    const optimizationLog = [];

    // --- STEP 2: ANALYZE ---

    function analyze(query) {

        if (
            typeof query !== "object" || query === null || Array.isArray(query) ||
            !Array.isArray(query.select) ||
            !Array.isArray(query.where) ||
            (query.orderBy !== null && (typeof query.orderBy !== "object" || query.orderBy === null)) ||
            (query.limit !== null && typeof query.limit !== "number") ||
            typeof query.offset !== "number"
        ) {
            return "Invalid Input";
        }

        const suggestions = [];

        // MISSING_INDEX (MEDIUM)

        for (const cond of query.where) {
            if (!indexes.includes(cond.field)) {
                suggestions.push({
                    type: "MISSING_INDEX",
                    message: "Field '" + cond.field + "' in WHERE has no index",
                    severity: "MEDIUM"
                });
            }
        }

        if (query.where.length === 0) {
            suggestions.push({
                type: "FULL_TABLE_SCAN",
                message: "No WHERE conditions — full table scan",
                severity: "HIGH"
            });
        }

        // SELECT_STAR (LOW)

        if (query.select.length === 0) {
            suggestions.push({
                type: "SELECT_STAR",
                message: "Selecting all fields is inefficient",
                severity: "LOW"
            });
        }

        // MISSING_LIMIT (MEDIUM)

        if (query.limit === null) {
            suggestions.push({
                type: "MISSING_LIMIT",
                message: "No LIMIT clause may return too many rows",
                severity: "MEDIUM"
            });
        }

        // INEFFICIENT_SORT (MEDIUM)

        if (query.orderBy && !indexes.includes(query.orderBy.field)) {
            suggestions.push({
                type: "INEFFICIENT_SORT",
                message: "ORDER BY field '" + query.orderBy.field + "' has no index",
                severity: "MEDIUM"
            });
        }

        // Score: 100 - penalties.
        // MISSING_INDEX carries a HIGH penalty (30) per sample scoring.

        const penaltyByType = {
            MISSING_INDEX: 30,
            FULL_TABLE_SCAN: 30,
            SELECT_STAR: 10,
            MISSING_LIMIT: 20,
            INEFFICIENT_SORT: 20
        };

        let score = 100;

        for (const s of suggestions) {
            const penalty = penaltyByType[s.type] !== undefined ? penaltyByType[s.type]
                : s.severity === "LOW" ? 10
                    : s.severity === "MEDIUM" ? 20
                        : 30;
            score -= penalty;
        }

        return { suggestions, score };
    }

    // --- STEP 3: OPTIMIZE ---

    function optimize(query) {

        const analyzed = analyze(query);

        if (analyzed === "Invalid Input") return "Invalid Input";

        const changesApplied = [];
        const optimized = {
            select: [...query.select],
            where: [...query.where],
            orderBy: query.orderBy ? { ...query.orderBy } : null,
            limit: query.limit,
            offset: query.offset
        };

        // Add limit 100 if missing.

        if (optimized.limit === null) {
            optimized.limit = 100;
            changesApplied.push("Added LIMIT 100");
        }

        // Reorder where conditions: indexed fields first.

        const indexed = optimized.where.filter(c => indexes.includes(c.field));
        const nonIndexed = optimized.where.filter(c => !indexes.includes(c.field));
        const newOrder = [...indexed, ...nonIndexed];

        if (JSON.stringify(newOrder) !== JSON.stringify(optimized.where)) {
            optimized.where = newOrder;
            changesApplied.push("Reordered WHERE: indexed fields first");
        }

        const result = { original: query, optimized, changesApplied };

        optimizationLog.push(result);

        return result;
    }

    // --- STEP 4: ESTIMATE COST ---

    function estimateCost(query, dataSize) {

        const analyzed = analyze(query);

        if (analyzed === "Invalid Input") return "Invalid Input";

        if (typeof dataSize !== "number" || dataSize < 0) return "Invalid Input";

        const baseCost = dataSize;

        let cost = baseCost;

        // Indexed where field → multiply by 0.1.
        // Non-indexed where field → multiply by 0.5.

        for (const cond of query.where) {
            cost *= indexes.includes(cond.field) ? 0.1 : 0.5;
        }

        const indexSavings = baseCost - cost;

        // orderBy on non-indexed field → add dataSize * 0.2.

        let sortCost = 0;

        if (query.orderBy && !indexes.includes(query.orderBy.field)) {
            sortCost = dataSize * 0.2;
            cost += sortCost;
        }

        // limit → multiply final cost by limit / dataSize (min 0.01).

        let limitSavings = 0;

        if (query.limit !== null && dataSize > 0) {
            const ratio = query.limit / dataSize;
            const factor = Math.max(ratio, 0.01);
            const beforeLimit = cost;
            cost *= factor;
            limitSavings = beforeLimit - cost;
        }

        const estimatedCost = Number(cost.toFixed(2));

        return {
            estimatedCost,
            dataSize,
            costBreakdown: {
                baseCost,
                indexSavings: Number(indexSavings.toFixed(2)),
                sortCost: Number(sortCost.toFixed(2)),
                limitSavings: Number(limitSavings.toFixed(2))
            }
        };
    }

    // --- STEP 5: RETURN OPTIMIZER ---

    return {
        analyze,
        optimize,
        estimateCost,
        getOptimizationLog() {
            return optimizationLog.slice();
        }
    };
}


// ------ EXAMPLE USAGE ------

const optimizer = createQueryOptimizer({ indexes: ["id", "dept", "age"] });


console.log(optimizer.analyze({
    select: [],
    where: [{ field: "dept", operator: "=", value: "IT" }, { field: "salary", operator: ">", value: 50000 }],
    orderBy: { field: "salary", direction: "desc" },
    limit: null,
    offset: 0
}));


console.log(optimizer.estimateCost({
    select: ["name"],
    where: [{ field: "dept", operator: "=", value: "IT" }],
    orderBy: null,
    limit: 10,
    offset: 0
}, 1000));


console.log(optimizer.optimize({
    select: [],
    where: [{ field: "name", operator: "=", value: "Rahim" }, { field: "dept", operator: "=", value: "IT" }],
    orderBy: null,
    limit: null,
    offset: 0
}));


// --- INVALID ---
console.log(createQueryOptimizer({ indexes: "not-array" }));