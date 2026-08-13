// 🧩 PROBLEM–01: solveClassicRecursion()

// Logic: Implements three classic recursive algorithms:
// 1. FACTORIAL  — n! recursively
// 2. FIBONACCI  — nth Fibonacci WITHOUT memoization
// 3. POWER      — fast exponentiation using divide-and-conquer

// Each algorithm also tracks the total number of recursive calls made.

function solveClassicRecursion(problemType, params) {

    // --- STEP 1: VALIDATION ---
    // Validate that problemType is a non-empty string.

    if (
        typeof problemType !== "string" ||
        problemType.trim() === ""
    ) {
        return "Invalid Input";
    }

    // Validate that params is a non-null object.

    if (
        typeof params !== "object" ||
        params === null ||
        Array.isArray(params)
    ) {
        return "Invalid Input";
    }

    // Validate that problemType is one of the accepted values.

    if (
        problemType !== "FACTORIAL" &&
        problemType !== "FIBONACCI" &&
        problemType !== "POWER"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: FACTORIAL ---

    if (problemType === "FACTORIAL") {

        const { n } = params;

        // Validate n: must be an integer in range 0–15.

        if (
            typeof n !== "number" ||
            !Number.isInteger(n) ||
            n < 0 ||
            n > 15
        ) {
            return "Invalid Input";
        }

        // calls counter is stored in an object so that inner recursive function can mutate it (avoids using a global variable).

        const counter = { calls: 0 };

        // Inner recursive function for factorial.

        function factorial(num) {

            // Count this function call.

            counter.calls++;

            // Base cases: 0! = 1 and 1! = 1.

            if (num === 0 || num === 1) {
                return 1;
            }

            // Recursive case: n × factorial(n-1).

            return num * factorial(num - 1);
        }

        const result = factorial(n);

        // --- FACTORIAL RESULT ---

        return {
            n,
            result,
            calls: counter.calls
        };
    }

    // --- STEP 3: FIBONACCI (WITHOUT MEMOIZATION) ---

    if (problemType === "FIBONACCI") {

        const { n } = params;

        // Validate n: must be an integer in range 0–20.

        if (
            typeof n !== "number" ||
            !Number.isInteger(n) ||
            n < 0 ||
            n > 20
        ) {
            return "Invalid Input";
        }

        const counter = { calls: 0 };

        // Inner recursive function for Fibonacci (naive, no memoization).

        function fib(num) {

            // Count this function call.

            counter.calls++;

            // Base cases: fib(0) = 0, fib(1) = 1.

            if (num === 0) return 0;
            if (num === 1) return 1;

            // Recursive case: fib(n) = fib(n-1) + fib(n-2).
            // This causes exponential growth in call count because the same sub-problems are computed repeatedly.

            return fib(num - 1) + fib(num - 2);
        }

        const result = fib(n);

        // --- FIBONACCI RESULT ---

        return {
            n,
            result,
            calls: counter.calls
        };
    }

    // --- STEP 4: POWER (FAST EXPONENTIATION) ---

    if (problemType === "POWER") {

        const { base, exponent } = params;

        // Validate base: must be a number.

        if (typeof base !== "number") {
            return "Invalid Input";
        }

        // Validate exponent: must be a non-negative integer.

        if (
            typeof exponent !== "number" ||
            !Number.isInteger(exponent) ||
            exponent < 0
        ) {
            return "Invalid Input";
        }

        const counter = { calls: 0 };

        // Inner recursive function for fast (divide-and-conquer) exponentiation.
        // This reduces the number of multiplications to O(log n) calls.

        function power(b, exp) {

            // Count this function call.

            counter.calls++;

            // Base case: anything raised to 0 is 1.

            if (exp === 0) return 1;

            // If the exponent is even:
            // Instead of multiplying b by itself exp times, compute power(b, exp/2) once and square the result.
            // This halves the problem size each step → fewer calls.

            if (exp % 2 === 0) {
                const half = power(b, exp / 2);
                return half * half;
            }

            // If the exponent is odd:
            // Reduce by 1 to make it even, then recurse.

            return b * power(b, exp - 1);
        }

        const result = power(base, exponent);

        // --- POWER RESULT ---

        return {
            base,
            exponent,
            result,
            calls: counter.calls
        };
    }
}


// ------ EXAMPLE USAGE ------

// --- FACTORIAL ---
console.log(solveClassicRecursion("FACTORIAL", { n: 6 }));

// --- FIBONACCI ---
console.log(solveClassicRecursion("FIBONACCI", { n: 7 }));

// --- POWER ---
console.log(solveClassicRecursion("POWER", { base: 2, exponent: 10 }));

// --- INVALID: wrong problemType ---
console.log(solveClassicRecursion("SQRT", { n: 5 }));

// --- INVALID: n out of range ---
console.log(solveClassicRecursion("FACTORIAL", { n: 20 }));

// --- INVALID: params missing ---
console.log(solveClassicRecursion("FIBONACCI", null));