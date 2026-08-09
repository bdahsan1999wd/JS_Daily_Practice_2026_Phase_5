// 🧩 PROBLEM–01: simulateRequestLifecycle()
//
// Logic: Simulates a complete HTTP request lifecycle.

// Supports:
// 1. Receive request
// 2. Optional authentication check
// 3. Optional request body validation
// 4. Process request
// 5. Optional request logging

// Lifecycle stops immediately if authentication or body validation fails.

function simulateRequestLifecycle(request, lifecycleConfig) {

    // --- STEP 1: VALIDATION ---
    // Validate request and lifecycleConfig objects.

    if (
        typeof request !== "object" ||
        request === null ||
        Array.isArray(request) ||
        typeof lifecycleConfig !== "object" ||
        lifecycleConfig === null ||
        Array.isArray(lifecycleConfig)
    ) {
        return "Invalid Input";
    }

    const {
        requestId,
        method,
        path,
        body,
        headers
    } = request;

    const {
        requireAuth,
        validateBody,
        logRequest
    } = lifecycleConfig;

    // Validate request fields.

    if (
        typeof requestId !== "string" ||
        requestId.trim() === "" ||
        !["GET", "POST", "PUT", "DELETE"].includes(method) ||
        typeof path !== "string" ||
        path.trim() === "" ||
        !path.startsWith("/") ||
        (
            body !== null &&
            (
                typeof body !== "object" ||
                Array.isArray(body)
            )
        ) ||
        typeof headers !== "object" ||
        headers === null ||
        Array.isArray(headers)
    ) {
        return "Invalid Input";
    }

    // Validate lifecycle configuration.

    if (
        typeof requireAuth !== "boolean" ||
        typeof validateBody !== "boolean" ||
        typeof logRequest !== "boolean"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STORAGE ---

    // Stores every lifecycle stage.

    const stages = [];

    // --- STEP 3: RECEIVED STAGE ---

    // Request enters the system.

    stages.push({
        stage: "RECEIVED",
        requestId,
        method,
        path
    });

    // --- STEP 4: AUTHENTICATION ---

    // Authentication is checked only when required.

    if (requireAuth === true) {

        // Check whether Authorization header exists.

        if (
            typeof headers.Authorization !== "string" ||
            headers.Authorization.trim() === ""
        ) {

            stages.push({
                stage: "AUTH",
                status: "FAILED",
                reason: "Authorization header missing"
            });

            return {
                requestId,
                lifecycleStatus: "BLOCKED",
                stages,
                stagesCompleted: stages.length
            };

        }

        // Authentication successful.

        stages.push({
            stage: "AUTH",
            status: "PASSED"
        });

    }

    // --- STEP 5: BODY VALIDATION ---

    // Body validation only applies to POST and PUT requests
    // when validateBody is enabled.

    if (
        validateBody === true &&
        ["POST", "PUT"].includes(method)
    ) {

        // Body is required.

        if (body === null) {

            stages.push({
                stage: "VALIDATION",
                status: "FAILED",
                reason: "Request body required"
            });

            return {
                requestId,
                lifecycleStatus: "BLOCKED",
                stages,
                stagesCompleted: stages.length
            };

        }

        // Body validation successful.

        stages.push({
            stage: "VALIDATION",
            status: "PASSED"
        });

    }

    // --- STEP 6: PROCESSING ---

    // Processing always happens if the request
    // was not blocked by previous stages.

    stages.push({
        stage: "PROCESSING",
        status: "COMPLETED",
        result: `processed_${requestId}`
    });

    // --- STEP 7: LOGGING ---

    // Add logging stage only when enabled.

    if (logRequest === true) {

        stages.push({
            stage: "LOGGING",
            logged: true,
            logMessage:
                `[INFO] ${method} ${path} → COMPLETED`
        });

    }

    // --- STEP 8: FINAL RESULT ---

    return {
        requestId,
        lifecycleStatus: "COMPLETED",
        stages,
        stagesCompleted: stages.length
    };

}

// --- EXAMPLE USAGE ---
console.log(

    simulateRequestLifecycle(

        {
            requestId: "REQ-1",
            method: "POST",
            path: "/api/orders",
            body: {
                item: "Book"
            },
            headers: {
                Authorization: "Bearer token-123"
            }
        },

        {
            requireAuth: true,
            validateBody: true,
            logRequest: true
        }

    )

);

console.log(

    simulateRequestLifecycle(

        {
            requestId: "REQ-2",
            method: "POST",
            path: "/api/users",
            body: null,
            headers: {}
        },

        {
            requireAuth: true,
            validateBody: true,
            logRequest: true
        }

    )

);

console.log(

    simulateRequestLifecycle(

        {
            requestId: "REQ-3",
            method: "GET",
            path: "/api/products",
            body: null,
            headers: {}
        },

        {
            requireAuth: false,
            validateBody: true,
            logRequest: false
        }

    )

);
