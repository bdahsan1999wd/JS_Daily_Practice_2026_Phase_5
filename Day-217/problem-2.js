// 🧩 PROBLEM–02: sanitizeConfig()

// Logic: Sanitizes a configuration object by masking all secret values.

// 1. Traverse the entire config object recursively.
// 2. Replace secret values with "***MASKED***".
// 3. Count how many values were masked.
// 4. Return a new object without modifying the original.

function sanitizeConfig(config, secretKeys) {

    // --- STEP 1: VALIDATION ---
    // config must be a valid object and
    // secretKeys must be an array of strings.

    if (
        typeof config !== "object" ||
        config === null ||
        Array.isArray(config) ||
        !Array.isArray(secretKeys) ||
        !secretKeys.every(
            key => typeof key === "string"
        )
    ) {
        return "Invalid Input";
    }

    // Convert secret keys to lowercase
    // for case-insensitive matching.

    const secretKeySet = new Set(
        secretKeys.map(key => key.toLowerCase())
    );

    let maskedCount = 0;

    // --------------------------------------
    // Helper Function: Deep Clone & Sanitize
    // --------------------------------------

    function sanitize(value) {

        // Handle arrays.

        if (Array.isArray(value)) {
            return value.map(item => sanitize(item));
        }

        // Handle objects recursively.

        if (
            typeof value === "object" &&
            value !== null
        ) {

            const result = {};

            for (const key in value) {

                // Mask secret fields.

                if (
                    secretKeySet.has(
                        key.toLowerCase()
                    )
                ) {

                    result[key] = "***MASKED***";
                    maskedCount++;

                } else {

                    result[key] = sanitize(
                        value[key]
                    );

                }

            }

            return result;

        }

        // Primitive values remain unchanged.

        return value;

    }

    // --- STEP 2: SANITIZE CONFIGURATION ---

    const sanitized = sanitize(config);

    // --- STEP 3: RETURN RESULT ---

    return {
        sanitized,
        maskedCount
    };

}

// --- EXAMPLE USAGE ---
console.log(

    sanitizeConfig(

        {
            port: 3000,

            db: {
                host: "localhost",
                password: "super-secret-123",
                port: 5432
            },

            apiKey: "key-abc-xyz",

            appName: "MyApp",

            auth: {
                secret: "jwt-secret-token",
                expiresIn: "7d"
            }

        },

        [
            "password",
            "apiKey",
            "secret"
        ]

    )

);