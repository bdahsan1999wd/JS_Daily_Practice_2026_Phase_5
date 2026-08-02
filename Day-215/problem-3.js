// 🧩 PROBLEM–03: createWildcardBus()

// Logic: Creates an Event Bus that supports:
// 1. Exact event subscriptions
// 2. Wildcard pattern subscriptions
// 3. Publishing events to all matching listeners
// 4. Returning matched listener IDs for any event

function createWildcardBus() {

    // --- STEP 1: INTERNAL STORAGE ---
    // Store every subscription.

    const subscriptions = [];

    // Helper function:
    // Check whether a pattern matches an event name.

    function isMatch(pattern, eventName) {

        // "*" matches everything.

        if (pattern === "*") {
            return true;
        }

        // Exact match.

        if (pattern === eventName) {
            return true;
        }

        // Prefix wildcard.
        // Example:
        // "user.*"

        if (pattern.endsWith("*")) {

            const prefix = pattern.slice(0, -1);

            return eventName.startsWith(prefix);

        }

        // Suffix wildcard.
        // Example:
        // "*.created"

        if (pattern.startsWith("*")) {

            const suffix = pattern.slice(1);

            return eventName.endsWith(suffix);

        }

        return false;

    }

    return {

        // --- SUBSCRIBE ---
        // Register or overwrite a listener.

        subscribe(pattern, listenerId, handlerFn) {

            // Validate input.

            if (
                typeof pattern !== "string" ||
                pattern.trim() === "" ||
                typeof listenerId !== "string" ||
                listenerId.trim() === "" ||
                typeof handlerFn !== "function"
            ) {
                return "Invalid Input";
            }

            // Remove existing subscription having same pattern + listenerId.

            const existingIndex = subscriptions.findIndex(
                subscription =>
                    subscription.pattern === pattern &&
                    subscription.listenerId === listenerId
            );

            if (existingIndex !== -1) {
                subscriptions.splice(existingIndex, 1);
            }

            // Store the new subscription.

            subscriptions.push({
                pattern,
                listenerId,
                handler: handlerFn
            });

            return {
                subscribed: true,
                pattern,
                listenerId
            };

        },

        // --- PUBLISH ---
        // Notify all matching listeners. A listener is called only once even if multiple patterns match.

        publish(eventName, payload) {

            // Validate input.

            if (
                typeof eventName !== "string" ||
                eventName.trim() === ""
            ) {
                return "Invalid Input";
            }

            const notifiedListeners = new Set();

            for (const subscription of subscriptions) {

                if (
                    isMatch(
                        subscription.pattern,
                        eventName
                    ) &&
                    !notifiedListeners.has(
                        subscription.listenerId
                    )
                ) {

                    subscription.handler(payload);

                    notifiedListeners.add(
                        subscription.listenerId
                    );

                }

            }

            return {
                eventName,
                payload,
                matchedListeners:
                    notifiedListeners.size
            };

        },

        // --- GET MATCHED LISTENERS ---
        // Return all listener IDs that match the supplied event.

        getMatchedListeners(eventName) {

            // Validate input.

            if (
                typeof eventName !== "string" ||
                eventName.trim() === ""
            ) {
                return "Invalid Input";
            }

            const matchedListeners = new Set();

            for (const subscription of subscriptions) {

                if (
                    isMatch(
                        subscription.pattern,
                        eventName
                    )
                ) {

                    matchedListeners.add(
                        subscription.listenerId
                    );

                }

            }

            return [...matchedListeners];

        }

    };

}

// --- EXAMPLE USAGE ---
const bus = createWildcardBus();

bus.subscribe(
    "user.*",
    "L-1",
    payload => payload
);

bus.subscribe(
    "*.created",
    "L-2",
    payload => payload
);

bus.subscribe(
    "order.shipped",
    "L-3",
    payload => payload
);

bus.subscribe(
    "*",
    "L-4",
    payload => payload
);

console.log(
    bus.getMatchedListeners(
        "user.created"
    )
);

console.log(
    bus.publish(
        "user.created",
        {
            userId: "U1"
        }
    )
);

console.log(
    bus.publish(
        "order.shipped",
        {
            orderId: "O1"
        }
    )
);