// 🧩 PROBLEM–05: solveStackQueueChallenge()

// Logic: Solves three different Stack and Queue challenges:

// 1. BALANCED_BRACKETS Uses a stack to check whether brackets are properly opened and closed.

// 2. QUEUE_VIA_STACKS Simulates a Queue using two stacks.

// 3. SORT_STACK Sorts numbers using only stack operations, with the smallest value on top.

// The function returns the result based on the selected challengeType.

function solveStackQueueChallenge(input, challengeType) {

    // --- STEP 1: VALIDATION ---
    // Validate challengeType.

    if (
        ![
            "BALANCED_BRACKETS",
            "QUEUE_VIA_STACKS",
            "SORT_STACK"
        ].includes(challengeType)
    ) {
        return "Invalid Input";
    }


    // =========================================================
    // CHALLENGE 01: BALANCED_BRACKETS
    // =========================================================

    if (challengeType === "BALANCED_BRACKETS") {

        // Input must be a string.

        if (typeof input !== "string") {
            return "Invalid Input";
        }

        // Stack stores opening brackets.

        const stack = [];

        // Define matching closing brackets.

        const matchingBrackets = {
            ")": "(",
            "}": "{",
            "]": "["
        };

        // Define valid opening brackets.

        const openingBrackets = ["(", "{", "["];

        // Traverse every character.

        for (const character of input) {

            // If the character is an opening bracket,
            // push it onto the stack.

            if (openingBrackets.includes(character)) {

                stack.push(character);

                continue;

            }

            // If the character is a closing bracket,
            // check whether it matches the latest
            // opening bracket.

            if (Object.hasOwn(matchingBrackets, character)) {

                // No opening bracket exists to match it.

                if (stack.length === 0) {

                    return {
                        input,
                        isBalanced: false,
                        reason: "Unmatched closing bracket"
                    };

                }

                // Remove the most recent opening bracket.

                const lastOpeningBracket = stack.pop();

                // Check whether the brackets match.

                if (
                    lastOpeningBracket !==
                    matchingBrackets[character]
                ) {

                    return {
                        input,
                        isBalanced: false,
                        reason: "Unmatched closing bracket"
                    };

                }

            }

        }

        // If opening brackets remain in the stack,
        // they were never closed.

        if (stack.length > 0) {

            return {
                input,
                isBalanced: false,
                reason: "Unclosed opening brackets"
            };

        }

        // All brackets were correctly matched.

        return {
            input,
            isBalanced: true,
            reason: null
        };

    }


    // =========================================================
    // CHALLENGE 02: QUEUE_VIA_STACKS
    // =========================================================

    if (challengeType === "QUEUE_VIA_STACKS") {

        // Input must be a non-empty array.

        if (
            !Array.isArray(input) ||
            input.length === 0
        ) {
            return "Invalid Input";
        }

        // Every operation must be a valid object.

        if (
            !input.every(operation =>
                typeof operation === "object" &&
                operation !== null &&
                !Array.isArray(operation) &&
                (
                    operation.op === "ENQUEUE" ||
                    operation.op === "DEQUEUE"
                )
            )
        ) {
            return "Invalid Input";
        }

        // Stack used for incoming/enqueue operations.

        const stack1 = [];

        // Stack used for outgoing/dequeue operations.

        const stack2 = [];

        // Stores the result of every operation.

        const operationLog = [];


        // --- HELPER: MOVE STACK1 TO STACK2 ---
        //
        // When stack2 is empty, move all elements
        // from stack1 to stack2.
        //
        // This reverses the order and gives us
        // FIFO behavior.

        function moveToOutputStack() {

            if (stack2.length === 0) {

                while (stack1.length > 0) {

                    stack2.push(stack1.pop());

                }

            }

        }


        // --- HELPER: GET CURRENT QUEUE STATE ---
        //
        // Queue order is:
        // stack2 from top → bottom
        // followed by stack1 from bottom → top.

        function getQueueState() {

            return [
                ...stack2.slice().reverse(),
                ...stack1.slice().reverse()
            ];

        }


        // --- PROCESS EVERY OPERATION ---

        for (const operation of input) {

            // -----------------------------
            // ENQUEUE
            // -----------------------------

            if (operation.op === "ENQUEUE") {

                // "value" must exist.
                // undefined is not a valid queue value
                // for this challenge.

                if (operation.value === undefined) {
                    return "Invalid Input";
                }

                // Add the value to the input stack.

                stack1.push(operation.value);

                // Record the current queue state.

                operationLog.push({
                    op: "ENQUEUE",
                    value: operation.value,
                    queueState: getQueueState()
                });

                continue;

            }

            // -----------------------------
            // DEQUEUE
            // -----------------------------

            if (operation.op === "DEQUEUE") {

                // Make sure stack2 contains the
                // oldest queued item.

                moveToOutputStack();

                // Dequeue from an empty queue.

                if (stack2.length === 0) {

                    operationLog.push({
                        op: "DEQUEUE",
                        result: undefined,
                        queueState: getQueueState()
                    });

                    continue;

                }

                // Remove the oldest item.

                const result = stack2.pop();

                // Record the dequeue result.

                operationLog.push({
                    op: "DEQUEUE",
                    result,
                    queueState: getQueueState()
                });

            }

        }

        return {
            operationLog
        };

    }


    // =========================================================
    // CHALLENGE 03: SORT_STACK
    // =========================================================

    if (challengeType === "SORT_STACK") {

        // Input must be a non-empty array
        // containing only numbers.

        if (
            !Array.isArray(input) ||
            input.length === 0 ||
            !input.every(number =>
                typeof number === "number" &&
                Number.isFinite(number)
            )
        ) {
            return "Invalid Input";
        }

        // Keep the original input unchanged.

        const original = [...input];

        // Main stack.
        //
        // The input array is pushed into the stack
        // in its original order.

        const mainStack = [];

        // Temporary stack used for sorting.

        const tempStack = [];


        // --- STEP 1: BUILD MAIN STACK ---

        for (const number of input) {

            mainStack.push(number);

        }


        // --- STEP 2: SORT USING TWO STACKS ---
        //
        // Pop one value from the main stack.
        //
        // Move larger values from tempStack back
        // to mainStack until the correct position
        // for the current value is found.
        //
        // Then push the current value into tempStack.

        while (mainStack.length > 0) {

            const current = mainStack.pop();


            // Move larger values back to mainStack.

            while (
                tempStack.length > 0 &&
                tempStack[tempStack.length - 1] > current
            ) {

                mainStack.push(tempStack.pop());

            }

            // Put current value into its
            // correct position in tempStack.

            tempStack.push(current);

        }


        // tempStack now has the smallest element
        // at the bottom and largest at the top.
        //
        // To return an array where resultArray[0]
        // represents the top of the stack,
        // reverse the temporary stack.

        const sorted = [...tempStack].reverse();

        return {
            original,
            sorted
        };

    }


    // --- FALLBACK ---
    // Should never be reached because challengeType
    // was already validated.

    return "Invalid Input";

}



// ------ EXAMPLE USAGE ------


// BALANCED_BRACKETS
console.log(solveStackQueueChallenge("({[]})", "BALANCED_BRACKETS"));

console.log(solveStackQueueChallenge("({[}])", "BALANCED_BRACKETS"));


// QUEUE_VIA_STACKS
console.log(

    solveStackQueueChallenge(

        [
            {
                op: "ENQUEUE",
                value: 1
            },
            {
                op: "ENQUEUE",
                value: 2
            },
            {
                op: "DEQUEUE"
            },
            {
                op: "ENQUEUE",
                value: 3
            }
        ],

        "QUEUE_VIA_STACKS"

    )

);


// SORT_STACK
console.log(solveStackQueueChallenge([34, 3, 31, 98, 92, 23], "SORT_STACK"));