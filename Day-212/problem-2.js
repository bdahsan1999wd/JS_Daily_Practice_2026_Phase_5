// 🧩 PROBLEM–02: deserializeQueryString()

// Logic: Parses a query string into an object. Values are converted based on the provided schema, while missing required fields are reported as errors.

function deserializeQueryString(queryString, schema) {

    // --- STEP 1: VALIDATION ---
    // Query string must be a non-empty string and
    // schema must be a non-empty object.

    if (
        typeof queryString !== "string" ||
        queryString.trim() === "" ||
        typeof schema !== "object" ||
        schema === null ||
        Array.isArray(schema) ||
        Object.keys(schema).length === 0
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: PARSE QUERY STRING ---
    // Convert every key=value pair into a temporary object.

    const tempData = {};

    for (const pair of queryString.split("&")) {

        const [rawKey, rawValue = ""] = pair.split("=");

        const key = decodeURIComponent(rawKey);
        const value = decodeURIComponent(rawValue);

        if (tempData[key]) {
            tempData[key].push(value);
        } else {
            tempData[key] = [value];
        }

    }

    // --- STEP 3: APPLY SCHEMA ---
    // Convert values according to their expected type.

    const parsedData = {};
    const errors = [];

    for (const key in schema) {

        const { type, required } = schema[key];

        if (!(key in tempData)) {

            if (required) {
                errors.push(`${key} is required`);
            }

            continue;
        }

        const values = tempData[key];

        switch (type) {

            case "string":
                parsedData[key] = values[0];
                break;

            case "number":
                parsedData[key] = Number(values[0]);
                break;

            case "boolean":
                parsedData[key] = values[0] === "true";
                break;

            case "array":
                parsedData[key] = values;
                break;

            default:
                return "Invalid Input";

        }

    }

    // --- STEP 4: RETURN RESULT ---

    return {
        parsedData,
        errors
    };

}

// --- EXAMPLE USAGE ---
console.log(
    deserializeQueryString(
        "page=2&limit=20&active=true&tags=js&tags=node&search=hello%20world",
        {
            page: { type: "number", required: true },
            limit: { type: "number", required: true },
            active: { type: "boolean", required: false },
            tags: { type: "array", required: false },
            search: { type: "string", required: false },
            sortBy: { type: "string", required: true }
        }
    )
);