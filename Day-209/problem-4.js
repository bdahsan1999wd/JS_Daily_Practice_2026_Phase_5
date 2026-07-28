// 🧩 PROBLEM–04: applyCompositeFilter()

// Logic: Applies multiple filter types (Exact Match, Range Filter, and Search) using either AND or OR composition to produce the final filtered result.

function applyCompositeFilter(records, filterConfig) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(records) ||
        records.length === 0 ||
        !records.every(record =>
            typeof record === "object" &&
            record !== null &&
            !Array.isArray(record)
        ) ||
        typeof filterConfig !== "object" ||
        filterConfig === null ||
        !["AND", "OR"].includes(filterConfig.operator)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: EXTRACT FILTERS ---
    const {
        exactMatch,
        ranges,
        search,
        operator
    } = filterConfig;

    const appliedFilters = [];

    // --- STEP 3: APPLY FILTERS ---
    const results = records.filter(record => {

        const conditions = [];

        // Exact Match
        if (exactMatch !== null) {

            appliedFilters.push("exactMatch");

            conditions.push(
                Object.entries(exactMatch).every(([key, value]) =>
                    key in record && record[key] === value
                )
            );

        }

        // Range Filter
        if (ranges !== null) {

            appliedFilters.push("ranges");

            conditions.push(
                Object.entries(ranges).every(([field, range]) => {

                    if (!(field in record)) {
                        return false;
                    }

                    const value = record[field];

                    if (typeof value !== "number") {
                        return false;
                    }

                    if (range.min !== null && value < range.min) {
                        return false;
                    }

                    if (range.max !== null && value > range.max) {
                        return false;
                    }

                    return true;

                })
            );

        }

        // Search Filter
        if (search !== null) {

            appliedFilters.push("search");

            const query = search.caseSensitive
                ? search.query
                : search.query.toLowerCase();

            conditions.push(

                search.searchFields.some(field => {

                    if (
                        !(field in record) ||
                        typeof record[field] !== "string"
                    ) {
                        return false;
                    }

                    const value = search.caseSensitive
                        ? record[field]
                        : record[field].toLowerCase();

                    return value.includes(query);

                })

            );

        }

        return operator === "AND"
            ? conditions.every(Boolean)
            : conditions.some(Boolean);

    });

    // --- STEP 4: RETURN RESULT ---
    return {
        results,
        totalResults: results.length,
        appliedFilters: [...new Set(appliedFilters)]
    };

}

// --- EXAMPLE USAGE ---
console.log(
    applyCompositeFilter(
        [
            {
                id: "E1",
                department: "IT",
                salary: 70000,
                name: "Rahim Dev"
            },
            {
                id: "E2",
                department: "HR",
                salary: 45000,
                name: "Karim Manager"
            },
            {
                id: "E3",
                department: "IT",
                salary: 40000,
                name: "Nadia Dev"
            }
        ],
        {
            exactMatch: {
                department: "IT"
            },
            ranges: {
                salary: {
                    min: 60000,
                    max: null
                }
            },
            search: null,
            operator: "AND"
        }
    )
);