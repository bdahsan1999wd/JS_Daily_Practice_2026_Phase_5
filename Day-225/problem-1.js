// 🧩 PROBLEM–01: runBasicSorts()

// Logic: Implements two basic sorting algorithms:
// 1. BUBBLE SORT
// 2. SELECTION SORT

// The function also tracks:
// Bubble Sort → total swaps and passes
// Selection Sort → total swaps and comparisons

function runBasicSorts(numbers, algorithm) {

    // --- STEP 1: VALIDATION ---
    // Validate that numbers is a non-empty array containing only numbers.

    if (
        !Array.isArray(numbers) ||
        numbers.length === 0 ||
        !numbers.every(number => typeof number === "number")
    ) {
        return "Invalid Input";
    }

    // Validate the selected sorting algorithm.

    if (
        algorithm !== "BUBBLE" &&
        algorithm !== "SELECTION"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: PRESERVE ORIGINAL ARRAY ---
    // Copy the input array so that the original array remains unchanged.

    const original = [...numbers];

    // This is the array that will actually be sorted.

    const arr = [...numbers];

    // --- STEP 3: BUBBLE SORT ---

    if (algorithm === "BUBBLE") {

        // Stores the total number of swaps.

        let swaps = 0;

        // Stores how many passes were actually performed.

        let passes = 0;

        // Outer loop controls each Bubble Sort pass.

        for (let i = 0; i < arr.length - 1; i++) {

            // Assume this pass will not need any swap.

            let swapped = false;

            // Inner loop compares adjacent elements. The last i elements are already sorted, so they are excluded from this pass.

            for (let j = 0; j < arr.length - i - 1; j++) {

                // If the current element is greater than the next element, they are in the wrong order.

                if (arr[j] > arr[j + 1]) {

                    // Swap the two adjacent elements.

                    [arr[j], arr[j + 1]] =
                        [arr[j + 1], arr[j]];

                    // Count this swap.

                    swaps++;

                    // At least one swap happened during this pass.

                    swapped = true;
                }
            }

            // This outer loop iteration was actually used.

            passes++;

            // If no swap happened, the array is already completely sorted, so stop early.

            if (!swapped) {
                break;
            }
        }

        // --- STEP 4: BUBBLE SORT RESULT ---

        return {
            algorithm,
            original,
            sorted: arr,
            swaps,
            passes
        };
    }

    // --- STEP 5: SELECTION SORT ---

    if (algorithm === "SELECTION") {

        // Stores the total number of swaps.

        let swaps = 0;

        // Stores the total number of comparisons.

        let comparisons = 0;

        // Outer loop selects the correct position for each element.

        for (let i = 0; i < arr.length - 1; i++) {

            // Assume the current position contains the minimum value.

            let minIndex = i;

            // Search for the smallest element in the remaining unsorted portion.

            for (let j = i + 1; j < arr.length; j++) {

                // One comparison is made between the current minimum and arr[j].

                comparisons++;

                // If a smaller value is found, remember its index.

                if (arr[j] < arr[minIndex]) {
                    minIndex = j;
                }
            }

            // Swap only when the minimum element is not already at position i.

            if (minIndex !== i) {

                // Move the minimum value to the beginning of the unsorted portion.

                [arr[i], arr[minIndex]] =
                    [arr[minIndex], arr[i]];

                // Count this swap.

                swaps++;
            }
        }

        // --- STEP 6: SELECTION SORT RESULT ---

        return {
            algorithm,
            original,
            sorted: arr,
            swaps,
            comparisons
        };
    }

}


// ------ EXAMPLE USAGE ------

// --- BUBBLE SORT ---
console.log(runBasicSorts([64, 34, 25, 12, 22, 11, 90], "BUBBLE"));

// --- SELECTION SORT ---
console.log(runBasicSorts([64, 34, 25, 12, 22, 11, 90], "SELECTION"));

// --- ALREADY SORTED ARRAY ---
console.log(runBasicSorts([1, 2, 3, 4, 5], "BUBBLE"));

// --- INVALID INPUT ---
console.log(runBasicSorts([10, "20", 30], "BUBBLE"));