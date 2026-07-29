// 🧩 PROBLEM–03: simulateValidationMiddleware()

// Logic: Simulates a request validation middleware. Validates the request body against the provided schema and collects all validation errors before returning.

function simulateValidationMiddleware(request, validationSchema) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof request !== "object" ||
        request === null ||
        typeof validationSchema !== "object" ||
        validationSchema === null ||
        Array.isArray(validationSchema)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: CHECK REQUEST BODY ---
    const body = request.body;

    const hasRequiredFields = Object.values(validationSchema)
        .some(rule => rule.required);

    if (
        (body === null || body === undefined) &&
        hasRequiredFields
    ) {
        return {
            validationStatus: "FAILED",
            errors: ["Request body is required"],
            blocked: true
        };
    }

    // --- STEP 3: VALIDATE FIELDS ---
    const errors = [];

    for (const [field, rules] of Object.entries(validationSchema)) {

        const value = body[field];

        // Required Field
        if (
            rules.required &&
            !(field in body)
        ) {
            errors.push(`${field} is required`);
            continue;
        }

        if (!(field in body)) {
            continue;
        }

        // Type Validation
        const actualType = Array.isArray(value)
            ? "array"
            : typeof value;

        if (actualType !== rules.type) {
            errors.push(`${field} must be a ${rules.type}`);
            continue;
        }

        // String Validation
        if (
            rules.type === "string" &&
            rules.minLength !== undefined &&
            value.length < rules.minLength
        ) {
            errors.push(
                `${field} must be at least ${rules.minLength} characters`
            );
        }

        // Number Validation
        if (
            rules.type === "number" &&
            rules.min !== undefined &&
            value < rules.min
        ) {
            errors.push(
                `${field} must be at least ${rules.min}`
            );
        }

    }

    // --- STEP 4: RETURN RESULT ---
    return {
        validationStatus: errors.length === 0
            ? "PASSED"
            : "FAILED",
        errors,
        blocked: errors.length > 0
    };

}

// --- EXAMPLE USAGE ---
if (require.main === module) {
    console.log(
        simulateValidationMiddleware(
            {
                body: {
                    username: "ab",
                    age: 15
                }
            },
            {
                username: {
                    required: true,
                    type: "string",
                    minLength: 4
                },
                age: {
                    required: true,
                    type: "number",
                    min: 18
                },
                email: {
                    required: true,
                    type: "string"
                }
            }
        )
    );
}
module.exports = {simulateValidationMiddleware};