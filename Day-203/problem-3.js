// 🧩 PROBLEM–03: fetchFromFirstAvailable()

// Logic: Simulates fetching data from multiple endpoints using Promise.any(). The first available endpoint returns the data. If all endpoints fail, returns "All endpoints unavailable".

function fetchFromFirstAvailable(endpoints) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(endpoints) ||
        endpoints.length === 0 ||
        !endpoints.every(endpoint =>
            typeof endpoint === "object" &&
            endpoint !== null &&
            typeof endpoint.url === "string" &&
            endpoint.url.trim() !== "" &&
            typeof endpoint.isAvailable === "boolean"
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CREATE FETCH PROMISES ---
    const fetchPromises = endpoints.map(endpoint => {

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

    });

    // --- STEP 3: RETURN FIRST AVAILABLE ENDPOINT ---
    return Promise.any(fetchPromises)
        .catch(() => {

            return Promise.reject("All endpoints unavailable");

        });

}

// --- EXAMPLE USAGE ---
fetchFromFirstAvailable([
    {
        url: "api.service1.com",
        isAvailable: false
    },
    {
        url: "api.service2.com",
        isAvailable: true
    },
    {
        url: "api.service3.com",
        isAvailable: true
    }
])
    .then(result => console.log(result))
    .catch(error => console.log(error));