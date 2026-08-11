// 🧩 PROBLEM–03: solveWithTwoPointers()

// Logic: Builds an internal singly linked list from an array and applies the Two Pointer Technique.

// Supports:
// 1. FIND_MIDDLE
// 2. DETECT_CYCLE
// 3. NTH_FROM_END

function solveWithTwoPointers(values, problemType) {

    // --- STEP 1: VALIDATION ---
    // Validate the input array and problem type.

    if (
        !Array.isArray(values) ||
        values.length === 0 ||
        !["FIND_MIDDLE", "DETECT_CYCLE", "NTH_FROM_END"].includes(
            problemType
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD INTERNAL LINKED LIST ---
    // Each node contains a value and a reference
    // to the next node.

    let head = null;
    let tail = null;

    // The first element is N for NTH_FROM_END.
    // Therefore, the actual list values start from index 1.

    const listValues =
        problemType === "NTH_FROM_END"
            ? values.slice(1)
            : values;

    // Validate N for NTH_FROM_END.

    if (
        problemType === "NTH_FROM_END" &&
        (
            !Number.isInteger(values[0]) ||
            values[0] < 1
        )
    ) {
        return "Invalid Input";
    }

    // Build the linked list.

    for (const value of listValues) {

        // undefined values are not allowed.

        if (value === undefined) {
            return "Invalid Input";
        }

        const newNode = {
            value,
            next: null
        };

        // First node becomes the head.

        if (head === null) {

            head = newNode;
            tail = newNode;

        } else {

            // Add new node to the end.

            tail.next = newNode;
            tail = newNode;

        }

    }

    // Total number of nodes.

    const totalNodes = listValues.length;

    // --- STEP 3: FIND MIDDLE ---
    // Slow pointer moves one step at a time.
    // Fast pointer moves two steps at a time.
    //
    // When fast reaches the end, slow points to
    // the middle node.
    //
    // For an even-sized list, this naturally gives
    // the SECOND middle node.

    if (problemType === "FIND_MIDDLE") {

        let slow = head;
        let fast = head;

        // Continue until fast reaches the end.

        while (
            fast !== null &&
            fast.next !== null
        ) {

            slow = slow.next;
            fast = fast.next.next;

        }

        // Find the 1-based position of the slow pointer.

        let position = 1;
        let current = head;

        while (current !== slow) {

            current = current.next;
            position++;

        }

        return {
            middleValue: slow.value,
            position,
            totalNodes
        };

    }

    // --- STEP 4: DETECT CYCLE ---
    // Since the linked list is created directly from
    // an array, there is no actual cycle.
    //
    // We still use slow/fast pointers to demonstrate
    // the cycle detection traversal.

    if (problemType === "DETECT_CYCLE") {

        let slow = head;
        let fast = head;

        // Move slow by one step and fast by two steps.

        while (
            fast !== null &&
            fast.next !== null
        ) {

            slow = slow.next;
            fast = fast.next.next;

        }

        // Traverse the list normally to count nodes.

        let traversedNodes = 0;
        let current = head;

        while (current !== null) {

            traversedNodes++;
            current = current.next;

        }

        return {
            hasCycle: false,
            message: "No cycle detected",
            nodeCount: totalNodes,
            traversedNodes
        };

    }

    // --- STEP 5: FIND NTH NODE FROM END ---
    // The first element of values represents N.

    // Example:
    // values = [2, 10, 20, 30, 40, 50]

    // N = 2
    // Actual list = [10, 20, 30, 40, 50]

    // We move the fast pointer N steps ahead first.
    // Then move both pointers together.

    // When fast reaches null, slow points to
    // the Nth node from the end.

    if (problemType === "NTH_FROM_END") {

        const n = values[0];

        // Check whether N exceeds the list length.

        if (n > totalNodes) {

            return {
                error: "N exceeds list length"
            };

        }

        let fast = head;
        let slow = head;

        // Move fast pointer N steps ahead.

        for (let i = 0; i < n; i++) {

            fast = fast.next;

        }

        // Move both pointers until fast reaches the end.

        while (fast !== null) {

            slow = slow.next;
            fast = fast.next;

        }

        // Find the 1-based position from the head.

        let position = 1;
        let current = head;

        while (current !== slow) {

            current = current.next;
            position++;

        }

        return {
            n,
            nthFromEnd: slow.value,
            position
        };

    }

}

// --- EXAMPLE USAGE ---
console.log(solveWithTwoPointers([1, 2, 3, 4, 5], "FIND_MIDDLE"));
console.log(solveWithTwoPointers([1, 2, 3, 4, 5, 6], "FIND_MIDDLE"));
console.log(solveWithTwoPointers([1, 2, 3, 4, 5], "DETECT_CYCLE"));
console.log(solveWithTwoPointers([2, 10, 20, 30, 40, 50], "NTH_FROM_END"));
console.log(solveWithTwoPointers([6, 10, 20, 30, 40, 50], "NTH_FROM_END"));