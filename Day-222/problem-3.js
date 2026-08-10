// 🧩 PROBLEM–03: createDeque()
//
// Logic: Creates a Double-Ended Queue (Deque).

// Supports:

// 1. Add values to the front
// 2. Add values to the rear
// 3. Remove values from the front
// 4. Remove values from the rear
// 5. Peek at the front value
// 6. Peek at the rear value
// 7. Get current size
// 8. Convert deque to an array

// The deque maintains its internal state through a private array.

function createDeque() {

    // --- STEP 1: INTERNAL STORAGE ---

    // Stores all deque values.
    // Index 0 represents the front.
    // The last index represents the rear.

    const deque = [];


    // --- STEP 2: RETURN DEQUE OBJECT ---

    return {

        // -----------------------------
        // Add value to the front
        // -----------------------------
        pushFront(value) {

            // Validate value.
            // undefined values are not allowed.

            if (value === undefined) {
                return "Invalid Input";
            }

            // Add value at the beginning of the deque.

            deque.unshift(value);

            // Return operation result.

            return {
                pushed: "FRONT",
                value,
                size: deque.length
            };

        },


        // -----------------------------
        // Add value to the rear
        // -----------------------------
        pushRear(value) {

            // Validate value.
            // undefined values are not allowed.

            if (value === undefined) {
                return "Invalid Input";
            }

            // Add value at the end of the deque.

            deque.push(value);

            // Return operation result.

            return {
                pushed: "REAR",
                value,
                size: deque.length
            };

        },


        // -----------------------------
        // Remove value from the front
        // -----------------------------
        popFront() {

            // Check whether deque is empty.

            if (deque.length === 0) {
                return {
                    error: "Deque is empty"
                };
            }

            // Remove the first value.

            const value = deque.shift();

            // Return removed value and new size.

            return {
                value,
                size: deque.length
            };

        },


        // -----------------------------
        // Remove value from the rear
        // -----------------------------
        popRear() {

            // Check whether deque is empty.

            if (deque.length === 0) {
                return {
                    error: "Deque is empty"
                };
            }

            // Remove the last value.

            const value = deque.pop();

            // Return removed value and new size.

            return {
                value,
                size: deque.length
            };

        },


        // -----------------------------
        // View front value
        // -----------------------------
        peekFront() {

            // Check whether deque is empty.

            if (deque.length === 0) {
                return {
                    error: "Deque is empty"
                };
            }

            // Return the first value
            // without removing it.

            return {
                value: deque[0]
            };

        },


        // -----------------------------
        // View rear value
        // -----------------------------
        peekRear() {

            // Check whether deque is empty.

            if (deque.length === 0) {
                return {
                    error: "Deque is empty"
                };
            }

            // Return the last value
            // without removing it.

            return {
                value: deque[deque.length - 1]
            };

        },


        // -----------------------------
        // Get current deque size
        // -----------------------------
        size() {

            // Return the number of
            // values currently stored.

            return deque.length;

        },


        // -----------------------------
        // Convert deque to array
        // -----------------------------
        toArray() {

            // Return a copy of the deque.
            // This prevents external code
            // from directly modifying
            // the internal array.

            return [...deque];

        }

    };

}


// ------ EXAMPLE USAGE ------
const deque = createDeque();

console.log(deque.pushRear(1));

console.log(deque.pushRear(2));

console.log(deque.pushFront(0));

console.log(deque.toArray());

console.log(deque.popFront());

console.log(deque.popRear());

console.log(deque.peekFront());

console.log(deque.peekRear());

console.log(deque.pushFront(99));

console.log(deque.toArray());