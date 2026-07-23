// 🧩 PROBLEM–04: runWaterfallWithRollback()

// Logic: Executes operations one by one using a waterfall pattern. If any operation fails, all previously completed operations are rolled back in reverse order.

async function runWaterfallWithRollback(transactionId, operations) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof transactionId !== "string" ||
        transactionId.trim() === "" ||
        !Array.isArray(operations) ||
        operations.length === 0 ||
        !operations.every(operation =>
            typeof operation === "object" &&
            operation !== null &&
            typeof operation.operationId === "string" &&
            operation.operationId.trim() !== "" &&
            typeof operation.shouldFail === "boolean"
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: EXECUTE OPERATIONS ---
    const completedOperations = [];

    try {

        for (const operation of operations) {

            if (operation.shouldFail) {
                throw new Error("Operation failed: " + operation.operationId);
            }

            completedOperations.push(operation.operationId);

        }

        // --- STEP 3: RETURN COMMITTED RESULT ---
        return {
            transactionId,
            status: "COMMITTED",
            completedOperations
        };

    } catch (error) {

        // --- STEP 4: BUILD ROLLBACK LOG ---
        const failedOperation = error.message.replace("Operation failed: ", "");

        const rollbackLog = completedOperations
            .reverse()
            .map(operationId => ({
                operationId,
                rolledBack: true
            }));

        return {
            transactionId,
            status: "ROLLED_BACK",
            failedOperation,
            rollbackLog
        };

    }

}

// --- EXAMPLE USAGE ---
runWaterfallWithRollback(
    "TXN-001",
    [
        { operationId: "OP-1", shouldFail: false },
        { operationId: "OP-2", shouldFail: false },
        { operationId: "OP-3", shouldFail: true },
        { operationId: "OP-4", shouldFail: false }
    ]
)
    .then(result => console.log(result))
    .catch(error => console.log(error));