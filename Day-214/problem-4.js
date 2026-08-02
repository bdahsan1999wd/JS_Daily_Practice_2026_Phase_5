// 🧩 PROBLEM–04: trackWebhookDelivery()

// Logic: Tracks webhook delivery attempts and determines whether the webhook was eventually delivered. Also calculates retry statistics and average response time.

function trackWebhookDelivery(deliveryAttempts, maxRetries) {

    // --- STEP 1: VALIDATION ---
    // Delivery attempts must be a non-empty array and maxRetries must be a positive integer.

    if (
        !Array.isArray(deliveryAttempts) ||
        deliveryAttempts.length === 0 ||
        !Number.isInteger(maxRetries) ||
        maxRetries < 1
    ) {
        return "Invalid Input";
    }

    const isValidAttempts = deliveryAttempts.every(attempt =>
        typeof attempt === "object" &&
        attempt !== null &&
        Number.isInteger(attempt.attemptNumber) &&
        attempt.attemptNumber >= 1 &&
        typeof attempt.webhookId === "string" &&
        typeof attempt.statusCode === "number" &&
        typeof attempt.responseTimeMs === "number" &&
        attempt.responseTimeMs >= 0
    );

    if (!isValidAttempts) {
        return "Invalid Input";
    }

    // --- STEP 2: ANALYZE DELIVERY ATTEMPTS ---
    // Find the first successful delivery and calculate total response time.

    let deliveredOnAttempt = null;
    let totalResponseTime = 0;

    for (const attempt of deliveryAttempts) {

        totalResponseTime += attempt.responseTimeMs;

        const isSuccessful =
            attempt.statusCode >= 200 &&
            attempt.statusCode < 300;

        if (isSuccessful && deliveredOnAttempt === null) {
            deliveredOnAttempt = attempt.attemptNumber;
        }

    }

    // --- STEP 3: CALCULATE DELIVERY STATUS ---

    const retriesUsed = deliveryAttempts.length - 1;

    const finalStatus = deliveredOnAttempt !== null
        ? "DELIVERED"
        : "FAILED";

    const retriesExhausted =
        finalStatus === "FAILED" &&
        retriesUsed >= maxRetries;

    const avgResponseTimeMs = Number(
        (totalResponseTime / deliveryAttempts.length).toFixed(2)
    );

    // --- STEP 4: RETURN RESULT ---

    return {
        webhookId: deliveryAttempts[0].webhookId,
        finalStatus,
        deliveredOnAttempt,
        retriesUsed,
        retriesExhausted,
        avgResponseTimeMs
    };

}

// --- EXAMPLE USAGE ---
console.log(
    trackWebhookDelivery(
        [
            {
                attemptNumber: 1,
                webhookId: "WH-1",
                statusCode: 500,
                responseTimeMs: 200
            },
            {
                attemptNumber: 2,
                webhookId: "WH-1",
                statusCode: 503,
                responseTimeMs: 150
            },
            {
                attemptNumber: 3,
                webhookId: "WH-1",
                statusCode: 200,
                responseTimeMs: 100
            }
        ],
        5
    )
);