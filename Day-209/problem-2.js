// 🧩 PROBLEM–02: filterByRange()

// Logic: Filters records using one or more numeric ranges. A record passes only if it satisfies ALL range filters.

function filterByRange(records, rangeFilters) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(records) ||
        records.length === 0 ||
        !records.every(record =>
            typeof record === "object" &&
            record !== null &&
            !Array.isArray(record)
        ) ||
        typeof rangeFilters !== "object" ||
        rangeFilters === null ||
        Array.isArray(rangeFilters)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: FILTER RECORDS ---
    const filteredRecords = [];
    const rejectedRecords = [];

    for (const record of records) {

        const passed = Object.entries(rangeFilters).every(([field, range]) => {

            if (
                typeof range !== "object" ||
                range === null ||
                !("min" in range) ||
                !("max" in range)
            ) {
                return false;
            }

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

        });

        if (passed) {
            filteredRecords.push(record);
        } else {
            rejectedRecords.push(record);
        }

    }

    // --- STEP 3: RETURN RESULT ---
    return {
        filteredRecords,
        rejectedRecords,
        filteredCount: filteredRecords.length,
        rejectedCount: rejectedRecords.length
    };

}

// --- EXAMPLE USAGE ---
console.log(
    filterByRange(
        [
            { name: "A", age: 25, salary: 50000 },
            { name: "B", age: 17, salary: 80000 },
            { name: "C", age: 30, salary: 45000 }
        ],
        {
            age: {
                min: 18,
                max: null
            },
            salary: {
                min: 48000,
                max: 90000
            }
        }
    )
);