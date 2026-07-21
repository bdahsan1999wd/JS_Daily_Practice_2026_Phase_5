// 🧩 PROBLEM–01: aggregateFromSources()

// Logic: Simulates fetching data from multiple sources in parallel using Promise.all() and calculates the total number of records.

function aggregateFromSources(sources) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(sources) ||
        sources.length === 0 ||
        !sources.every(source =>
            typeof source === "object" &&
            source !== null &&
            typeof source.sourceId === "string" &&
            source.sourceId.trim() !== "" &&
            typeof source.dataType === "string"
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CREATE FETCH PROMISES ---
    const fetchPromises = sources.map(source => {

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

    });

    // --- STEP 3: AGGREGATE RESULTS ---
    return Promise.all(fetchPromises)
        .then(results => {

            const totalRecords = results.reduce(
                (total, source) => total + source.records.length,
                0
            );

            return {
                results,
                totalRecords
            };

        });

}

// --- EXAMPLE USAGE ---
aggregateFromSources([
    {
        sourceId: "S1",
        dataType: "USERS"
    },
    {
        sourceId: "S2",
        dataType: "PRODUCTS"
    }
])
    .then(result => { console.log(JSON.stringify(result)); })
    .catch(error => console.log(error));