// 🧩 PROBLEM–02: insertionSort()

// Logic: Implements Insertion Sort for:
// 1. Arrays of numbers
// 2. Arrays of objects using a comparator key

// The function also tracks:
// shifts → number of times an element moves one position right
// passes → number of outer loop iterations

// The original array is never mutated.

function insertionSort(items, comparatorKey) {

    // --- STEP 1: VALIDATION ---
    // Validate that items is a non-empty array.

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return "Invalid Input";
    }

    // comparatorKey must be either null or a string.

    if (
        comparatorKey !== null &&
        typeof comparatorKey !== "string"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: VALIDATE ARRAY CONTENT ---

    if (comparatorKey === null) {

        // When comparatorKey is null, every item must be a number.

        if (
            !items.every(item =>
                typeof item === "number"
            )
        ) {
            return "Invalid Input";
        }

    } else {

        // When comparatorKey is a string, every item must be a non-null object.

        if (
            !items.every(item =>
                typeof item === "object" &&
                item !== null &&
                !Array.isArray(item)
            )
        ) {
            return "Invalid Input";
        }

        // Every object must contain the requested key and its value must be a number.

        if (
            !items.every(item =>
                Object.prototype.hasOwnProperty.call(
                    item,
                    comparatorKey
                ) &&
                typeof item[comparatorKey] === "number"
            )
        ) {
            return "Invalid Input";
        }
    }

    // --- STEP 3: CREATE A COPY ---
    // Work on a copy so the original array remains unchanged.

    const original = [...items];

    const arr = [...items];

    // Stores the total number of shift operations.

    let shifts = 0;

    // Insertion Sort always performs n - 1 outer-loop iterations.

    let passes = arr.length - 1;

    // --- STEP 4: INSERTION SORT ---

    // Start from index 1 because the first element is already considered sorted.

    for (let i = 1; i < arr.length; i++) {

        // Store the current element that needs to be inserted into the sorted portion.

        const key = arr[i];

        // Start comparing from the element immediately before the key.

        let j = i - 1;

        // --- STEP 5: SHIFT ELEMENTS ---

        // Continue moving larger elements one position to the right.

        while (
            j >= 0 &&
            (
                comparatorKey === null
                    ? arr[j] > key
                    : arr[j][comparatorKey] > key[comparatorKey]
            )
        ) {

            // Move the larger element one position right.

            arr[j + 1] = arr[j];

            // Count this single shift operation.

            shifts++;

            // Move one position toward the beginning.

            j--;
        }

        // --- STEP 6: INSERT KEY ---

        // Place the stored element into its correct sorted position.

        arr[j + 1] = key;
    }

    // --- STEP 7: RETURN RESULT ---

    return {
        original,
        sorted: arr,
        shifts,
        passes
    };
}


// ------ EXAMPLE USAGE ------

// --- NUMBER ARRAY ---
console.log(insertionSort([12, 11, 13, 5, 6], null));


// --- OBJECT ARRAY ---
console.log(

    insertionSort(

        [
            {
                name: "Karim",
                score: 70
            },
            {
                name: "Rahim",
                score: 90
            },
            {
                name: "Nadia",
                score: 55
            }
        ],

        "score"

    )

);

// --- ALREADY SORTED ARRAY ---
console.log(insertionSort([1, 2, 3, 4, 5], null));

// --- INVALID INPUT ---
console.log(insertionSort([10, "20", 30], null));