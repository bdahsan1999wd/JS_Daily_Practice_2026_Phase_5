// 🧩 PROBLEM–02: runConditionalWaterfall()

// Logic: Simulates a conditional async waterfall. The order is validated, discount is applied based on customer type, then the delivery fee is calculated.

async function runConditionalWaterfall(order) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof order !== "object" ||
        order === null ||
        typeof order.orderId !== "string" ||
        order.orderId.trim() === "" ||
        typeof order.amount !== "number" ||
        order.amount <= 0 ||
        typeof order.customerType !== "string" ||
        !["REGULAR", "VIP", "WHOLESALE"].includes(order.customerType)
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: WATERFALL STEPS ---

    async function validateOrder(order) {

        return {
            ...order,
            validated: true
        };

    }

    async function applyDiscount(order) {

        let discountRate = 0.95;

        if (order.customerType === "VIP") {
            discountRate = 0.80;
        }
        else if (order.customerType === "WHOLESALE") {
            discountRate = 0.70;
        }

        return {
            ...order,
            discountedAmount: Number(
                (order.amount * discountRate).toFixed(2)
            ),
            discountApplied: true
        };

    }

    async function addDeliveryFee(order) {

        const deliveryFee =
            order.discountedAmount < 1000 ? 60 : 0;

        return {
            orderId: order.orderId,
            customerType: order.customerType,
            discountedAmount: order.discountedAmount,
            deliveryFee,
            finalAmount: Number(
                (order.discountedAmount + deliveryFee).toFixed(2)
            )
        };

    }

    // --- STEP 3: EXECUTE WATERFALL ---
    const validatedOrder = await validateOrder(order);
    const discountedOrder = await applyDiscount(validatedOrder);
    const finalOrder = await addDeliveryFee(discountedOrder);

    return finalOrder;

}

// --- EXAMPLE USAGE ---
runConditionalWaterfall({
    orderId: "ORD-77",
    amount: 800,
    customerType: "VIP"
})
    .then(result => console.log(result))
    .catch(error => console.log(error));