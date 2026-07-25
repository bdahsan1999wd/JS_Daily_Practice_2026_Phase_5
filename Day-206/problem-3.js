// 🧩 PROBLEM–03: processPriorityQueue()

// Logic: Simulates an async priority queue processor. Queue items are sorted by priority (highest first) and processed sequentially using async/await. Each processed item is assigned a priority tier.

async function processPriorityQueue(queue) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(queue) ||
        queue.length === 0 ||
        !queue.every(item =>
            typeof item === "object" &&
            item !== null &&
            typeof item.itemId === "string" &&
            item.itemId.trim() !== "" &&
            Number.isInteger(item.priority) &&
            item.priority >= 1 &&
            item.priority <= 10
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: SORT QUEUE ---
    const sortedQueue = [...queue].sort(
        (a, b) => b.priority - a.priority
    );

    // --- STEP 3: ITEM PROCESSOR ---

    async function processItem(item) {

        let tier = "";

        if (item.priority >= 7) {
            tier = "URGENT";
        } else if (item.priority >= 4) {
            tier = "NORMAL";
        } else {
            tier = "LOW";
        }

        return {
            itemId: item.itemId,
            data: item.data,
            status: "PROCESSED",
            tier
        };

    }

    // --- STEP 4: PROCESS SEQUENTIALLY ---

    const results = [];
    const processingOrder = [];

    for (const item of sortedQueue) {

        const processedItem = await processItem(item);

        results.push(processedItem);
        processingOrder.push(item.itemId);

    }

    return {
        results,
        processingOrder
    };

}

// --- EXAMPLE USAGE ---

processPriorityQueue([
    {
        itemId: "I-1",
        priority: 3,
        data: "low task"
    },
    {
        itemId: "I-2",
        priority: 8,
        data: "urgent task"
    },
    {
        itemId: "I-3",
        priority: 5,
        data: "normal task"
    }
])
    .then(result => console.log(result))
    .catch(error => console.log(error));