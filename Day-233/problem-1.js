// 🧩 PROBLEM–01: createErrorClassifier()

// Logic: Returns an error classifier object.
//   classify(error)     — classify an error into a category
//   createError(type, message, details) — create a structured error object
//   isRetryable(error)  — check if error type is retryable
//   getSeverity(error)  — return severity level of error
//   getHttpStatus(error) — return appropriate HTTP status code

// Classification: use error.type if present & valid; otherwise classify by
// message keywords. Error type table:
//   VALIDATION_ERROR/LOW/400/no | AUTH_ERROR/MEDIUM/401/no | FORBIDDEN_ERROR/MEDIUM/403/no
//   NOT_FOUND_ERROR/LOW/404/no | CONFLICT_ERROR/MEDIUM/409/no | RATE_LIMIT_ERROR/MEDIUM/429/yes
//   SERVER_ERROR/HIGH/500/yes | DB_ERROR/HIGH/503/yes | NETWORK_ERROR/HIGH/503/yes | UNKNOWN_ERROR/HIGH/500/no


function createErrorClassifier() {

    // --- STEP 1: ERROR TYPE TABLE ---

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

    // --- STEP 2: KEYWORD-BASED CLASSIFICATION ---

    function classifyByMessage(message) {

        const msg = String(message).toLowerCase();

        if (msg.includes("validation") || msg.includes("invalid")) return "VALIDATION_ERROR";
        if (msg.includes("unauthorized") || msg.includes("auth")) return "AUTH_ERROR";
        if (msg.includes("not found")) return "NOT_FOUND_ERROR";
        if (msg.includes("database") || msg.includes("db")) return "DB_ERROR";
        if (msg.includes("network") || msg.includes("timeout")) return "NETWORK_ERROR";

        return "UNKNOWN_ERROR";
    }

    // --- STEP 3: RETURN CLASSIFIER OBJECT ---

    return {

        classify(error) {

            if (
                typeof error !== "object" || error === null || Array.isArray(error) ||
                typeof error.message !== "string"
            ) {
                return "Invalid Input";
            }

            // Prefer error.type if it is a valid type.

            let type = null;

            if (error.type !== undefined && errorTypes[error.type]) {
                type = error.type;
            } else {
                type = classifyByMessage(error.message);
            }

            const props = errorTypes[type];

            return {
                type,
                severity: props.severity,
                httpStatus: props.httpStatus,
                retryable: props.retryable,
                message: error.message
            };
        },

        createError(type, message, details) {

            if (
                typeof type !== "string" || !errorTypes[type] ||
                typeof message !== "string"
            ) {
                return "Invalid Input";
            }

            const props = errorTypes[type];

            return {
                type,
                message,
                details: details ?? null,
                severity: props.severity,
                httpStatus: props.httpStatus,
                retryable: props.retryable,
                createdAt: "2025-01-01T00:00:00Z"
            };
        },

        isRetryable(error) {

            if (
                typeof error !== "object" || error === null || Array.isArray(error) ||
                typeof error.type !== "string" || !errorTypes[error.type]
            ) {
                return "Invalid Input";
            }

            return { type: error.type, retryable: errorTypes[error.type].retryable };
        },

        getSeverity(error) {

            if (
                typeof error !== "object" || error === null || Array.isArray(error) ||
                typeof error.type !== "string" || !errorTypes[error.type]
            ) {
                return "Invalid Input";
            }

            return { type: error.type, severity: errorTypes[error.type].severity };
        },

        getHttpStatus(error) {

            if (
                typeof error !== "object" || error === null || Array.isArray(error) ||
                typeof error.type !== "string" || !errorTypes[error.type]
            ) {
                return "Invalid Input";
            }

            return { type: error.type, httpStatus: errorTypes[error.type].httpStatus };
        }
    };
}


// ------ EXAMPLE USAGE ------

const classifier = createErrorClassifier();

console.log(classifier.classify({ message: "User not found in database" }));


console.log(classifier.classify({ type: "DB_ERROR", message: "Connection failed" }));


console.log(classifier.createError("VALIDATION_ERROR", "Email is invalid", ["email must contain @"]));


console.log(classifier.isRetryable({ type: "SERVER_ERROR" }));


console.log(classifier.getSeverity({ type: "AUTH_ERROR" }));


console.log(classifier.getHttpStatus({ type: "RATE_LIMIT_ERROR" }));


// --- INVALID ---
console.log(classifier.classify({}));