// 🧩 PROBLEM–02: simulateAuthMiddleware()

// Logic: Simulates an authentication middleware. Validates the Authorization header, verifies the token, and attaches authenticated user information to the request.

function simulateAuthMiddleware(request, validTokens) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof request !== "object" ||
        request === null ||
        typeof request.path !== "string" ||
        request.path.trim() === "" ||
        typeof request.headers !== "object" ||
        request.headers === null ||
        !Array.isArray(validTokens) ||
        !validTokens.every(token => typeof token === "string")
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: EXTRACT AUTHORIZATION HEADER ---
    const authHeader = request.headers.Authorization;

    if (!authHeader) {

        return {
            authStatus: "BLOCKED",
            request,
            blockReason: "Authorization header missing"
        };

    }

    // --- STEP 3: VALIDATE HEADER FORMAT ---
    const parts = authHeader.split(" ");

    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {

        return {
            authStatus: "BLOCKED",
            request,
            blockReason: "Invalid authorization format"
        };

    }

    const token = parts[1];

    // --- STEP 4: VALIDATE TOKEN ---
    if (!validTokens.includes(token)) {

        return {
            authStatus: "BLOCKED",
            request,
            blockReason: "Invalid or expired token"
        };

    }

    // --- STEP 5: ATTACH AUTH INFO ---
    const authenticatedRequest = {
        ...request,
        auth: {
            userId: "USER_" + token,
            role: "USER"
        }
    };

    // --- STEP 6: RETURN RESULT ---
    return {
        authStatus: "PASSED",
        request: authenticatedRequest,
        blockReason: null
    };

}

// --- EXAMPLE USAGE ---
console.log(
    simulateAuthMiddleware(
        {
            path: "/api/orders",
            headers: {
                Authorization: "Bearer token-abc"
            }
        },
        [
            "token-abc",
            "token-xyz"
        ]
    )
);