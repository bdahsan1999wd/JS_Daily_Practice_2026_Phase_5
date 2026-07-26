// 🧩 PROBLEM–02: createTTLCache()

// Logic: Creates a TTL (Time-To-Live) cache. Cached entries remain valid until their TTL expires. Expired entries are automatically re-fetched and updated.

function createTTLCache(fetchFn, ttlMs) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof fetchFn !== "function" ||
        typeof ttlMs !== "number" ||
        ttlMs <= 0
    ) {
        throw new Error("Invalid Input");
    }

    // --- STEP 2: CACHE STORE ---
    const store = {};

    // --- STEP 3: GET METHOD ---
    async function get(key, currentTimeMs) {

        if (
            typeof key !== "string" ||
            key.trim() === "" ||
            typeof currentTimeMs !== "number" ||
            currentTimeMs < 0
        ) {
            return Promise.reject("Invalid Input");
        }

        const entry = store[key];

        // --- CACHE HIT ---
        if (entry) {

            const isExpired =
                currentTimeMs - entry.storedAtMs >= entry.ttlMs;

            if (!isExpired) {

                return {
                    key,
                    data: entry.data,
                    source: "CACHE",
                    expired: false
                };

            }

            // --- CACHE EXPIRED ---
            const freshData = await fetchFn(key);

            store[key] = {
                data: freshData,
                storedAtMs: currentTimeMs,
                ttlMs
            };

            return {
                key,
                data: freshData,
                source: "REFETCH",
                expired: true
            };

        }

        // --- CACHE MISS ---
        const data = await fetchFn(key);

        store[key] = {
            data,
            storedAtMs: currentTimeMs,
            ttlMs
        };

        return {
            key,
            data,
            source: "FETCH",
            expired: false
        };

    }

    // --- STEP 4: INVALIDATE METHOD ---
    function invalidate(key) {

        delete store[key];

        return {
            key,
            invalidated: true
        };

    }

    // --- STEP 5: STATS METHOD ---
    function stats() {

        return {
            totalEntries: Object.keys(store).length
        };

    }

    // --- STEP 6: RETURN CACHE API ---
    return {
        get,
        invalidate,
        stats
    };

}

// --- EXAMPLE USAGE ---
const fetchFn = (key) => {
    return Promise.resolve("fresh_data_for_" + key);
};

const ttlCache = createTTLCache(fetchFn, 1000);

ttlCache.get("product-1", 0)
    .then(result => console.log(result))
    .catch(error => console.log(error));