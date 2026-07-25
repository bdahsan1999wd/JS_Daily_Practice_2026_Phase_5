// 🧩 PROBLEM–04: simulateDebounce()

// Logic: Simulates an async debounce mechanism. Events are first sorted by timestamp, then grouped based on the debounce window. Only the last event from each group survives while the others are debounced out.

async function simulateDebounce(events, debounceWindowMs) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(events) ||
        events.length === 0 ||
        typeof debounceWindowMs !== "number" ||
        debounceWindowMs <= 0 ||
        !events.every(event =>
            typeof event === "object" &&
            event !== null &&
            typeof event.eventId === "string" &&
            event.eventId.trim() !== "" &&
            typeof event.timestampMs === "number" &&
            event.timestampMs >= 0
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: SORT EVENTS ---
    const sortedEvents = [...events].sort(
        (a, b) => a.timestampMs - b.timestampMs
    );

    // --- STEP 3: APPLY DEBOUNCE ---

    const processedEvents = [];
    let currentGroup = [sortedEvents[0]];

    for (let i = 1; i < sortedEvents.length; i++) {

        const previousEvent = sortedEvents[i - 1];
        const currentEvent = sortedEvents[i];

        const gap = currentEvent.timestampMs - previousEvent.timestampMs;

        if (gap <= debounceWindowMs) {

            currentGroup.push(currentEvent);

        } else {

            processedEvents.push(
                currentGroup[currentGroup.length - 1]
            );

            currentGroup = [currentEvent];

        }

    }

    // Push the last group's final event
    processedEvents.push(
        currentGroup[currentGroup.length - 1]
    );

    // --- STEP 4: BUILD RESULT ---

    const debouncedCount =
        sortedEvents.length - processedEvents.length;

    return {
        processedEvents,
        debouncedCount
    };

}

// --- EXAMPLE USAGE ---
simulateDebounce(
    [
        {
            eventId: "E1",
            timestampMs: 100,
            data: "a"
        },
        {
            eventId: "E2",
            timestampMs: 150,
            data: "b"
        },
        {
            eventId: "E3",
            timestampMs: 200,
            data: "c"
        },
        {
            eventId: "E4",
            timestampMs: 500,
            data: "d"
        }
    ],
    100
)
    .then(result => console.log(result))
    .catch(error => console.log(error));