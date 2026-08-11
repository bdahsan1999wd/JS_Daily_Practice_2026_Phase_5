// 🧩 PROBLEM–04: manipulateLinkedList()

// Logic: Performs different linked-list manipulation operations.

// Supports:
// 1. Merge two sorted linked lists
// 2. Remove duplicate values
// 3. Partition a linked list around a pivot

// The input array is first converted into an internal singly linked list before performing the requested operation.

function manipulateLinkedList(values, operation, params) {

    // --- STEP 1: VALIDATION ---
    // Validate the main input values.

    if (
        !Array.isArray(values) ||
        values.length === 0 ||
        !values.every(value => typeof value === "number") ||
        typeof operation !== "string" ||
        !["MERGE_SORTED", "REMOVE_DUPLICATES", "PARTITION"].includes(operation) ||
        typeof params !== "object" ||
        params === null ||
        Array.isArray(params)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: NODE STRUCTURE ---
    // Creates a single linked-list node.

    function createNode(value) {

        return {
            value,
            next: null
        };

    }

    // --- STEP 3: BUILD LINKED LIST ---
    // Converts the input array into a singly linked list.

    function buildList(array) {

        let head = null;
        let tail = null;

        for (const value of array) {

            const newNode = createNode(value);

            // First node becomes the head.

            if (head === null) {

                head = newNode;
                tail = newNode;

            } else {

                // Attach new node to the end.

                tail.next = newNode;
                tail = newNode;

            }

        }

        return head;

    }

    // --- STEP 4: CONVERT LIST TO ARRAY ---
    // Used to read linked-list values from head to tail.

    function listToArray(head) {

        const result = [];

        let current = head;

        while (current !== null) {

            result.push(current.value);

            current = current.next;

        }

        return result;

    }

    // Build the primary linked list.

    const head = buildList(values);


    // =========================================================
    // OPERATION-01: MERGE_SORTED
    // =========================================================

    if (operation === "MERGE_SORTED") {

        // Validate the second sorted array.

        if (
            !Array.isArray(params.second) ||
            params.second.length === 0 ||
            !params.second.every(value =>
                typeof value === "number"
            )
        ) {
            return "Invalid Input";
        }

        // Build the second linked list.

        const secondHead = buildList(params.second);

        // Create a dummy node to simplify the merge process.

        const dummy = createNode(null);

        let current = dummy;

        let firstPointer = head;
        let secondPointer = secondHead;

        // Compare nodes from both lists.
        // Always attach the smaller value.

        while (
            firstPointer !== null &&
            secondPointer !== null
        ) {

            if (
                firstPointer.value <=
                secondPointer.value
            ) {

                current.next = firstPointer;
                firstPointer = firstPointer.next;

            } else {

                current.next = secondPointer;
                secondPointer = secondPointer.next;

            }

            current = current.next;

        }

        // Attach remaining nodes from the first list.

        if (firstPointer !== null) {

            current.next = firstPointer;

        }

        // Attach remaining nodes from the second list.

        if (secondPointer !== null) {

            current.next = secondPointer;

        }

        // Convert merged linked list into an array.

        const merged = listToArray(dummy.next);

        return {
            merged,
            size: merged.length
        };

    }


    // =========================================================
    // OPERATION-02: REMOVE_DUPLICATES
    // =========================================================

    if (operation === "REMOVE_DUPLICATES") {

        // Store values that have already appeared.

        const seen = new Set();

        // Create a dummy node to simplify deletion.

        const dummy = createNode(null);

        dummy.next = head;

        let previous = dummy;
        let current = head;

        // Traverse the entire linked list.

        while (current !== null) {

            // If the value already exists,
            // remove the current node.

            if (seen.has(current.value)) {

                previous.next = current.next;

            } else {

                // First occurrence is preserved.

                seen.add(current.value);

                previous = current;

            }

            current = current.next;

        }

        // Convert the modified linked list to an array.

        const deduplicated = listToArray(dummy.next);

        // Calculate how many nodes were removed.

        const removedCount =
            values.length - deduplicated.length;

        return {
            original: values,
            deduplicated,
            removedCount
        };

    }


    // =========================================================
    // OPERATION-03: PARTITION
    // =========================================================

    if (operation === "PARTITION") {

        // Validate pivot.

        if (typeof params.pivot !== "number") {

            return "Invalid Input";

        }

        const pivot = params.pivot;

        // Create separate dummy nodes for the
        // two partitions.

        const beforeDummy = createNode(null);
        const afterDummy = createNode(null);

        let beforeTail = beforeDummy;
        let afterTail = afterDummy;

        let current = head;

        // Traverse the original linked list.

        while (current !== null) {

            // Save the next node before rearranging.

            const nextNode = current.next;

            // Detach the current node.

            current.next = null;

            // Values smaller than pivot go into
            // the "before" partition.

            if (current.value < pivot) {

                beforeTail.next = current;
                beforeTail = current;

            } else {

                // Values greater than or equal to pivot
                // go into the "after" partition.

                afterTail.next = current;
                afterTail = current;

            }

            current = nextNode;

        }

        // Connect the two partitions.

        beforeTail.next = afterDummy.next;

        // Convert both partitions to arrays.

        const before = listToArray(beforeDummy.next);

        const after = listToArray(afterDummy.next);

        // Combine both partitions.

        const partitioned = [
            ...before,
            ...after
        ];

        return {
            pivot,
            before,
            after,
            partitioned
        };

    }

}

// --- EXAMPLE USAGE ---

// --- MERGE_SORTED ---
console.log(manipulateLinkedList([1, 3, 5, 7], "MERGE_SORTED", { second: [2, 4, 6, 8] }));

// --- REMOVE_DUPLICATES ---
console.log(manipulateLinkedList([1, 2, 3, 2, 4, 1, 5], "REMOVE_DUPLICATES", {}));

// --- PARTITION ---
console.log(manipulateLinkedList([3, 5, 8, 2, 10, 1, 7], "PARTITION", { pivot: 5 }));