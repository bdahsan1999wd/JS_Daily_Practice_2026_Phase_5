// 🧩 PROBLEM–05: runEventStreamOrchestrator()

// Logic: Simulates a complete async event stream pipeline. It first applies debounce, then sorts surviving events by priority, and finally processes each event asynchronously. The final result summarizes the entire stream execution.

async function runEventStreamOrchestrator(streamConfig) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof streamConfig !== "object" ||
        streamConfig === null ||
        typeof streamConfig.streamId !== "string" ||
        streamConfig.streamId.trim() === "" ||
        !Array.isArray(streamConfig.events) ||
        streamConfig.events.length === 0 ||
        typeof streamConfig.debounceWindowMs !== "number" ||
        streamConfig.debounceWindowMs <= 0 ||
        !streamConfig.events.every(event =>
            typeof event === "object" &&
            event !== null &&
            typeof event.eventId === "string" &&
            event.eventId.trim() !== "" &&
            typeof event.timestampMs === "number" &&
            event.timestampMs >= 0 &&
            Number.isInteger(event.priority) &&
            event.priority >= 1 &&
            event.priority <= 10 &&
            typeof event.shouldFail === "boolean"
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: APPLY DEBOUNCE ---

    function applyDebounce(events, debounceWindowMs) {

        const sortedEvents = [...events].sort(
            (a, b) => a.timestampMs - b.timestampMs
        );

        const survivedEvents = [];
        let currentGroup = [sortedEvents[0]];

        for (let i = 1; i < sortedEvents.length; i++) {

            const previousEvent = sortedEvents[i - 1];
            const currentEvent = sortedEvents[i];

            const gap = currentEvent.timestampMs - previousEvent.timestampMs;

            if (gap <= debounceWindowMs) {

                currentGroup.push(currentEvent);

            } else {

                survivedEvents.push(
                    currentGroup[currentGroup.length - 1]
                );

                currentGroup = [currentEvent];

            }

        }

        survivedEvents.push(
            currentGroup[currentGroup.length - 1]
        );

        return survivedEvents;

    }

    // --- STEP 3: SORT BY PRIORITY ---

    function sortByPriority(events) {

        return [...events].sort(
            (a, b) => b.priority - a.priority
        );

    }

    // --- STEP 4: PROCESS EVENTS ---

    async function processEvent(event) {

        if (event.shouldFail) {
            return Promise.reject("Event failed: " + event.eventId);
        }

        return {
            eventId: event.eventId,
            status: "SUCCESS"
        };

    }

    // --- STEP 5: EXECUTE PIPELINE ---

    const debouncedEvents = applyDebounce(
        streamConfig.events,
        streamConfig.debounceWindowMs
    );

    const prioritizedEvents = sortByPriority(
        debouncedEvents
    );

    const settledResults = await Promise.allSettled(
        prioritizedEvents.map(processEvent)
    );

    // --- STEP 6: BUILD RESULT ---

    const processedLog = [];
    let successCount = 0;
    let failureCount = 0;

    settledResults.forEach((result, index) => {

        if (result.status === "fulfilled") {

            processedLog.push({
                eventId: result.value.eventId,
                status: "SUCCESS"
            });

            successCount++;

        } else {

            processedLog.push({
                eventId: prioritizedEvents[index].eventId,
                status: "FAILED"
            });

            failureCount++;

        }

    });

    return {
        streamId: streamConfig.streamId,
        totalReceived: streamConfig.events.length,
        afterDebounce: debouncedEvents.length,
        successCount,
        failureCount,
        processedLog
    };

}

// --- EXAMPLE USAGE ---
runEventStreamOrchestrator({
    streamId: "STREAM-01",
    events: [
        {
            eventId: "E1",
            timestampMs: 100,
            priority: 5,
            payload: "data1",
            shouldFail: false
        },
        {
            eventId: "E2",
            timestampMs: 130,
            priority: 8,
            payload: "data2",
            shouldFail: false
        },
        {
            eventId: "E3",
            timestampMs: 500,
            priority: 3,
            payload: "data3",
            shouldFail: true
        }
    ],
    debounceWindowMs: 100
})
    .then(result => console.log(result))
    .catch(error => console.log(error));