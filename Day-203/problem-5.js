// 🧩 PROBLEM–05: runParallelFetchOrchestrator()

// Logic: Orchestrates multiple parallel fetching strategies. Critical sources use Promise.all(), optional sources use Promise.allSettled(), and fallback endpoints use Promise.any().

async function runParallelFetchOrchestrator(fetchPlan) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof fetchPlan !== "object" ||
        fetchPlan === null ||
        !Array.isArray(fetchPlan.criticalSources) ||
        !Array.isArray(fetchPlan.optionalSources) ||
        !Array.isArray(fetchPlan.fallbackEndpoints)
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: HELPER FUNCTIONS ---
    function fetchSource(source) {

        return new Promise((resolve, reject) => {

            if (source.dataType === "USERS") {

                resolve({
                    sourceId: source.sourceId,
                    dataType: source.dataType,
                    records: [
                        { id: "U1" },
                        { id: "U2" }
                    ]
                });

            }

            else if (source.dataType === "PRODUCTS") {

                resolve({
                    sourceId: source.sourceId,
                    dataType: source.dataType,
                    records: [
                        { id: "P1" },
                        { id: "P2" },
                        { id: "P3" }
                    ]
                });

            }

            else if (source.dataType === "ORDERS") {

                resolve({
                    sourceId: source.sourceId,
                    dataType: source.dataType,
                    records: [
                        { id: "O1" }
                    ]
                });

            }

            else {

                reject("Unknown data type: " + source.dataType);

            }

        });

    }

    function fetchEndpoint(endpoint) {

        return new Promise((resolve, reject) => {

            if (endpoint.isAvailable) {

                resolve({
                    url: endpoint.url,
                    status: "OK",
                    data: "response_from_" + endpoint.url
                });

            } else {

                reject("Endpoint unavailable: " + endpoint.url);

            }

        });

    }

    // --- STEP 3: FETCH CRITICAL SOURCES ---
    const criticalData = await Promise.all(
        fetchPlan.criticalSources.map(fetchSource)
    );

    // --- STEP 4: FETCH OPTIONAL SOURCES ---
    const optionalResults = await Promise.allSettled(
        fetchPlan.optionalSources.map(fetchSource)
    );

    const succeeded = [];
    const failed = [];

    optionalResults.forEach((result, index) => {

        if (result.status === "fulfilled") {

            succeeded.push(result.value);

        } else {

            failed.push({
                sourceId: fetchPlan.optionalSources[index].sourceId,
                reason: result.reason
            });

        }

    });

    // --- STEP 5: FETCH FALLBACK ENDPOINT ---
    const fallbackData = await Promise.any(
        fetchPlan.fallbackEndpoints.map(fetchEndpoint)
    );

    // --- STEP 6: RETURN RESULT ---
    return {
        criticalData,
        optionalData: {
            succeeded,
            failed
        },
        fallbackData
    };

}

// --- EXAMPLE USAGE ---
runParallelFetchOrchestrator({
    criticalSources: [
        {
            sourceId: "S1",
            dataType: "USERS"
        }
    ],
    optionalSources: [
        {
            sourceId: "S2",
            dataType: "PRODUCTS"
        },
        {
            sourceId: "S3",
            dataType: "UNKNOWN"
        }
    ],
    fallbackEndpoints: [
        {
            url: "backup.api.com",
            isAvailable: false
        },
        {
            url: "secondary.api.com",
            isAvailable: true
        }
    ]
})
    .then(result => { console.log(JSON.stringify(result, null, 2)); })
    .catch(error => console.log(error));