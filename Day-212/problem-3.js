// 🧩 PROBLEM–03: serializeNestedObject()

// Logic: Transforms a top-level object by applying serialization rules. Rules are applied in this order:
// 1. Omit fields
// 2. Rename fields
// 3. Wrap date fields
// 4. Flatten arrays (optional)

function serializeNestedObject(data, serializationRules) {

    // --- STEP 1: VALIDATION ---
    // Data and rules must be valid objects.

    if (
        typeof data !== "object" ||
        data === null ||
        Array.isArray(data) ||
        typeof serializationRules !== "object" ||
        serializationRules === null ||
        Array.isArray(serializationRules)
    ) {
        return "Invalid Input";
    }

    const {
        dateFields,
        omitFields,
        renameFields,
        flattenArrays
    } = serializationRules;

    if (
        !Array.isArray(dateFields) ||
        !Array.isArray(omitFields) ||
        typeof renameFields !== "object" ||
        renameFields === null ||
        Array.isArray(renameFields) ||
        typeof flattenArrays !== "boolean"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: SERIALIZE OBJECT ---
    // Apply all rules to top-level fields only.

    const serializedData = {};

    for (const key in data) {

        // Skip omitted fields.
        if (omitFields.includes(key)) {
            continue;
        }

        // Rename field if mapping exists.
        const newKey = renameFields[key] || key;

        let value = data[key];

        // Wrap configured date fields.
        if (dateFields.includes(newKey)) {
            value = { $date: value };
        }

        // Convert arrays into comma-separated strings.
        if (flattenArrays && Array.isArray(value)) {
            value = value.join(",");
        }

        serializedData[newKey] = value;

    }

    // --- STEP 3: RETURN RESULT ---

    return serializedData;

}

// --- EXAMPLE USAGE ---
console.log(
    serializeNestedObject(
        {
            user_id: "U1",
            full_name: "Rahim",
            created_at: "2025-01-01",
            password: "secret",
            tags: ["js", "node"]
        },
        {
            dateFields: ["createdAt"],
            omitFields: ["password"],
            renameFields: {
                user_id: "id",
                full_name: "name",
                created_at: "createdAt"
            },
            flattenArrays: true
        }
    )
);
