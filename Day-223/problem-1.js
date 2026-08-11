// 🧩 PROBLEM–01: createSinglyLinkedList()

// Logic: Creates a singly linked list using internal nodes.

// Supports:
// 1. Append a node to the end
// 2. Prepend a node to the beginning
// 3. Delete the first matching node
// 4. Find a node by value
// 5. Convert the list to an array
// 6. Get the current list size
// 7. Reverse the list in-place

function createSinglyLinkedList() {

    // --- STEP 1: INTERNAL NODE CREATION ---
    // Creates a new node with a value and a pointer
    // to the next node.

    function createNode(value) {

        return {
            value,
            next: null
        };

    }

    // --- STEP 2: INTERNAL LINKED LIST STATE ---

    // Points to the first node in the list.

    let head = null;

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
            // becomes the head.

            if (head === null) {

                head = newNode;
                listSize++;

                return {
                    appended: true,
                    value,
                    size: listSize
                };

            }

            // Start from the head node.

            let current = head;

            // Move to the last node.

            while (current.next !== null) {
                current = current.next;
            }

            // Connect the new node to the end.

            current.next = newNode;

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

            // Point the new node to the
            // current head.

            newNode.next = head;

            // Make the new node the head.

            head = newNode;

            // Increase list size.

            listSize++;

            return {
                prepended: true,
                value,
                size: listSize
            };

        },

        // -----------------------------
        // Delete the FIRST matching node
        // -----------------------------
        delete(value) {

            // undefined is not allowed.

            if (value === undefined) {
                return "Invalid Input";
            }

            // If the list is empty, the value
            // cannot be found.

            if (head === null) {

                return {
                    deleted: false,
                    reason: "Value not found"
                };

            }

            // If the head itself contains
            // the target value, remove it.

            if (head.value === value) {

                head = head.next;
                listSize--;

                return {
                    deleted: true,
                    value,
                    size: listSize
                };

            }

            // Start searching from the head.

            let current = head;

            // Search until the node before
            // the matching node is found.

            while (
                current.next !== null &&
                current.next.value !== value
            ) {
                current = current.next;
            }

            // If no matching node was found.

            if (current.next === null) {

                return {
                    deleted: false,
                    reason: "Value not found"
                };

            }

            // Skip the matching node.

            current.next = current.next.next;

            // Decrease list size.

            listSize--;

            return {
                deleted: true,
                value,
                size: listSize
            };

        },

        // -----------------------------
        // Find a node by value
        // -----------------------------
        find(value) {

            // undefined is not allowed.

            if (value === undefined) {
                return "Invalid Input";
            }

            // Start searching from the head.

            let current = head;

            // Position is 1-based.

            let position = 1;

            // Traverse the linked list.

            while (current !== null) {

                // Matching value found.

                if (current.value === value) {

                    return {
                        value,
                        position
                    };

                }

                current = current.next;
                position++;

            }

            // Value was not found.

            return {
                found: false,
                value
            };

        },

        // -----------------------------
        // Convert linked list to array
        // -----------------------------
        toArray() {

            const values = [];

            // Start from the head.

            let current = head;

            // Traverse every node.

            while (current !== null) {

                values.push(current.value);

                current = current.next;

            }

            return values;

        },

        // -----------------------------
        // Get current list size
        // -----------------------------
        size() {

            return listSize;

        },

        // -----------------------------
        // Reverse the linked list
        // -----------------------------
        reverse() {

            // Previous node starts as null.

            let previous = null;

            // Current node starts at the head.

            let current = head;

            // Reverse every next pointer.

            while (current !== null) {

                // Save the next node before
                // changing the current pointer.

                const nextNode = current.next;

                // Reverse the direction of the link.

                current.next = previous;

                // Move previous forward.

                previous = current;

                // Move current forward.

                current = nextNode;

            }

            // The previous node is now the
            // new head of the list.

            head = previous;

            return {
                reversed: true,
                list: this.toArray()
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const list = createSinglyLinkedList();

console.log(list.append(10));
console.log(list.append(20));
console.log(list.append(30));
console.log(list.prepend(5));
console.log(list.toArray());
console.log(list.find(20));
console.log(list.find(99));
console.log(list.delete(10));
console.log(list.toArray());
console.log(list.reverse());
console.log(list.toArray());
console.log(list.size());