// 🧩 PROBLEM–01: checkFixedWindowLimit()

// Logic: Applies the Fixed Window Rate Limiting algorithm. Requests are grouped by client and fixed time window. Requests exceeding the configured limit are marked as RATE_LIMITED.

function checkFixedWindowLimit(requests, windowConfig) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(requests) ||
        requests.length === 0 ||
        !requests.every(request =>
            typeof request === "object" &&
            request !== null &&
            typeof request.requestId === "string" &&
            request.requestId.trim() !== "" &&
            typeof request.clientId === "string" &&
            request.clientId.trim() !== "" &&
            typeof request.timestampMs === "number" &&
            request.timestampMs >= 0
        ) ||
        typeof windowConfig !== "object" ||
        windowConfig === null ||
        typeof windowConfig.windowSizeMs !== "number" ||
        windowConfig.windowSizeMs <= 0 ||
        !Number.isInteger(windowConfig.maxRequests) ||
        windowConfig.maxRequests < 1
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: SORT REQUESTS BY CLIENT & TIME ---
    const sortedRequests = [...requests].sort((a, b) => {

        if (a.clientId === b.clientId) {
            return a.timestampMs - b.timestampMs;
        }

        return a.clientId.localeCompare(b.clientId);

    });

    // --- STEP 3: APPLY FIXED WINDOW ---
    const windowCounter = {};
    const results = [];

    let allowedCount = 0;
    let rateLimitedCount = 0;

    for (const request of sortedRequests) {

        const windowNumber = Math.floor(
            request.timestampMs / windowConfig.windowSizeMs
        );

        const key = `${request.clientId}-${windowNumber}`;

        windowCounter[key] = (windowCounter[key] || 0) + 1;

        const status =
            windowCounter[key] <= windowConfig.maxRequests
                ? "ALLOWED"
                : "RATE_LIMITED";

        if (status === "ALLOWED") {
            allowedCount++;
        } else {
            rateLimitedCount++;
        }

        results.push({
            requestId: request.requestId,
            clientId: request.clientId,
            status
        });

    }

    // --- STEP 4: RETURN RESULT ---
    return {
        results,
        allowedCount,
        rateLimitedCount
    };

}

// --- EXAMPLE USAGE ---
console.log(
    checkFixedWindowLimit(
        [
            {
                requestId: "R1",
                clientId: "C1",
                timestampMs: 100
            },
            {
                requestId: "R2",
                clientId: "C1",
                timestampMs: 200
            },
            {
                requestId: "R3",
                clientId: "C1",
                timestampMs: 300
            },
            {
                requestId: "R4",
                clientId: "C1",
                timestampMs: 1100
            }
        ],
        {
            windowSizeMs: 1000,
            maxRequests: 2
        }
    )
);
