// 🧩 PROBLEM–01: serializeToQueryString()

// Logic: Converts a flat object into a URL query string. Keys are sorted alphabetically. Arrays generate repeated keys while primitive values are encoded normally.

function serializeToQueryString(params) {

    // --- STEP 1: VALIDATION ---
    // Input must be a non-empty flat object.
    // Values can be string, number, boolean or array.

    if (
        typeof params !== "object" ||
        params === null ||
        Array.isArray(params) ||
        Object.keys(params).length === 0
    ) {
        return "Invalid Input";
    }

    for (const value of Object.values(params)) {

        if (Array.isArray(value)) {

            if (
                value.length === 0 ||
                !value.every(item =>
                    ["string", "number", "boolean"].includes(typeof item)
                )
            ) {
                return "Invalid Input";
            }

        } else if (
            !["string", "number", "boolean"].includes(typeof value)
        ) {
            return "Invalid Input";
        }

    }

    // --- STEP 2: SORT KEYS ---
    // Sort keys alphabetically for consistent output.

    const sortedKeys = Object.keys(params).sort();

    // --- STEP 3: SERIALIZE OBJECT ---
    // Convert every property into query string format.

    const queryParts = [];

    for (const key of sortedKeys) {

        const value = params[key];

        // Repeat the same key for array values.
        if (Array.isArray(value)) {

            for (const item of value) {

                queryParts.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`
                );

            }

            continue;
        }

        // Serialize primitive values.

        queryParts.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        );

    }

    // --- STEP 4: RETURN RESULT ---

    return queryParts.join("&");

}

// --- EXAMPLE USAGE ---
console.log(
    serializeToQueryString({
        page: 1,
        limit: 10,
        search: "hello world",
        tags: ["js", "node"],
        active: true
    })
);