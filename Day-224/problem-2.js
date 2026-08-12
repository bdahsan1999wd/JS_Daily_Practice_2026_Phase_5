// 🧩 PROBLEM–02: Binary Search Variants

// Logic: Performs different binary search variations on a sorted array.

// Supported variants:
// 1. FIRST_OCCURRENCE  → Find the first index of target.
// 2. LAST_OCCURRENCE   → Find the last index of target.
// 3. COUNT_OCCURRENCES → Count how many times target appears.


// The array must be sorted in ascending order.

// Time Complexity:
// FIRST_OCCURRENCE  → O(log n)
// LAST_OCCURRENCE   → O(log n)
// COUNT_OCCURRENCES → O(log n)

function binarySearchVariant(sortedArray, target, variant) {

    // --- STEP 1: VALIDATION ---
    // Validate that sortedArray is a non-empty array.

    if (
        !Array.isArray(sortedArray) ||
        sortedArray.length === 0
    ) {
        return "Invalid Input";
    }

    // Validate that every array element is a valid number.

    if (
        !sortedArray.every(
            value =>
                typeof value === "number" &&
                !Number.isNaN(value)
        )
    ) {
        return "Invalid Input";
    }

    // Validate target.

    if (
        typeof target !== "number" ||
        Number.isNaN(target)
    ) {
        return "Invalid Input";
    }

    // Validate variant.

    if (
        ![
            "FIRST_OCCURRENCE",
            "LAST_OCCURRENCE",
            "COUNT_OCCURRENCES"
        ].includes(variant)
    ) {
        return "Invalid Input";
    }

    // Validate ascending order.

    for (let i = 1; i < sortedArray.length; i++) {

        if (sortedArray[i] < sortedArray[i - 1]) {
            return "Invalid Input";
        }

    }


    // --- STEP 2: FIRST OCCURRENCE SEARCH ---
    //
    // When target is found:
    // - Store the current index.
    // - Continue searching LEFT.
    //
    // This allows us to find an earlier occurrence.

    function findFirstOccurrence() {

        let left = 0;
        let right = sortedArray.length - 1;

        let firstIndex = -1;
        let comparisons = 0;

        while (left <= right) {

            // Calculate middle index.

            const mid = Math.floor(
                (left + right) / 2
            );

            // Get middle value.

            const midValue = sortedArray[mid];

            // Count this comparison.

            comparisons++;

            // Target found.
            // Store the index and continue LEFT.

            if (midValue === target) {

                firstIndex = mid;
                right = mid - 1;

            }

            // Target is greater.
            // Search RIGHT half.

            else if (midValue < target) {

                left = mid + 1;

            }

            // Target is smaller.
            // Search LEFT half.

            else {

                right = mid - 1;

            }

        }

        return {
            firstIndex,
            comparisons
        };

    }


    // --- STEP 3: LAST OCCURRENCE SEARCH ---
    //
    // When target is found:
    // - Store the current index.
    // - Continue searching RIGHT.
    //
    // This allows us to find a later occurrence.

    function findLastOccurrence() {

        let left = 0;
        let right = sortedArray.length - 1;

        let lastIndex = -1;
        let comparisons = 0;

        while (left <= right) {

            // Calculate middle index.

            const mid = Math.floor(
                (left + right) / 2
            );

            // Get middle value.

            const midValue = sortedArray[mid];

            // Count this comparison.

            comparisons++;

            // Target found.
            // Store the index and continue RIGHT.

            if (midValue === target) {

                lastIndex = mid;
                left = mid + 1;

            }

            // Target is greater.
            // Search RIGHT half.

            else if (midValue < target) {

                left = mid + 1;

            }

            // Target is smaller.
            // Search LEFT half.

            else {

                right = mid - 1;

            }

        }

        return {
            lastIndex,
            comparisons
        };

    }


    // --- STEP 4: HANDLE FIRST_OCCURRENCE ---

    if (variant === "FIRST_OCCURRENCE") {

        const result = findFirstOccurrence();

        // Target was not found.

        if (result.firstIndex === -1) {

            return {
                found: false,
                target,
                comparisons: result.comparisons
            };

        }

        // Target was found.

        return {
            found: true,
            target,
            firstIndex: result.firstIndex,
            comparisons: result.comparisons
        };

    }


    // --- STEP 5: HANDLE LAST_OCCURRENCE ---

    if (variant === "LAST_OCCURRENCE") {

        const result = findLastOccurrence();

        // Target was not found.

        if (result.lastIndex === -1) {

            return {
                found: false,
                target,
                comparisons: result.comparisons
            };

        }

        // Target was found.

        return {
            found: true,
            target,
            lastIndex: result.lastIndex,
            comparisons: result.comparisons
        };

    }


    // --- STEP 6: HANDLE COUNT_OCCURRENCES ---
    //
    // First find the first occurrence.
    // Then find the last occurrence.
    //
    // Count:
    // lastIndex - firstIndex + 1

    if (variant === "COUNT_OCCURRENCES") {

        const firstResult = findFirstOccurrence();

        // If the first occurrence does not exist,
        // target does not exist in the array.

        if (firstResult.firstIndex === -1) {

            return {
                target,
                count: 0,
                firstIndex: null,
                lastIndex: null
            };

        }

        // Find the last occurrence.

        const lastResult = findLastOccurrence();

        // Calculate total occurrences.

        const count =
            lastResult.lastIndex -
            firstResult.firstIndex +
            1;

        return {
            target,
            count,
            firstIndex: firstResult.firstIndex,
            lastIndex: lastResult.lastIndex
        };

    }

}


// ------ EXAMPLE USAGE ------

console.log(

    binarySearchVariant(
        [1, 2, 2, 2, 3, 4, 5],
        2,
        "FIRST_OCCURRENCE"
    )

);

console.log(

    binarySearchVariant(
        [1, 2, 2, 2, 3, 4, 5],
        2,
        "LAST_OCCURRENCE"
    )

);

console.log(

    binarySearchVariant(
        [1, 2, 2, 2, 3, 4, 5],
        2,
        "COUNT_OCCURRENCES"
    )

);

console.log(

    binarySearchVariant(
        [1, 2, 2, 2, 3, 4, 5],
        9,
        "COUNT_OCCURRENCES"
    )

);