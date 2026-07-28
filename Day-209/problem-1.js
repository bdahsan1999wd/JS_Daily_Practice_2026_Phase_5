// 🧩 PROBLEM–01: filterByField()

// Logic: Filters records using exact field matching. A record passes only if it satisfies ALL filter conditions using strict equality (AND logic).

function filterByField(records, filters) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(records) ||
        records.length === 0 ||
        !records.every(record =>
            typeof record === "object" &&
            record !== null &&
            !Array.isArray(record)
        ) ||
        typeof filters !== "object" ||
        filters === null ||
        Array.isArray(filters)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: HANDLE EMPTY FILTERS ---
    if (Object.keys(filters).length === 0) {
        return records;
    }

    // --- STEP 3: FILTER RECORDS ---
    const filteredRecords = records.filter(record => {

        return Object.entries(filters).every(([key, value]) => {

            if (!(key in record)) {
                return false;
            }

            return record[key] === value;

        });

    });

    // --- STEP 4: RETURN RESULT ---
    return filteredRecords;

}

// --- EXAMPLE USAGE ---
console.log(
    filterByField(
        [
            {
                id: "U1",
                role: "ADMIN",
                status: "ACTIVE"
            },
            {
                id: "U2",
                role: "USER",
                status: "ACTIVE"
            },
            {
                id: "U3",
                role: "ADMIN",
                status: "INACTIVE"
            }
        ],
        {
            role: "ADMIN",
            status: "ACTIVE"
        }
    )
);