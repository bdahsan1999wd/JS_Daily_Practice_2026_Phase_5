// 🧩 PROBLEM–02: createQueue()

// Logic: Implements a basic Queue data structure using FIFO (First In, First Out) behavior.

// Supports:

// 1. Enqueue a value
// 2. Dequeue the front value
// 3. Peek at the front value
// 4. Peek at the rear value
// 5. Check whether queue is empty
// 6. Get queue size
// 7. Convert queue to array
// 8. Clear the entire queue

function createQueue() {

    // --- STEP 1: INTERNAL STORAGE ---
    // Stores all queue values.
    //
    // Index 0 represents the front.
    // The last index represents the rear.

    const queue = [];

    // --- STEP 2: RETURN QUEUE OBJECT ---

    return {

        // -----------------------------
        // Add a new value to the rear
        // -----------------------------
        enqueue(value) {

            // undefined is not allowed.

            if (value === undefined) {
                return "Invalid Input";
            }

            // Add value to the back of queue.

            queue.push(value);

            // Return enqueue result.

            return {
                enqueued: true,
                value,
                size: queue.length
            };

        },

        // -----------------------------
        // Remove the front value
        // -----------------------------
        dequeue() {

            // Check whether queue is empty.

            if (queue.length === 0) {

                return {
                    error: "Queue is empty"
                };

            }

            // Remove the first element.
            // This follows FIFO behavior.

            const value = queue.shift();

            // Return removed value
            // and current queue size.

            return {
                value,
                size: queue.length
            };

        },

        // -----------------------------
        // View the front value
        // -----------------------------
        front() {

            // Check whether queue is empty.

            if (queue.length === 0) {

                return {
                    error: "Queue is empty"
                };

            }

            // Read the first element
            // without removing it.

            return {
                value: queue[0]
            };

        },

        // -----------------------------
        // View the rear value
        // -----------------------------
        rear() {

            // Check whether queue is empty.

            if (queue.length === 0) {

                return {
                    error: "Queue is empty"
                };

            }

            // Read the last element
            // without removing it.

            return {
                value: queue[queue.length - 1]
            };

        },

        // -----------------------------
        // Check whether queue is empty
        // -----------------------------
        isEmpty() {

            return queue.length === 0;

        },

        // -----------------------------
        // Get current queue size
        // -----------------------------
        size() {

            return queue.length;

        },

        // -----------------------------
        // Return all queue values
        // -----------------------------
        toArray() {

            // Return a copy of the queue.
            // This prevents external code from
            // modifying the internal queue directly.

            return [...queue];

        },

        // -----------------------------
        // Clear the entire queue
        // -----------------------------
        clear() {

            // Store current number of items
            // before removing them.

            const removedCount = queue.length;

            // Remove all items.

            queue.length = 0;

            // Return clear result.

            return {
                cleared: true,
                removedCount
            };

        }

    };

}


// ------ EXAMPLE USAGE ------
const queue = createQueue();

console.log(queue.enqueue("A"));

console.log(queue.enqueue("B"));

console.log(queue.enqueue("C"));

// View the front value without removing it.
console.log(queue.front());

// View the rear value without removing it.
console.log(queue.rear());

// Return all queue values. Array order is front → rear.
console.log(queue.toArray());

// Remove the front value.
console.log(queue.dequeue());

// Remove the next front value.
console.log(queue.dequeue());

// Check the new front value.
console.log(queue.front());

// Get current queue size.
console.log(queue.size());

// Check whether queue is empty.
console.log(queue.isEmpty());

// Remove all remaining values.
console.log(queue.clear());

// Queue is now empty.
console.log(queue.isEmpty());

// Attempt to dequeue from an empty queue.
console.log(queue.dequeue());

// undefined is invalid.
console.log(queue.enqueue(undefined));