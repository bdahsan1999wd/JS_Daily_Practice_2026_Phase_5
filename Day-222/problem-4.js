// 🧩 PROBLEM–04: solveWithMonotonicStack()

// Logic: Solves three different problems using monotonic stack techniques:

// 1. NEXT_GREATER Find the next greater element to the right.

// 2. PREV_SMALLER Find the previous smaller element to the left.

// 3. LARGEST_RECTANGLE Find the largest rectangle area in a histogram.

// The function returns the result based on the selected problemType.

function solveWithMonotonicStack(numbers, problemType) {

    // --- STEP 1: VALIDATION ---
    // Validate numbers and problemType.

    if (
        !Array.isArray(numbers) ||
        numbers.length === 0 ||
        !numbers.every(number =>
            Number.isInteger(number)
        ) ||
        ![
            "NEXT_GREATER",
            "PREV_SMALLER",
            "LARGEST_RECTANGLE"
        ].includes(problemType)
    ) {
        return "Invalid Input";
    }


    // --- STEP 2: NEXT GREATER ---
    // Find the next greater element for every element.

    // We use a monotonic decreasing stack.
    // The stack stores indices whose next
    // greater element has not been found yet.

    if (problemType === "NEXT_GREATER") {

        // Initially every element has no greater element.

        const result = Array(numbers.length).fill(-1);

        // Stores indices of unresolved elements.

        const stack = [];

        // Traverse from left to right.

        for (let i = 0; i < numbers.length; i++) {

            // While the current number is greater
            // than the number at the stack's top index,
            // current number becomes its next greater.

            while (
                stack.length > 0 &&
                numbers[i] > numbers[stack[stack.length - 1]]
            ) {

                const index = stack.pop();

                result[index] = numbers[i];

            }

            // Store current index for future comparison.

            stack.push(i);

        }

        return result;

    }


    // --- STEP 3: PREVIOUS SMALLER ---
    // Find the nearest smaller element
    // for every element on its left.
    //
    // We use a monotonic increasing stack.
    // The stack stores indices of elements that
    // can potentially be previous smaller elements.

    if (problemType === "PREV_SMALLER") {

        // Initially no previous smaller element
        // exists for any position.

        const result = Array(numbers.length).fill(-1);

        // Stores indices of possible
        // previous smaller elements.

        const stack = [];

        // Traverse from left to right.

        for (let i = 0; i < numbers.length; i++) {

            // Remove elements that are greater than
            // or equal to the current element.
            //
            // They cannot be the nearest smaller
            // element for the current position.

            while (
                stack.length > 0 &&
                numbers[stack[stack.length - 1]] >= numbers[i]
            ) {

                stack.pop();

            }

            // If stack still contains an index,
            // its top is the nearest smaller element.

            if (stack.length > 0) {

                result[i] =
                    numbers[stack[stack.length - 1]];

            }

            // Store current index for future elements.

            stack.push(i);

        }

        return result;

    }


    // --- STEP 4: LARGEST RECTANGLE ---
    // Find the largest rectangle area
    // in the histogram.
    //
    // The stack stores indices of bars
    // in increasing height order.

    if (problemType === "LARGEST_RECTANGLE") {

        // Add a zero-height bar at the end.
        // This forces all remaining bars in the
        // stack to be processed.

        const heights = [...numbers, 0];

        // Stores indices of bars in increasing
        // height order.

        const stack = [];

        // Stores the maximum rectangle area found.

        let maxArea = 0;

        // Traverse every histogram bar.

        for (let i = 0; i < heights.length; i++) {

            // Remove taller bars when the current
            // bar is shorter.
            //
            // The popped bar can now determine
            // its maximum possible width.

            while (
                stack.length > 0 &&
                heights[i] < heights[stack[stack.length - 1]]
            ) {

                const heightIndex = stack.pop();

                const height = heights[heightIndex];

                // If the stack is empty after popping,
                // the rectangle extends from index 0.
                //
                // Otherwise, the rectangle starts
                // after the current stack top.

                const width =
                    stack.length === 0
                        ? i
                        : i - stack[stack.length - 1] - 1;

                // Calculate rectangle area.

                const area = height * width;

                // Keep the largest area.

                maxArea = Math.max(maxArea, area);

            }

            // Store current index.

            stack.push(i);

        }

        // Return the required histogram result.
        // Use the original numbers array,
        // not the temporary zero-height bar.

        return {
            maxArea,
            heights: numbers
        };

    }

}


// ------ EXAMPLE USAGE ------
console.log(solveWithMonotonicStack([2, 1, 5, 3, 6, 4], "NEXT_GREATER"));

console.log(solveWithMonotonicStack([2, 1, 5, 3, 6, 4], "PREV_SMALLER"));

console.log(solveWithMonotonicStack([2, 1, 5, 6, 2, 3], "LARGEST_RECTANGLE"));