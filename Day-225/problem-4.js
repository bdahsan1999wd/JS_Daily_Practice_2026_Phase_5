// 🧩 PROBLEM–04: quickSort()

// Logic: Implements Quick Sort using recursive divide-and-conquer with in-place partitioning.

// Steps:
// 1. Select a pivot based on pivotStrategy
// 2. Move the pivot to the end
// 3. Apply Lomuto partition
// 4. Recursively sort the left and right partitions

// Tracks:
// comparisons → comparisons made during partitioning
// swaps → total number of swaps

// The original array is never mutated.

function quickSort(numbers, pivotStrategy) {

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

    // Validate pivot strategy.

    if (
        !["FIRST", "LAST", "MIDDLE"].includes(
            pivotStrategy
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: CREATE A COPY ---
    // Work on a copy so the original array remains unchanged.

    const original = [...numbers];

    const arr = [...numbers];

    // Stores total partition comparisons.

    let comparisons = 0;

    // Stores total swaps.

    let swaps = 0;

    // --- STEP 3: SWAP HELPER ---

    function swap(index1, index2) {

        // No need to count a swap when both indexes are the same.

        if (index1 === index2) {
            return;
        }

        const temp = arr[index1];

        arr[index1] = arr[index2];

        arr[index2] = temp;

        swaps++;
    }

    // --- STEP 4: SELECT PIVOT ---

    function getPivotIndex(low, high) {

        if (pivotStrategy === "FIRST") {

            // First element of current subarray.

            return low;
        }

        if (pivotStrategy === "LAST") {

            // Last element of current subarray.

            return high;
        }

        // Middle element of current subarray.

        return Math.floor(
            (low + high) / 2
        );
    }

    // --- STEP 5: LOMUTO PARTITION ---

    function partition(low, high) {

        // Select pivot according to the
        // requested strategy.

        const pivotIndex =
            getPivotIndex(low, high);

        const pivot = arr[pivotIndex];

        // Lomuto partition requires the pivot to be placed at the end.

        if (pivotIndex !== high) {
            swap(pivotIndex, high);
        }

        // i tracks the position where the next smaller/equal element should go.

        let i = low - 1;

        // --- STEP 6: PARTITION LOOP ---

        for (
            let j = low;
            j < high;
            j++
        ) {

            // Compare current element with pivot.

            comparisons++;

            if (arr[j] <= pivot) {

                // Move boundary forward.

                i++;

                // Place current element inside the smaller/equal partition.

                swap(i, j);
            }
        }

        // --- STEP 7: PLACE PIVOT ---

        // Move pivot from the end to its correct sorted position.

        swap(i + 1, high);

        // Return the final pivot position.

        return i + 1;
    }

    // --- STEP 8: RECURSIVE QUICK SORT ---

    function sort(low, high) {

        // Continue only when the subarray contains at least two elements.

        if (low >= high) {
            return;
        }

        // Partition the current subarray.

        const pivotIndex =
            partition(low, high);

        // Recursively sort the left side.

        sort(
            low,
            pivotIndex - 1
        );

        // Recursively sort the right side.

        sort(
            pivotIndex + 1,
            high
        );
    }

    // --- STEP 9: START SORTING ---

    sort(0, arr.length - 1);

    // --- STEP 10: RETURN RESULT ---

    return {
        pivotStrategy,
        original,
        sorted: arr,
        comparisons,
        swaps
    };
}

// ------ EXAMPLE USAGE ------

// --- LAST PIVOT ---
console.log(quickSort([10, 7, 8, 9, 1, 5], "LAST"));

// --- FIRST PIVOT ---
console.log(quickSort([10, 7, 8, 9, 1, 5], "FIRST"));

// --- MIDDLE PIVOT ---
console.log(quickSort([10, 7, 8, 9, 1, 5], "MIDDLE"));

// --- INVALID INPUT ---
console.log(quickSort([10, 7, "8", 9], "LAST"));