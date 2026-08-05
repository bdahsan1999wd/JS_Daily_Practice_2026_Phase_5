// 🧩 PROBLEM–04: createConfigReloader()

// Logic: Creates a configuration reloader.

// Supports:

// 1. Get current config
// 2. Reload with validation
// 3. Keep version history
// 4. Rollback to previous version
// 5. Track current version

function createConfigReloader(initialConfig, schema) {

    // --- STEP 1: VALIDATION ---
    // initialConfig and schema must both be valid objects.

    if (
        typeof initialConfig !== "object" ||
        initialConfig === null ||
        Array.isArray(initialConfig) ||
        typeof schema !== "object" ||
        schema === null ||
        Array.isArray(schema)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    let currentConfig = { ...initialConfig };

    // Stores previous config versions.
    const history = [];

    // Current config version.
    let version = 1;

    // --- STEP 3: HELPER FUNCTION ---
    // Validate config using Problem-03 logic.

    function validateConfig(config, schema) {

        const errors = [];

        function getType(value) {

            if (Array.isArray(value)) {
                return "array";
            }

            if (value === null) {
                return "null";
            }

            return typeof value;

        }

        for (const key in schema) {

            const rule = schema[key];

            const hasValue =
                Object.prototype.hasOwnProperty.call(config, key);

            if (!hasValue) {

                if (rule.required) {
                    errors.push(`${key}: required field missing`);
                }

                continue;

            }

            const value = config[key];
            const actualType = getType(value);

            if (actualType !== rule.type) {

                errors.push(
                    `${key}: expected ${rule.type}, got ${actualType}`
                );

                continue;

            }

            if (
                Array.isArray(rule.allowedValues) &&
                !rule.allowedValues.includes(value)
            ) {

                errors.push(
                    `${key}: value '${value}' not allowed`
                );

            }

            if (
                rule.type === "number" &&
                typeof rule.min === "number" &&
                value < rule.min
            ) {

                errors.push(
                    `${key}: must be >= ${rule.min}`
                );

            }

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

        return {
            isValid: errors.length === 0,
            errors
        };

    }

    // --- STEP 4: RETURN CONFIG RELOADER ---

    return {

        // Return current active config.

        getConfig() {

            return { ...currentConfig };

        },

        // Return current version.

        getVersion() {

            return version;

        },

        // Return config history.

        getHistory() {

            return history.map(config => ({ ...config }));

        },

        // Reload with new config if valid.

        reload(newConfig) {

            if (
                typeof newConfig !== "object" ||
                newConfig === null ||
                Array.isArray(newConfig)
            ) {
                return "Invalid Input";
            }

            const validationResult =
                validateConfig(newConfig, schema);

            if (!validationResult.isValid) {

                return {
                    reloaded: false,
                    errors: validationResult.errors
                };

            }

            // Save current config before replacing it.

            history.push({ ...currentConfig });

            currentConfig = { ...newConfig };

            version++;

            return {
                reloaded: true,
                version
            };

        },

        // Rollback to previous config.

        rollback() {

            if (history.length === 0) {

                return {
                    rolledBack: false,
                    reason: "No previous version available"
                };

            }

            currentConfig = history.pop();

            version--;

            return {
                rolledBack: true,
                version
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const reloader = createConfigReloader(

    {
        port: 3000,
        logLevel: "info"
    },

    {
        port: {
            required: true,
            type: "number",
            min: 1024,
            max: 65535,
            allowedValues: null
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
        }

    }

);

console.log(reloader.getVersion());

console.log(reloader.getConfig());

console.log(

    reloader.reload({

        port: 4000,
        logLevel: "warn"

    })

);

console.log(

    reloader.reload({

        port: 99,
        logLevel: "info"

    })

);

console.log(reloader.getVersion());

console.log(reloader.rollback());

console.log(reloader.getConfig());

console.log(reloader.getHistory());