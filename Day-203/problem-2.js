// 🧩 PROBLEM–02: findFastestSource()

// Logic: Simulates finding the fastest data source using Promise.race(). The source with the lowest response time is placed first, so it wins the race.

function findFastestSource(sources) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(sources) ||
        sources.length === 0 ||
        !sources.every(source =>
            typeof source === "object" &&
            source !== null &&
            typeof source.sourceId === "string" &&
            source.sourceId.trim() !== "" &&
            typeof source.responseSpeedMs === "number" &&
            source.responseSpeedMs > 0
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: SORT SOURCES BY SPEED ---
    const sortedSources = [...sources].sort(
        (a, b) => a.responseSpeedMs - b.responseSpeedMs
    );

    // --- STEP 3: CREATE PROMISES ---
    const racePromises = sortedSources.map(source => {

        return new Promise(resolve => {

            resolve({
                sourceId: source.sourceId,
                responseSpeedMs: source.responseSpeedMs,
                data: "data_from_" + source.sourceId
            });

        });

    });

    // --- STEP 4: RETURN FASTEST SOURCE ---
    return Promise.race(racePromises);

}

// --- EXAMPLE USAGE ---
findFastestSource([
    {
        sourceId: "DB-1",
        responseSpeedMs: 300
    },
    {
        sourceId: "DB-2",
        responseSpeedMs: 100
    },
    {
        sourceId: "DB-3",
        responseSpeedMs: 200
    }
])
    .then(result => console.log(result))
    .catch(error => console.log(error));