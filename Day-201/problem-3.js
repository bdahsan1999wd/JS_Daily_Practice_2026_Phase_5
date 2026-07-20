// 🧩 PROBLEM–03: fetchAllResources()

// Logic: Simulates parallel resource loading using Promise.all(). If every resource loads successfully, returns all data. If one fails, the whole Promise rejects.

function fetchAllResources(resourceIds) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(resourceIds) ||
        resourceIds.length === 0 ||
        !resourceIds.every(id => typeof id === "string")
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CREATE PROMISES ---
    const requests = resourceIds.map(resourceId => {

        return new Promise((resolve, reject) => {

            if (resourceId.startsWith("R")) {
                resolve({
                    resourceId,
                    data: "data_for_" + resourceId,
                    loaded: true
                });
            } else {
                reject("Failed to load: " + resourceId);
            }

        });

    });

    // --- STEP 3: FETCH ALL ---
    return Promise.all(requests);

}

// --- EXAMPLE USAGE ---
fetchAllResources(["R1", "R2", "R3"])
    .then(results => console.log(results))
    .catch(err => console.log(err));