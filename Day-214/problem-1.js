// 🧩 PROBLEM–01: manageWebhookRegistry()

// Logic: Manages a webhook registry by handling register, deactivate, delete and list operations without mutating the original registry.

function manageWebhookRegistry(registry, operation) {

    // --- STEP 1: VALIDATION ---
    // Registry must be an array and operation must be a valid object.

    if (
        !Array.isArray(registry) ||
        typeof operation !== "object" ||
        operation === null ||
        Array.isArray(operation)
    ) {
        return "Invalid Input";
    }

    const isValidRegistry = registry.every(webhook =>
        typeof webhook === "object" &&
        webhook !== null &&
        typeof webhook.webhookId === "string" &&
        typeof webhook.url === "string" &&
        Array.isArray(webhook.events) &&
        webhook.events.every(event => typeof event === "string") &&
        typeof webhook.isActive === "boolean"
    );

    if (!isValidRegistry) {
        return "Invalid Input";
    }

    const { type, webhookId, url, events } = operation;

    if (typeof type !== "string") {
        return "Invalid Input";
    }

    // Create a copy to avoid mutating the original registry.

    let updatedRegistry = [...registry];

    // --- STEP 2: HANDLE OPERATION ---

    switch (type) {

        case "REGISTER": {

            if (
                typeof url !== "string" ||
                !url.startsWith("https://") ||
                !Array.isArray(events) ||
                events.length === 0
            ) {

                return url && !url.startsWith("https://")
                    ? "Webhook URL must use HTTPS"
                    : "Invalid Input";

            }

            const newWebhook = {
                webhookId: `WH-${registry.length + 1}`,
                url,
                events,
                isActive: true
            };

            updatedRegistry.push(newWebhook);

            return {
                registry: updatedRegistry,
                operationResult: {
                    success: true,
                    webhookId: newWebhook.webhookId,
                    message: "Webhook registered successfully"
                }
            };

        }

        case "DEACTIVATE": {

            const index = updatedRegistry.findIndex(
                webhook => webhook.webhookId === webhookId
            );

            if (index === -1) {
                return "Webhook not found";
            }

            updatedRegistry[index] = {
                ...updatedRegistry[index],
                isActive: false
            };

            return {
                registry: updatedRegistry,
                operationResult: {
                    success: true,
                    webhookId,
                    message: "Webhook deactivated successfully"
                }
            };

        }

        case "DELETE": {

            const exists = updatedRegistry.some(
                webhook => webhook.webhookId === webhookId
            );

            if (!exists) {
                return "Webhook not found";
            }

            updatedRegistry = updatedRegistry.filter(
                webhook => webhook.webhookId !== webhookId
            );

            return {
                registry: updatedRegistry,
                operationResult: {
                    success: true,
                    webhookId,
                    message: "Webhook deleted successfully"
                }
            };

        }

        case "LIST":

            return {
                registry: updatedRegistry,
                operationResult: {
                    success: true,
                    message: "Webhook list retrieved successfully"
                }
            };

        default:
            return "Invalid Input";

    }

}

// --- EXAMPLE USAGE ---
console.log(
    manageWebhookRegistry(
        [
            {
                webhookId: "WH-1",
                url: "https://example.com/hook",
                events: ["order.created"],
                isActive: true
            }
        ],
        {
            type: "REGISTER",
            url: "https://myapp.com/webhook",
            events: [
                "payment.success",
                "order.shipped"
            ]
        }
    )
);