// 🧩 PROBLEM–05: runQueryEngine()

// Logic: Executes a complete query pipeline by applying composite filters, sorting, pagination, and field projection similar to a REST API query engine.

function runQueryEngine(dataset, query) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(dataset) ||
        dataset.length === 0 ||
        !dataset.every(
            record =>
                typeof record === "object" &&
                record !== null &&
                !Array.isArray(record)
        ) ||
        typeof query !== "object" ||
        query === null ||
        Array.isArray(query)
    ) {
        return "Invalid Input";
    }

    const {
        filters,
        sortBy = null,
        sortOrder = "asc",
        page = 1,
        limit = 10,
        fields = null
    } = query;

    if (
        (sortOrder !== "asc" && sortOrder !== "desc") ||
        typeof page !== "number" ||
        page < 1 ||
        typeof limit !== "number" ||
        limit < 1 ||
        limit > 100 ||
        (fields !== null &&
            (!Array.isArray(fields) ||
                !fields.every(field => typeof field === "string")))
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: APPLY FILTERS ---
    let filteredData = [...dataset];
    const appliedFilters = [];

    if (filters && typeof filters === "object") {

        const {
            exactMatch = null,
            ranges = null,
            search = null,
            operator = "AND"
        } = filters;

        if (operator !== "AND" && operator !== "OR") {
            return "Invalid Input";
        }

        const filterResults = [];

        // Exact Match
        if (exactMatch) {
            appliedFilters.push("exactMatch");

            filterResults.push(
                dataset.filter(record =>
                    Object.entries(exactMatch).every(
                        ([key, value]) => record[key] === value
                    )
                )
            );
        }

        // Range Filter
        if (ranges) {
            appliedFilters.push("ranges");

            filterResults.push(
                dataset.filter(record =>
                    Object.entries(ranges).every(([key, range]) => {

                        if (!(key in record)) return false;

                        if (
                            typeof range !== "object" ||
                            range === null
                        ) {
                            return false;
                        }

                        const { min = null, max = null } = range;

                        if (
                            min !== null &&
                            record[key] < min
                        ) {
                            return false;
                        }

                        if (
                            max !== null &&
                            record[key] > max
                        ) {
                            return false;
                        }

                        return true;
                    })
                )
            );
        }

        // Search Filter
        if (search) {

            const {
                query: keyword,
                searchFields,
                caseSensitive = false
            } = search;

            if (
                typeof keyword !== "string" ||
                keyword.length === 0 ||
                !Array.isArray(searchFields)
            ) {
                return "Invalid Input";
            }

            appliedFilters.push("search");

            filterResults.push(
                dataset.filter(record =>
                    searchFields.some(field => {

                        if (typeof record[field] !== "string") {
                            return false;
                        }

                        const value = caseSensitive
                            ? record[field]
                            : record[field].toLowerCase();

                        const target = caseSensitive
                            ? keyword
                            : keyword.toLowerCase();

                        return value.includes(target);
                    })
                )
            );
        }

        if (filterResults.length > 0) {

            if (operator === "AND") {

                filteredData = dataset.filter(record =>
                    filterResults.every(result =>
                        result.includes(record)
                    )
                );

            } else {

                filteredData = [
                    ...new Set(filterResults.flat())
                ];

            }

        }
    }

    // --- STEP 3: SORT ---
    if (sortBy) {

        filteredData.sort((a, b) => {

            if (a[sortBy] === b[sortBy]) return 0;

            if (sortOrder === "asc") {
                return a[sortBy] > b[sortBy] ? 1 : -1;
            }

            return a[sortBy] < b[sortBy] ? 1 : -1;

        });

    }

    // --- STEP 4: PAGINATION ---
    const totalMatches = filteredData.length;
    const totalPages = Math.ceil(totalMatches / limit);

    const startIndex = (page - 1) * limit;
    const paginatedData = filteredData.slice(
        startIndex,
        startIndex + limit
    );

    // --- STEP 5: FIELD PROJECTION ---
    const finalData =
        fields === null
            ? paginatedData
            : paginatedData.map(record => {

                const projected = {};

                fields.forEach(field => {
                    if (field in record) {
                        projected[field] = record[field];
                    }
                });

                return projected;

            });

    // --- STEP 6: RETURN RESULT ---
    return {
        data: finalData,
        pagination: {
            page,
            limit,
            totalMatches,
            totalPages
        },
        appliedFilters
    };

}

// --- EXAMPLE USAGE ---
console.log(
    runQueryEngine(
        [
            { id: "P1", category: "TECH", price: 1200, title: "JS Book" },
            { id: "P2", category: "TECH", price: 800, title: "CSS Book" },
            { id: "P3", category: "DESIGN", price: 950, title: "Design Guide" }
        ],
        {
            filters: {
                exactMatch: {
                    category: "TECH"
                },
                ranges: null,
                search: null,
                operator: "AND"
            },
            sortBy: "price",
            sortOrder: "asc",
            page: 1,
            limit: 10,
            fields: ["id", "title", "price"]
        }
    )
);