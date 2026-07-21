// 🧩 PROBLEM–04: processBatchConcurrently()

// Logic: Processes items in batches using async/await. Each batch is executed concurrently with Promise.all(). The next batch starts only after the current batch finishes.

async function processBatchConcurrently(items, concurrencyLimit) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(items) ||
        items.length === 0 ||
        typeof concurrencyLimit !== "number" ||
        !Number.isInteger(concurrencyLimit) ||
        concurrencyLimit < 1 ||
        concurrencyLimit > 10 ||
        !items.every(item =>
            typeof item === "object" &&
            item !== null &&
            typeof item.itemId === "string" &&
            item.itemId.trim() !== "" &&
            typeof item.value === "number" &&
            item.value > 0
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: HELPER FUNCTION ---
    function processItem(item) {

        return Promise.resolve({
            itemId: item.itemId,
            processedValue: item.value * 2,
            status: "DONE"
        });

    }

    // --- STEP 3: PROCESS BATCHES ---
    const results = [];
    let totalBatches = 0;

    for (let i = 0; i < items.length; i += concurrencyLimit) {

        const batch = items.slice(i, i + concurrencyLimit);

        const batchResults = await Promise.all(
            batch.map(processItem)
        );

        results.push(...batchResults);
        totalBatches++;

    }

    // --- STEP 4: RETURN RESULT ---
    return {
        results,
        totalBatches,
        totalProcessed: results.length
    };

}

// --- EXAMPLE USAGE ---
processBatchConcurrently(
    [
        {
            itemId: "I-1",
            value: 10
        },
        {
            itemId: "I-2",
            value: 20
        },
        {
            itemId: "I-3",
            value: 30
        }
    ],
    2
)
    .then(result => console.log(result))
    .catch(error => console.log(error));