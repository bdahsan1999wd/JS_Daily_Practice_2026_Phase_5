// 🧩 PROBLEM–02: createOneTimeBus()

// Logic: Creates an Event Bus that supports:
// 1. Persistent listeners (on)
// 2. One-time listeners (once)
// 3. Emit events to all matching listeners
// 4. Automatically remove one-time listeners after first execution

function createOneTimeBus() {

    // --- STEP 1: INTERNAL STORAGE ---
    // Store listeners grouped by event name.

    const events = {};

    return {

        // --- ON ---
        // Register a persistent listener.

        on(eventName, listenerId, handlerFn) {

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

            // Create event if it doesn't exist.

            if (!events[eventName]) {
                events[eventName] = {};
            }

            // Add or overwrite the listener.

            events[eventName][listenerId] = {
                handler: handlerFn,
                once: false
            };

            return {
                subscribed: true,
                eventName,
                listenerId
            };

        },

        // --- ONCE ---
        // Register a listener that runs only once.

        once(eventName, listenerId, handlerFn) {

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

            // Create event if it doesn't exist.

            if (!events[eventName]) {
                events[eventName] = {};
            }

            // Add or overwrite the listener.

            events[eventName][listenerId] = {
                handler: handlerFn,
                once: true
            };

            return {
                subscribed: true,
                eventName,
                listenerId
            };

        },

        // --- EMIT ---
        // Notify all matching listeners.
        // Remove one-time listeners after execution.

        emit(eventName, payload) {

            // Validate input.

            if (
                typeof eventName !== "string" ||
                eventName.trim() === ""
            ) {
                return "Invalid Input";
            }

            const listeners = events[eventName];

            // No listeners registered.

            if (!listeners) {

                return {
                    eventName,
                    payload,
                    firedCount: 0,
                    removedOneTimeListeners: 0
                };

            }

            let firedCount = 0;
            let removedOneTimeListeners = 0;

            // Store one-time listeners to remove later.

            const listenersToRemove = [];

            // Execute every listener.

            for (const [listenerId, listener] of Object.entries(listeners)) {

                listener.handler(payload);

                firedCount++;

                if (listener.once) {
                    listenersToRemove.push(listenerId);
                }

            }

            // Remove one-time listeners.

            for (const listenerId of listenersToRemove) {

                delete listeners[listenerId];

                removedOneTimeListeners++;

            }

            // Remove empty event.

            if (Object.keys(listeners).length === 0) {
                delete events[eventName];
            }

            return {
                eventName,
                payload,
                firedCount,
                removedOneTimeListeners
            };

        },

        // --- LISTENER COUNT ---
        // Return the number of active listeners.

        listenerCount(eventName) {

            // Validate input.

            if (
                typeof eventName !== "string" ||
                eventName.trim() === ""
            ) {
                return "Invalid Input";
            }

            if (!events[eventName]) {
                return 0;
            }

            return Object.keys(events[eventName]).length;

        }

    };

}

// --- EXAMPLE USAGE ---
const bus = createOneTimeBus();

bus.on(
    "order.placed",
    "persistent-L",
    (payload) => payload
);

bus.once(
    "order.placed",
    "one-time-L",
    (payload) => payload
);

console.log(
    bus.listenerCount(
        "order.placed"
    )
);

console.log(
    bus.emit(
        "order.placed",
        {
            orderId: "O1"
        }
    )
);

console.log(
    bus.listenerCount(
        "order.placed"
    )
);

console.log(
    bus.emit(
        "order.placed",
        {
            orderId: "O2"
        }
    )
);