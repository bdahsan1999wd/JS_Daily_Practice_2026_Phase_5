// 🧩 PROBLEM–02: transformStream()

// Logic: Simulates an async stream transformer. Each data chunk is processed through a synchronous transform function wrapped inside a Promise. Promise.allSettled() ensures every chunk is processed even if some transformations fail.

async function transformStream(dataChunks, transformFn) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(dataChunks) ||
        dataChunks.length === 0 ||
        typeof transformFn !== "function" ||
        !dataChunks.every(chunk =>
            typeof chunk === "object" &&
            chunk !== null &&
            typeof chunk.chunkId === "string" &&
            chunk.chunkId.trim() !== "" &&
            typeof chunk.value === "number"
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CHUNK TRANSFORMER ---

    async function processChunk(chunk) {

        try {

            const transformedValue = transformFn(chunk);

            return {
                chunkId: chunk.chunkId,
                transformed: transformedValue,
                error: null
            };

        } catch (error) {

            return Promise.reject({
                chunkId: chunk.chunkId,
                error: error.message
            });

        }

    }

    // --- STEP 3: PROCESS ALL CHUNKS ---

    const settledResults = await Promise.allSettled(
        dataChunks.map(processChunk)
    );

    const streamOutput = [];
    let throughput = 0;

    settledResults.forEach(result => {

        if (result.status === "fulfilled") {

            streamOutput.push(result.value);
            throughput++;

        } else {

            streamOutput.push({
                chunkId: result.reason.chunkId,
                transformed: null,
                error: result.reason.error
            });

        }

    });

    return {
        streamOutput,
        throughput
    };

}

// --- EXAMPLE USAGE ---
transformStream(
    [
        {
            chunkId: "C1",
            value: 10
        },
        {
            chunkId: "C2",
            value: 0
        },
        {
            chunkId: "C3",
            value: 5
        }
    ],
    (chunk) => {

        if (chunk.value === 0) {
            throw new Error("Zero value not allowed");
        }

        return chunk.value * 3;

    }
)
    .then(result => console.log(result))
    .catch(error => console.log(error));