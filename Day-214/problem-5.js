// 🧩 PROBLEM–05: runWebhookPipelineOrchestrator()

// Logic: Simulates the complete webhook pipeline.
// For each event:
// 1. Dispatch to matching webhooks
// 2. Sign successful deliveries
// 3. Track delivery status with retry simulation

function runWebhookPipelineOrchestrator(events, webhookConfig) {

    // --- STEP 1: VALIDATION ---
    // Events must be a non-empty array and webhookConfig must contain valid settings.

    if (
        !Array.isArray(events) ||
        events.length === 0 ||
        typeof webhookConfig !== "object" ||
        webhookConfig === null ||
        Array.isArray(webhookConfig)
    ) {
        return "Invalid Input";
    }

    const {
        webhooks,
        secret,
        maxRetries
    } = webhookConfig;

    if (
        !Array.isArray(webhooks) ||
        typeof secret !== "string" ||
        secret.trim() === "" ||
        !Number.isInteger(maxRetries) ||
        maxRetries < 1
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: PROCESS EVENTS ---
    // Execute the webhook pipeline for each event.

    const orchestrationLog = [];

    let totalDeliveries = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    for (const event of events) {

        const deliveries = [];

        // Find matching active webhooks.

        const matchedWebhooks = webhooks.filter(webhook =>
            webhook.isActive &&
            webhook.events.includes(event.eventType)
        );

        for (const webhook of matchedWebhooks) {

            totalDeliveries++;

            const initialSuccess =
                webhook.url.includes("healthy");

            let finalStatus;
            let signature = null;

            // Simulate delivery attempts.

            if (initialSuccess) {

                finalStatus = "DELIVERED";

            } else if (maxRetries >= 3) {

                finalStatus = "DELIVERED";

            } else {

                finalStatus = "FAILED";

            }

            // Sign payload only if finally delivered.

            if (finalStatus === "DELIVERED") {

                const serializedPayload = JSON.stringify(event.payload);

                const signatureValue = [...(serializedPayload + secret)]
                    .reduce(
                        (sum, char) => sum + char.charCodeAt(0),
                        0
                    );

                signature = `sha256=${signatureValue.toString(16)}`;

                totalSuccessful++;

            } else {

                totalFailed++;

            }

            deliveries.push({
                webhookId: webhook.webhookId,
                finalStatus,
                signature
            });

        }

        orchestrationLog.push({
            eventId: event.eventId,
            eventType: event.eventType,
            deliveries
        });

    }

    // --- STEP 3: RETURN RESULT ---

    return {
        orchestrationLog,
        totalEvents: events.length,
        totalDeliveries,
        totalSuccessful,
        totalFailed
    };

}

// --- EXAMPLE USAGE ---
console.log(
    runWebhookPipelineOrchestrator(
        [
            {
                eventId: "E1",
                eventType: "order.created",
                payload: {
                    orderId: "O1"
                }
            }
        ],
        {
            webhooks: [
                {
                    webhookId: "WH-1",
                    url: "https://healthy.app.com/hook",
                    events: ["order.created"],
                    isActive: true
                },
                {
                    webhookId: "WH-2",
                    url: "https://broken.app.com/hook",
                    events: ["order.created"],
                    isActive: true
                }
            ],
            secret: "my-secret",
            maxRetries: 3
        }
    )
);