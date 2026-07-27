// 🧩 PROBLEM–02: buildErrorResponse()

// Logic: Builds a standardized REST API error response using the Error Envelope pattern. Includes error code, message, optional details, and timestamp.

function buildErrorResponse(statusCode, errorCode, message, details) {

    // --- STEP 1: VALIDATION ---
    if (
        ![400, 401, 403, 404, 409, 422, 500].includes(statusCode) ||
        typeof errorCode !== "string" ||
        errorCode.trim() === "" ||
        typeof message !== "string" ||
        message.trim() === "" ||
        !(
            details === null ||
            (
                Array.isArray(details) &&
                details.every(detail => typeof detail === "string")
            )
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD RESPONSE ---
    return {
        success: false,
        statusCode,
        error: {
            code: errorCode,
            message,
            details: details ?? []
        },
        timestamp: "2025-01-01T00:00:00Z"
    };

}

// --- EXAMPLE USAGE ---
console.log(
    buildErrorResponse(
        422,
        "VALIDATION_ERROR",
        "Request validation failed",
        [
            "email is required",
            "password too short"
        ]
    )
);

console.log(
    buildErrorResponse(
        404,
        "NOT_FOUND",
        "User not found",
        null
    )
);