// 🧩 PROBLEM–04: buildPaginatedResponse()

// Logic: Builds a paginated API response. Optionally sorts the data before applying pagination and returns pagination metadata along with the paged result.

function buildPaginatedResponse(allData, queryParams) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(allData) ||
        allData.length === 0 ||
        typeof queryParams !== "object" ||
        queryParams === null ||
        Array.isArray(queryParams)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: EXTRACT QUERY PARAMETERS ---
    const page = queryParams.page ?? 1;
    const limit = queryParams.limit ?? 10;
    const sortBy = queryParams.sortBy ?? null;
    const sortOrder = queryParams.sortOrder ?? "asc";

    if (
        typeof page !== "number" ||
        page < 1 ||
        typeof limit !== "number" ||
        limit < 1 ||
        limit > 100 ||
        !["asc", "desc"].includes(sortOrder)
    ) {
        return "Invalid Input";
    }

    // --- STEP 3: SORT DATA ---
    const sortedData = [...allData];

    if (
        sortBy &&
        sortedData.every(item =>
            typeof item === "object" &&
            item !== null
        )
    ) {

        sortedData.sort((a, b) => {

            if (a[sortBy] < b[sortBy]) {
                return sortOrder === "asc" ? -1 : 1;
            }

            if (a[sortBy] > b[sortBy]) {
                return sortOrder === "asc" ? 1 : -1;
            }

            return 0;

        });

    }

    // --- STEP 4: PAGINATE DATA ---
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const pagedData = sortedData.slice(startIndex, endIndex);

    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / limit);

    // --- STEP 5: RETURN RESULT ---
    return {
        data: pagedData,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };

}

// --- EXAMPLE USAGE ---
console.log(
    buildPaginatedResponse(
        [
            { name: "C", score: 70 },
            { name: "A", score: 90 },
            { name: "B", score: 80 }
        ],
        {
            page: 1,
            limit: 2,
            sortBy: "score",
            sortOrder: "desc"
        }
    )
);