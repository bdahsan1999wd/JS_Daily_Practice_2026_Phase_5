// 🧩 PROBLEM–01: createAsyncCache()

// Logic: Creates a basic async cache wrapper. If data exists in the cache, it is returned immediately. Otherwise, the fetch function is executed and the result is cached.

function createAsyncCache(fetchFn, cache) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof fetchFn !== "function" ||
        typeof cache !== "object" ||
        cache === null ||
        Array.isArray(cache)
    ) {
        throw new Error("Invalid Input");
    }

    // --- STEP 2: RETURN WRAPPER FUNCTION ---
    return function (key) {

        // --- INPUT VALIDATION ---
        if (
            typeof key !== "string" ||
            key.trim() === ""
        ) {
            return Promise.reject("Invalid Input");
        }

        // --- STEP 3: CACHE HIT ---
        if (Object.prototype.hasOwnProperty.call(cache, key)) {

            return Promise.resolve({
                key,
                data: cache[key],
                source: "CACHE"
            });

        }

        // --- STEP 4: CACHE MISS ---
        return fetchFn(key)
            .then(result => {

                cache[key] = result;

                return {
                    key,
                    data: result,
                    source: "FETCH"
                };

            });

    };

}

// --- EXAMPLE USAGE ---
const cache = {};

const fetchFn = (key) => {
    return Promise.resolve("data_for_" + key);
};

const cachedFetch = createAsyncCache(fetchFn, cache);

cachedFetch("user-1")
    .then(result => console.log(result))
    .catch(error => console.log(error));