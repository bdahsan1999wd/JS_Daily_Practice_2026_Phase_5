// 🧩 PROBLEM–02: processOrderPipeline()

// Logic: Simulates a complete order processing pipeline using Promise chaining (Validation → Pricing → Confirmation).

function processOrderPipeline(orderId) {

    // --- STEP 1: VALIDATION ---
    if (typeof orderId !== "string" || orderId.trim() === "") {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: HELPER FUNCTIONS ---

    function validateOrder(orderId) {
        return new Promise((resolve, reject) => {

            if (orderId.startsWith("ORD")) {
                resolve({
                    orderId,
                    valid: true
                });
            } else {
                reject("Invalid order ID");
            }

        });
    }

    function calculateTotal(order) {
        return new Promise(resolve => {

            resolve({
                ...order,
                total: order.orderId.length * 100
            });

        });
    }

    function confirmOrder(order) {
        return new Promise(resolve => {

            resolve({
                ...order,
                status: "CONFIRMED",
                confirmationCode: "CONF-" + order.orderId
            });

        });
    }

    // --- STEP 3: PROMISE CHAIN ---
    return validateOrder(orderId)
        .then(calculateTotal)
        .then(confirmOrder);

}

// --- EXAMPLE USAGE ---
processOrderPipeline("ORD-500")
    .then(result => console.log(result))
    .catch(err => console.log(err));