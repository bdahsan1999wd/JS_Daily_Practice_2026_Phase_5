// 🧩 PROBLEM–03: transformResponseData()

// Logic: Transforms raw API response data by renaming fields using the provided field map and removing unwanted fields before returning the final response payload.

function transformResponseData(rawData, fieldMap, excludeFields) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(rawData) ||
        rawData.length === 0 ||
        !rawData.every(item =>
            typeof item === "object" &&
            item !== null &&
            !Array.isArray(item)
        ) ||
        typeof fieldMap !== "object" ||
        fieldMap === null ||
        Array.isArray(fieldMap) ||
        !Array.isArray(excludeFields) ||
        !excludeFields.every(field => typeof field === "string")
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: TRANSFORM DATA ---
    const transformedData = rawData.map(record => {

        const transformedRecord = {};

        for (const key in record) {

            // Skip excluded fields
            if (excludeFields.includes(key)) {
                continue;
            }

            // Rename field if mapping exists
            const newKey = fieldMap[key] ?? key;

            transformedRecord[newKey] = record[key];

        }

        return transformedRecord;

    });

    // --- STEP 3: RETURN RESULT ---
    return transformedData;

}

// --- EXAMPLE USAGE ---
console.log(
    transformResponseData(
        [
            {
                user_id: "U1",
                user_name: "Rahim",
                password_hash: "abc123",
                created_at: "2025-01-01"
            },
            {
                user_id: "U2",
                user_name: "Karim",
                password_hash: "xyz789",
                created_at: "2025-01-02"
            }
        ],
        {
            user_id: "id",
            user_name: "name",
            created_at: "createdAt"
        },
        [
            "password_hash"
        ]
    )
);