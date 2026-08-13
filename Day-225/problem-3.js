// 🧩 PROBLEM–03: mergeSort()

// Logic: Implements classic Merge Sort using recursive divide-and-conquer.

// Steps:
// 1. Divide the array into two halves
// 2. Recursively sort both halves
// 3. Merge the two sorted halves

// Tracks:
// mergeOperations → number of times merge() is called
// comparisons → total comparisons during merging

// The original array is never mutated.

function mergeSort(numbers) {

    // --- STEP 1: VALIDATION ---
    // Validate that numbers is a non-empty array containing only numbers.

    if (
        !Array.isArray(numbers) ||
        numbers.length === 0 ||
        !numbers.every(number =>
            typeof number === "number"
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: CREATE A COPY ---
    // Keep the original array unchanged.

    const original = [...numbers];

    // Stores the number of merge operations.

    let mergeOperations = 0;

    // Stores the total number of comparisons performed during all merge operations.

    let comparisons = 0;

    // --- STEP 3: MERGE FUNCTION ---
    // Merges two already sorted arrays.

    function merge(left, right) {

        // Every call to merge() represents one merge operation.

        mergeOperations++;

        const result = [];

        // Pointer for the left array.

        let i = 0;

        // Pointer for the right array.

        let j = 0;

        // --- STEP 4: COMPARE BOTH HALVES ---

        while (
            i < left.length &&
            j < right.length
        ) {

            // Compare the current elements from both sorted halves.

            comparisons++;

            if (left[i] <= right[j]) {

                // Left element is smaller or equal.

                result.push(left[i]);

                i++;

            } else {

                // Right element is smaller.

                result.push(right[j]);

                j++;
            }
        }

        // --- STEP 5: ADD REMAINING LEFT ELEMENTS ---

        // No comparison is required here because the remaining elements are already sorted.

        while (i < left.length) {

            result.push(left[i]);

            i++;
        }

        // --- STEP 6: ADD REMAINING RIGHT ELEMENTS ---

        while (j < right.length) {

            result.push(right[j]);

            j++;
        }

        // Return the merged sorted array.

        return result;
    }

    // --- STEP 7: RECURSIVE MERGE SORT ---

    function sort(arr) {

        // Base case: An array with 0 or 1 element is already sorted.

        if (arr.length <= 1) {
            return arr;
        }

        // Find the middle position.

        const middle = Math.floor(arr.length / 2);

        // --- STEP 8: DIVIDE ---

        // Split the array into two halves.

        const left = arr.slice(0, middle);

        const right = arr.slice(middle);

        // --- STEP 9: CONQUER ---

        // Recursively sort both halves.

        const sortedLeft = sort(left);

        const sortedRight = sort(right);

        // --- STEP 10: MERGE ---

        // Merge the two sorted halves.

        return merge(
            sortedLeft,
            sortedRight
        );
    }

    // --- STEP 11: SORT THE ARRAY ---

    const sorted = sort([...numbers]);

    // --- STEP 12: RETURN RESULT ---

    return {
        original,
        sorted,
        mergeOperations,
        comparisons
    };
}

// ------ EXAMPLE USAGE ------

console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]));

// --- ALREADY SORTED ARRAY ---
console.log(mergeSort([1, 2, 3, 4, 5]));

// --- REVERSE ORDER ---
console.log(mergeSort([5, 4, 3, 2, 1]));

// --- INVALID INPUT ---
console.log(mergeSort([10, 20, "30", 40]));