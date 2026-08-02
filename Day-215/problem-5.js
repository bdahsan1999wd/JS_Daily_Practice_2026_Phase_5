// 🧩 PROBLEM–05: runEventBusOrchestrator()

// Logic: Simulates a complete Event Bus system by combining:
// 1. Wildcard event matching
// 2. One-time listeners
// 3. Event history tracking
// 4. Event publishing summary

function runEventBusOrchestrator(busConfig) {

    // --- STEP 1: VALIDATION ---
    // busConfig must be a valid object.

    if (
        typeof busConfig !== "object" ||
        busConfig === null ||
        Array.isArray(busConfig)
    ) {
        return "Invalid Input";
    }

    const {
        busId,
        maxHistorySize,
        subscriptions,
        eventsToPublish
    } = busConfig;

    // Validate configuration.

    if (
        typeof busId !== "string" ||
        busId.trim() === "" ||
        !Number.isInteger(maxHistorySize) ||
        maxHistorySize < 1 ||
        !Array.isArray(subscriptions) ||
        !Array.isArray(eventsToPublish)
    ) {
        return "Invalid Input";
    }

    // Validate every subscription.

    const validSubscriptions = subscriptions.every(subscription =>
        typeof subscription === "object" &&
        subscription !== null &&
        !Array.isArray(subscription) &&
        typeof subscription.listenerId === "string" &&
        subscription.listenerId.trim() !== "" &&
        typeof subscription.pattern === "string" &&
        subscription.pattern.trim() !== "" &&
        typeof subscription.isOneTime === "boolean"
    );

    // Validate every event.

    const validEvents = eventsToPublish.every(event =>
        typeof event === "object" &&
        event !== null &&
        !Array.isArray(event) &&
        typeof event.eventName === "string" &&
        event.eventName.trim() !== "" &&
        typeof event.payload === "object" &&
        event.payload !== null &&
        !Array.isArray(event.payload)
    );

    if (!validSubscriptions || !validEvents) {
        return "Invalid Input";
    }

    // --- STEP 2: SETUP EVENT BUS ---

    const listeners = [];
    const history = [];

    let eventIndex = 1;
    let totalListenerFires = 0;
    let oneTimeListenersRemoved = 0;

    // --- STEP 3: REGISTER SUBSCRIPTIONS ---

    for (const subscription of subscriptions) {

        listeners.push({
            listenerId: subscription.listenerId,
            pattern: subscription.pattern,
            isOneTime: subscription.isOneTime
        });

    }

    // Helper function for wildcard matching.

    function matches(pattern, eventName) {

        // Match every event.

        if (pattern === "*") {
            return true;
        }

        // Prefix wildcard (user.*)

        if (pattern.endsWith("*")) {

            return eventName.startsWith(
                pattern.slice(0, -1)
            );

        }

        // Suffix wildcard (*.created)

        if (pattern.startsWith("*")) {

            return eventName.endsWith(
                pattern.slice(1)
            );

        }

        // Exact match.

        return pattern === eventName;

    }

    // --- STEP 4: PUBLISH EVENTS ---

    for (const event of eventsToPublish) {

        // Save event into history.

        history.push({
            eventId: `EVT-${eventIndex++}`,
            eventName: event.eventName,
            payload: { ...event.payload },
            publishedAt: new Date().toISOString()
        });

        // Keep only the latest events.

        if (history.length > maxHistorySize) {
            history.shift();
        }

        // Find matching listeners.

        const matchedListeners = [];

        for (const listener of listeners) {

            if (
                matches(
                    listener.pattern,
                    event.eventName
                )
            ) {
                matchedListeners.push(listener);
            }

        }

        // Count every listener invocation.

        totalListenerFires += matchedListeners.length;

        // Remove one-time listeners after firing.

        for (const listener of matchedListeners) {

            if (listener.isOneTime) {

                const index = listeners.findIndex(
                    item =>
                        item.listenerId === listener.listenerId &&
                        item.pattern === listener.pattern
                );

                if (index !== -1) {

                    listeners.splice(index, 1);
                    oneTimeListenersRemoved++;

                }

            }

        }

    }

    // --- STEP 5: RETURN RESULT ---

    return {
        busId,
        totalPublished: eventsToPublish.length,
        totalListenerFires,
        oneTimeListenersRemoved,
        historySnapshot: history
    };

}

// --- EXAMPLE USAGE ---
console.log(
    runEventBusOrchestrator({
        busId: "BUS-01",

        maxHistorySize: 10,

        subscriptions: [
            {
                listenerId: "L-1",
                pattern: "user.*",
                isOneTime: false
            },
            {
                listenerId: "L-2",
                pattern: "*.created",
                isOneTime: true
            },
            {
                listenerId: "L-3",
                pattern: "*",
                isOneTime: false
            }
        ],

        eventsToPublish: [
            {
                eventName: "user.created",
                payload: {
                    userId: "U1"
                }
            },
            {
                eventName: "user.deleted",
                payload: {
                    userId: "U2"
                }
            },
            {
                eventName: "order.created",
                payload: {
                    orderId: "O1"
                }
            }
        ]
    })
);