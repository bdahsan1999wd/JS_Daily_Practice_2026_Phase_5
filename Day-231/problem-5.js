// 🧩 PROBLEM–05: runDTOPipelineOrchestrator()

// Logic: Full DTO Pipeline Orchestrator — composes Problems 01–04.

// For each request:

//   1. Extract + transform via Request DTO (Problem-01)

//   2. Validate via Validation Pipeline (Problem-04) — stop on failure

//   3. Map DTO → entity via "dtoToEntity" mapping (Problem-03)

//   4. Build response via Response DTO (Problem-02) Produces requestLog + summary with failure breakdown.

function runDTOPipelineOrchestrator(orchestratorConfig) {

    // --- STEP 1: VALIDATE orchestratorConfig ---

    if (
        typeof orchestratorConfig !== "object" ||
        orchestratorConfig === null ||
        Array.isArray(orchestratorConfig)
    ) {
        return "Invalid Input";
    }

    const {
        orchestratorId,
        requestDTOConfig,
        responseDTOConfig,
        mapperConfig,
        validationPipelineConfig,
        requests
    } = orchestratorConfig;

    if (
        typeof orchestratorId !== "string" || orchestratorId.trim() === "" ||
        typeof requestDTOConfig !== "object" || requestDTOConfig === null ||
        typeof responseDTOConfig !== "object" || responseDTOConfig === null ||
        typeof mapperConfig !== "object" || mapperConfig === null ||
        typeof validationPipelineConfig !== "object" || validationPipelineConfig === null ||
        !Array.isArray(requests)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD REQUEST DTO (Problem-01 logic) ---

    function buildRequestDTO(cfg) {

        const { fields } = cfg;
        const validTypes = ["string", "number", "boolean", "array", "object"];

        function matchesType(value, type) {
            switch (type) {
                case "string": return typeof value === "string";
                case "number": return typeof value === "number" && !Number.isNaN(value);
                case "boolean": return typeof value === "boolean";
                case "array": return Array.isArray(value);
                case "object": return typeof value === "object" && value !== null && !Array.isArray(value);
                default: return false;
            }
        }

        function applyTransform(value, transform) {
            switch (transform) {
                case "trim": return typeof value === "string" ? value.trim() : value;
                case "lowercase": return typeof value === "string" ? value.toLowerCase() : value;
                case "uppercase": return typeof value === "string" ? value.toUpperCase() : value;
                case "toNumber": return Number(value);
                case "toBoolean": return value === "true" || value === true;
                default: return value;
            }
        }

        function fromRequest(rawData) {

            if (typeof rawData !== "object" || rawData === null || Array.isArray(rawData)) {
                return { valid: false, errors: ["Invalid Input"], dto: null };
            }

            const dto = {};
            const errors = [];

            for (const field of fields) {
                let value = rawData[field.name];

                if (value === undefined) {
                    if (field.required) {
                        errors.push(field.name + ": required field missing");
                        continue;
                    }
                    value = field.default;
                }

                if (value !== undefined && field.transform) {
                    value = applyTransform(value, field.transform);
                }

                dto[field.name] = value;

                // Type check.

                if (value !== undefined && value !== null && !matchesType(value, field.type)) {
                    errors.push(field.name + ": invalid type");
                }
            }

            if (errors.length > 0) return { valid: false, errors, dto: null };

            return { valid: true, errors: [], dto };
        }

        return { fromRequest };
    }

    // --- STEP 3: BUILD RESPONSE DTO (Problem-02 logic) ---

    function buildResponseDTO(cfg) {

        const { fields } = cfg;

        function formatValue(value, format) {
            switch (format) {
                case "currency": return "৳" + Number(value).toFixed(2);
                case "uppercase": return String(value).toUpperCase();
                case "date": return value;
                default: return value;
            }
        }

        function fromEntity(entity) {

            if (typeof entity !== "object" || entity === null || Array.isArray(entity)) {
                return "Invalid Input";
            }

            const output = {};

            for (const field of fields) {
                if (!field.include) continue;

                let value = entity[field.source] === undefined ? null : entity[field.source];

                if (field.mask) {
                    value = "***";
                } else if (field.format) {
                    value = formatValue(value, field.format);
                }

                output[field.target] = value;
            }

            return output;
        }

        return { fromEntity };
    }

    // --- STEP 4: BUILD MAPPER (Problem-03 logic) ---

    function buildMapper(cfg) {

        const mappingStore = {};

        for (const mapping of cfg.mappings) {
            mappingStore[mapping.mappingName] = mapping.rules;
        }

        function getPath(obj, path) {
            const parts = path.split(".");
            let current = obj;
            for (const part of parts) {
                if (current === null || current === undefined) return undefined;
                current = current[part];
            }
            return current;
        }

        function setPath(target, path, value) {
            const parts = path.split(".");
            let current = target;
            for (let i = 0; i < parts.length - 1; i++) {
                if (typeof current[parts[i]] !== "object" || current[parts[i]] === null) {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
        }

        function map(mappingName, sourceObject) {

            const rules = mappingStore[mappingName];

            if (rules === undefined) return { error: "Mapping not found: " + mappingName };

            const result = {};

            for (const rule of rules) {
                const rawValue = getPath(sourceObject, rule.from);
                const value = typeof rule.transform === "function" ? rule.transform(rawValue) : rawValue;
                setPath(result, rule.to, value);
            }

            return result;
        }

        return { map };
    }

    // --- STEP 5: BUILD VALIDATION PIPELINE (Problem-04 logic) ---

    function buildPipeline(cfg) {

        const stageStore = {};

        for (const stage of cfg.stages) {
            stageStore[stage.stageName] = stage.validators;
        }

        function runValidator(validator, data) {

            const value = data[validator.field];

            switch (validator.rule) {
                case "required":
                    if (value === undefined || value === null || value === "") return { field: validator.field, message: validator.message };
                    break;
                case "minLength":
                    if (typeof value !== "string" || value.length < validator.value) return { field: validator.field, message: validator.message };
                    break;
                case "maxLength":
                    if (typeof value !== "string" || value.length > validator.value) return { field: validator.field, message: validator.message };
                    break;
                case "min":
                    if (typeof value !== "number" || value < validator.value) return { field: validator.field, message: validator.message };
                    break;
                case "max":
                    if (typeof value !== "number" || value > validator.value) return { field: validator.field, message: validator.message };
                    break;
                case "pattern": {
                    let ok = false;
                    if (validator.value === "email") ok = typeof value === "string" && value.includes("@") && value.includes(".");
                    else if (validator.value === "phone") ok = typeof value === "string" && value.startsWith("+") && value.length >= 10 && value.length <= 15;
                    if (!ok) return { field: validator.field, message: validator.message };
                    break;
                }
                case "custom":
                    if (typeof validator.customFn !== "function" || !validator.customFn(value)) return { field: validator.field, message: validator.message };
                    break;
                default:
                    return { field: validator.field, message: "Unknown rule: " + validator.rule };
            }

            return null;
        }

        function runStage(stageName, data) {

            const validators = stageStore[stageName];
            if (validators === undefined) return { error: "Stage not found: " + stageName };

            const errors = [];

            for (const validator of validators) {
                const err = runValidator(validator, data);
                if (err !== null) errors.push(err);
            }

            return { stageName, passed: errors.length === 0, errors };
        }

        function run(data) {

            let stagesRun = 0;
            let failedStage = null;
            let errors = [];

            for (const stageName of Object.keys(stageStore)) {
                const result = runStage(stageName, data);
                stagesRun++;
                if (!result.passed) {
                    failedStage = stageName;
                    errors = result.errors;
                    break;
                }
            }

            return { pipelineId: cfg.pipelineId, passed: failedStage === null, stagesRun, failedStage, errors };
        }

        return { run };
    }

    // --- STEP 6: WIRE EVERYTHING ---

    const requestDTO = buildRequestDTO(requestDTOConfig);
    const responseDTO = buildResponseDTO(responseDTOConfig);
    const mapper = buildMapper(mapperConfig);
    const pipeline = buildPipeline(validationPipelineConfig);

    // --- STEP 7: PROCESS REQUESTS ---

    const requestLog = [];
    let successCount = 0;
    let failedCount = 0;
    let extractionFailed = 0;
    let validationFailed = 0;
    let mappingFailed = 0;

    requests.forEach((request, index) => {

        const entry = {
            requestIndex: index,
            stages: {
                extraction: null,
                validation: null,
                mapping: null,
                response: null
            },
            finalOutput: null
        };

        // 1. Extraction.

        const extraction = requestDTO.fromRequest(request);

        entry.stages.extraction = { valid: extraction.valid, dto: extraction.dto };

        if (!extraction.valid) {
            extractionFailed++;
            failedCount++;
            entry.error = "Extraction failed";
            requestLog.push(entry);
            return;
        }

        // 2. Validation.

        const validation = pipeline.run(extraction.dto);

        entry.stages.validation = {
            passed: validation.passed,
            stagesRun: validation.stagesRun,
            failedStage: validation.failedStage,
            errors: validation.errors
        };

        if (!validation.passed) {
            validationFailed++;
            failedCount++;
            entry.error = "Validation failed at stage: " + validation.failedStage;
            requestLog.push(entry);
            return;
        }

        // 3. Mapping (dtoToEntity).

        const mapped = mapper.map("dtoToEntity", extraction.dto);

        if (mapped && mapped.error) {
            mappingFailed++;
            failedCount++;
            entry.error = "Mapping failed";
            requestLog.push(entry);
            return;
        }

        entry.stages.mapping = mapped;

        // 4. Response DTO.

        const response = responseDTO.fromEntity(mapped);

        entry.stages.response = response;
        entry.finalOutput = response;

        successCount++;
        requestLog.push(entry);
    });

    // --- STEP 8: BUILD SUMMARY ---

    const summary = {
        totalRequests: requests.length,
        successCount,
        failedCount,
        failureBreakdown: {
            extractionFailed,
            validationFailed,
            mappingFailed
        }
    };

    return { orchestratorId, requestLog, summary };
}


// ------ EXAMPLE USAGE ------

// --- Full pipeline (matches readme sample) ---
console.log(runDTOPipelineOrchestrator({
    orchestratorId: "DTO-ORCH-01",
    requestDTOConfig: {
        dtoName: "CreateUserDTO",
        fields: [
            { name: "username", type: "string", required: true, default: null, transform: "trim" },
            { name: "email", type: "string", required: true, default: null, transform: "lowercase" },
            { name: "age", type: "number", required: false, default: 18, transform: "toNumber" }
        ]
    },
    responseDTOConfig: {
        dtoName: "UserResponseDTO",
        fields: [
            { source: "username", target: "name", type: "string", include: true, mask: false, format: "uppercase" },
            { source: "email", target: "email", type: "string", include: true, mask: false, format: null },
            { source: "age", target: "age", type: "number", include: true, mask: false, format: null }
        ]
    },
    mapperConfig: {
        mapperId: "UserMapper",
        mappings: [
            {
                mappingName: "dtoToEntity",
                rules: [
                    { from: "username", to: "username", transform: null },
                    { from: "email", to: "email", transform: null },
                    { from: "age", to: "age", transform: null }
                ]
            }
        ]
    },
    validationPipelineConfig: {
        pipelineId: "UserValidation",
        stages: [
            {
                stageName: "BasicValidation",
                validators: [
                    { field: "username", rule: "minLength", value: 3, message: "Username min 3 chars", customFn: null },
                    { field: "email", rule: "pattern", value: "email", message: "Invalid email", customFn: null }
                ]
            }
        ]
    },
    requests: [
        { username: "  Rahim  ", email: "RAHIM@MAIL.COM", age: "25" },
        { username: "Al", email: "invalid", age: "20" }
    ]
}));


// --- INVALID: missing config ---
console.log(runDTOPipelineOrchestrator({ orchestratorId: "X", requests: [] }));