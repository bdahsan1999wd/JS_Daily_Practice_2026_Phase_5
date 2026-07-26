// 🧩 PROBLEM–03: memoizeAsync()

// Logic: Creates a memoized version of an async function. Results are cached using JSON.stringify(arguments) as the cache key to avoid repeated executions.

function memoizeAsync(asyncFn) {

    // --- STEP 1: VALIDATION ---
    if (typeof asyncFn !== "function") {
        throw new Error("Invalid Input");
    }

    // --- STEP 2: CACHE STORE ---
    const cache = new Map();

    // --- STEP 3: MEMOIZED FUNCTION ---
    async function memoized(...args) {

        const cacheKey = JSON.stringify(args);

        // --- CACHE HIT ---
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        // --- CACHE MISS ---
        const result = await asyncFn(...args);

        cache.set(cacheKey, result);

        return result;

    }

    // --- STEP 4: CACHE SIZE METHOD ---
    memoized.cacheSize = function () {

        return cache.size;

    };

    // --- STEP 5: CLEAR CACHE METHOD ---
    memoized.clearCache = function () {

        cache.clear();

        return {
            cleared: true
        };

    };

    // --- STEP 6: RETURN MEMOIZED FUNCTION ---
    return memoized;

}

// --- EXAMPLE USAGE ---
let callCount = 0;

const expensiveFn = async (x, y) => {

    callCount++;

    return x + y;

};

const memoized = memoizeAsync(expensiveFn);

memoized(2, 3)
    .then(result => console.log(result))
    .catch(error => console.log(error));