// 🧩 PROBLEM–05: runRecursionChallenge()

// Logic: Orchestrator function that solves multiple recursion/memoization problems from a config object, logs each result, and builds a summary.

// Supported problem types:
//   "FACTORIAL"      — n! recursively
//   "FIBONACCI"      — nth Fibonacci naive (no memo)
//   "FIBONACCI_MEMO" — nth Fibonacci with memoization
//   "COIN_CHANGE"    — minimum coins (top-down DP)
//   "SUBSETS"        — all subsets via backtracking
//   "COMBINATION_SUM"— all combinations summing to target

function runRecursionChallenge(challengeConfig) {

    // STEP 1: VALIDATE challengeConfig


    // Must be a non-null plain object.

    if (
        typeof challengeConfig !== "object" ||
        challengeConfig === null ||
        Array.isArray(challengeConfig)
    ) {
        return "Invalid Input";
    }

    const { challengeId, problems } = challengeConfig;

    // challengeId must be a non-empty string.

    if (
        typeof challengeId !== "string" ||
        challengeId.trim() === ""
    ) {
        return "Invalid Input";
    }

    // problems must be a non-empty array.

    if (
        !Array.isArray(problems) ||
        problems.length === 0
    ) {
        return "Invalid Input";
    }

    // Allowed problem types for this challenge.

    const ALLOWED_TYPES = new Set([
        "FACTORIAL",
        "FIBONACCI",
        "FIBONACCI_MEMO",
        "COIN_CHANGE",
        "SUBSETS",
        "COMBINATION_SUM"
    ]);

    // Each problem entry must have a valid type and a params object.

    for (const problem of problems) {

        if (
            typeof problem !== "object" ||
            problem === null ||
            Array.isArray(problem)
        ) {
            return "Invalid Input";
        }

        if (
            typeof problem.type !== "string" ||
            !ALLOWED_TYPES.has(problem.type)
        ) {
            return "Invalid Input";
        }

        if (
            typeof problem.params !== "object" ||
            problem.params === null ||
            Array.isArray(problem.params)
        ) {
            return "Invalid Input";
        }
    }

    // STEP 2: SOLVER FUNCTIONS
    // Each solver is self-contained and returns the same result shape as Problems 01–04. Invalid params → return "Invalid Input".


    // ---------- FACTORIAL ----------

    function solveFactorial(params) {

        const { n } = params;

        if (
            typeof n !== "number" ||
            !Number.isInteger(n) ||
            n < 0 || n > 15
        ) {
            return "Invalid Input";
        }

        const counter = { calls: 0 };

        function factorial(num) {
            counter.calls++;
            if (num === 0 || num === 1) return 1;
            return num * factorial(num - 1);
        }

        const result = factorial(n);

        return { n, result, calls: counter.calls };
    }

    // ---------- FIBONACCI (NAIVE — no memoization) ----------

    function solveFibonacci(params) {

        const { n } = params;

        if (
            typeof n !== "number" ||
            !Number.isInteger(n) ||
            n < 0 || n > 20
        ) {
            return "Invalid Input";
        }

        const counter = { calls: 0 };

        function fib(num) {
            counter.calls++;
            if (num === 0) return 0;
            if (num === 1) return 1;
            return fib(num - 1) + fib(num - 2);
        }

        const result = fib(n);

        return { n, result, calls: counter.calls };
    }

    // ---------- FIBONACCI MEMO ----------

    function solveFibonacciMemo(params) {

        const { n } = params;

        if (
            typeof n !== "number" ||
            !Number.isInteger(n) ||
            n < 0 || n > 40
        ) {
            return "Invalid Input";
        }

        const memo = {};
        const counter = { calls: 0, cacheHits: 0 };

        function fib(num) {
            counter.calls++;
            if (num === 0) return 0;
            if (num === 1) return 1;

            if (memo[num] !== undefined) {
                counter.cacheHits++;
                return memo[num];
            }

            memo[num] = fib(num - 1) + fib(num - 2);
            return memo[num];
        }

        const result = fib(n);

        return {
            n,
            result,
            calls: counter.calls,
            cacheHits: counter.cacheHits
        };
    }

    // ---------- COIN CHANGE ----------

    function solveCoinChange(params) {

        const { coins, amount } = params;

        if (
            !Array.isArray(coins) ||
            coins.length === 0 ||
            !coins.every(
                c => typeof c === "number" && Number.isInteger(c) && c > 0
            )
        ) {
            return "Invalid Input";
        }

        if (
            typeof amount !== "number" ||
            !Number.isInteger(amount) ||
            amount < 0
        ) {
            return "Invalid Input";
        }

        const memo = {};
        const counter = { calls: 0, cacheHits: 0 };

        function minCoins(rem) {
            counter.calls++;
            if (rem === 0) return 0;
            if (rem < 0) return Infinity;

            if (memo[rem] !== undefined) {
                counter.cacheHits++;
                return memo[rem];
            }

            let best = Infinity;

            for (const coin of coins) {
                const res = 1 + minCoins(rem - coin);
                if (res < best) best = res;
            }

            memo[rem] = best;
            return memo[rem];
        }

        const answer = minCoins(amount);
        const minCoinsCount = answer === Infinity ? -1 : answer;

        return {
            amount,
            coins,
            minCoins: minCoinsCount,
            calls: counter.calls,
            cacheHits: counter.cacheHits
        };
    }

    // ---------- SUBSETS ----------

    function solveSubsets(params) {

        const { nums } = params;

        if (
            !Array.isArray(nums) ||
            nums.length === 0 ||
            !nums.every(n => typeof n === "number" && Number.isInteger(n)) ||
            new Set(nums).size !== nums.length
        ) {
            return "Invalid Input";
        }

        const subsets = [];
        const counter = { calls: 0 };

        function backtrack(index, current) {
            counter.calls++;
            subsets.push([...current]);

            for (let i = index; i < nums.length; i++) {
                current.push(nums[i]);
                backtrack(i + 1, current);
                current.pop();
            }
        }

        backtrack(0, []);

        return {
            nums,
            subsets,
            totalSubsets: subsets.length,
            calls: counter.calls
        };
    }

    // ---------- COMBINATION SUM ----------

    function solveCombinationSum(params) {

        const { candidates, target } = params;

        if (
            !Array.isArray(candidates) ||
            candidates.length === 0 ||
            !candidates.every(
                c => typeof c === "number" && Number.isInteger(c) && c > 0
            ) ||
            new Set(candidates).size !== candidates.length
        ) {
            return "Invalid Input";
        }

        if (
            typeof target !== "number" ||
            !Number.isInteger(target) ||
            target <= 0
        ) {
            return "Invalid Input";
        }

        const sorted = [...candidates].sort((a, b) => a - b);
        const combinations = [];
        const counter = { calls: 0 };

        function backtrack(remaining, start, current) {
            counter.calls++;
            if (remaining === 0) {
                combinations.push([...current]);
                return;
            }

            for (let i = start; i < sorted.length; i++) {
                if (sorted[i] > remaining) break;
                current.push(sorted[i]);
                backtrack(remaining - sorted[i], i, current);
                current.pop();
            }
        }

        backtrack(target, 0, []);

        return {
            candidates: sorted,
            target,
            combinations,
            totalCombinations: combinations.length,
            calls: counter.calls
        };
    }

    // STEP 3: SOLVER DISPATCHER
    // Maps each problem type to its solver function.

    const solverMap = {
        "FACTORIAL": solveFactorial,
        "FIBONACCI": solveFibonacci,
        "FIBONACCI_MEMO": solveFibonacciMemo,
        "COIN_CHANGE": solveCoinChange,
        "SUBSETS": solveSubsets,
        "COMBINATION_SUM": solveCombinationSum
    };


    // STEP 4: SOLVE EACH PROBLEM & BUILD problemLog

    const problemLog = [];

    for (const problem of problems) {

        const { type, params } = problem;

        // Run the matching solver.

        const result = solverMap[type](params);

        // If any individual solver returns "Invalid Input",
        // propagate it upward immediately.

        if (result === "Invalid Input") {
            return "Invalid Input";
        }

        problemLog.push({ type, params, result });
    }


    // STEP 5: BUILD SUMMARY

    // totalProblems → count of problems solved.

    const totalProblems = problemLog.length;

    // totalRecursiveCalls → sum of all `calls` fields across every result.
    // Some results (SUBSETS, COMBINATION_SUM) only have `calls`.
    // Others (FIBONACCI_MEMO, COIN_CHANGE) have `calls` + `cacheHits`.
    // We sum only `calls` as per the spec.

    const totalRecursiveCalls = problemLog.reduce((sum, entry) => {
        return sum + (entry.result.calls ?? 0);
    }, 0);

    // memoizationSavings → only built when BOTH "FIBONACCI" and
    // "FIBONACCI_MEMO" appear in the log AND they share the same n.

    let memoizationSavings = null;

    const fibEntry = problemLog.find(e => e.type === "FIBONACCI");
    const memoEntry = problemLog.find(e => e.type === "FIBONACCI_MEMO");

    if (fibEntry && memoEntry) {

        // Only compare if both were run on the same n value.

        if (fibEntry.params.n === memoEntry.params.n) {

            const naiveCalls = fibEntry.result.calls;
            const memoCalls = memoEntry.result.calls;

            memoizationSavings = {
                n: fibEntry.params.n,
                naiveCalls,
                memoCalls,
                callsReduced: naiveCalls - memoCalls
            };
        }
    }

    // STEP 6: RETURN FINAL RESULT

    return {
        challengeId,
        problemLog,
        summary: {
            totalProblems,
            memoizationSavings,
            totalRecursiveCalls
        }
    };
}



// ---------------- EXAMPLE USAGE ----------------

console.log(runRecursionChallenge({
    challengeId: "REC-01",
    problems: [
        { type: "FACTORIAL", params: { n: 5 } },
        { type: "FIBONACCI", params: { n: 8 } },
        { type: "FIBONACCI_MEMO", params: { n: 8 } },
        { type: "COIN_CHANGE", params: { coins: [1, 5, 6, 9], amount: 11 } },
        { type: "SUBSETS", params: { nums: [1, 2] } }
    ]
}));


// --- INVALID: missing challengeId ---
console.log(runRecursionChallenge({
    problems: [{ type: "FACTORIAL", params: { n: 3 } }]
}));


// --- INVALID: unknown problem type ---
console.log(runRecursionChallenge({
    challengeId: "REC-02",
    problems: [{ type: "MERGE_SORT", params: { n: 5 } }]
}));


// --- INVALID: bad params inside a problem ---
console.log(runRecursionChallenge({
    challengeId: "REC-03",
    problems: [{ type: "FACTORIAL", params: { n: 99 } }]
}));