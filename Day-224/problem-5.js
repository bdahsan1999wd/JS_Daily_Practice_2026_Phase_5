// 🧩 PROBLEM–05: runBinarySearchChallenge()

// Logic: Runs multiple binary-search-related queries on a dataset.

// Supported query types:
// 1. SEARCH  → Classic Binary Search
// 2. FIRST   → First occurrence
// 3. LAST    → Last occurrence
// 4. COUNT   → Count occurrences
// 5. ROTATED → Rotate dataset and perform rotated binary search

// The function combines the concepts from -> Problem-01, Problem-02 and Problem-03.

function runBinarySearchChallenge(challengeConfig) {

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
        queries
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
            value =>
                typeof value === "number" &&
                Number.isFinite(value)
        )
    ) {
        return "Invalid Input";
    }

    // Validate that dataset is sorted in ascending order.

    for (let i = 1; i < dataset.length; i++) {

        if (dataset[i] < dataset[i - 1]) {
            return "Invalid Input";
        }

    }

    // Validate queries.

    if (
        !Array.isArray(queries) ||
        !queries.every(query =>
            typeof query === "object" &&
            query !== null &&
            !Array.isArray(query)
        )
    ) {
        return "Invalid Input";
    }


    // --- STEP 2: VALIDATE EACH QUERY ---

    const validQueryTypes = [
        "SEARCH",
        "FIRST",
        "LAST",
        "COUNT",
        "ROTATED"
    ];

    for (const query of queries) {

        if (
            !validQueryTypes.includes(query.type) ||
            typeof query.target !== "number" ||
            !Number.isFinite(query.target)
        ) {
            return "Invalid Input";
        }

    }


    // --- STEP 3: INTERNAL SEARCH FUNCTIONS ---

    // Classic iterative binary search.
    //
    // Returns:
    // { found, target, index, comparisons }

    function classicSearch(arr, target) {

        let left = 0;
        let right = arr.length - 1;
        let comparisons = 0;

        while (left <= right) {

            const mid = Math.floor(
                (left + right) / 2
            );

            comparisons++;

            if (arr[mid] === target) {

                return {
                    found: true,
                    target,
                    index: mid,
                    comparisons
                };

            }

            if (arr[mid] < target) {

                left = mid + 1;

            } else {

                right = mid - 1;

            }

        }

        return {
            found: false,
            target,
            comparisons
        };
    }


    // Find the FIRST occurrence of target.

    function findFirst(arr, target) {

        let left = 0;
        let right = arr.length - 1;

        let firstIndex = -1;
        let comparisons = 0;

        while (left <= right) {

            const mid = Math.floor(
                (left + right) / 2
            );

            comparisons++;

            if (arr[mid] === target) {

                // Store the current occurrence.

                firstIndex = mid;

                // Continue searching to the LEFT
                // for an earlier occurrence.

                right = mid - 1;

            } else if (arr[mid] < target) {

                left = mid + 1;

            } else {

                right = mid - 1;

            }

        }

        if (firstIndex === -1) {

            return {
                found: false,
                target,
                comparisons
            };

        }

        return {
            found: true,
            target,
            firstIndex,
            comparisons
        };
    }


    // Find the LAST occurrence of target.

    function findLast(arr, target) {

        let left = 0;
        let right = arr.length - 1;

        let lastIndex = -1;
        let comparisons = 0;

        while (left <= right) {

            const mid = Math.floor(
                (left + right) / 2
            );

            comparisons++;

            if (arr[mid] === target) {

                // Store the current occurrence.

                lastIndex = mid;

                // Continue searching to the RIGHT
                // for a later occurrence.

                left = mid + 1;

            } else if (arr[mid] < target) {

                left = mid + 1;

            } else {

                right = mid - 1;

            }

        }

        if (lastIndex === -1) {

            return {
                found: false,
                target,
                comparisons
            };

        }

        return {
            found: true,
            target,
            lastIndex,
            comparisons
        };
    }


    // Count how many times target occurs.

    function countOccurrences(arr, target) {

        // First find the first occurrence.

        const firstResult = findFirst(
            arr,
            target
        );

        // If target does not exist,
        // count is zero.

        if (!firstResult.found) {

            return {
                target,
                count: 0,
                firstIndex: null,
                lastIndex: null,
                comparisons:
                    firstResult.comparisons
            };
        }

        // Then find the last occurrence.

        const lastResult = findLast(
            arr,
            target
        );

        const count =
            lastResult.lastIndex -
            firstResult.firstIndex +
            1;

        return {
            target,
            count,
            firstIndex: firstResult.firstIndex,
            lastIndex: lastResult.lastIndex,

            // COUNT uses both binary searches,
            // so total comparisons are added.

            comparisons:
                firstResult.comparisons +
                lastResult.comparisons
        };
    }


    // Search inside a rotated sorted array.
    //
    // The rotated array contains distinct values
    // because Problem-03 requires distinct integers.

    function searchRotated(arr, target) {

        let left = 0;
        let right = arr.length - 1;

        let comparisons = 0;

        while (left <= right) {

            const mid = Math.floor(
                (left + right) / 2
            );

            comparisons++;

            if (arr[mid] === target) {

                return {
                    found: true,
                    target,
                    index: mid,
                    comparisons
                };
            }

            // Determine whether LEFT half is sorted.

            if (arr[left] <= arr[mid]) {

                // Target belongs to the sorted LEFT half.

                if (
                    target >= arr[left] &&
                    target < arr[mid]
                ) {

                    right = mid - 1;

                } else {

                    left = mid + 1;

                }

            } else {

                // RIGHT half is sorted.

                if (
                    target > arr[mid] &&
                    target <= arr[right]
                ) {

                    left = mid + 1;

                } else {

                    right = mid - 1;

                }
            }
        }

        return {
            found: false,
            target,
            comparisons
        };
    }


    // --- STEP 4: CREATE ROTATED DATASET ---

    // Problem-05 says:
    // Move the FIRST element to the END.

    // Example:
    // [1, 2, 3, 4, 5]
    // →
    // [2, 3, 4, 5, 1]

    // However, Problem-03 requires DISTINCT values.
    // Therefore ROTATED queries are only valid when
    // the dataset contains distinct values.

    const hasDuplicates =
        new Set(dataset).size !== dataset.length;

    let rotatedDataset = null;

    if (!hasDuplicates) {

        rotatedDataset = [
            ...dataset.slice(1),
            dataset[0]
        ];

    }


    // --- STEP 5: PROCESS ALL QUERIES ---

    const queryLog = [];

    let totalComparisons = 0;
    let foundCount = 0;


    for (const query of queries) {

        let result;


        // --- SEARCH QUERY ---
        // Use classic binary search.

        if (query.type === "SEARCH") {

            result = classicSearch(
                dataset,
                query.target
            );

        }


        // --- FIRST QUERY ---
        // Find first occurrence.

        else if (query.type === "FIRST") {

            result = findFirst(
                dataset,
                query.target
            );

        }


        // --- LAST QUERY ---
        // Find last occurrence.

        else if (query.type === "LAST") {

            result = findLast(
                dataset,
                query.target
            );

        }


        // --- COUNT QUERY ---
        // Find first + last occurrence
        // and calculate total count.

        else if (query.type === "COUNT") {

            result = countOccurrences(
                dataset,
                query.target
            );

        }


        // --- ROTATED QUERY ---
        // Rotate dataset and search using
        // modified binary search.

        else if (query.type === "ROTATED") {

            // Problem-03 requires distinct values.

            if (hasDuplicates) {

                return "Invalid Input";
            }

            result = searchRotated(
                rotatedDataset,
                query.target
            );
        }


        // --- STEP 6: ADD RESULT TO QUERY LOG ---

        queryLog.push({
            type: query.type,
            target: query.target,
            result
        });


        // --- STEP 7: UPDATE COMPARISON COUNT ---

        // COUNT has an internal comparisons property,
        // but the final COUNT result specified by
        // Problem-02 does not expose comparisons.

        // We still use it for the challenge summary.

        if (typeof result.comparisons === "number") {

            totalComparisons += result.comparisons;
        }


        // --- STEP 8: UPDATE FOUND COUNT ---

        // SEARCH / FIRST / LAST / ROTATED:
        // found === true means successful.

        if (result.found === true) {

            foundCount++;

        }

        // COUNT:
        // count > 0 means successful.

        else if (
            query.type === "COUNT" &&
            result.count > 0
        ) {

            foundCount++;
        }

    }


    // --- STEP 9: REMOVE INTERNAL COMPARISONS ---
    //
    // COUNT result in Problem-02 does NOT contain
    // a comparisons property.
    //
    // Therefore remove it before returning the final log.

    for (const entry of queryLog) {

        if (entry.type === "COUNT") {

            delete entry.result.comparisons;
        }

    }


    // --- STEP 10: BUILD FINAL SUMMARY ---

    return {
        challengeId,

        queryLog,

        summary: {
            totalQueries: queries.length,
            totalComparisons,
            foundCount
        }
    };
}


// ------ EXAMPLE USAGE ------

console.log(runBinarySearchChallenge({
    challengeId: "BS-01", dataset: [1, 2, 2, 3, 3, 3, 4, 5],

    queries: [

        {
            type: "SEARCH",
            target: 3
        },

        {
            type: "FIRST",
            target: 3
        },

        {
            type: "LAST",
            target: 3
        },

        {
            type: "COUNT",
            target: 3
        },

        {
            type: "COUNT",
            target: 9
        }

    ]

})

);