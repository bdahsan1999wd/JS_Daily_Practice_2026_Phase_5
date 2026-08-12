// 🧩 PROBLEM–03: searchRotatedArray()

// Logic: Searches for a target value inside a rotated sorted array using modified binary search.

// The array was originally sorted in ascending order, but it has been rotated at some pivot.

// Example: [4, 5, 6, 7, 0, 1, 2]

// The algorithm determines which half of the current search range is sorted and then decides which half may contain the target.

// Time Complexity: O(log n)

function searchRotatedArray(rotatedArray, target) {

    // --- STEP 1: VALIDATION ---
    // Validate that rotatedArray is a non-empty array.

    if (
        !Array.isArray(rotatedArray) ||
        rotatedArray.length === 0
    ) {
        return "Invalid Input";
    }

    // Validate that every element is an integer.

    if (
        !rotatedArray.every(
            value => Number.isInteger(value)
        )
    ) {
        return "Invalid Input";
    }

    // The problem requires all values to be distinct.

    if (
        new Set(rotatedArray).size !== rotatedArray.length
    ) {
        return "Invalid Input";
    }

    // Validate target.

    if (!Number.isInteger(target)) {
        return "Invalid Input";
    }

    // --- STEP 2: INITIALIZE SEARCH RANGE ---

    let left = 0;
    let right = rotatedArray.length - 1;

    // Stores how many times the middle value
    // is compared with the target.

    let comparisons = 0;

    // --- STEP 3: MODIFIED BINARY SEARCH ---

    while (left <= right) {

        // Calculate middle index.

        const mid = Math.floor((left + right) / 2);

        // Compare middle value with target.

        comparisons++;

        // Target found.

        if (rotatedArray[mid] === target) {

            return {
                found: true,
                target,
                index: mid,
                comparisons
            };

        }

        // --- STEP 4: DETERMINE SORTED HALF ---

        // If left value <= middle value,
        // the LEFT half is sorted.

        if (rotatedArray[left] <= rotatedArray[mid]) {

            // Check whether target belongs
            // inside the sorted LEFT half.

            if (
                target >= rotatedArray[left] &&
                target < rotatedArray[mid]
            ) {

                // Target may exist in the left half.

                right = mid - 1;

            } else {

                // Target must be in the right half.

                left = mid + 1;

            }

        } else {

            // Otherwise, the RIGHT half is sorted.

            // Check whether target belongs
            // inside the sorted RIGHT half.

            if (
                target > rotatedArray[mid] &&
                target <= rotatedArray[right]
            ) {

                // Target may exist in the right half.

                left = mid + 1;

            } else {

                // Target must be in the left half.

                right = mid - 1;

            }

        }

    }

    // --- STEP 5: TARGET NOT FOUND ---

    return {
        found: false,
        target,
        comparisons
    };

}

// ------ EXAMPLE USAGE ------
console.log(searchRotatedArray([4, 5, 6, 7, 0, 1, 2], 0));
console.log(searchRotatedArray([4, 5, 6, 7, 0, 1, 2], 3));
console.log(searchRotatedArray([6, 7, 8, 1, 2, 3, 4, 5], 3));
console.log(searchRotatedArray([1, 2, 3, 4, 5], 4));