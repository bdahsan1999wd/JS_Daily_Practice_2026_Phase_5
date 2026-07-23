// 🧩 PROBLEM–03: runDynamicWaterfall()

// Logic: Dynamically executes a sequence of async operations. Each step receives the previous step's result and updates the current value while maintaining a complete history.

async function runDynamicWaterfall(initialValue, steps) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof initialValue !== "number" ||
        initialValue <= 0 ||
        !Array.isArray(steps) ||
        steps.length === 0 ||
        !steps.every(step =>
            typeof step === "object" &&
            step !== null &&
            typeof step.operation === "string" &&
            typeof step.operand === "number"
        )
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: INITIALIZE PIPELINE ---
    let currentValue = initialValue;
    const history = [];

    // --- STEP 3: EXECUTE WATERFALL ---
    for (let i = 0; i < steps.length; i++) {

        const { operation, operand } = steps[i];

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
                    return Promise.reject("Division by zero");
                }

                currentValue /= operand;
                break;

            default:
                return Promise.reject("Invalid Operation");

        }

        currentValue = Number(currentValue.toFixed(2));

        history.push({
            step: i + 1,
            operation,
            operand,
            result: currentValue
        });

    }

    // --- STEP 4: RETURN RESULT ---
    return {
        finalValue: currentValue,
        history
    };

}

// --- EXAMPLE USAGE ---
runDynamicWaterfall(
    100,
    [
        { operation: "MULTIPLY", operand: 2 },
        { operation: "ADD", operand: 50 },
        { operation: "DIVIDE", operand: 5 }
    ]
)
    .then(result => console.log(result))
    .catch(error => console.log(error));