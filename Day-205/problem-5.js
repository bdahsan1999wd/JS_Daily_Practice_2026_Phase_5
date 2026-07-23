// 🧩 PROBLEM–05: runFullWaterfallOrchestrator()

// Logic: Orchestrates a complete async waterfall pipeline. Initializes the pipeline, executes dynamic transformation steps, performs rollback on failure, and finalizes on success.

async function runFullWaterfallOrchestrator(pipeline) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof pipeline !== "object" ||
        pipeline === null ||
        typeof pipeline.pipelineId !== "string" ||
        pipeline.pipelineId.trim() === "" ||
        typeof pipeline.initialValue !== "number" ||
        pipeline.initialValue <= 0 ||
        !Array.isArray(pipeline.transformSteps) ||
        pipeline.transformSteps.length === 0 ||
        !pipeline.transformSteps.every(step =>
            typeof step === "object" &&
            step !== null &&
            typeof step.operation === "string" &&
            typeof step.operand === "number"
        ) ||
        !(
            pipeline.failOnStep === null ||
            (
                typeof pipeline.failOnStep === "number" &&
                Number.isInteger(pipeline.failOnStep)
            )
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: INITIALIZE PIPELINE ---
    const pipelineInfo = {
        pipelineId: pipeline.pipelineId,
        initialValue: pipeline.initialValue,
        startedAt: "2025-01-01",
        status: "RUNNING"
    };

    let currentValue = pipeline.initialValue;
    const history = [];

    try {

        // --- STEP 3: EXECUTE WATERFALL ---
        for (let i = 0; i < pipeline.transformSteps.length; i++) {

            let { operation, operand } = pipeline.transformSteps[i];

            if (pipeline.failOnStep === i + 1) {
                operation = "DIVIDE";
                operand = 0;
            }

            switch (operation) {

                case "MULTIPLY":
                    currentValue *= operand;
                    break;

                case "ADD":
                    currentValue += operand;
                    break;

                case "SUBTRACT":
                    currentValue -= operand;
                    break;

                case "DIVIDE":

                    if (operand === 0) {
                        throw new Error("Division by zero");
                    }

                    currentValue /= operand;
                    break;

                default:
                    throw new Error("Invalid Operation");

            }

            currentValue = Number(currentValue.toFixed(2));

            history.push({
                step: i + 1,
                operation,
                operand,
                result: currentValue
            });

        }

        // --- STEP 4: RETURN COMPLETED RESULT ---
        return {
            pipelineId: pipelineInfo.pipelineId,
            status: "COMPLETED",
            finalValue: currentValue,
            totalSteps: pipeline.transformSteps.length,
            history
        };

    } catch (error) {

        // --- STEP 5: ROLLBACK ---
        return {
            pipelineId: pipelineInfo.pipelineId,
            status: "FAILED",
            failedAtStep: pipeline.failOnStep,
            rolledBack: true,
            finalValue: pipeline.initialValue
        };

    }

}

// --- EXAMPLE USAGE ---
runFullWaterfallOrchestrator({
    pipelineId: "PIPE-01",
    initialValue: 100,
    transformSteps: [
        { operation: "MULTIPLY", operand: 3 },
        { operation: "ADD", operand: 50 },
        { operation: "DIVIDE", operand: 5 }
    ],
    failOnStep: null
})
    .then(result => console.log(result))
    .catch(error => console.log(error));