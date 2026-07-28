// 🧩 PROBLEM–03: searchRecords()

// Logic: Performs a full-text search across specified fields. Records are ranked by matchScore and returned in descending order of relevance.

function searchRecords(records, searchConfig) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(records) ||
        records.length === 0 ||
        !records.every(record =>
            typeof record === "object" &&
            record !== null &&
            !Array.isArray(record)
        ) ||
        typeof searchConfig !== "object" ||
        searchConfig === null ||
        Array.isArray(searchConfig) ||
        typeof searchConfig.query !== "string" ||
        searchConfig.query.trim() === "" ||
        !Array.isArray(searchConfig.searchFields) ||
        searchConfig.searchFields.length === 0 ||
        !searchConfig.searchFields.every(field => typeof field === "string")
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: PREPARE SEARCH ---
    const {
        query,
        searchFields,
        caseSensitive = false
    } = searchConfig;

    const searchQuery = caseSensitive
        ? query
        : query.toLowerCase();

    const results = [];

    // --- STEP 3: SEARCH RECORDS ---
    for (const record of records) {

        let matchScore = 0;

        for (const field of searchFields) {

            if (
                !(field in record) ||
                typeof record[field] !== "string"
            ) {
                continue;
            }

            const fieldValue = caseSensitive
                ? record[field]
                : record[field].toLowerCase();

            if (fieldValue.includes(searchQuery)) {
                matchScore++;
            }

        }

        if (matchScore > 0) {

            results.push({
                record,
                matchScore
            });

        }

    }

    // --- STEP 4: SORT RESULTS ---
    results.sort((a, b) => b.matchScore - a.matchScore);

    // --- STEP 5: RETURN RESULT ---
    return {
        results,
        totalMatches: results.length
    };

}

// --- EXAMPLE USAGE ---
console.log(
    searchRecords(
        [
            {
                id: "P1",
                name: "JavaScript Guide",
                description: "Learn JavaScript basics"
            },
            {
                id: "P2",
                name: "Python Tutorial",
                description: "JavaScript vs Python"
            },
            {
                id: "P3",
                name: "Java Cookbook",
                description: "Advanced Java recipes"
            }
        ],
        {
            query: "javascript",
            searchFields: [
                "name",
                "description"
            ],
            caseSensitive: false
        }
    )
);