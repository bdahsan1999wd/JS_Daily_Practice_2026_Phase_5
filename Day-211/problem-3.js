// 🧩 PROBLEM–03: checkSlidingWindowLimit()

// Logic: Applies the Sliding Window Rate Limiting algorithm. For every request, only ALLOWED requests within the previous rolling window are counted. Requests exceeding the configured limit are marked as RATE_LIMITED.

function checkSlidingWindowLimit(requests, windowConfig) {

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

    // --- STEP 2: INITIALIZE ---
    const allowedHistory = {};
    const results = [];

    let allowedCount = 0;
    let rateLimitedCount = 0;

    // --- STEP 3: APPLY SLIDING WINDOW ---
    for (const request of requests) {

        if (!allowedHistory[request.clientId]) {
            allowedHistory[request.clientId] = [];
        }

        const history = allowedHistory[request.clientId];

        while (
            history.length > 0 &&
            history[0] <= request.timestampMs - windowConfig.windowSizeMs
        ) {
            history.shift();
        }

        const windowCount = history.length;

        let status;

        if (windowCount < windowConfig.maxRequests) {

            status = "ALLOWED";
            history.push(request.timestampMs);
            allowedCount++;

        } else {

            status = "RATE_LIMITED";
            rateLimitedCount++;

        }

        results.push({
            requestId: request.requestId,
            clientId: request.clientId,
            status,
            windowCount
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
    checkSlidingWindowLimit(
        [
            {
                requestId: "R1",
                clientId: "C1",
                timestampMs: 100
            },
            {
                requestId: "R2",
                clientId: "C1",
                timestampMs: 400
            },
            {
                requestId: "R3",
                clientId: "C1",
                timestampMs: 700
            },
            {
                requestId: "R4",
                clientId: "C1",
                timestampMs: 900
            }
        ],
        {
            windowSizeMs: 500,
            maxRequests: 2
        }
    )
);
