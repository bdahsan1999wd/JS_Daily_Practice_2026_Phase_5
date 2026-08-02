// 🧩 PROBLEM–04: createReplayBus()

// Logic: Creates an event bus that stores event history.
// Supports:
// 1. Subscribe listeners
// 2. Publish events
// 3. Replay old events to a listener
// 4. Retrieve history
// 5. Clear history

function createReplayBus(maxHistorySize) {

    // --- STEP 1: VALIDATION ---
    // maxHistorySize must be an integer >= 1.

    if (
        !Number.isInteger(maxHistorySize) ||
        maxHistorySize < 1
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STORAGE ---

    // Stores listeners grouped by event name.
    const listeners = {};

    // Stores published event history.
    const history = [];

    // Auto incrementing event index.
    let eventIndex = 1;

    // --------------------------------------------------
    // Subscribe a listener
    // --------------------------------------------------

    function subscribe(eventName, listenerId, handlerFn) {

        // Validate input.

        if (
            typeof eventName !== "string" ||
            eventName.trim() === "" ||
            typeof listenerId !== "string" ||
            listenerId.trim() === "" ||
            typeof handlerFn !== "function"
        ) {
            return "Invalid Input";
        }

        // Create event bucket if necessary.

        if (!listeners[eventName]) {
            listeners[eventName] = [];
        }

        // Overwrite existing listener with same ID.

        const existingIndex = listeners[eventName].findIndex(
            listener => listener.listenerId === listenerId
        );

        if (existingIndex !== -1) {

            listeners[eventName][existingIndex].handlerFn =
                handlerFn;

        } else {

            listeners[eventName].push({
                listenerId,
                handlerFn
            });

        }

        return {
            subscribed: true,
            eventName,
            listenerId
        };

    }

    // --------------------------------------------------
    // Publish an event
    // --------------------------------------------------

    function publish(eventName, payload) {

        // Validate event name.

        if (
            typeof eventName !== "string" ||
            eventName.trim() === ""
        ) {
            return "Invalid Input";
        }

        // Create history record.

        const eventRecord = {
            eventId: `EVT-${eventIndex++}`,
            eventName,
            payload,
            publishedAt: new Date().toISOString()
        };

        // Save event.

        history.push(eventRecord);

        // Maintain FIFO history size.

        if (history.length > maxHistorySize) {
            history.shift();
        }

        // Notify listeners.

        let notified = 0;

        if (listeners[eventName]) {

            for (const listener of listeners[eventName]) {

                listener.handlerFn(payload);

                notified++;

            }

        }

        return {
            eventName,
            payload,
            listenersNotified: notified
        };

    }

    // --------------------------------------------------
    // Replay previous events
    // --------------------------------------------------

    function replay(eventName, listenerId) {

        // Validate input.

        if (
            typeof eventName !== "string" ||
            eventName.trim() === "" ||
            typeof listenerId !== "string" ||
            listenerId.trim() === ""
        ) {
            return "Invalid Input";
        }

        // Find listener.

        const listener = listeners[eventName]?.find(
            listener => listener.listenerId === listenerId
        );

        if (!listener) {

            return {
                replayed: 0,
                reason: "Listener not found"
            };

        }

        // Find matching history.

        const matchedEvents = history.filter(
            event => event.eventName === eventName
        );

        // Replay every event.

        for (const event of matchedEvents) {
            listener.handlerFn(event.payload);
        }

        return {
            listenerId,
            eventName,
            replayed: matchedEvents.length
        };

    }

    // --------------------------------------------------
    // Get history
    // --------------------------------------------------

    function getHistory(eventName) {

        // Validate input.

        if (
            typeof eventName !== "string" ||
            eventName.trim() === ""
        ) {
            return "Invalid Input";
        }

        // "*" returns every stored event.

        if (eventName === "*") {
            return [...history];
        }

        // Return matching events only.

        return history.filter(
            event => event.eventName === eventName
        );

    }

    // --------------------------------------------------
    // Clear history
    // --------------------------------------------------

    function clearHistory() {

        const removedEvents = history.length;

        history.length = 0;

        return {
            cleared: true,
            eventsRemoved: removedEvents
        };

    }

    // --- STEP 3: RETURN EVENT BUS ---

    return {
        subscribe,
        publish,
        replay,
        getHistory,
        clearHistory
    };

}

// --- EXAMPLE USAGE ---
const bus = createReplayBus(3);

bus.subscribe(
    "user.created",
    "L-1",
    payload => console.log(payload)
);

bus.publish(
    "user.created",
    { userId: "U1" }
);

bus.publish(
    "user.created",
    { userId: "U2" }
);

bus.publish(
    "order.placed",
    { orderId: "O1" }
);

console.log(
    bus.getHistory("user.created")
);

console.log(
    bus.replay(
        "user.created",
        "L-1"
    )
);

console.log(
    bus.clearHistory()
);