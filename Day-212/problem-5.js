// 🧩 PROBLEM–05: runDataContractPipeline()

// Logic: Executes the complete data contract pipeline.
// 1. Deserialize raw input
// 2. Serialize the transformed data
// 3. Validate the final response
// 4. Return the pipeline result

function runDataContractPipeline(rawInput, contractConfig) {

    // --- STEP 1: VALIDATION ---
    // Input data and contract configuration must be valid objects.

    if (
        typeof rawInput !== "object" ||
        rawInput === null ||
        Array.isArray(rawInput) ||
        typeof contractConfig !== "object" ||
        contractConfig === null ||
        Array.isArray(contractConfig)
    ) {
        return "Invalid Input";
    }

    const {
        deserializationSchema,
        serializationRules,
        responseSchema
    } = contractConfig;

    if (
        typeof deserializationSchema !== "object" ||
        deserializationSchema === null ||
        Array.isArray(deserializationSchema) ||
        typeof serializationRules !== "object" ||
        serializationRules === null ||
        Array.isArray(serializationRules) ||
        typeof responseSchema !== "object" ||
        responseSchema === null ||
        Array.isArray(responseSchema)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: DESERIALIZE DATA ---
    // Convert raw string values into their expected types.

    const deserializedData = {};
    const deserializationErrors = [];

    for (const key in deserializationSchema) {

        const { type, required } = deserializationSchema[key];

        if (!(key in rawInput)) {

            if (required) {
                deserializationErrors.push(`${key} is required`);
            }

            continue;
        }

        const value = rawInput[key];

        switch (type) {

            case "string":
                deserializedData[key] = String(value);
                break;

            case "number":
                deserializedData[key] = Number(value);
                break;

            case "boolean":
                deserializedData[key] = value === "true";
                break;

            case "array":
                deserializedData[key] = Array.isArray(value)
                    ? value
                    : [value];
                break;

            default:
                return "Invalid Input";

        }

    }

    // --- STEP 3: SERIALIZE DATA ---
    // Apply serialization rules to the deserialized object.

    const serializedData = {};

    const {
        dateFields,
        omitFields,
        renameFields,
        flattenArrays
    } = serializationRules;

    for (const key in deserializedData) {

        if (omitFields.includes(key)) {
            continue;
        }

        const newKey = renameFields[key] || key;

        let value = deserializedData[key];

        if (dateFields.includes(newKey)) {
            value = { $date: value };
        }

        if (flattenArrays && Array.isArray(value)) {
            value = value.join(",");
        }

        serializedData[newKey] = value;

    }

    // --- STEP 4: VALIDATE RESPONSE ---
    // Compare the serialized data against the response schema.

    const errors = [...deserializationErrors];
    let checkedFields = 0;

    for (const key in responseSchema) {

        checkedFields++;

        const {
            type,
            required,
            nullable
        } = responseSchema[key];

        if (!(key in serializedData)) {

            if (required) {
                errors.push(`${key}: field is required`);
            }

            continue;
        }

        const value = serializedData[key];

        if (value === null) {

            if (!nullable) {
                errors.push(`${key}: field cannot be null`);
            }

            continue;
        }

        const actualType = Array.isArray(value)
            ? "array"
            : typeof value;

        if (actualType !== type) {
            errors.push(
                `${key}: expected ${type}, got ${actualType}`
            );
        }

    }

    const validationResult = {
        isValid: errors.length === 0,
        errors,
        checkedFields
    };

    // --- STEP 5: RETURN RESULT ---

    return {
        pipelineStatus: validationResult.isValid
            ? "SUCCESS"
            : "VALIDATION_FAILED",
        deserializedData,
        serializedData,
        validationResult
    };

}

// --- EXAMPLE USAGE ---
console.log(
    runDataContractPipeline(
        {
            user_id: "U1",
            full_name: "Rahim",
            age: "25",
            active: "true"
        },
        {
            deserializationSchema: {
                user_id: {
                    type: "string",
                    required: true
                },
                full_name: {
                    type: "string",
                    required: true
                },
                age: {
                    type: "number",
                    required: true
                },
                active: {
                    type: "boolean",
                    required: true
                }
            },
            serializationRules: {
                dateFields: [],
                omitFields: [],
                renameFields: {
                    user_id: "id",
                    full_name: "name"
                },
                flattenArrays: false
            },
            responseSchema: {
                id: {
                    type: "string",
                    required: true,
                    nullable: false
                },
                name: {
                    type: "string",
                    required: true,
                    nullable: false
                },
                age: {
                    type: "number",
                    required: true,
                    nullable: false
                },
                active: {
                    type: "boolean",
                    required: true,
                    nullable: false
                }
            }
        }
    )
);