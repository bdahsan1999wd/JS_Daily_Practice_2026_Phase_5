// 🧩 PROBLEM–04: createBusinessLayer()

// Logic: Returns a business logic layer object.
//   getService(serviceName)            — specific service handler
//   execute(serviceName, operationName, input, context) — run a business operation
//   getOperationLog()                  — history of all executed operations
//   getLayerStats()                    — statistics

// execute(): find service+operation → validate inputRules (Day-231 P-04 logic)
// → if shouldFail → failure → else call execute(validatedInput, context).
// Logs { serviceName, operationName, success, timestamp } per execution.


function createBusinessLayer(businessConfig) {

    // --- STEP 1: VALIDATE businessConfig ---

    if (
        typeof businessConfig !== "object" || businessConfig === null || Array.isArray(businessConfig) ||
        typeof businessConfig.layerId !== "string" || businessConfig.layerId.trim() === "" ||
        !Array.isArray(businessConfig.services)
    ) {
        return "Invalid Input";
    }

    for (const s of businessConfig.services) {
        if (
            typeof s.serviceName !== "string" || s.serviceName.trim() === "" ||
            !Array.isArray(s.operations)
        ) {
            return "Invalid Input";
        }
        for (const op of s.operations) {
            if (
                typeof op.operationName !== "string" || op.operationName.trim() === "" ||
                !Array.isArray(op.inputRules) ||
                typeof op.execute !== "function" ||
                typeof op.shouldFail !== "boolean"
            ) {
                return "Invalid Input";
            }
        }
    }

    // --- STEP 2: INTERNAL STATE ---

    const services = {}; // serviceName -> { operations: { operationName -> op } }

    for (const s of businessConfig.services) {
        services[s.serviceName] = { operations: {} };
        for (const op of s.operations) {
            services[s.serviceName].operations[op.operationName] = op;
        }
    }

    const operationLog = [];
    const stats = { totalExecutions: 0, successCount: 0, failureCount: 0, operationBreakdown: {} };

    // --- STEP 3: VALIDATOR RULES (Day-231 Problem-04 logic) ---

    function runValidator(validator, data) {

        const value = data[validator.field];

        switch (validator.rule) {

            case "required":
                if (value === undefined || value === null || value === "") {
                    return { field: validator.field, message: validator.message };
                }
                break;

            case "minLength":
                if (typeof value !== "string" || value.length < validator.value) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            case "maxLength":
                if (typeof value !== "string" || value.length > validator.value) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            case "min":
                if (typeof value !== "number" || value < validator.value) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            case "max":
                if (typeof value !== "number" || value > validator.value) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            case "pattern": {
                let ok = false;
                if (validator.value === "email") {
                    ok = typeof value === "string" && value.includes("@") && value.includes(".");
                } else if (validator.value === "phone") {
                    ok = typeof value === "string" && value.startsWith("+") && value.length >= 10 && value.length <= 15;
                }
                if (!ok) return { field: validator.field, message: validator.message };
                break;
            }

            case "custom":
                if (typeof validator.customFn !== "function" || !validator.customFn(value)) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            default:
                return { field: validator.field, message: "Unknown rule: " + validator.rule };
        }

        return null;
    }

    // --- STEP 4: EXECUTE AN OPERATION ---

    function executeOperation(serviceName, operationName, input, context) {

        const service = services[serviceName];

        // Find service + operation.

        if (!service || !service.operations[operationName]) {
            return { success: false, error: "Operation not found: " + serviceName + "." + operationName };
        }

        const op = service.operations[operationName];

        // Validate input against inputRules.

        const validationErrors = [];

        for (const validator of op.inputRules) {
            const err = runValidator(validator, input);
            if (err !== null) validationErrors.push(err);
        }

        if (validationErrors.length > 0) {
            operationLog.push({ serviceName, operationName, success: false, timestamp: "2025-01-01T00:00:00Z" });
            stats.totalExecutions++;
            stats.failureCount++;
            const key = serviceName + "." + operationName;
            stats.operationBreakdown[key] = (stats.operationBreakdown[key] || 0) + 1;
            return { success: false, validationErrors };
        }

        // Simulated failure.

        if (op.shouldFail) {
            operationLog.push({ serviceName, operationName, success: false, timestamp: "2025-01-01T00:00:00Z" });
            stats.totalExecutions++;
            stats.failureCount++;
            const key = serviceName + "." + operationName;
            stats.operationBreakdown[key] = (stats.operationBreakdown[key] || 0) + 1;
            return { success: false, error: "Operation execution failed" };
        }

        // Execute.

        const result = op.execute(input, context);

        operationLog.push({ serviceName, operationName, success: true, timestamp: "2025-01-01T00:00:00Z" });
        stats.totalExecutions++;
        stats.successCount++;
        const key = serviceName + "." + operationName;
        stats.operationBreakdown[key] = (stats.operationBreakdown[key] || 0) + 1;

        return { success: true, result, serviceName, operationName };
    }

    // --- STEP 5: RETURN BUSINESS LAYER OBJECT ---

    return {

        getService(serviceName) {

            if (typeof serviceName !== "string" || serviceName.trim() === "") return "Invalid Input";

            if (!services[serviceName]) return { error: "Service not found" };

            return {
                serviceName,
                operations: Object.keys(services[serviceName].operations)
            };
        },

        execute(serviceName, operationName, input, context) {

            if (
                typeof serviceName !== "string" ||
                typeof operationName !== "string" ||
                typeof input !== "object" || input === null || Array.isArray(input)
            ) {
                return "Invalid Input";
            }

            return executeOperation(serviceName, operationName, input, context);
        },

        getOperationLog() {
            return operationLog.slice();
        },

        getLayerStats() {
            return { ...stats, operationBreakdown: { ...stats.operationBreakdown } };
        }
    };
}



// ------ EXAMPLE USAGE ------

const bl = createBusinessLayer({
    layerId: "BL-01",
    services: [
        {
            serviceName: "OrderService",
            operations: [
                {
                    operationName: "createOrder",
                    inputRules: [
                        { field: "userId", rule: "required", value: null, message: "userId is required" },
                        { field: "amount", rule: "min", value: 1, message: "amount must be positive" }
                    ],
                    execute: (input, ctx) => ({ orderId: "O-" + Date.now(), ...input, status: "CREATED" }),
                    shouldFail: false
                }
            ]
        }
    ]
});


console.log(bl.execute("OrderService", "createOrder", { userId: "U1", amount: 500 }, { requestId: "REQ-1" }));


console.log(bl.execute("OrderService", "createOrder", { amount: 0 }, {}));


console.log(bl.getLayerStats());


console.log(bl.getService("OrderService"));


// --- INVALID ---
console.log(bl.getService("Missing"));