// 🧩 PROBLEM–01: simulateEventEmitter()

// Logic: Simulates an async event emitter where every event is processed independently using Promise.allSettled(). Successful events are marked as SUCCESS while failed events are marked as FAILED without stopping the overall processing.

async function simulateEventEmitter(events) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(events) ||
        events.length === 0 ||
        !events.every(event =>
            typeof event === "object" &&
            event !== null &&
            typeof event.eventName === "string" &&
            event.eventName.trim() !== "" &&
            typeof event.shouldFail === "boolean"
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: EVENT PROCESSOR ---

    async function processEvent(event) {

        if (event.shouldFail) {
            return Promise.reject("Event failed: " + event.eventName);
        }

        return {
            eventName: event.eventName,
            payload: event.payload,
            processed: true,
            status: "SUCCESS"
        };

    }

    // --- STEP 3: PROCESS ALL EVENTS ---

    const settledResults = await Promise.allSettled(
        events.map(processEvent)
    );

    const processedEvents = [];
    let successCount = 0;
    let failureCount = 0;

    settledResults.forEach((result, index) => {

        if (result.status === "fulfilled") {

            processedEvents.push({
                eventName: result.value.eventName,
                status: "SUCCESS",
                payload: result.value.payload
            });

            successCount++;

        } else {

            processedEvents.push({
                eventName: events[index].eventName,
                status: "FAILED",
                error: result.reason
            });

            failureCount++;

        }

    });

    return {
        processedEvents,
        successCount,
        failureCount
    };

}

// --- EXAMPLE USAGE ---

simulateEventEmitter([
    {
        eventName: "user.created",
        payload: { id: "U1" },
        shouldFail: false
    },
    {
        eventName: "payment.failed",
        payload: { amount: 500 },
        shouldFail: true
    },
    {
        eventName: "order.placed",
        payload: { orderId: "O1" },
        shouldFail: false
    }
])
    .then(result => { console.dir(result, { depth: null }) })
    .catch(error => console.log(error));