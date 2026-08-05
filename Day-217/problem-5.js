// 🧩 PROBLEM–05: runConfigOrchestrator()

// Logic: Simulates the complete configuration workflow.

// 1. Load environment config
// 2. Validate configuration
// 3. Mask secret values
// 4. Reload config (optional)
// 5. Return final orchestrated result

function runConfigOrchestrator(orchestratorConfig) {

    // --- STEP 1: VALIDATION ---
    // Validate orchestrator configuration.

    if (
        typeof orchestratorConfig !== "object" ||
        orchestratorConfig === null ||
        Array.isArray(orchestratorConfig)
    ) {
        return "Invalid Input";
    }

    const {
        configId,
        rawConfig,
        environment,
        schema,
        secretKeys,
        reloadWith
    } = orchestratorConfig;

    if (
        typeof configId !== "string" ||
        configId.trim() === "" ||
        typeof rawConfig !== "object" ||
        rawConfig === null ||
        Array.isArray(rawConfig) ||
        !["development", "staging", "production"].includes(environment) ||
        typeof schema !== "object" ||
        schema === null ||
        Array.isArray(schema) ||
        !Array.isArray(secretKeys)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: HELPER FUNCTIONS ---

    // Deep merge two objects.

    function deepMerge(base, override) {

        const result = { ...base };

        for (const key in override) {

            if (
                typeof override[key] === "object" &&
                override[key] !== null &&
                !Array.isArray(override[key]) &&
                typeof result[key] === "object" &&
                result[key] !== null &&
                !Array.isArray(result[key])
            ) {

                result[key] = deepMerge(
                    result[key],
                    override[key]
                );

            } else {

                result[key] = override[key];

            }

        }

        return result;

    }

    // Load configuration.

    function loadConfig() {

        const defaults = rawConfig.default || {};
        const envConfig = rawConfig[environment] || {};

        return {
            ...deepMerge(defaults, envConfig),
            _meta: {
                environment,
                loadedAt: "2025-01-01T00:00:00Z"
            }
        };

    }

    // Validate configuration.

    function validate(config) {

        const errors = [];
        const warnings = [];

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

            if (!(key in config)) {

                if (rule.required) {
                    errors.push(
                        `${key}: required field missing`
                    );
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
                rule.min !== null &&
                value < rule.min
            ) {

                errors.push(
                    `${key}: must be >= ${rule.min}`
                );

            }

            if (
                rule.type === "number" &&
                rule.max !== null &&
                value > rule.max
            ) {

                errors.push(
                    `${key}: must be <= ${rule.max}`
                );

            }

        }

        for (const key in config) {

            if (!(key in schema) && key !== "_meta") {

                warnings.push(
                    `${key}: unknown config key (not in schema)`
                );

            }

        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            checkedFields: Object.keys(schema).length
        };

    }

    // Deep mask secret keys.

    function sanitize(obj) {

        let maskedCount = 0;

        const lowerSecretKeys =
            secretKeys.map(key => key.toLowerCase());

        function traverse(value) {

            if (Array.isArray(value)) {
                return value.map(traverse);
            }

            if (
                typeof value === "object" &&
                value !== null
            ) {

                const result = {};

                for (const key in value) {

                    if (
                        lowerSecretKeys.includes(
                            key.toLowerCase()
                        )
                    ) {

                        result[key] = "***MASKED***";
                        maskedCount++;

                    } else {

                        result[key] = traverse(value[key]);

                    }

                }

                return result;

            }

            return value;

        }

        return {
            sanitized: traverse(obj),
            maskedCount
        };

    }

    // --- STEP 3: LOAD CONFIG ---

    const loadedConfig = loadConfig();

    // --- STEP 4: VALIDATE CONFIG ---

    const validationResult =
        validate(loadedConfig);

    if (!validationResult.isValid) {

        return {
            configId,
            status: "VALIDATION_FAILED",
            errors: validationResult.errors
        };

    }

    // --- STEP 5: SANITIZE CONFIG ---

    let activeConfig =
        sanitize(loadedConfig).sanitized;

    let reloadResult = null;
    let version = 1;

    // --- STEP 6: OPTIONAL RELOAD ---

    if (reloadWith !== null) {

        const reloadValidation =
            validate(reloadWith);

        if (reloadValidation.isValid) {

            version++;

            activeConfig = sanitize({

                ...reloadWith,

                _meta: loadedConfig._meta

            }).sanitized;

            reloadResult = {
                reloadStatus: "SUCCESS",
                version
            };

        } else {

            reloadResult = {
                reloadStatus: "FAILED",
                errors: reloadValidation.errors
            };

        }

    }

    // --- STEP 7: RETURN RESULT ---

    return {
        configId,
        status: "SUCCESS",
        activeConfig,
        validationResult,
        reloadResult
    };

}

// --- EXAMPLE USAGE ---
console.log(

    runConfigOrchestrator({

        configId: "CFG-01",

        rawConfig: {

            default: {
                port: 3000,
                logLevel: "info",
                db: {
                    host: "localhost",
                    password: "dev-pass"
                }
            },

            production: {
                port: 8080,
                db: {
                    host: "prod-db.com"
                }
            }

        },

        environment: "production",

        schema: {

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

        },

        secretKeys: [
            "password"
        ],

        reloadWith: {
            port: 9090,
            logLevel: "warn",
            db: {
                host: "prod-db.com",
                password: "new-pass"
            }
        }

    })

);