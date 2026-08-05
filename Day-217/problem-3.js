// 🧩 PROBLEM–03: validateConfig()

// Logic: Validates a configuration object using a schema.

// Checks:
// 1. Required fields
// 2. Data types
// 3. Allowed values
// 4. Number min/max constraints
// 5. Unknown configuration keys (warnings)

function validateConfig(config, schema) {

    // --- STEP 1: VALIDATION ---
    // Config and schema must both be valid objects.

    if (
        typeof config !== "object" ||
        config === null ||
        Array.isArray(config) ||
        typeof schema !== "object" ||
        schema === null ||
        Array.isArray(schema)
    ) {
        return "Invalid Input";
    }

    const errors = [];
    const warnings = [];

    // Count how many schema fields were checked.

    const checkedFields = Object.keys(schema).length;

    // Helper function for detecting actual data type.

    function getType(value) {

        if (Array.isArray(value)) {
            return "array";
        }

        if (value === null) {
            return "null";
        }

        return typeof value;

    }

    // --- STEP 2: VALIDATE EVERY SCHEMA FIELD ---

    for (const key in schema) {

        const rule = schema[key];
        const value = config[key];

        const hasValue =
            Object.prototype.hasOwnProperty.call(config, key);

        // Required field validation.

        if (!hasValue) {

            if (rule.required) {
                errors.push(`${key}: required field missing`);
            }

            continue;

        }

        // Type validation.

        const actualType = getType(value);

        if (actualType !== rule.type) {

            errors.push(
                `${key}: expected ${rule.type}, got ${actualType}`
            );

            continue;

        }

        // Allowed values validation.

        if (
            Array.isArray(rule.allowedValues) &&
            !rule.allowedValues.includes(value)
        ) {

            errors.push(
                `${key}: value '${value}' not allowed`
            );

        }

        // Minimum number validation.

        if (
            rule.type === "number" &&
            typeof rule.min === "number" &&
            value < rule.min
        ) {

            errors.push(
                `${key}: must be >= ${rule.min}`
            );

        }

        // Maximum number validation.

        if (
            rule.type === "number" &&
            typeof rule.max === "number" &&
            value > rule.max
        ) {

            errors.push(
                `${key}: must be <= ${rule.max}`
            );

        }

    }

    // --- STEP 3: FIND UNKNOWN CONFIG KEYS ---
    // Any config key not present in schema becomes a warning.

    for (const key in config) {

        if (!(key in schema)) {

            warnings.push(
                `${key}: unknown config key (not in schema)`
            );

        }

    }

    // --- STEP 4: RETURN RESULT ---

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        checkedFields
    };

}

// --- EXAMPLE USAGE ---
console.log(

    validateConfig(

        {
            port: 8080,
            environment: "production",
            logLevel: "verbose",
            maxConnections: 5,
            undocumentedKey: "someValue"
        },

        {
            port: {
                required: true,
                type: "number",
                min: 1024,
                max: 65535,
                allowedValues: null
            },

            environment: {
                required: true,
                type: "string",
                allowedValues: [
                    "development",
                    "staging",
                    "production"
                ],
                min: null,
                max: null
            },

            logLevel: {
                required: true,
                type: "string",
                allowedValues: [
                    "info",
                    "warn",
                    "error"
                ],
                min: null,
                max: null
            },

            maxConnections: {
                required: false,
                type: "number",
                min: 1,
                max: 100,
                allowedValues: null
            },

            dbHost: {
                required: true,
                type: "string",
                allowedValues: null,
                min: null,
                max: null
            }

        }

    )

);