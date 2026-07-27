// 🧩 PROBLEM–01: buildSuccessResponse()

// Logic: Builds a standardized REST API success response using the Response Envelope pattern. Supports optional metadata and automatically handles HTTP 204 responses.

function buildSuccessResponse(data, statusCode, meta) {

    // --- STEP 1: VALIDATION ---
    if (
        ![200, 201, 204].includes(statusCode) ||
        (meta !== undefined &&
            (typeof meta !== "object" ||
                meta === null ||
                Array.isArray(meta)))
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD RESPONSE ---
    return {
        success: true,
        statusCode,
        data: statusCode === 204 ? null : data,
        meta: {
            page: meta?.page ?? null,
            totalCount: meta?.totalCount ?? null,
            requestId: meta?.requestId ?? "N/A"
        },
        timestamp: "2025-01-01T00:00:00Z"
    };

}

// --- EXAMPLE USAGE ---
console.log(
    buildSuccessResponse(
        { userId: "U1", name: "Rahim" },
        200,
        {
            page: 1,
            totalCount: 50,
            requestId: "REQ-001"
        }
    )
);

console.log(
    buildSuccessResponse(
        null,
        204,
        {}
    )
);