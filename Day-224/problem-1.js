// 🧩 PROBLEM–01: Classic Binary Search

// Logic: Searches for a target value inside a sorted array using the Binary Search algorithm.

// Binary Search works by repeatedly dividing the search range into two halves.

// Steps:
// 1. Find the middle element.
// 2. Compare middle value with target.
// 3. If equal → target found.
// 4. If middle value is smaller → search right half.
// 5. If middle value is greater → search left half.
// 6. Continue until the target is found or range becomes empty.

// Time Complexity: O(log n)

function binarySearch(sortedArray, target) {

    // --- STEP 1: VALIDATION ---
    // Validate that sortedArray is a non-empty array.

    if (
        !Array.isArray(sortedArray) ||
        sortedArray.length === 0
    ) {
        return "Invalid Input";
    }

    // Validate that every element of the array is a number.

    if (
        !sortedArray.every(
            value => typeof value === "number" && !Number.isNaN(value)
        )
    ) {
        return "Invalid Input";
    }

    // Validate that the target is a number.

    if (
        typeof target !== "number" ||
        Number.isNaN(target)
    ) {
        return "Invalid Input";
    }

    // Validate that the array is sorted in ascending order.

    for (let i = 1; i < sortedArray.length; i++) {

        if (sortedArray[i] < sortedArray[i - 1]) {
            return "Invalid Input";
        }

    }

    // --- STEP 2: INITIALIZE SEARCH RANGE ---

    // left points to the first possible index.

    let left = 0;

    // right points to the last possible index.

    let right = sortedArray.length - 1;

    // Stores how many times the middle value
    // was compared with the target.

    let comparisons = 0;

    // --- STEP 3: BINARY SEARCH LOOP ---

    // Continue searching while a valid range exists.

    while (left <= right) {

        // Calculate the middle index.

        const mid = Math.floor((left + right) / 2);

        // Get the value at the middle index.

        const midValue = sortedArray[mid];

        // Count this comparison.

        comparisons++;

        // --- STEP 4: TARGET FOUND ---

        // If middle value equals target,
        // the search is successful.

        if (midValue === target) {

            return {
                found: true,
                target,
                index: mid,
                comparisons
            };

        }

        // --- STEP 5: SEARCH RIGHT HALF ---

        // If middle value is smaller than target,
        // target can only exist on the right side.

        if (midValue < target) {

            left = mid + 1;

        }

        // --- STEP 6: SEARCH LEFT HALF ---

        // If middle value is greater than target,
        // target can only exist on the left side.

        else {

            right = mid - 1;

        }

    }

    // --- STEP 7: TARGET NOT FOUND ---

    // If the loop finishes, the target does not exist
    // in the array.

    return {
        found: false,
        target,
        comparisons
    };

}


// ------ EXAMPLE USAGE ------
console.log(

    binarySearch(
        [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
        7
    )

);

console.log(

    binarySearch(
        [1, 3, 5, 7, 9],
        4
    )

);


// --- ADDITIONAL EXAMPLE ---
console.log(

    binarySearch(
        [10, 20, 30, 40, 50],
        30
    )

);