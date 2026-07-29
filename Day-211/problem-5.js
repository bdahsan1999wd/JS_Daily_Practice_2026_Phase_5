// 🧩 PROBLEM–05: runRateLimitOrchestrator()

// Logic: Runs the configured Rate Limiting algorithm. Supports both Fixed Window and Token Bucket. Generates a final rate limit report after processing.

function runRateLimitOrchestrator(incomingRequests, config) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(incomingRequests) ||
        incomingRequests.length === 0 ||
        !incomingRequests.every(request =>
            typeof request === "object" &&
            request !== null &&
            typeof request.requestId === "string" &&
            request.requestId.trim() !== "" &&
            typeof request.clientId === "string" &&
            request.clientId.trim() !== "" &&
            typeof request.clientTier === "string" &&
            ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"].includes(request.clientTier) &&
            typeof request.timestampMs === "number" &&
            request.timestampMs >= 0 &&
            Number.isInteger(request.tokensRequired) &&
            request.tokensRequired >= 1
        ) ||
        typeof config !== "object" ||
        config === null ||
        !["FIXED_WINDOW", "TOKEN_BUCKET"].includes(config.algorithm)
    ) {
        return "Invalid Input";
    }

    let results = [];
    let allowedCount = 0;
    let rateLimitedCount = 0;

    // --- STEP 2: APPLY SELECTED ALGORITHM ---
    if (config.algorithm === "FIXED_WINDOW") {

        if (
            typeof config.windowSizeMs !== "number" ||
            config.windowSizeMs <= 0 ||
            !Number.isInteger(config.maxRequests) ||
            config.maxRequests < 1
        ) {
            return "Invalid Input";
        }

        const windowCounter = {};

        const sortedRequests = [...incomingRequests].sort((a, b) => {

            if (a.clientId === b.clientId) {
                return a.timestampMs - b.timestampMs;
            }

            return a.clientId.localeCompare(b.clientId);

        });

        for (const request of sortedRequests) {

            const windowNumber = Math.floor(
                request.timestampMs / config.windowSizeMs
            );

            const key = `${request.clientId}-${windowNumber}`;

            windowCounter[key] = (windowCounter[key] || 0) + 1;

            const status =
                windowCounter[key] <= config.maxRequests
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

    } else {

        if (
            !Number.isInteger(config.bucketCapacity) ||
            config.bucketCapacity < 1 ||
            typeof config.refillRatePerMs !== "number" ||
            config.refillRatePerMs <= 0 ||
            typeof config.initialTokens !== "number" ||
            config.initialTokens < 0 ||
            config.initialTokens > config.bucketCapacity
        ) {
            return "Invalid Input";
        }

        let currentTokens = config.initialTokens;
        let lastTimestampMs = incomingRequests[0].timestampMs;

        for (const request of incomingRequests) {

            const elapsedTime =
                request.timestampMs - lastTimestampMs;

            const refilledTokens =
                elapsedTime * config.refillRatePerMs;

            currentTokens = Math.min(
                config.bucketCapacity,
                currentTokens + refilledTokens
            );

            let status;

            if (currentTokens >= request.tokensRequired) {

                currentTokens -= request.tokensRequired;
                status = "ALLOWED";
                allowedCount++;

            } else {

                status = "RATE_LIMITED";
                rateLimitedCount++;

            }

            results.push({
                requestId: request.requestId,
                clientId: request.clientId,
                status
            });

            lastTimestampMs = request.timestampMs;

        }

    }

    // --- STEP 3: BUILD REPORT ---
    const throttledClients = {};

    for (const result of results) {

        if (result.status === "RATE_LIMITED") {

            throttledClients[result.clientId] =
                (throttledClients[result.clientId] || 0) + 1;

        }

    }

    let mostThrottledClient = null;
    let maxLimited = 0;

    for (const clientId in throttledClients) {

        if (throttledClients[clientId] > maxLimited) {

            maxLimited = throttledClients[clientId];
            mostThrottledClient = clientId;

        }

    }

    const rateLimitReport = {
        algorithm: config.algorithm,
        totalRequests: incomingRequests.length,
        allowedCount,
        rateLimitedCount,
        rateLimitedPercent: Number(
            (
                (rateLimitedCount / incomingRequests.length) *
                100
            ).toFixed(2)
        ),
        mostThrottledClient
    };

    // --- STEP 4: RETURN RESULT ---
    return {
        results,
        rateLimitReport
    };

}

// --- EXAMPLE USAGE ---
console.log(
    runRateLimitOrchestrator(
        [
            {
                requestId: "R1",
                clientId: "C1",
                clientTier: "FREE",
                timestampMs: 0,
                tokensRequired: 1
            },
            {
                requestId: "R2",
                clientId: "C1",
                clientTier: "FREE",
                timestampMs: 10,
                tokensRequired: 1
            },
            {
                requestId: "R3",
                clientId: "C2",
                clientTier: "BASIC",
                timestampMs: 20,
                tokensRequired: 1
            }
        ],
        {
            algorithm: "FIXED_WINDOW",
            windowSizeMs: 1000,
            maxRequests: 1,
            bucketCapacity: 5,
            refillRatePerMs: 0.01,
            initialTokens: 5
        }
    )
);
