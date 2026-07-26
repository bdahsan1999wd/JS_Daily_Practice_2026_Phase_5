// 🧩 PROBLEM–04: implementCacheAside()

// Logic: Implements the Cache-Aside pattern. Reads check the cache first, writes invalidate the cache, and deletes remove cached entries. All operations are processed sequentially.

async function implementCacheAside(operations, cache) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(operations) ||
        operations.length === 0 ||
        typeof cache !== "object" ||
        cache === null ||
        Array.isArray(cache) ||
        !operations.every(operation =>
            typeof operation === "object" &&
            operation !== null &&
            typeof operation.type === "string" &&
            ["READ", "WRITE", "DELETE"].includes(operation.type) &&
            typeof operation.key === "string" &&
            operation.key.trim() !== ""
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: PROCESS OPERATIONS ---
    const operationLog = [];

    for (const operation of operations) {

        // --- READ ---
        if (operation.type === "READ") {

            if (Object.prototype.hasOwnProperty.call(cache, operation.key)) {

                operationLog.push({
                    key: operation.key,
                    data: cache[operation.key],
                    source: "CACHE"
                });

            } else {

                const data = "db_value_for_" + operation.key;

                cache[operation.key] = data;

                operationLog.push({
                    key: operation.key,
                    data,
                    source: "DB"
                });

            }

        }

        // --- WRITE ---
        else if (operation.type === "WRITE") {

            const dbValue = "written_" + operation.value;

            delete cache[operation.key];

            operationLog.push({
                key: operation.key,
                written: true,
                cacheInvalidated: true
            });

        }

        // --- DELETE ---
        else {

            delete cache[operation.key];

            operationLog.push({
                key: operation.key,
                deleted: true
            });

        }

    }

    // --- STEP 3: RETURN RESULT ---
    return {
        operationLog,
        finalCacheState: cache
    };

}

// --- EXAMPLE USAGE ---
implementCacheAside(
    [
        {
            type: "READ",
            key: "user-1"
        },
        {
            type: "WRITE",
            key: "user-1",
            value: "Rahim"
        },
        {
            type: "READ",
            key: "user-1"
        }
    ],
    {}
)
    .then(result => console.log(result))
    .catch(error => console.log(error));