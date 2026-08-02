// 🧩 PROBLEM–02: dispatchEvent()

// Logic: Dispatches an event to all active webhooks subscribed to the given event type. Delivery succeeds only if the webhook URL contains the word "healthy".

function dispatchEvent(event, webhooks) {

    // --- STEP 1: VALIDATION ---
    // Event must be a valid object and webhooks must be a valid array.

    if (
        typeof event !== "object" ||
        event === null ||
        Array.isArray(event) ||
        !Array.isArray(webhooks)
    ) {
        return "Invalid Input";
    }

    const {
        eventId,
        eventType,
        payload
    } = event;

    if (
        typeof eventId !== "string" ||
        eventId.trim() === "" ||
        typeof eventType !== "string" ||
        eventType.trim() === "" ||
        typeof payload !== "object" ||
        payload === null ||
        Array.isArray(payload)
    ) {
        return "Invalid Input";
    }

    const isValidWebhooks = webhooks.every(webhook =>
        typeof webhook === "object" &&
        webhook !== null &&
        typeof webhook.webhookId === "string" &&
        typeof webhook.url === "string" &&
        Array.isArray(webhook.events) &&
        webhook.events.every(event => typeof event === "string") &&
        typeof webhook.isActive === "boolean"
    );

    if (!isValidWebhooks) {
        return "Invalid Input";
    }

    // --- STEP 2: FIND MATCHING WEBHOOKS ---
    // Only active webhooks subscribed to this event will receive the delivery.

    const matchedWebhooks = webhooks.filter(webhook =>
        webhook.isActive &&
        webhook.events.includes(eventType)
    );

    // --- STEP 3: SIMULATE DELIVERY ---

    const dispatchLog = [];
    let successCount = 0;
    let failureCount = 0;

    for (const webhook of matchedWebhooks) {

        const delivered = webhook.url.includes("healthy");

        const statusCode = delivered
            ? 200
            : 500;

        if (delivered) {
            successCount++;
        } else {
            failureCount++;
        }

        dispatchLog.push({
            webhookId: webhook.webhookId,
            url: webhook.url,
            delivered,
            statusCode
        });

    }

    // --- STEP 4: RETURN RESULT ---

    return {
        eventId,
        eventType,
        matchedWebhooks: matchedWebhooks.length,
        dispatchLog,
        successCount,
        failureCount
    };

}

// --- EXAMPLE USAGE ---
console.log(
    dispatchEvent(
        {
            eventId: "EVT-1",
            eventType: "order.created",
            payload: {
                orderId: "O1"
            }
        },
        [
            {
                webhookId: "WH-1",
                url: "https://healthy.service.com/hook",
                events: ["order.created"],
                isActive: true
            },
            {
                webhookId: "WH-2",
                url: "https://broken.service.com/hook",
                events: ["order.created"],
                isActive: true
            },
            {
                webhookId: "WH-3",
                url: "https://healthy.other.com/hook",
                events: ["payment.success"],
                isActive: true
            }
        ]
    )
);