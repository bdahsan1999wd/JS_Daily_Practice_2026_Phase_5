// 🧩 PROBLEM–05: runFullMiddlewarePipeline()

// Logic: Orchestrates the complete middleware pipeline. Executes Authentication, Validation, and Logger middlewares in sequence. Stops immediately if any middleware blocks the request.

const { simulateAuthMiddleware } = require("./problem-2");
const { simulateValidationMiddleware } = require("./problem-3");
const { simulateLoggerMiddleware } = require("./problem-4");

function runFullMiddlewarePipeline(request, pipelineConfig) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof request !== "object" ||
        request === null ||
        typeof pipelineConfig !== "object" ||
        pipelineConfig === null ||
        !Array.isArray(pipelineConfig.validTokens) ||
        typeof pipelineConfig.validationSchema !== "object" ||
        pipelineConfig.validationSchema === null
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: AUTH MIDDLEWARE ---
    const authResult = simulateAuthMiddleware(
        {
            path: request.path,
            headers: request.headers
        },
        pipelineConfig.validTokens
    );

    if (authResult.authStatus === "BLOCKED") {

        return {
            pipelineStatus: "BLOCKED_AT_AUTH",
            stepsCompleted: 1,
            authResult,
            validationResult: null,
            logEntry: null
        };

    }

    // --- STEP 3: VALIDATION MIDDLEWARE ---
    const validationResult = simulateValidationMiddleware(
        {
            body: request.body
        },
        pipelineConfig.validationSchema
    );

    if (validationResult.blocked) {

        return {
            pipelineStatus: "BLOCKED_AT_VALIDATION",
            stepsCompleted: 2,
            authResult,
            validationResult,
            logEntry: null
        };

    }

    // --- STEP 4: LOGGER MIDDLEWARE ---
    const loggerResult = simulateLoggerMiddleware([
        {
            requestId: "REQ-001",
            method: request.method,
            path: request.path,
            statusCode: 200,
            durationMs: 0
        }
    ]);

    const logEntry = loggerResult.logs[0];

    // --- STEP 5: RETURN RESULT ---
    return {
        pipelineStatus: "COMPLETED",
        stepsCompleted: 3,
        authResult: {
            authStatus: authResult.authStatus,
            blockReason: authResult.blockReason
        },
        validationResult,
        logEntry
    };

}

// --- EXAMPLE USAGE ---
console.log(
    runFullMiddlewarePipeline(
        {
            method: "POST",
            path: "/api/register",
            headers: {
                Authorization: "Bearer token-xyz"
            },
            body: {
                username: "Rahim123",
                age: 25,
                email: "rahim@mail.com"
            }
        },
        {
            validTokens: [
                "token-xyz"
            ],
            validationSchema: {
                username: {
                    required: true,
                    type: "string",
                    minLength: 4
                },
                age: {
                    required: true,
                    type: "number",
                    min: 18
                },
                email: {
                    required: true,
                    type: "string"
                }
            }
        }
    )
);