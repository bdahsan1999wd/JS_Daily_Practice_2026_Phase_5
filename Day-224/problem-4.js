// 🧩 PROBLEM–04: binarySearchOnAnswer()

// Logic: Solves three different problems using the Binary Search on Answer / Binary Search technique.

// Supported problem types:
// 1. SQRT
// 2. MIN_DAYS
// 3. PEAK_ELEMENT

function binarySearchOnAnswer(problemType, params) {

    // --- STEP 1: VALIDATION ---
    // Validate the main input objects.

    if (
        typeof problemType !== "string" ||
        !["SQRT", "MIN_DAYS", "PEAK_ELEMENT"].includes(problemType) ||
        typeof params !== "object" ||
        params === null ||
        Array.isArray(params)
    ) {
        return "Invalid Input";
    }


    // ============================================================
    // PROBLEM TYPE: SQRT
    // ============================================================

    if (problemType === "SQRT") {

        // --- STEP 2: VALIDATE SQRT INPUT ---

        const { n } = params;

        if (
            typeof n !== "number" ||
            !Number.isFinite(n) ||
            n < 0
        ) {
            return "Invalid Input";
        }


        // --- STEP 3: HANDLE DECIMAL INPUT ---
        // Integer square root is based on the integer part of n.

        const number = Math.floor(n);


        // --- STEP 4: INITIALIZE BINARY SEARCH ---

        let left = 0;
        let right = number;

        let sqrtFloor = 0;
        let comparisons = 0;


        // --- STEP 5: BINARY SEARCH ---

        while (left <= right) {

            // Calculate middle index.

            const mid = Math.floor((left + right) / 2);

            // Compare mid² with n.

            comparisons++;

            if (mid * mid <= number) {

                // mid is a valid square root candidate.

                sqrtFloor = mid;

                // Try to find a larger valid value.

                left = mid + 1;

            } else {

                // mid² is too large.

                right = mid - 1;
            }
        }


        // --- STEP 6: RETURN SQRT RESULT ---

        return {
            n,
            sqrtFloor,
            comparisons
        };
    }


    // ============================================================
    // PROBLEM TYPE: MIN_DAYS
    // ============================================================

    if (problemType === "MIN_DAYS") {

        // --- STEP 7: VALIDATE MIN_DAYS INPUT ---

        const {
            bloomDays,
            k,
            m
        } = params;

        if (
            !Array.isArray(bloomDays) ||
            bloomDays.length === 0 ||
            !bloomDays.every(
                day =>
                    typeof day === "number" &&
                    Number.isFinite(day) &&
                    day >= 0
            ) ||
            !Number.isInteger(k) ||
            k < 1 ||
            !Number.isInteger(m) ||
            m < 1
        ) {
            return "Invalid Input";
        }


        // --- STEP 8: CHECK IF ENOUGH FLOWERS EXIST ---
        // k bouquets × m flowers are required.

        if (bloomDays.length < k * m) {

            return {
                possible: false,
                minDay: -1
            };
        }


        // --- STEP 9: FIND SEARCH RANGE ---

        let left = Math.min(...bloomDays);
        let right = Math.max(...bloomDays);

        let minDay = -1;
        let comparisons = 0;


        // --- STEP 10: HELPER FUNCTION ---
        // Checks whether k bouquets can be created
        // on a particular day.

        function canMakeBouquets(day) {

            let consecutiveFlowers = 0;
            let bouquets = 0;

            for (const bloomDay of bloomDays) {

                // Flower has bloomed by this day.

                if (bloomDay <= day) {

                    consecutiveFlowers++;

                    // Enough consecutive flowers for one bouquet.

                    if (consecutiveFlowers === m) {

                        bouquets++;

                        // Start counting the next bouquet.

                        consecutiveFlowers = 0;

                        // Required number of bouquets reached.

                        if (bouquets >= k) {
                            return true;
                        }
                    }

                } else {

                    // Non-bloomed flower breaks
                    // the consecutive sequence.

                    consecutiveFlowers = 0;
                }
            }

            return false;
        }


        // --- STEP 11: BINARY SEARCH ON DAY ---

        while (left <= right) {

            // Select the middle day.

            const mid = Math.floor((left + right) / 2);

            // One answer-feasibility check = one comparison.

            comparisons++;

            if (canMakeBouquets(mid)) {

                // Current day is possible.
                // Try to find an earlier possible day.

                minDay = mid;
                right = mid - 1;

            } else {

                // Current day is not enough.
                // Need a later day.

                left = mid + 1;
            }
        }


        // --- STEP 12: RETURN MIN_DAYS RESULT ---

        return {
            possible: minDay !== -1,
            minDay,
            comparisons
        };
    }


    // ============================================================
    // PROBLEM TYPE: PEAK_ELEMENT
    // ============================================================

    if (problemType === "PEAK_ELEMENT") {

        // --- STEP 13: VALIDATE PEAK INPUT ---

        const { nums } = params;

        if (
            !Array.isArray(nums) ||
            nums.length === 0 ||
            !nums.every(
                value =>
                    typeof value === "number" &&
                    Number.isFinite(value)
            ) ||
            new Set(nums).size !== nums.length
        ) {
            return "Invalid Input";
        }


        // --- STEP 14: INITIALIZE BINARY SEARCH ---

        let left = 0;
        let right = nums.length - 1;

        let comparisons = 0;


        // --- STEP 15: FIND PEAK ELEMENT ---

        while (left < right) {

            // Calculate middle index.

            const mid = Math.floor((left + right) / 2);

            // Compare current element with next element.

            comparisons++;

            if (nums[mid] < nums[mid + 1]) {

                // Sequence is increasing.
                // A peak must exist on the right side.

                left = mid + 1;

            } else {

                // Sequence is decreasing.
                // A peak exists at mid or on the left side.

                right = mid;
            }
        }


        // --- STEP 16: LEFT AND RIGHT MEET ---
        // The remaining index is the peak.

        const peakIndex = left;
        const peakValue = nums[peakIndex];


        // --- STEP 17: RETURN PEAK RESULT ---

        return {
            peakValue,
            peakIndex,
            comparisons
        };
    }


    // --- STEP 18: FALLBACK ---
    // This should never execute because problemType
    // was already validated at the beginning.

    return "Invalid Input";
}

// ------ EXAMPLE USAGE ------

console.log(binarySearchOnAnswer("SQRT", { n: 25 }));
console.log(binarySearchOnAnswer("SQRT", { n: 37 }));
console.log(binarySearchOnAnswer("MIN_DAYS", { bloomDays: [1, 10, 3, 10, 2], k: 3, m: 1 }));
console.log(binarySearchOnAnswer("PEAK_ELEMENT", { nums: [1, 2, 3, 1] }));