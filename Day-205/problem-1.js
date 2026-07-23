// 🧩 PROBLEM–01: runWaterfallChain()

// Logic: Simulates a basic async waterfall pipeline. Each async step receives the previous step's result and transforms the data before passing it forward.

async function runWaterfallChain(inputData) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof inputData !== "object" ||
        inputData === null ||
        typeof inputData.value !== "number" ||
        inputData.value <= 0 ||
        typeof inputData.label !== "string" ||
        inputData.label.trim() === ""
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: WATERFALL STEPS ---

    async function doubleValue(data) {

        return {
            ...data,
            value: data.value * 2,
            step: "DOUBLED"
        };

    }

    async function addTax(data) {

        return {
            ...data,
            value: Number((data.value * 1.15).toFixed(2)),
            step: "TAX_ADDED"
        };

    }

    async function formatValue(data) {

        return {
            ...data,
            formattedValue: "৳" + data.value.toFixed(2),
            step: "FORMATTED"
        };

    }

    // --- STEP 3: EXECUTE WATERFALL ---
    const doubledData = await doubleValue(inputData);
    const taxedData = await addTax(doubledData);
    const formattedData = await formatValue(taxedData);

    return formattedData;

}

// --- EXAMPLE USAGE ---
runWaterfallChain({
    value: 100,
    label: "Product A"
})
    .then(result => console.log(result))
    .catch(error => console.log(error));