// 🧩 PROBLEM–05: fetchWithFallback()

// Logic: Simulates resilient batch fetching using Promise.allSettled(). Successful requests are collected while failures are reported without stopping the entire batch.

function fetchWithFallback(requests) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(requests) ||
        requests.length === 0 ||
        !requests.every(request =>
            typeof request === "object" &&
            typeof request.id === "string" &&
            typeof request.type === "string"
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CREATE REQUESTS ---
    const promises = requests.map(request => {

        return new Promise((resolve, reject) => {

            if (
                request.type === "USER" &&
                request.id.startsWith("U")
            ) {
                resolve({
                    id: request.id,
                    type: request.type,
                    result: "user_data_" + request.id
                });
            }

            else if (
                request.type === "PRODUCT" &&
                request.id.startsWith("P")
            ) {
                resolve({
                    id: request.id,
                    type: request.type,
                    result: "product_data_" + request.id
                });
            }

            else if (
                request.type === "ORDER" &&
                request.id.startsWith("O")
            ) {
                resolve({
                    id: request.id,
                    type: request.type,
                    result: "order_data_" + request.id
                });
            }

            else {
                reject("Fetch failed for " + request.id);
            }

        });

    });

    // --- STEP 3: BUILD FINAL REPORT ---
    return Promise.allSettled(promises)
        .then(results => {

            const succeeded = [];
            const failed = [];

            results.forEach((result, index) => {

                if (result.status === "fulfilled") {

                    succeeded.push({
                        id: result.value.id,
                        result: result.value.result
                    });

                } else {

                    failed.push({
                        id: requests[index].id,
                        reason: result.reason
                    });

                }

            });

            const successRate = Number(
                ((succeeded.length / requests.length) * 100).toFixed(2)
            );

            return {
                succeeded,
                failed,
                successRate
            };

        });

}

// --- EXAMPLE USAGE ---
fetchWithFallback([
    { id: "U-1", type: "USER" },
    { id: "X-1", type: "PRODUCT" },
    { id: "O-1", type: "ORDER" }
])
    .then(result => console.log(result));