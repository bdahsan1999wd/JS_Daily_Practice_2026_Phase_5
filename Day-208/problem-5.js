// 🧩 PROBLEM–05: buildAPIResponsePipeline()

// Logic: Orchestrates the complete REST API response pipeline. It transforms raw records, applies sorting & pagination, then wraps the result inside a standardized success response.

function buildAPIResponsePipeline(rawRecords, requestConfig) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(rawRecords) ||
        rawRecords.length === 0 ||
        typeof requestConfig !== "object" ||
        requestConfig === null ||
        ![200, 201].includes(requestConfig.statusCode) ||
        typeof requestConfig.fieldMap !== "object" ||
        requestConfig.fieldMap === null ||
        !Array.isArray(requestConfig.excludeFields) ||
        typeof requestConfig.queryParams !== "object" ||
        requestConfig.queryParams === null ||
        typeof requestConfig.requestId !== "string" ||
        requestConfig.requestId.trim() === ""
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: TRANSFORM DATA ---
    const transformedData = rawRecords.map(record => {

        const transformedRecord = {};

        for (const key in record) {

            if (requestConfig.excludeFields.includes(key)) {
                continue;
            }

            const newKey = requestConfig.fieldMap[key] ?? key;

            transformedRecord[newKey] = record[key];

        }

        return transformedRecord;

    });

    // --- STEP 3: SORT & PAGINATE ---
    const {
        page = 1,
        limit = 10,
        sortBy = null,
        sortOrder = "asc"
    } = requestConfig.queryParams;

    const sortedData = [...transformedData];

    if (sortBy) {

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

    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const pagedData = sortedData.slice(startIndex, endIndex);

    // --- STEP 4: BUILD SUCCESS RESPONSE ---
    return {
        success: true,
        statusCode: requestConfig.statusCode,
        data: pagedData,
        meta: {
            page,
            totalCount: totalItems,
            requestId: requestConfig.requestId
        },
        timestamp: "2025-01-01T00:00:00Z"
    };

}

// --- EXAMPLE USAGE ---
console.log(
    buildAPIResponsePipeline(
        [
            {
                user_id: "U1",
                user_name: "Rahim",
                password_hash: "h1",
                score: 85
            },
            {
                user_id: "U2",
                user_name: "Karim",
                password_hash: "h2",
                score: 92
            },
            {
                user_id: "U3",
                user_name: "Nadia",
                password_hash: "h3",
                score: 78
            }
        ],
        {
            statusCode: 200,
            fieldMap: {
                user_id: "id",
                user_name: "name"
            },
            excludeFields: [
                "password_hash"
            ],
            queryParams: {
                page: 1,
                limit: 2,
                sortBy: "score",
                sortOrder: "desc"
            },
            requestId: "REQ-999"
        }
    )
);