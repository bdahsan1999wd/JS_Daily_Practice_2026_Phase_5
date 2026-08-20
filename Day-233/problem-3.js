// 🧩 PROBLEM–03: createGlobalErrorHandler()

// Logic: Returns a global error handler object.
//   handle(error)       — process an error through registered handlers
//   handleBatch(errors) — process multiple errors
//   getStats()          — error handling statistics
//   getErrorLog()       — full error history

// handle(): classify error → find handler (exact type, then "*") → apply
// strategy (LOG / RETRY / FALLBACK / ESCALATE). In production never include
// stack traces/internal details; in development include full error details.


function createGlobalErrorHandler(handlerConfig) {

    // --- STEP 1: VALIDATE handlerConfig ---

    if (
        typeof handlerConfig !== "object" || handlerConfig === null || Array.isArray(handlerConfig) ||
        typeof handlerConfig.handlerId !== "string" || handlerConfig.handlerId.trim() === "" ||
        !["development", "staging", "production"].includes(handlerConfig.environment) ||
        !Array.isArray(handlerConfig.handlers)
    ) {
        return "Invalid Input";
    }

    for (const h of handlerConfig.handlers) {
        if (
            typeof h.errorType !== "string" ||
            !["LOG", "RETRY", "FALLBACK", "ESCALATE"].includes(h.strategy) ||
            (h.strategy === "RETRY" && (!Number.isInteger(h.maxRetries) || h.maxRetries < 1 || h.maxRetries > 5))
        ) {
            return "Invalid Input";
        }
    }

    const { handlerId, environment, handlers } = handlerConfig;

    // --- STEP 2: PROBLEM-01 CLASSIFICATION LOGIC (self-contained) ---

    const errorTypes = {
        VALIDATION_ERROR: { severity: "LOW", httpStatus: 400, retryable: false },
        AUTH_ERROR: { severity: "MEDIUM", httpStatus: 401, retryable: false },
        FORBIDDEN_ERROR: { severity: "MEDIUM", httpStatus: 403, retryable: false },
        NOT_FOUND_ERROR: { severity: "LOW", httpStatus: 404, retryable: false },
        CONFLICT_ERROR: { severity: "MEDIUM", httpStatus: 409, retryable: false },
        RATE_LIMIT_ERROR: { severity: "MEDIUM", httpStatus: 429, retryable: true },
        SERVER_ERROR: { severity: "HIGH", httpStatus: 500, retryable: true },
        DB_ERROR: { severity: "HIGH", httpStatus: 503, retryable: true },
        NETWORK_ERROR: { severity: "HIGH", httpStatus: 503, retryable: true },
        UNKNOWN_ERROR: { severity: "HIGH", httpStatus: 500, retryable: false }
    };

    function classify(error) {

        const msg = String(error.message).toLowerCase();

        if (msg.includes("validation") || msg.includes("invalid")) return "VALIDATION_ERROR";
        if (msg.includes("unauthorized") || msg.includes("auth")) return "AUTH_ERROR";
        if (msg.includes("not found")) return "NOT_FOUND_ERROR";
        if (msg.includes("database") || msg.includes("db")) return "DB_ERROR";
        if (msg.includes("network") || msg.includes("timeout")) return "NETWORK_ERROR";

        return "UNKNOWN_ERROR";
    }

    // --- STEP 3: INTERNAL STATE ---

    let stats = { totalHandled: 0, byStrategy: { LOG: 0, RETRY: 0, FALLBACK: 0, ESCALATE: 0 }, byType: {} };
    let errorLog = [];

    // --- STEP 4: HANDLE ONE ERROR ---

    function handleSingle(error) {

        // Validate error object.

        if (
            typeof error !== "object" || error === null || Array.isArray(error) ||
            typeof error.message !== "string"
        ) {
            return "Invalid Input";
        }

        const type = (error.type && errorTypes[error.type]) ? error.type : classify(error);
        const severity = errorTypes[type].severity;

        // Find handler: exact type match first, then "*".

        const handler = handlers.find(h => h.errorType === type) || handlers.find(h => h.errorType === "*");

        if (!handler) {
            return { handled: false, reason: "No handler for type: " + type };
        }

        const strategy = handler.strategy;

        let result;

        switch (strategy) {
            case "LOG":
                result = { strategy: "LOG", logged: true, type, message: error.message };
                break;

            case "RETRY":
                result = { strategy: "RETRY", retriesUsed: handler.maxRetries, finalStatus: "EXHAUSTED" };
                break;

            case "FALLBACK":
                result = { strategy: "FALLBACK", fallbackValue: handler.fallbackValue ?? null, type };
                break;

            case "ESCALATE":
                result = { strategy: "ESCALATE", escalatedTo: "ENGINEERING_TEAM", severity, type };
                break;
        }

        // Environment-aware details (production hides internals).

        let logEntry = { type, strategy, handledAt: "2025-01-01T00:00:00Z", environment };

        if (environment === "development") {
            logEntry = { ...logEntry, errorDetails: { message: error.message, severity, type } };
        }

        errorLog.push(logEntry);

        // Update stats.

        stats.totalHandled++;
        stats.byStrategy[strategy]++;
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        return { handled: true, type, strategy, result, environment };
    }

    // --- STEP 5: RETURN HANDLER OBJECT ---

    return {

        handle(error) {
            return handleSingle(error);
        },

        handleBatch(errors) {

            if (!Array.isArray(errors)) return "Invalid Input";

            const results = errors.map(e => handleSingle(e));

            return {
                totalErrors: errors.length,
                handled: results.filter(r => r && r.handled === true).length,
                unhandled: results.filter(r => !r || r.handled !== true).length,
                results
            };
        },

        getStats() {
            return { ...stats, byStrategy: { ...stats.byStrategy }, byType: { ...stats.byType } };
        },

        getErrorLog() {
            return errorLog.slice();
        }
    };
}


// ------ EXAMPLE USAGE ------

const handler = createGlobalErrorHandler({
    handlerId: "GLOBAL-01",
    environment: "production",
    handlers: [
        { errorType: "VALIDATION_ERROR", strategy: "LOG", maxRetries: null, fallbackValue: null },
        { errorType: "DB_ERROR", strategy: "RETRY", maxRetries: 3, fallbackValue: null },
        { errorType: "SERVER_ERROR", strategy: "ESCALATE", maxRetries: null, fallbackValue: null },
        { errorType: "*", strategy: "FALLBACK", maxRetries: null, fallbackValue: { data: null, error: "Service unavailable" } }
    ]
});

console.log(handler.handle({ type: "DB_ERROR", message: "Connection timeout" }));


console.log(handler.handle({ type: "VALIDATION_ERROR", message: "Email invalid" }));


console.log(handler.handle({ type: "NETWORK_ERROR", message: "Timeout" }));


console.log(handler.getStats());


// --- handleBatch ---
console.log(handler.handleBatch([{ type: "AUTH_ERROR", message: "bad creds" }, { message: "no type here" }]));


// --- INVALID ---
console.log(createGlobalErrorHandler({ handlerId: "", environment: "prod", handlers: [] }));