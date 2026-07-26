// 🧩 PROBLEM–05: runCacheOrchestrator()

// Logic: Orchestrates a complete cache workflow using TTL cache. It performs an initial batch fetch, invalidates selected keys, then re-fetches the invalidated entries.

async function runCacheOrchestrator(config) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof config !== "object" ||
        config === null ||
        typeof config.cacheId !== "string" ||
        config.cacheId.trim() === "" ||
        !Array.isArray(config.keys) ||
        config.keys.length === 0 ||
        !config.keys.every(key =>
            typeof key === "string" &&
            key.trim() !== ""
        ) ||
        typeof config.ttlMs !== "number" ||
        config.ttlMs <= 0 ||
        typeof config.currentTimeMs !== "number" ||
        config.currentTimeMs < 0 ||
        !Array.isArray(config.invalidateKeys) ||
        !config.invalidateKeys.every(key =>
            typeof key === "string" &&
            key.trim() !== ""
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CACHE STORE ---
    const cache = {};

    const fetchFn = async (key) => {
        return "fetched_data_for_" + key;
    };

    // --- STEP 3: INITIAL FETCH ---
    const initialFetchLog = [];

    for (const key of config.keys) {

        const data = await fetchFn(key);

        cache[key] = {
            data,
            storedAtMs: config.currentTimeMs,
            ttlMs: config.ttlMs
        };

        initialFetchLog.push({
            key,
            data,
            source: "FETCH",
            expired: false
        });

    }

    // --- STEP 4: INVALIDATE KEYS ---
    for (const key of config.invalidateKeys) {

        delete cache[key];

    }

    // --- STEP 5: RE-FETCH INVALIDATED KEYS ---
    const reFetchLog = [];

    for (const key of config.invalidateKeys) {

        const data = await fetchFn(key);

        cache[key] = {
            data,
            storedAtMs: config.currentTimeMs,
            ttlMs: config.ttlMs
        };

        reFetchLog.push({
            key,
            data,
            source: "FETCH",
            expired: false
        });

    }

    // --- STEP 6: RETURN RESULT ---
    return {
        cacheId: config.cacheId,
        initialFetchLog,
        invalidatedKeys: config.invalidateKeys,
        reFetchLog
    };

}

// --- EXAMPLE USAGE ---
runCacheOrchestrator({
    cacheId: "CACHE-01",
    keys: [
        "k1",
        "k2",
        "k3"
    ],
    ttlMs: 1000,
    currentTimeMs: 500,
    invalidateKeys: [
        "k1",
        "k3"
    ]
})
    .then(result => console.log(result))
    .catch(error => console.log(error));