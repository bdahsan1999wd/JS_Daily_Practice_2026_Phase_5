// 🧩 PROBLEM–01: createEventBus()

// Logic: Creates an Event Bus that supports:
// 1. Subscribe listeners to events
// 2. Publish events to all listeners
// 3. Unsubscribe specific listeners
// 4. Retrieve all listeners of an event

function createEventBus() {

    // --- STEP 1: INTERNAL STORAGE ---
    // Store all events and their listeners.

    const events = {};

    return {

        // --- SUBSCRIBE ---
        // Register or update a listener.

        subscribe(eventName, listenerId, handlerFn) {

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

            // Create the event if it doesn't exist.

            if (!events[eventName]) {
                events[eventName] = {};
            }

            // Add or overwrite the listener.

            events[eventName][listenerId] = handlerFn;

            return {
                subscribed: true,
                eventName,
                listenerId
            };

        },

        // --- PUBLISH ---
        // Notify every listener of an event.

        publish(eventName, payload) {

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
                    listenersNotified: 0
                };

            }

            // Execute every listener.

            const handlers = Object.values(listeners);

            for (const handler of handlers) {
                handler(payload);
            }

            return {
                eventName,
                payload,
                listenersNotified: handlers.length
            };

        },

        // --- UNSUBSCRIBE ---
        // Remove a specific listener.

        unsubscribe(eventName, listenerId) {

            // Validate input.

            if (
                typeof eventName !== "string" ||
                eventName.trim() === "" ||
                typeof listenerId !== "string" ||
                listenerId.trim() === ""
            ) {
                return "Invalid Input";
            }

            if (
                !events[eventName] ||
                !(listenerId in events[eventName])
            ) {

                return {
                    unsubscribed: false,
                    reason: "Listener not found"
                };

            }

            delete events[eventName][listenerId];

            // Remove the event if no listeners remain.

            if (
                Object.keys(events[eventName]).length === 0
            ) {
                delete events[eventName];
            }

            return {
                unsubscribed: true,
                eventName,
                listenerId
            };

        },

        // --- GET LISTENERS ---
        // Return all listener IDs for an event.

        getListeners(eventName) {

            // Validate input.

            if (
                typeof eventName !== "string" ||
                eventName.trim() === ""
            ) {
                return "Invalid Input";
            }

            if (!events[eventName]) {
                return [];
            }

            return Object.keys(events[eventName]);

        }

    };

}

// --- EXAMPLE USAGE ---
const bus = createEventBus();

bus.subscribe(
    "user.created",
    "L-1",
    (payload) => payload
);

bus.subscribe(
    "user.created",
    "L-2",
    (payload) => payload
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
    bus.getListeners(
        "user.created"
    )
);

console.log(
    bus.unsubscribe(
        "user.created",
        "L-1"
    )
);

console.log(
    bus.getListeners(
        "user.created"
    )
);