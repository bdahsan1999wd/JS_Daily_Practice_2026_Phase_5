// 🧩 PROBLEM–04: solveWithBacktracking()

// Logic: Implements three recursive backtracking algorithms:

// 1. SUBSETS         — generate all subsets (include/exclude at each step)
// 2. PERMUTATIONS    — generate all permutations (swap technique)
// 3. COMBINATION_SUM — find all combinations that sum to target

// Each algorithm tracks the total number of recursive calls made.

function solveWithBacktracking(problemType, params) {

    // --- STEP 1: VALIDATE problemType ---

    if (
        typeof problemType !== "string" ||
        problemType.trim() === ""
    ) {
        return "Invalid Input";
    }

    if (
        problemType !== "SUBSETS" &&
        problemType !== "PERMUTATIONS" &&
        problemType !== "COMBINATION_SUM"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: VALIDATE params ---

    if (
        typeof params !== "object" ||
        params === null ||
        Array.isArray(params)
    ) {
        return "Invalid Input";
    }

    // --- STEP 3: SUBSETS ---

    if (problemType === "SUBSETS") {

        const { nums } = params;

        // Validate nums: must be a non-empty array of distinct integers.

        if (
            !Array.isArray(nums) ||
            nums.length === 0 ||
            !nums.every(n => typeof n === "number" && Number.isInteger(n))
        ) {
            return "Invalid Input";
        }

        // Check for duplicates — nums must contain distinct integers.

        if (new Set(nums).size !== nums.length) {
            return "Invalid Input";
        }

        const subsets = [];
        const counter = { calls: 0 };

        // Inner recursive backtracking function.

        // At each index, we make two choices:
        //   1. INCLUDE nums[index] in the current subset → recurse further
        //   2. EXCLUDE nums[index]                       → recurse further
        // This builds every possible combination of elements.

        // current → the subset being built in this branch
        // index   → which element we are deciding on right now

        function backtrack(index, current) {

            // Count this function invocation.

            counter.calls++;

            // Every state of `current` is a valid subset — record it.
            // We snapshot with [...current] because current will be mutated.

            subsets.push([...current]);

            // Try including each element from index onward.
            // Starting from `index` (not 0) ensures we never go backwards,
            // which prevents duplicate subsets like [1,2] and [2,1].

            for (let i = index; i < nums.length; i++) {

                // CHOOSE: add nums[i] to the current subset.

                current.push(nums[i]);

                // EXPLORE: recurse to decide on the next element.

                backtrack(i + 1, current);

                // UN-CHOOSE (backtrack): remove nums[i] to try the next option.

                current.pop();
            }
        }

        backtrack(0, []);

        // --- SUBSETS RESULT ---

        return {
            nums,
            subsets,
            totalSubsets: subsets.length,
            calls: counter.calls
        };
    }

    // --- STEP 4: PERMUTATIONS ---

    if (problemType === "PERMUTATIONS") {

        const { nums } = params;

        // Validate nums: must be a non-empty array of distinct integers.

        if (
            !Array.isArray(nums) ||
            nums.length === 0 ||
            !nums.every(n => typeof n === "number" && Number.isInteger(n))
        ) {
            return "Invalid Input";
        }

        // Check for duplicates.

        if (new Set(nums).size !== nums.length) {
            return "Invalid Input";
        }

        const permutations = [];
        const counter = { calls: 0 };

        // Work on a copy so we don't mutate the original input.

        const arr = [...nums];

        // Inner recursive backtracking function using the SWAP technique.
        // The idea: everything to the LEFT of `start` is already "fixed"
        // (part of the current permutation prefix).
        // We try placing each remaining element at position `start`
        // by swapping it there, recursing, then swapping back.

        // start → the current position we are filling in

        function backtrack(start) {

            // Count this function invocation.

            counter.calls++;

            // Base case: all positions are filled → we have a full permutation.

            if (start === arr.length) {
                permutations.push([...arr]);
                return;
            }

            // Try each element from `start` to the end as the next element
            // in the permutation.

            for (let i = start; i < arr.length; i++) {

                // CHOOSE: swap arr[start] with arr[i] to place arr[i] at `start`.

                [arr[start], arr[i]] = [arr[i], arr[start]];

                // EXPLORE: recurse to fill the next position.

                backtrack(start + 1);

                // UN-CHOOSE (backtrack): swap back to restore original order.

                [arr[start], arr[i]] = [arr[i], arr[start]];
            }
        }

        backtrack(0);

        // --- PERMUTATIONS RESULT ---

        return {
            nums,
            permutations,
            totalPermutations: permutations.length,
            calls: counter.calls
        };
    }

    // --- STEP 5: COMBINATION SUM ---

    if (problemType === "COMBINATION_SUM") {

        const { candidates, target } = params;

        // Validate candidates: non-empty array of positive distinct integers.

        if (
            !Array.isArray(candidates) ||
            candidates.length === 0 ||
            !candidates.every(
                c => typeof c === "number" && Number.isInteger(c) && c > 0
            )
        ) {
            return "Invalid Input";
        }

        // Check for duplicates in candidates.

        if (new Set(candidates).size !== candidates.length) {
            return "Invalid Input";
        }

        // Validate target: must be a positive integer.

        if (
            typeof target !== "number" ||
            !Number.isInteger(target) ||
            target <= 0
        ) {
            return "Invalid Input";
        }

        // Sort candidates so combinations are built in ascending order.
        // This also lets us stop early when a candidate exceeds remaining target.

        const sorted = [...candidates].sort((a, b) => a - b);

        const combinations = [];
        const counter = { calls: 0 };

        // Inner recursive backtracking function.
        // remaining → how much more we need to sum to reach target
        // start     → index in sorted array to try next (prevents re-using
        //             elements in a different order, but allows re-using same element)
        // current   → combination being built in this branch

        function backtrack(remaining, start, current) {

            // Count this function invocation.

            counter.calls++;

            // Base case: remaining is exactly 0 → valid combination found.

            if (remaining === 0) {
                combinations.push([...current]);
                return;
            }

            // Try each candidate from `start` onward.

            for (let i = start; i < sorted.length; i++) {

                // If the current candidate already exceeds remaining,
                // all further candidates (which are larger due to sorting)
                // will also exceed it → stop early.

                if (sorted[i] > remaining) break;

                // CHOOSE: add this candidate to current combination.

                current.push(sorted[i]);

                // EXPLORE: recurse with reduced remaining.
                // Pass i (not i+1) to allow re-using the same candidate.

                backtrack(remaining - sorted[i], i, current);

                // UN-CHOOSE (backtrack): remove last element to try next candidate.

                current.pop();
            }
        }

        backtrack(target, 0, []);

        // --- COMBINATION_SUM RESULT ---

        return {
            candidates: sorted,
            target,
            combinations,
            totalCombinations: combinations.length,
            calls: counter.calls
        };
    }
}


// ------ EXAMPLE USAGE ------

// --- SUBSETS ---
console.log(solveWithBacktracking("SUBSETS", { nums: [1, 2, 3] }));


// --- PERMUTATIONS ---
console.log(solveWithBacktracking("PERMUTATIONS", { nums: [1, 2, 3] }));


// --- COMBINATION_SUM ---
console.log(solveWithBacktracking("COMBINATION_SUM", { candidates: [2, 3, 6, 7], target: 7 }));


// --- INVALID: duplicate nums ---
console.log(solveWithBacktracking("SUBSETS", { nums: [1, 1, 2] }));


// --- INVALID: target not positive ---
console.log(solveWithBacktracking("COMBINATION_SUM", { candidates: [2, 3], target: 0 }));


// --- INVALID: wrong problemType ---
console.log(solveWithBacktracking("BINARY_SEARCH", { nums: [1, 2] }));