// 🧩 PROBLEM–02: solveTwoSumPatterns()

// Logic: Implements three hash map based patterns:
// 1. TWO_SUM     — find indices of two numbers summing to target
// 2. THREE_SUM   — find all unique triplets summing to zero
// 3. SUBARRAY_SUM — count subarrays summing to target (prefix sum)

function solveTwoSumPatterns(nums, problemType, params) {

    // --- STEP 1: VALIDATE nums ---
    // Must be a non-empty array of integers.

    if (
        !Array.isArray(nums) ||
        nums.length === 0 ||
        !nums.every(
            n => typeof n === "number" && Number.isInteger(n)
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: VALIDATE problemType ---

    if (
        typeof problemType !== "string" ||
        problemType.trim() === ""
    ) {
        return "Invalid Input";
    }

    if (
        problemType !== "TWO_SUM" &&
        problemType !== "THREE_SUM" &&
        problemType !== "SUBARRAY_SUM"
    ) {
        return "Invalid Input";
    }

    // --- STEP 3: VALIDATE params ---
    // params must be a non-null plain object for all types.

    if (
        typeof params !== "object" ||
        params === null ||
        Array.isArray(params)
    ) {
        return "Invalid Input";
    }

    // --- STEP 4: TWO SUM ---

    if (problemType === "TWO_SUM") {

        // params must contain a numeric target.

        if (typeof params.target !== "number") {
            return "Invalid Input";
        }

        const { target } = params;

        // Hash map stores { value: index } as we iterate.
        // For each number, we check if its complement (target - num)
        // already exists in the map.
        // If yes → we found the pair.
        // If no  → store current number and its index in map.

        const seen = {};

        for (let i = 0; i < nums.length; i++) {

            const num = nums[i];
            const complement = target - num;

            // Check if complement was seen in a previous iteration.

            if (seen[complement] !== undefined) {

                // Return the earlier index first, then current index.

                return {
                    target,
                    indices: [seen[complement], i]
                };
            }

            // Store current number's index for future lookups.

            seen[num] = i;
        }

        // No valid pair found.

        return {
            target,
            indices: null,
            reason: "No pair found"
        };
    }

    // --- STEP 5: THREE SUM ---

    if (problemType === "THREE_SUM") {

        // Sort the array first.
        // Sorting helps us:
        //   1. Use two-pointer / hash map efficiently.
        //   2. Skip duplicate values to avoid duplicate triplets.

        const sorted = [...nums].sort((a, b) => a - b);
        const triplets = [];

        // Fix the first element at index i.
        // For each i, find pairs in the remaining subarray
        // that sum to -sorted[i] using a hash map.

        for (let i = 0; i < sorted.length - 2; i++) {

            // Skip duplicate values for the first element.
            // If sorted[i] === sorted[i-1], we already processed
            // this value as the first element → skip to avoid duplicates.

            if (i > 0 && sorted[i] === sorted[i - 1]) continue;

            // Target for the remaining two elements.

            const target = -sorted[i];

            // Hash set stores values we have seen in this inner pass.

            const seen = new Set();

            // Track which second elements we already used to avoid
            // duplicate triplets from the same i.

            const usedSecond = new Set();

            for (let j = i + 1; j < sorted.length; j++) {

                const num = sorted[j];
                const complement = target - num;

                // If complement exists in seen, we have a valid triplet.

                if (seen.has(complement)) {

                    // Avoid duplicate triplets by checking if this
                    // second element value was already used.

                    if (!usedSecond.has(complement)) {
                        triplets.push([sorted[i], complement, num]);
                        usedSecond.add(complement);
                    }
                }

                // Add current number to seen for future complement checks.

                seen.add(num);
            }
        }

        // --- THREE_SUM RESULT ---

        return {
            triplets,
            count: triplets.length
        };
    }

    // --- STEP 6: SUBARRAY SUM ---

    if (problemType === "SUBARRAY_SUM") {

        // params must contain a numeric target.

        if (typeof params.target !== "number") {
            return "Invalid Input";
        }

        const { target } = params;

        // --- PREFIX SUM + HASH MAP TECHNIQUE ---
        //
        // Key insight:
        //   If prefixSum[j] - prefixSum[i] = target,
        //   then subarray from index (i+1) to j sums to target.
        //
        // So for each index j, we check if (prefixSum[j] - target)
        // exists in our map. If it does, the subarray ending at j
        // and starting just after the stored index is a valid match.
        //
        // prefixMap stores { prefixSum: [list of indices where this sum occurred] }
        // We use index -1 with sum 0 as the base case:
        //   this handles subarrays starting from index 0.

        const prefixMap = { 0: [-1] };
        const subarrays = [];
        let prefixSum = 0;
        let count = 0;

        for (let j = 0; j < nums.length; j++) {

            // Accumulate prefix sum up to index j.

            prefixSum += nums[j];

            // Check if (prefixSum - target) was seen before.

            const needed = prefixSum - target;

            if (prefixMap[needed] !== undefined) {

                // Each stored index i where prefixSum was `needed`
                // gives a valid subarray from (i+1) to j.

                for (const i of prefixMap[needed]) {
                    subarrays.push([i + 1, j]);
                    count++;
                }
            }

            // Store current prefixSum with its index.
            // Multiple indices can share the same prefixSum
            // (e.g. if some elements cancel out).

            if (prefixMap[prefixSum] === undefined) {
                prefixMap[prefixSum] = [];
            }

            prefixMap[prefixSum].push(j);
        }

        // --- SUBARRAY_SUM RESULT ---

        return {
            target,
            count,
            subarrays
        };
    }
}


// ------ EXAMPLE USAGE ------

// --- TWO_SUM: found ---
console.log(solveTwoSumPatterns([2, 7, 11, 15], "TWO_SUM", { target: 9 }));


// --- TWO_SUM: another case ---
console.log(solveTwoSumPatterns([3, 2, 4], "TWO_SUM", { target: 6 }));


// --- TWO_SUM: not found ---
console.log(solveTwoSumPatterns([1, 2, 3], "TWO_SUM", { target: 10 }));


// --- THREE_SUM ---
console.log(solveTwoSumPatterns([-1, 0, 1, 2, -1, -4], "THREE_SUM", {}));


// --- SUBARRAY_SUM ---
console.log(solveTwoSumPatterns([1, 1, 1], "SUBARRAY_SUM", { target: 2 }));


// --- INVALID: non-integer in nums ---
console.log(solveTwoSumPatterns([1, 2.5, 3], "TWO_SUM", { target: 5 }));


// --- INVALID: wrong problemType ---
console.log(solveTwoSumPatterns([1, 2, 3], "FOUR_SUM", { target: 5 }));


// --- INVALID: missing target ---
console.log(solveTwoSumPatterns([1, 2, 3], "TWO_SUM", {}));