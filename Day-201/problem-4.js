// 🧩 PROBLEM–04: getUserOrders()

// Logic: Uses async/await to simulate fetching user data, retrieving orders, and calculating total spending. Errors are handled using try/catch.

async function getUserOrders(userId) {

    // --- STEP 1: VALIDATION ---
    if (typeof userId !== "string" || userId.trim() === "") {
        return {
            error: "Invalid Input"
        };
    }

    // --- STEP 2: HELPER PROMISES ---

    function fetchUser(userId) {
        return new Promise((resolve, reject) => {

            if (userId.startsWith("U")) {
                resolve({
                    userId,
                    name: "User_" + userId
                });
            } else {
                reject("User not found");
            }

        });
    }

    function fetchOrders() {
        return Promise.resolve([
            {
                orderId: "ORD-1",
                amount: 500
            },
            {
                orderId: "ORD-2",
                amount: 300
            }
        ]);
    }

    // --- STEP 3: PROCESS REQUEST ---
    try {

        const user = await fetchUser(userId);
        const orders = await fetchOrders();

        const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);

        return {
            user,
            orders,
            totalSpent
        };

    } catch (error) {

        return {
            error
        };

    }

}

// --- EXAMPLE USAGE ---
getUserOrders("U-001")
    .then(result => console.log(result));