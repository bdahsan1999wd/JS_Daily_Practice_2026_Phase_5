// 🧩 PROBLEM–02: createDoublyLinkedList()

// Logic: Creates a doubly linked list using internal nodes. Each node maintains both:
// 1. A next pointer to the next node
// 2. A prev pointer to the previous node

// Supports:
// 1. Append a node to the end
// 2. Prepend a node to the beginning
// 3. Insert a node at a specific position
// 4. Delete a node at a specific position
// 5. Convert the list to an array from head to tail
// 6. Convert the list to an array from tail to head
// 7. Get the current list size

function createDoublyLinkedList() {

    // --- STEP 1: INTERNAL NODE CREATION ---
    // Creates a new doubly linked list node.

    function createNode(value) {

        return {
            value,
            next: null,
            prev: null
        };

    }

    // --- STEP 2: INTERNAL LINKED LIST STATE ---

    // Points to the first node in the list.

    let head = null;

    // Points to the last node in the list.

    let tail = null;

    // Tracks the total number of nodes.

    let listSize = 0;

    // --- STEP 3: RETURN LINKED LIST METHODS ---

    return {

        // -----------------------------
        // Add a node to the END
        // -----------------------------
        append(value) {

            // undefined is not allowed.

            if (value === undefined) {
                return "Invalid Input";
            }

            // Create a new node.

            const newNode = createNode(value);

            // If the list is empty, the new node
            // becomes both head and tail.

            if (head === null) {

                head = newNode;
                tail = newNode;

            } else {

                // Connect the current tail to
                // the new node.

                tail.next = newNode;

                // Connect the new node back to
                // the current tail.

                newNode.prev = tail;

                // Update tail.

                tail = newNode;

            }

            // Increase list size.

            listSize++;

            return {
                appended: true,
                value,
                size: listSize
            };

        },

        // -----------------------------
        // Add a node to the BEGINNING
        // -----------------------------
        prepend(value) {

            // undefined is not allowed.

            if (value === undefined) {
                return "Invalid Input";
            }

            // Create a new node.

            const newNode = createNode(value);

            // If the list is empty, the new node
            // becomes both head and tail.

            if (head === null) {

                head = newNode;
                tail = newNode;

            } else {

                // Connect the new node to
                // the current head.

                newNode.next = head;

                // Connect the current head back
                // to the new node.

                head.prev = newNode;

                // Update head.

                head = newNode;

            }

            // Increase list size.

            listSize++;

            return {
                prepended: true,
                value,
                size: listSize
            };

        },

        // -----------------------------
        // Insert a node at a position
        // -----------------------------
        insertAt(value, position) {

            // Validate value.

            if (value === undefined) {
                return "Invalid Input";
            }

            // Position must be an integer.

            if (!Number.isInteger(position)) {
                return "Invalid Input";
            }

            // Position must be between 1 and size + 1.

            if (
                position < 1 ||
                position > listSize + 1
            ) {
                return {
                    error: "Invalid position"
                };
            }

            // Position 1 means inserting at the beginning.

            if (position === 1) {

                const result = this.prepend(value);

                return {
                    inserted: true,
                    value,
                    position,
                    size: result.size
                };

            }

            // Position size + 1 means inserting
            // at the end.

            if (position === listSize + 1) {

                const result = this.append(value);

                return {
                    inserted: true,
                    value,
                    position,
                    size: result.size
                };

            }

            // Create the new node.

            const newNode = createNode(value);

            // Start from the head.

            let current = head;

            // Move to the node currently occupying
            // the insertion position.

            for (let index = 1; index < position; index++) {
                current = current.next;
            }

            // Store the previous node.

            const previousNode = current.prev;

            // Connect previous node to new node.

            previousNode.next = newNode;

            // Connect new node back to previous node.

            newNode.prev = previousNode;

            // Connect new node to current node.

            newNode.next = current;

            // Connect current node back to new node.

            current.prev = newNode;

            // Increase list size.

            listSize++;

            return {
                inserted: true,
                value,
                position,
                size: listSize
            };

        },

        // -----------------------------
        // Delete a node at a position
        // -----------------------------
        deleteAt(position) {

            // Position must be an integer.

            if (!Number.isInteger(position)) {
                return "Invalid Input";
            }

            // Position must point to an existing node.

            if (
                position < 1 ||
                position > listSize
            ) {
                return {
                    error: "Invalid position"
                };
            }

            // Start from the head.

            let current = head;

            // Find the node at the requested position.

            for (let index = 1; index < position; index++) {
                current = current.next;
            }

            // Save the value before removing the node.

            const deletedValue = current.value;

            // If deleting the head node.

            if (current === head) {

                head = current.next;

                // If a new head exists, remove its
                // backward reference.

                if (head !== null) {
                    head.prev = null;
                }

            } else {

                // Connect the previous node directly
                // to the next node.

                current.prev.next = current.next;

                // If a next node exists, connect it
                // back to the previous node.

                if (current.next !== null) {
                    current.next.prev = current.prev;
                }

            }

            // If deleting the tail node, update tail.

            if (current === tail) {
                tail = current.prev;

                // If a new tail exists, remove its
                // forward reference.

                if (tail !== null) {
                    tail.next = null;
                }
            }

            // Decrease list size.

            listSize--;

            // If the list became empty, both pointers
            // must be null.

            if (listSize === 0) {
                head = null;
                tail = null;
            }

            return {
                deleted: true,
                value: deletedValue,
                position,
                size: listSize
            };

        },

        // -----------------------------
        // Convert list to array
        // HEAD → TAIL
        // -----------------------------
        toArray() {

            const values = [];

            // Start from the head.

            let current = head;

            // Traverse using next pointers.

            while (current !== null) {

                values.push(current.value);

                current = current.next;

            }

            return values;

        },

        // -----------------------------
        // Convert list to array
        // TAIL → HEAD
        // -----------------------------
        toArrayReverse() {

            const values = [];

            // Start from the tail.

            let current = tail;

            // Traverse backwards using prev pointers.

            while (current !== null) {

                values.push(current.value);

                current = current.prev;

            }

            return values;

        },

        // -----------------------------
        // Get current list size
        // -----------------------------
        size() {

            return listSize;

        }

    };

}

// --- EXAMPLE USAGE ---
const dll = createDoublyLinkedList();

console.log(dll.append(10));
console.log(dll.append(20));
console.log(dll.append(30));
console.log(dll.prepend(5));
console.log(dll.toArray());
console.log(dll.toArrayReverse());
console.log(dll.insertAt(15, 3));
console.log(dll.toArray());
console.log(dll.deleteAt(2));
console.log(dll.toArray());
console.log(dll.toArrayReverse());
console.log(dll.size());