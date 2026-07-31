// 🧩 PROBLEM–04: validateResponseSchema()

// Logic: Validates an API response against the expected schema. Reports missing fields, null violations and type mismatches.

function validateResponseSchema(response, expectedSchema) {

    // --- STEP 1: VALIDATION ---
    // Response and schema must be valid objects.

    if (
        typeof response !== "object" ||
        response === null ||
        Array.isArray(response) ||
        typeof expectedSchema !== "object" ||
        expectedSchema === null ||
        Array.isArray(expectedSchema) ||
        Object.keys(expectedSchema).length === 0
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: VALIDATE RESPONSE ---

    const errors = [];
    let checkedFields = 0;

    for (const key in expectedSchema) {

        checkedFields++;

        const {
            type,
            required,
            nullable
        } = expectedSchema[key];

        // Check required fields.

        if (!(key in response)) {

            if (required) {
                errors.push(`${key}: field is required`);
            }

            continue;
        }

        const value = response[key];

        // Handle null values.

        if (value === null) {

            if (!nullable) {
                errors.push(`${key}: field cannot be null`);
            }

            continue;
        }

        // Detect actual value type.

        let actualType;

        if (Array.isArray(value)) {
            actualType = "array";
        } else {
            actualType = typeof value;
        }

        // Compare expected and actual types.

        if (actualType !== type) {
            errors.push(
                `${key}: expected ${type}, got ${actualType}`
            );
        }

    }

    // --- STEP 3: RETURN RESULT ---

    return {
        isValid: errors.length === 0,
        errors,
        checkedFields
    };

}

// --- EXAMPLE USAGE ---
console.log(
    validateResponseSchema(
        {
            id: "U1",
            name: "Rahim",
            age: "twenty-five",
            email: null,
            tags: ["js"]
        },
        {
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
            email: {
                type: "string",
                required: true,
                nullable: true
            },
            tags: {
                type: "array",
                required: false,
                nullable: false
            },
            role: {
                type: "string",
                required: true,
                nullable: false
            }
        }
    )
);