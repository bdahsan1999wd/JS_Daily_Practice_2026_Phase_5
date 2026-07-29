// 🧩 PROBLEM–02: simulateTokenBucket()

// Logic: Simulates the Token Bucket Rate Limiting algorithm. Tokens are refilled over time based on refill rate. Requests requiring more tokens than available are marked as RATE_LIMITED.

function simulateTokenBucket(requests, bucketConfig) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(requests) ||
        requests.length === 0 ||
        !requests.every(request =>
            typeof request === "object" &&
            request !== null &&
            typeof request.requestId === "string" &&
            request.requestId.trim() !== "" &&
            typeof request.timestampMs === "number" &&
            request.timestampMs >= 0 &&
            Number.isInteger(request.tokensRequired) &&
            request.tokensRequired >= 1
        ) ||
        typeof bucketConfig !== "object" ||
        bucketConfig === null ||
        !Number.isInteger(bucketConfig.bucketCapacity) ||
        bucketConfig.bucketCapacity < 1 ||
        typeof bucketConfig.refillRatePerMs !== "number" ||
        bucketConfig.refillRatePerMs <= 0 ||
        typeof bucketConfig.initialTokens !== "number" ||
        bucketConfig.initialTokens < 0 ||
        bucketConfig.initialTokens > bucketConfig.bucketCapacity
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INITIALIZE BUCKET ---
    let currentTokens = bucketConfig.initialTokens;
    let lastTimestampMs = requests[0].timestampMs;

    const results = [];

    // --- STEP 3: PROCESS REQUESTS ---
    for (const request of requests) {

        const elapsedTime = request.timestampMs - lastTimestampMs;

        const refilledTokens =
            elapsedTime * bucketConfig.refillRatePerMs;

        currentTokens = Math.min(
            bucketConfig.bucketCapacity,
            currentTokens + refilledTokens
        );

        let status;

        if (currentTokens >= request.tokensRequired) {

            currentTokens -= request.tokensRequired;
            status = "ALLOWED";

        } else {

            status = "RATE_LIMITED";

        }

        results.push({
            requestId: request.requestId,
            status,
            tokensAfter: Number(currentTokens.toFixed(2))
        });

        lastTimestampMs = request.timestampMs;

    }

    // --- STEP 4: RETURN RESULT ---
    return {
        results,
        finalTokenCount: Number(currentTokens.toFixed(2))
    };

}

// --- EXAMPLE USAGE ---
console.log(
    simulateTokenBucket(
        [
            {
                requestId: "R1",
                timestampMs: 0,
                tokensRequired: 3
            },
            {
                requestId: "R2",
                timestampMs: 0,
                tokensRequired: 3
            },
            {
                requestId: "R3",
                timestampMs: 500,
                tokensRequired: 2
            }
        ],
        {
            bucketCapacity: 5,
            refillRatePerMs: 0.01,
            initialTokens: 5
        }
    )
);
