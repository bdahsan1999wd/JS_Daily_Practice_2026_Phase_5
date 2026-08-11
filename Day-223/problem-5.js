// 🧩 PROBLEM–05: runLinkedListChallenge()

// Logic: Simulates a complete linked list challenge system.

// Supports:
// 1. Build an initial singly linked list
// 2. Apply multiple operations sequentially
// 3. Append values
// 4. Prepend values
// 5. Delete values
// 6. Reverse the list
// 7. Remove duplicate values
// 8. Find the middle node using two pointers
// 9. Return operation history and final list state

function runLinkedListChallenge(challengeConfig) {

    // --- STEP 1: VALIDATION ---
    // challengeConfig must be a valid object.

    if (
        typeof challengeConfig !== "object" ||
        challengeConfig === null ||
        Array.isArray(challengeConfig)
    ) {
        return "Invalid Input";
    }

    const {
        listId,
        values,
        operations
    } = challengeConfig;

    // Validate the main configuration fields.

    if (
        typeof listId !== "string" ||
        listId.trim() === "" ||
        !Array.isArray(values) ||
        values.length === 0 ||
        !values.every(value => typeof value === "number") ||
        !Array.isArray(operations)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: VALIDATE OPERATIONS ---
    // Every operation must be a valid object
    // with one of the supported operation types.

    const validOperationTypes = [
        "APPEND",
        "PREPEND",
        "DELETE",
        "REVERSE",
        "REMOVE_DUPLICATES",
        "FIND_MIDDLE"
    ];

    const areOperationsValid = operations.every(operation => {

        if (
            typeof operation !== "object" ||
            operation === null ||
            Array.isArray(operation) ||
            typeof operation.type !== "string" ||
            !validOperationTypes.includes(operation.type)
        ) {
            return false;
        }

        // APPEND, PREPEND and DELETE require a value.
        // undefined is not allowed for these operations.

        if (
            ["APPEND", "PREPEND", "DELETE"].includes(operation.type) &&
            operation.value === undefined
        ) {
            return false;
        }

        return true;

    });

    if (!areOperationsValid) {
        return "Invalid Input";
    }

    // --- STEP 3: INTERNAL NODE STRUCTURE ---
    // Each linked list node contains:
    // value -> stores the actual value
    // next  -> points to the next node

    function createNode(value) {

        return {
            value,
            next: null
        };

    }

    // --- STEP 4: INTERNAL LINKED LIST STATE ---

    let head = null;
    let tail = null;
    let listSize = 0;

    // --- STEP 5: APPEND HELPER ---
    // Adds a new node to the end of the list.

    function append(value) {

        const newNode = createNode(value);

        // If the list is empty,
        // the new node becomes both head and tail.

        if (head === null) {

            head = newNode;
            tail = newNode;

        } else {

            // Connect the current tail to the new node.

            tail.next = newNode;

            // Move tail to the new node.

            tail = newNode;

        }

        listSize++;

        return {
            appended: true,
            value,
            size: listSize
        };

    }

    // --- STEP 6: PREPEND HELPER ---
    // Adds a new node to the beginning of the list.

    function prepend(value) {

        const newNode = createNode(value);

        // New node points to the current head.

        newNode.next = head;

        // New node becomes the new head.

        head = newNode;

        // If the list was empty,
        // the new node is also the tail.

        if (tail === null) {
            tail = newNode;
        }

        listSize++;

        return {
            prepended: true,
            value,
            size: listSize
        };

    }

    // --- STEP 7: DELETE HELPER ---
    // Deletes the first node matching the given value.

    function deleteValue(value) {

        // Handle an empty list.

        if (head === null) {

            return {
                deleted: false,
                reason: "Value not found"
            };

        }

        // If the head contains the value,
        // remove the head node.

        if (head.value === value) {

            head = head.next;

            listSize--;

            // If the list becomes empty,
            // reset tail as well.

            if (head === null) {
                tail = null;
            }

            return {
                deleted: true,
                value,
                size: listSize
            };

        }

        // Start searching from the node after head.

        let current = head;

        while (
            current.next !== null &&
            current.next.value !== value
        ) {
            current = current.next;
        }

        // No matching node was found.

        if (current.next === null) {

            return {
                deleted: false,
                reason: "Value not found"
            };

        }

        // Store the node that will be deleted.

        const deletedNode = current.next;

        // Skip the deleted node.

        current.next = deletedNode.next;

        // If the deleted node was the tail,
        // update the tail pointer.

        if (deletedNode === tail) {
            tail = current;
        }

        listSize--;

        return {
            deleted: true,
            value,
            size: listSize
        };

    }

    // --- STEP 8: TO ARRAY HELPER ---
    // Converts the linked list into a normal array.

    function toArray() {

        const result = [];

        let current = head;

        while (current !== null) {

            result.push(current.value);

            current = current.next;

        }

        return result;

    }

    // --- STEP 9: REVERSE HELPER ---
    // Reverses the linked list in-place.

    function reverse() {

        let previous = null;
        let current = head;

        // The old head becomes the new tail.

        tail = head;

        // Reverse every next pointer.

        while (current !== null) {

            const nextNode = current.next;

            current.next = previous;

            previous = current;
            current = nextNode;

        }

        // Previous becomes the new head.

        head = previous;

        return {
            reversed: true,
            list: toArray()
        };

    }

    // --- STEP 10: REMOVE DUPLICATES HELPER ---
    // Removes duplicate values while keeping
    // the first occurrence of each value.

    function removeDuplicates() {

        const seen = new Set();

        let current = head;
        let previous = null;
        let removedCount = 0;

        while (current !== null) {

            // If value already exists,
            // remove the current node.

            if (seen.has(current.value)) {

                previous.next = current.next;

                // If the duplicate node was the tail,
                // update the tail pointer.

                if (current === tail) {
                    tail = previous;
                }

                listSize--;
                removedCount++;

            } else {

                // First occurrence is kept.

                seen.add(current.value);
                previous = current;

            }

            current = current.next;

        }

        return {
            deduplicated: toArray(),
            removedCount
        };

    }

    // --- STEP 11: FIND MIDDLE HELPER ---
    // Uses slow/fast pointers.
    //
    // Slow moves one node at a time.
    // Fast moves two nodes at a time.
    //
    // For an even-sized list, this returns
    // the SECOND middle node.

    function findMiddle() {

        let slow = head;
        let fast = head;

        // Track the position of the slow pointer.

        let position = 1;

        while (
            fast !== null &&
            fast.next !== null
        ) {

            slow = slow.next;
            fast = fast.next.next;

            position++;

        }

        return {
            middleValue: slow.value,
            position,
            totalNodes: listSize
        };

    }

    // --- STEP 12: BUILD INITIAL LIST ---
    // Insert every value from the initial values array.

    for (const value of values) {

        append(value);

    }

    // Keep a snapshot of the original list
    // before any operations are applied.

    const initialList = toArray();

    // --- STEP 13: OPERATION LOG ---
    // Stores the result of every operation
    // in the exact order it was executed.

    const operationLog = [];

    // --- STEP 14: PROCESS OPERATIONS ---
    // Execute each operation sequentially.
    // Mutating operations change the linked list state.

    for (const operation of operations) {

        let result;

        switch (operation.type) {

            // -----------------------------
            // APPEND
            // -----------------------------
            case "APPEND":

                result = append(operation.value);

                break;


            // -----------------------------
            // PREPEND
            // -----------------------------
            case "PREPEND":

                result = prepend(operation.value);

                break;


            // -----------------------------
            // DELETE
            // -----------------------------
            case "DELETE":

                result = deleteValue(operation.value);

                break;


            // -----------------------------
            // REVERSE
            // -----------------------------
            case "REVERSE":

                result = reverse();

                break;


            // -----------------------------
            // REMOVE DUPLICATES
            // -----------------------------
            case "REMOVE_DUPLICATES":

                result = removeDuplicates();

                break;


            // -----------------------------
            // FIND MIDDLE
            // -----------------------------
            // This operation does not modify
            // the linked list.

            case "FIND_MIDDLE":

                result = findMiddle();

                break;

        }

        // Store the operation type and
        // its corresponding result.

        operationLog.push({
            type: operation.type,
            result
        });

    }

    // --- STEP 15: FINAL RESULT ---
    // Return the complete challenge report.

    return {
        listId,
        initialList,
        operationLog,
        finalList: toArray(),
        finalSize: listSize
    };

}


// --- EXAMPLE USAGE ---
console.log(runLinkedListChallenge({

    listId: "LIST-01", values: [3, 1, 4, 1, 5, 9, 2, 6],

    operations: [

        {
            type: "REMOVE_DUPLICATES"
        },

        {
            type: "APPEND",
            value: 7
        },

        {
            type: "REVERSE"
        },

        {
            type: "FIND_MIDDLE"
        }

    ]

})

);