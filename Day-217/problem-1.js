// 🧩 PROBLEM–01: loadConfig()

// Logic: Loads the configuration for a specific environment.

// 1. Start with the default configuration.
// 2. Deep merge the environment-specific configuration.
// 3. Add metadata describing the loaded environment.

function loadConfig(rawConfig, environment) {

    // --- STEP 1: VALIDATION ---
    // rawConfig must be a valid object and
    // environment must be one of the supported environments.

    if (
        typeof rawConfig !== "object" ||
        rawConfig === null ||
        Array.isArray(rawConfig) ||
        ![
            "development",
            "staging",
            "production"
        ].includes(environment)
    ) {
        return "Invalid Input";
    }

    // --------------------------------------
    // Helper Function: Check for plain object
    // --------------------------------------

    function isObject(value) {
        return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
        );
    }

    // --------------------------------------
    // Helper Function: Deep Merge Environment values
    // always override default values.
    // --------------------------------------

    function deepMerge(base, override) {

        // Create a shallow copy so the original
        // object is never modified.

        const merged = { ...base };

        for (const key in override) {

            if (
                isObject(merged[key]) &&
                isObject(override[key])
            ) {

                // Recursively merge nested objects.

                merged[key] = deepMerge(
                    merged[key],
                    override[key]
                );

            } else {

                // Override primitive values,
                // arrays or new properties.

                merged[key] = override[key];

            }

        }

        return merged;

    }

    // --- STEP 2: LOAD CONFIGURATION ---

    // Use an empty object if default or
    // environment config does not exist.

    const defaultConfig =
        isObject(rawConfig.default)
            ? rawConfig.default
            : {};

    const environmentConfig =
        isObject(rawConfig[environment])
            ? rawConfig[environment]
            : {};

    // Merge configurations.

    const config = deepMerge(
        defaultConfig,
        environmentConfig
    );

    // --- STEP 3: ADD METADATA ---

    config._meta = {
        environment,
        loadedAt: "2025-01-01T00:00:00Z"
    };

    // --- STEP 4: RETURN RESULT ---

    return config;

}

// --- EXAMPLE USAGE ---
console.log(
    loadConfig(
        {
            default: {
                port: 3000,
                db: {
                    host: "localhost",
                    port: 5432
                },
                logLevel: "info"
            },

            production: {
                port: 8080,
                db: {
                    host: "prod-db.server.com"
                }
            }
        },
        "production"
    )
);