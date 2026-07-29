// 🧩 PROBLEM–04: applyTieredRateLimit()

// Logic: Applies tier-based Fixed Window Rate Limiting. Each client's tier determines the allowed requests and window size. Requests exceeding the limit are marked as RATE_LIMITED.

function applyTieredRateLimit(requests, tierPolicies) {

    // --- STEP 1: VALIDATION ---
    const validTiers = [
        "FREE",
        "BASIC",
        "PREMIUM",
        "ENTERPRISE"
    ];

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
            typeof request.clientTier === "string" &&
            validTiers.includes(request.clientTier) &&
            typeof request.timestampMs === "number" &&
            request.timestampMs >= 0
        ) ||
        typeof tierPolicies !== "object" ||
        tierPolicies === null ||
        !validTiers.every(tier =>
            typeof tierPolicies[tier] === "object" &&
            tierPolicies[tier] !== null &&
            typeof tierPolicies[tier].windowSizeMs === "number" &&
            tierPolicies[tier].windowSizeMs > 0 &&
            Number.isInteger(tierPolicies[tier].maxRequests) &&
            tierPolicies[tier].maxRequests >= 1
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: SORT REQUESTS ---
    const sortedRequests = [...requests].sort((a, b) => {

        if (a.clientId === b.clientId) {
            return a.timestampMs - b.timestampMs;
        }

        return a.clientId.localeCompare(b.clientId);

    });

    // --- STEP 3: APPLY TIERED RATE LIMIT ---
    const windowCounter = {};
    const tierSummary = {};
    const results = [];

    for (const request of sortedRequests) {

        const policy = tierPolicies[request.clientTier];

        const windowNumber = Math.floor(
            request.timestampMs / policy.windowSizeMs
        );

        const key =
            `${request.clientId}-${request.clientTier}-${windowNumber}`;

        windowCounter[key] = (windowCounter[key] || 0) + 1;

        const status =
            windowCounter[key] <= policy.maxRequests
                ? "ALLOWED"
                : "RATE_LIMITED";

        if (!tierSummary[request.clientTier]) {

            tierSummary[request.clientTier] = {
                totalRequests: 0,
                allowed: 0,
                rateLimited: 0
            };

        }

        tierSummary[request.clientTier].totalRequests++;

        if (status === "ALLOWED") {
            tierSummary[request.clientTier].allowed++;
        } else {
            tierSummary[request.clientTier].rateLimited++;
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
        tierSummary
    };

}

// --- EXAMPLE USAGE ---
console.log(
    applyTieredRateLimit(
        [
            {
                requestId: "R1",
                clientId: "C1",
                clientTier: "FREE",
                timestampMs: 100
            },
            {
                requestId: "R2",
                clientId: "C1",
                clientTier: "FREE",
                timestampMs: 200
            },
            {
                requestId: "R3",
                clientId: "C2",
                clientTier: "PREMIUM",
                timestampMs: 100
            }
        ],
        {
            FREE: {
                maxRequests: 1,
                windowSizeMs: 60000
            },
            BASIC: {
                maxRequests: 100,
                windowSizeMs: 60000
            },
            PREMIUM: {
                maxRequests: 1000,
                windowSizeMs: 60000
            },
            ENTERPRISE: {
                maxRequests: 999999,
                windowSizeMs: 60000
            }
        }
    )
);