// 🧩 PROBLEM–05: runningSortChallenge()

// Logic: Runs multiple sorting algorithms on the same dataset and compares their performance metrics.

// Supported algorithms:
// 1. BUBBLE
// 2. SELECTION
// 3. INSERTION
// 4. MERGE
// 5. QUICK

// The challenge:
// 1. Validate the challenge configuration
// 2. Run every requested sorting algorithm
// 3. Verify that all algorithms produce the same sorted result
// 4. Build a comparison report
// 5. Find the most efficient algorithm

// IMPORTANT:
// Every algorithm receives a fresh copy of the dataset, so the original dataset is never mutated.

function runningSortChallenge(challengeConfig) {

    // --- STEP 1: VALIDATION ---
    // Validate the main challenge configuration.

    if (
        typeof challengeConfig !== "object" ||
        challengeConfig === null ||
        Array.isArray(challengeConfig)
    ) {
        return "Invalid Input";
    }

    const {
        challengeId,
        dataset,
        algorithms,
        quickPivot
    } = challengeConfig;

    // Validate challengeId.

    if (
        typeof challengeId !== "string" ||
        challengeId.trim() === ""
    ) {
        return "Invalid Input";
    }

    // Validate dataset.

    if (
        !Array.isArray(dataset) ||
        dataset.length === 0 ||
        !dataset.every(
            number => typeof number === "number"
        )
    ) {
        return "Invalid Input";
    }

    // Validate algorithms.

    const validAlgorithms = [
        "BUBBLE",
        "SELECTION",
        "INSERTION",
        "MERGE",
        "QUICK"
    ];

    if (
        !Array.isArray(algorithms) ||
        algorithms.length === 0 ||
        !algorithms.every(
            algorithm =>
                typeof algorithm === "string" &&
                validAlgorithms.includes(algorithm)
        )
    ) {
        return "Invalid Input";
    }

    // Prevent duplicate algorithms because each algorithm should appear only once in the comparison report.

    if (
        new Set(algorithms).size !==
        algorithms.length
    ) {
        return "Invalid Input";
    }

    // quickPivot is required only when QUICK is included in the requested algorithms.

    if (algorithms.includes("QUICK")) {

        if (
            !["FIRST", "LAST", "MIDDLE"].includes(
                quickPivot
            )
        ) {
            return "Invalid Input";
        }
    }

    // --- STEP 2: INTERNAL SORTING FUNCTIONS ---

    // =================================================
    // BUBBLE SORT
    // =================================================

    function runBubbleSort(numbers) {

        const arr = [...numbers];

        let swaps = 0;

        let passes = 0;

        for (
            let i = 0;
            i < arr.length - 1;
            i++
        ) {

            // Track whether this pass performed any swap.

            let swapped = false;

            passes++;

            for (
                let j = 0;
                j < arr.length - i - 1;
                j++
            ) {

                if (arr[j] > arr[j + 1]) {

                    const temp = arr[j];

                    arr[j] = arr[j + 1];

                    arr[j + 1] = temp;

                    swaps++;

                    swapped = true;
                }
            }

            // If no swap occurred, the array is already sorted.

            if (!swapped) {
                break;
            }
        }

        return {
            sorted: arr,
            swaps,
            passes
        };
    }


    // =================================================
    // SELECTION SORT
    // =================================================

    function runSelectionSort(numbers) {

        const arr = [...numbers];

        let swaps = 0;

        let comparisons = 0;

        for (
            let i = 0;
            i < arr.length - 1;
            i++
        ) {

            // Assume current position contains the smallest value.

            let minIndex = i;

            // Search for the actual minimum.

            for (
                let j = i + 1;
                j < arr.length;
                j++
            ) {

                comparisons++;

                if (
                    arr[j] <
                    arr[minIndex]
                ) {
                    minIndex = j;
                }
            }

            // Swap only when a smaller element was found.

            if (minIndex !== i) {

                const temp = arr[i];

                arr[i] = arr[minIndex];

                arr[minIndex] = temp;

                swaps++;
            }
        }

        return {
            sorted: arr,
            swaps,
            comparisons
        };
    }


    // =================================================
    // INSERTION SORT
    // =================================================

    function runInsertionSort(numbers) {

        const arr = [...numbers];

        let shifts = 0;

        let passes = 0;

        // Start from the second element.

        for (
            let i = 1;
            i < arr.length;
            i++
        ) {

            passes++;

            const key = arr[i];

            let j = i - 1;

            // Shift larger elements one position to the right.

            while (
                j >= 0 &&
                arr[j] > key
            ) {

                arr[j + 1] = arr[j];

                shifts++;

                j--;
            }

            // Insert key into its correct position.

            arr[j + 1] = key;
        }

        return {
            sorted: arr,
            shifts,
            passes
        };
    }


    // =================================================
    // MERGE SORT
    // =================================================

    function runMergeSort(numbers) {

        let mergeOperations = 0;

        let comparisons = 0;

        function merge(left, right) {

            mergeOperations++;

            const result = [];

            let i = 0;

            let j = 0;

            while (
                i < left.length &&
                j < right.length
            ) {

                comparisons++;

                if (
                    left[i] <= right[j]
                ) {

                    result.push(left[i]);

                    i++;

                } else {

                    result.push(right[j]);

                    j++;
                }
            }

            // Add remaining left elements.

            while (i < left.length) {

                result.push(left[i]);

                i++;
            }

            // Add remaining right elements.

            while (j < right.length) {

                result.push(right[j]);

                j++;
            }

            return result;
        }

        function sort(arr) {

            // Base case.

            if (arr.length <= 1) {
                return arr;
            }

            const middle =
                Math.floor(arr.length / 2);

            // Divide.

            const left =
                arr.slice(0, middle);

            const right =
                arr.slice(middle);

            // Conquer.

            const sortedLeft =
                sort(left);

            const sortedRight =
                sort(right);

            // Merge.

            return merge(
                sortedLeft,
                sortedRight
            );
        }

        const sorted = sort([...numbers]);

        return {
            sorted,
            mergeOperations,
            comparisons
        };
    }


    // =================================================
    // QUICK SORT
    // =================================================

    function runQuickSort(numbers, pivotStrategy) {

        const arr = [...numbers];

        let comparisons = 0;

        let swaps = 0;

        function swap(index1, index2) {

            if (index1 === index2) {
                return;
            }

            const temp = arr[index1];

            arr[index1] = arr[index2];

            arr[index2] = temp;

            swaps++;
        }

        function getPivotIndex(low, high) {

            if (pivotStrategy === "FIRST") {
                return low;
            }

            if (pivotStrategy === "LAST") {
                return high;
            }

            return Math.floor(
                (low + high) / 2
            );
        }

        function partition(low, high) {

            // Select pivot.

            const pivotIndex =
                getPivotIndex(low, high);

            const pivot =
                arr[pivotIndex];

            // Lomuto partition requires pivot at the end.

            if (pivotIndex !== high) {
                swap(pivotIndex, high);
            }

            let i = low - 1;

            // Partition elements around pivot.

            for (
                let j = low;
                j < high;
                j++
            ) {

                comparisons++;

                if (arr[j] <= pivot) {

                    i++;

                    swap(i, j);
                }
            }

            // Put pivot in its final position.

            swap(i + 1, high);

            return i + 1;
        }

        function sort(low, high) {

            if (low >= high) {
                return;
            }

            const pivotIndex =
                partition(low, high);

            // Sort left partition.

            sort(
                low,
                pivotIndex - 1
            );

            // Sort right partition.

            sort(
                pivotIndex + 1,
                high
            );
        }

        sort(
            0,
            arr.length - 1
        );

        return {
            sorted: arr,
            comparisons,
            swaps
        };
    }


    // --- STEP 3: RUN REQUESTED ALGORITHMS ---

    const results = [];

    for (const algorithm of algorithms) {

        let result;

        // Run the appropriate sorting algorithm.

        if (algorithm === "BUBBLE") {

            result =
                runBubbleSort(dataset);

        } else if (algorithm === "SELECTION") {

            result =
                runSelectionSort(dataset);

        } else if (algorithm === "INSERTION") {

            result =
                runInsertionSort(dataset);

        } else if (algorithm === "MERGE") {

            result =
                runMergeSort(dataset);

        } else if (algorithm === "QUICK") {

            result =
                runQuickSort(
                    dataset,
                    quickPivot
                );
        }

        // Store algorithm name with its result.

        results.push({
            algorithm,
            ...result
        });
    }


    // --- STEP 4: DETERMINE SORTED RESULT ---

    // Use the first algorithm's sorted result as the reference result.

    const sortedResult =
        [...results[0].sorted];


    // --- STEP 5: VERIFY ALL RESULTS MATCH ---

    const allMatch =
        results.every(result =>
            result.sorted.length ===
            sortedResult.length &&
            result.sorted.every(
                (value, index) =>
                    value ===
                    sortedResult[index]
            )
        );


    // --- STEP 6: BUILD COMPARISON REPORT ---

    const comparisonReport =
        results.map(result => {

            // BUBBLE SORT

            if (result.algorithm === "BUBBLE") {

                return {
                    algorithm: "BUBBLE",
                    swaps: result.swaps,
                    passes: result.passes,
                    timeComplexity: "O(n²)"
                };
            }

            // SELECTION SORT

            if (result.algorithm === "SELECTION") {

                return {
                    algorithm: "SELECTION",
                    swaps: result.swaps,
                    comparisons: result.comparisons,
                    timeComplexity: "O(n²)"
                };
            }

            // INSERTION SORT

            if (result.algorithm === "INSERTION") {

                return {
                    algorithm: "INSERTION",
                    shifts: result.shifts,
                    passes: result.passes,
                    timeComplexity: "O(n²)"
                };
            }

            // MERGE SORT

            if (result.algorithm === "MERGE") {

                return {
                    algorithm: "MERGE",
                    mergeOperations:
                        result.mergeOperations,
                    comparisons:
                        result.comparisons,
                    timeComplexity: "O(n log n)"
                };
            }

            // QUICK SORT

            return {
                algorithm: "QUICK",
                comparisons:
                    result.comparisons,
                swaps:
                    result.swaps,
                timeComplexity:
                    "O(n log n) avg"
            };
        });


    // --- STEP 7: FIND MOST EFFICIENT ALGORITHM ---

    // Efficiency is primarily determined by the number of comparisons.

    // If comparison counts are tied, swaps are used as the tiebreaker.

    // For algorithms that do not explicitly track comparisons, use their available metric according to the challenge definition.

    function getComparisonMetric(result) {

        if (
            typeof result.comparisons ===
            "number"
        ) {
            return result.comparisons;
        }

        // Bubble and insertion do not track comparisons in their own problem definitions.

        // Their available secondary operation metric is used as a fallback.

        if (result.algorithm === "BUBBLE") {
            return result.swaps;
        }

        if (result.algorithm === "INSERTION") {
            return result.shifts;
        }

        return Infinity;
    }

    function getSwapMetric(result) {

        if (
            typeof result.swaps ===
            "number"
        ) {
            return result.swaps;
        }

        if (result.algorithm === "INSERTION") {
            return result.shifts;
        }

        if (result.algorithm === "MERGE") {
            return result.mergeOperations;
        }

        return Infinity;
    }

    let mostEfficient =
        results[0];

    for (
        let i = 1;
        i < results.length;
        i++
    ) {

        const current =
            results[i];

        const currentComparisons =
            getComparisonMetric(current);

        const bestComparisons =
            getComparisonMetric(
                mostEfficient
            );

        const currentSwaps =
            getSwapMetric(current);

        const bestSwaps =
            getSwapMetric(
                mostEfficient
            );

        // First compare comparison counts.

        if (
            currentComparisons <
            bestComparisons
        ) {

            mostEfficient = current;

            // If comparisons are equal, compare swaps/operation count.

        } else if (
            currentComparisons ===
            bestComparisons &&
            currentSwaps <
            bestSwaps
        ) {

            mostEfficient = current;
        }
    }


    // --- STEP 8: RETURN FINAL RESULT ---

    return {
        challengeId,
        dataset: [...dataset],
        sortedResult,
        allMatch,
        comparisonReport,
        mostEfficientAlgorithm:
            mostEfficient.algorithm
    };
}

// ------ EXAMPLE USAGE ------

console.log(runningSortChallenge({
    challengeId: "SORT-01",
    dataset: [64, 34, 25, 12, 22, 11, 90],
    algorithms: ["BUBBLE", "MERGE", "QUICK"],
    quickPivot: "LAST"
}));