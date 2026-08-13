// 🧩 PROBLEM–02: solvWithMemoization()

// Logic: Implements three memoized recursive algorithms:
// 1. FIBONACCI_MEMO — nth Fibonacci WITH memoization
// 2. GRID_PATHS     — unique paths in m×n grid (memoized)
// 3. COIN_CHANGE    — minimum coins for amount (top-down DP)

// Each algorithm tracks:
// calls     → actual recursive function calls made
// cacheHits → times a result was served directly from memo cache

function solvWithMemoization(problemType, params) {

    // --- STEP 1: VALIDATION ---
    // Validate that problemType is a non-empty string.

    if (
        typeof problemType !== "string" ||
        problemType.trim() === ""
    ) {
        return "Invalid Input";
    }

    // Validate that params is a non-null plain object.

    if (
        typeof params !== "object" ||
        params === null ||
        Array.isArray(params)
    ) {
        return "Invalid Input";
    }

    // Validate that problemType is one of the accepted values.

    if (
        problemType !== "FIBONACCI_MEMO" &&
        problemType !== "GRID_PATHS" &&
        problemType !== "COIN_CHANGE"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: FIBONACCI WITH MEMOIZATION ---

    if (problemType === "FIBONACCI_MEMO") {

        const { n } = params;

        // Validate n: must be an integer in range 0–40.

        if (
            typeof n !== "number" ||
            !Number.isInteger(n) ||
            n < 0 ||
            n > 40
        ) {
            return "Invalid Input";
        }

        // memo stores already-computed fib(k) values.
        // counter tracks calls and cacheHits across all recursive calls.

        const memo = {};
        const counter = { calls: 0, cacheHits: 0 };

        // Inner recursive function for memoized Fibonacci.

        function fib(num) {

            // Count this function invocation.

            counter.calls++;

            // Base cases: fib(0) = 0, fib(1) = 1.

            if (num === 0) return 0;
            if (num === 1) return 1;

            // If this sub-problem was already solved,
            // retrieve from cache and count it as a cache hit.

            if (memo[num] !== undefined) {
                counter.cacheHits++;
                return memo[num];
            }

            // Compute, store in memo, then return.
            // Next time fib(num) is needed, it will be a cache hit.

            memo[num] = fib(num - 1) + fib(num - 2);
            return memo[num];
        }

        const result = fib(n);

        // --- FIBONACCI_MEMO RESULT ---

        return {
            n,
            result,
            calls: counter.calls,
            cacheHits: counter.cacheHits
        };
    }

    // --- STEP 3: GRID PATHS WITH MEMOIZATION ---

    if (problemType === "GRID_PATHS") {

        const { m, n } = params;

        // Validate m and n: must be positive integers.

        if (
            typeof m !== "number" ||
            !Number.isInteger(m) ||
            m < 1 ||
            typeof n !== "number" ||
            !Number.isInteger(n) ||
            n < 1
        ) {
            return "Invalid Input";
        }

        // memo stores already-computed paths(rows, cols) values.
        // Key format: "rows,cols" string → unique per sub-grid size.

        const memo = {};
        const counter = { calls: 0, cacheHits: 0 };

        // Inner recursive function.
        // paths(rows, cols) = number of unique paths in a rows×cols grid.

        function paths(rows, cols) {

            // Count this function invocation.

            counter.calls++;

            // Base cases:
            // A grid with only 1 row → can only move RIGHT → exactly 1 path.
            // A grid with only 1 col → can only move DOWN  → exactly 1 path.

            if (rows === 1 || cols === 1) return 1;

            // Build a unique cache key for this sub-grid size.

            const key = `${rows},${cols}`;

            // If this sub-problem was already solved, return from cache.

            if (memo[key] !== undefined) {
                counter.cacheHits++;
                return memo[key];
            }

            // Recursive case:
            // From any cell, we can move DOWN (reduce rows by 1)
            // or RIGHT (reduce cols by 1).
            // Total unique paths = paths coming from above + paths coming from left.

            memo[key] = paths(rows - 1, cols) + paths(rows, cols - 1);
            return memo[key];
        }

        const uniquePaths = paths(m, n);

        // --- GRID_PATHS RESULT ---

        return {
            m,
            n,
            uniquePaths,
            calls: counter.calls,
            cacheHits: counter.cacheHits
        };
    }

    // --- STEP 4: COIN CHANGE WITH MEMOIZATION ---

    if (problemType === "COIN_CHANGE") {

        const { coins, amount } = params;

        // Validate coins: must be a non-empty array of positive integers.

        if (
            !Array.isArray(coins) ||
            coins.length === 0 ||
            !coins.every(
                c => typeof c === "number" && Number.isInteger(c) && c > 0
            )
        ) {
            return "Invalid Input";
        }

        // Validate amount: must be a non-negative integer.

        if (
            typeof amount !== "number" ||
            !Number.isInteger(amount) ||
            amount < 0
        ) {
            return "Invalid Input";
        }

        // memo stores the minimum coins needed for each sub-amount.
        // counter tracks calls and cacheHits.

        const memo = {};
        const counter = { calls: 0, cacheHits: 0 };

        // Inner recursive function.
        // minCoins(rem) = minimum number of coins to make exactly rem.

        function minCoins(rem) {

            // Count this function invocation.

            counter.calls++;

            // Base case: 0 amount needs 0 coins.

            if (rem === 0) return 0;

            // Negative remainder means this coin choice is invalid.
            // Return Infinity so it is never chosen as the minimum.

            if (rem < 0) return Infinity;

            // If this sub-problem was already solved, return from cache.

            if (memo[rem] !== undefined) {
                counter.cacheHits++;
                return memo[rem];
            }

            // Try every coin denomination.
            // For each coin, subtract its value and recurse on the remainder.
            // Add 1 to count the coin we just used.
            // Pick the option that uses the fewest coins overall.

            let best = Infinity;

            for (const coin of coins) {
                const result = 1 + minCoins(rem - coin);
                if (result < best) {
                    best = result;
                }
            }

            // Store result in memo before returning.

            memo[rem] = best;
            return memo[rem];
        }

        const answer = minCoins(amount);

        // If answer is still Infinity, no valid combination exists.

        const minCoinsCount = answer === Infinity ? -1 : answer;

        // --- COIN_CHANGE RESULT ---

        return {
            amount,
            coins,
            minCoins: minCoinsCount,
            calls: counter.calls,
            cacheHits: counter.cacheHits
        };
    }
}


// ------ EXAMPLE USAGE ------

// --- FIBONACCI_MEMO ---
console.log(solvWithMemoization("FIBONACCI_MEMO", { n: 10 }));

// --- GRID_PATHS ---
console.log(solvWithMemoization("GRID_PATHS", { m: 3, n: 3 }));

// --- COIN_CHANGE ---
console.log(solvWithMemoization("COIN_CHANGE", { coins: [1, 5, 6, 9], amount: 11 }));

// --- IMPOSSIBLE AMOUNT ---
console.log(solvWithMemoization("COIN_CHANGE", { coins: [2, 4], amount: 7 }));

// --- INVALID: wrong problemType ---
console.log(solvWithMemoization("FIBONACCI", { n: 5 }));

// --- INVALID: n out of range ---
console.log(solvWithMemoization("FIBONACCI_MEMO", { n: 50 }));

// --- INVALID: coins not positive integers ---
console.log(solvWithMemoization("COIN_CHANGE", { coins: [0, -1], amount: 5 }));