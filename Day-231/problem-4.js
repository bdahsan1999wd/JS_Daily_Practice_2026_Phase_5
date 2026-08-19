// 🧩 PROBLEM–04: createDTOValidationPipeline()

// Logic: Implements a DTO Validation Pipeline with named stages. Each stage contains validators; the pipeline runs fail-fast.

// Methods:
//   run(data)                 — run all stages sequentially (fail-fast)
//   runStage(stageName, data) — run a single stage
//   addStage(stage)           — add a new stage
//   getStageNames()           — array of stage names

function createDTOValidationPipeline(pipelineConfig) {

    // --- STEP 1: VALIDATE pipelineConfig ---

    if (
        typeof pipelineConfig !== "object" ||
        pipelineConfig === null ||
        Array.isArray(pipelineConfig)
    ) {
        return "Invalid Input";
    }

    const { pipelineId, stages } = pipelineConfig;

    if (
        typeof pipelineId !== "string" || pipelineId.trim() === "" ||
        !Array.isArray(stages)
    ) {
        return "Invalid Input";
    }

    const stageStore = {};

    for (const stage of stages) {
        if (
            typeof stage !== "object" || stage === null ||
            typeof stage.stageName !== "string" ||
            !Array.isArray(stage.validators)
        ) {
            return "Invalid Input";
        }
        stageStore[stage.stageName] = stage.validators;
    }

    // --- STEP 2: VALIDATOR RULES ---

    function runValidator(validator, data) {

        const value = data[validator.field];

        switch (validator.rule) {

            // required: not null/undefined/empty string.

            case "required":
                if (value === undefined || value === null || value === "") {
                    return { field: validator.field, message: validator.message };
                }
                break;

            // minLength: string length >= value.

            case "minLength":
                if (typeof value !== "string" || value.length < validator.value) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            // maxLength: string length <= value.

            case "maxLength":
                if (typeof value !== "string" || value.length > validator.value) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            // min: number >= value.

            case "min":
                if (typeof value !== "number" || value < validator.value) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            // max: number <= value.

            case "max":
                if (typeof value !== "number" || value > validator.value) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            // pattern: email or phone.

            case "pattern": {
                let ok = false;

                if (validator.value === "email") {
                    ok = typeof value === "string" && value.includes("@") && value.includes(".");
                } else if (validator.value === "phone") {
                    ok = typeof value === "string" &&
                        value.startsWith("+") &&
                        value.length >= 10 && value.length <= 15;
                }

                if (!ok) {
                    return { field: validator.field, message: validator.message };
                }
                break;
            }

            // custom: customFn(fieldValue) must return true.

            case "custom":
                if (typeof validator.customFn !== "function" || !validator.customFn(value)) {
                    return { field: validator.field, message: validator.message };
                }
                break;

            default:
                return { field: validator.field, message: "Unknown rule: " + validator.rule };
        }

        return null;
    }

    // --- STEP 3: PIPELINE METHODS ---

    return {
        // runStage(stageName, data): run a single stage.
        runStage(stageName, data) {

            if (typeof stageName !== "string" || typeof data !== "object" || data === null || Array.isArray(data)) {
                return "Invalid Input";
            }

            const validators = stageStore[stageName];

            if (validators === undefined) {
                return { error: "Stage not found: " + stageName };
            }

            const errors = [];

            for (const validator of validators) {
                const err = runValidator(validator, data);
                if (err !== null) errors.push(err);
            }

            return { stageName, passed: errors.length === 0, errors };
        },

        // run(data): run all stages, fail-fast.
        run(data) {

            if (typeof data !== "object" || data === null || Array.isArray(data)) {
                return "Invalid Input";
            }

            let stagesRun = 0;
            let failedStage = null;
            let errors = [];

            for (const stageName of Object.keys(stageStore)) {

                const result = this.runStage(stageName, data);

                stagesRun++;

                if (!result.passed) {
                    failedStage = stageName;
                    errors = result.errors;
                    break;
                }
            }

            return {
                pipelineId,
                passed: failedStage === null,
                stagesRun,
                failedStage,
                errors
            };
        },

        // addStage(stage): add a new stage.
        addStage(stage) {

            if (
                typeof stage !== "object" || stage === null ||
                typeof stage.stageName !== "string" ||
                !Array.isArray(stage.validators)
            ) {
                return "Invalid Input";
            }

            if (stageStore[stage.stageName] !== undefined) {
                return { error: "Stage already exists" };
            }

            stageStore[stage.stageName] = stage.validators;

            return { added: true, stageName: stage.stageName };
        },

        // getStageNames(): array of stage names.
        getStageNames() {
            return Object.keys(stageStore);
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build a validation pipeline ---
const pipeline = createDTOValidationPipeline({
    pipelineId: "UserValidation",
    stages: [
        {
            stageName: "BasicValidation",
            validators: [
                { field: "username", rule: "required", value: null, message: "Username is required", customFn: null },
                { field: "username", rule: "minLength", value: 3, message: "Username must be at least 3 chars", customFn: null },
                { field: "email", rule: "pattern", value: "email", message: "Invalid email format", customFn: null }
            ]
        },
        {
            stageName: "AgeValidation",
            validators: [
                { field: "age", rule: "min", value: 18, message: "Must be at least 18", customFn: null },
                { field: "age", rule: "max", value: 100, message: "Age cannot exceed 100", customFn: null }
            ]
        }
    ]
});


// --- run: all pass ---
console.log(pipeline.run({ username: "Rahim", email: "rahim@mail.com", age: 25 }));


// --- run: BasicValidation fails (minLength + pattern) ---
console.log(pipeline.run({ username: "Al", email: "invalid-email", age: 25 }));

// --- runStage: single stage ---
console.log(pipeline.runStage("AgeValidation", { age: 15 }));

// --- runStage: stage not found ---
console.log(pipeline.runStage("Nope", { age: 20 }));


// --- getStageNames ---
console.log(pipeline.getStageNames());

// --- INVALID: bad pipelineConfig ---
console.log(createDTOValidationPipeline({ pipelineId: "", stages: [] }));