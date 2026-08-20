// 🧩 PROBLEM–02: createErrorBoundary()

// Logic: Returns an error boundary object.
//   wrap(fn)          — wrap a function with error boundary protection
//   execute(fn, ...args) — execute a function safely within the boundary
//   getErrorCount()   — number of errors caught so far
//   isOpen()          — true if boundary is still catching (errorCount < maxErrors)
//   reset()           — reset error count
//   getErrorLog()     — all caught errors

// When execute() throws and boundary is OPEN: increment count, call onError
// (if present), call fallbackFn(error), return failure w/ fallbackResult.
// When BROKEN (errorCount >= maxErrors): no fallback, boundaryBroken: true.


function createErrorBoundary(boundaryConfig) {

    // --- STEP 1: VALIDATE boundaryConfig ---

    if (
        typeof boundaryConfig !== "object" || boundaryConfig === null || Array.isArray(boundaryConfig) ||
        typeof boundaryConfig.boundaryId !== "string" || boundaryConfig.boundaryId.trim() === "" ||
        typeof boundaryConfig.fallbackFn !== "function" ||
        (boundaryConfig.onError !== null && typeof boundaryConfig.onError !== "function") ||
        !Number.isInteger(boundaryConfig.maxErrors) || boundaryConfig.maxErrors < 1
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    const { boundaryId, fallbackFn, onError } = boundaryConfig;
    const maxErrors = boundaryConfig.maxErrors;

    let errorCount = 0;
    let errorLog = [];

    // --- STEP 3: RETURN BOUNDARY OBJECT ---

    return {

        wrap(fn) {

            if (typeof fn !== "function") return "Invalid Input";

            return (...args) => {

                try {
                    const result = fn(...args);
                    return { success: true, result, boundaryId };
                } catch (error) {
                    return handleFailure(error);
                }
            };
        },

        execute(fn, ...args) {

            if (typeof fn !== "function") return "Invalid Input";

            try {
                const result = fn(...args);
                return { success: true, result, boundaryId };
            } catch (error) {
                return handleFailure(error);
            }
        },

        getErrorCount() {
            return errorCount;
        },

        isOpen() {
            return { boundaryId, isOpen: errorCount < maxErrors, errorCount, maxErrors };
        },

        reset() {
            errorCount = 0;
            errorLog = [];
            return { reset: true, boundaryId, errorCount: 0 };
        },

        getErrorLog() {
            return errorLog.slice();
        }
    };

    // --- HELPER: process a thrown error ---

    function handleFailure(error) {

        const message = error && typeof error.message === "string"
            ? error.message
            : String(error);

        // Log the caught error.
        errorLog.push({ message, caughtAt: "2025-01-01T00:00:00Z" });

        // BROKEN boundary → no fallback.
        if (errorCount >= maxErrors) {
            return { success: false, error: message, boundaryBroken: true, boundaryId };
        }

        // OPEN boundary → count + report + fallback.
        errorCount++;

        if (onError) onError(error);

        const fallbackResult = fallbackFn(error);

        return { success: false, error: message, fallbackResult, boundaryId };
    }
}


// ------ EXAMPLE USAGE ------

const boundary = createErrorBoundary({
    boundaryId: "DB-BOUNDARY",
    fallbackFn: (err) => ({ fallback: true, message: "Using cached data", error: err.message }),
    onError: (err) => { /* report error */ },
    maxErrors: 2
});


console.log(boundary.execute(() => "success result"));

console.log(boundary.execute(() => { throw new Error("DB connection failed"); }));


console.log(boundary.execute(() => { throw new Error("Timeout"); }));


console.log(boundary.execute(() => { throw new Error("Another error"); }));


console.log(boundary.isOpen());


console.log(boundary.reset());


// --- wrap() ---
const wrapped = boundary.wrap(() => "wrapped result");
console.log(wrapped());


// --- INVALID ---
console.log(createErrorBoundary({ boundaryId: "", fallbackFn: () => { }, onError: null, maxErrors: 2 }));