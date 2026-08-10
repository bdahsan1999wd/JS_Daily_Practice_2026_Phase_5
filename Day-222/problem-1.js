// 🧩 PROBLEM–01: createStack()
//
// Logic: Implements a basic Stack data structure using LIFO (Last In, First Out) behavior.

// Supports:

// 1. Push a value
// 2. Pop the top value
// 3. Peek at the top value
// 4. Check whether stack is empty
// 5. Get stack size
// 6. Convert stack to array
// 7. Clear the entire stack

function createStack() {

    // --- STEP 1: INTERNAL STORAGE ---
    // Stores all stack values.
    //
    // The last element of this array
    // always represents the top of the stack.

    const stack = [];

    // --- STEP 2: RETURN STACK OBJECT ---

    return {

        // -----------------------------
        // Push a new value onto stack
        // -----------------------------
        push(value) {

            // undefined is not allowed.

            if (value === undefined) {
                return "Invalid Input";
            }

            // Add value to the top of stack.

            stack.push(value);

            // Return push result.

            return {
                pushed: true,
                value,
                size: stack.length
            };

        },

        // -----------------------------
        // Remove the top value
        // -----------------------------
        pop() {

            // Check whether stack is empty.

            if (stack.length === 0) {

                return {
                    error: "Stack is empty"
                };

            }

            // Remove the last element.
            // This follows LIFO behavior.

            const value = stack.pop();

            // Return removed value
            // and current stack size.

            return {
                value,
                size: stack.length
            };

        },

        // -----------------------------
        // View the top value
        // -----------------------------
        peek() {

            // Check whether stack is empty.

            if (stack.length === 0) {

                return {
                    error: "Stack is empty"
                };

            }

            // Read the last element
            // without removing it.

            return {
                value: stack[stack.length - 1]
            };

        },

        // -----------------------------
        // Check whether stack is empty
        // -----------------------------
        isEmpty() {

            return stack.length === 0;

        },

        // -----------------------------
        // Get current stack size
        // -----------------------------
        size() {

            return stack.length;

        },

        // -----------------------------
        // Return all stack values
        // -----------------------------
        toArray() {

            // Return a copy of the stack.
            // This prevents external code from
            // modifying the internal stack directly.

            return [...stack];

        },

        // -----------------------------
        // Clear the entire stack
        // -----------------------------
        clear() {

            // Store current number of items
            // before removing them.

            const removedCount = stack.length;

            // Remove all items.

            stack.length = 0;

            // Return clear result.

            return {
                cleared: true,
                removedCount
            };

        }

    };

}


// ------ EXAMPLE USAGE ------
const stack = createStack();

console.log(stack.push(10));

console.log(stack.push(20));

console.log(stack.push(30));

// View the top value without removing it.
console.log(stack.peek());

// Remove the top value.
console.log(stack.pop());

// Remove the next top value.
console.log(stack.pop());

// Return all remaining values. Array order is bottom → top.
console.log(stack.toArray());

// Get current stack size.
console.log(stack.size());

// Check whether stack is empty.
console.log(stack.isEmpty());

// Remove all remaining values.
console.log(stack.clear());

// Stack is now empty.
console.log(stack.isEmpty());

// Attempt to pop from an empty stack.
console.log(stack.pop());

// undefined is invalid.
console.log(stack.push(undefined));