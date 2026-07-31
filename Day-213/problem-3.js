// 🧩 PROBLEM–03: migrateResponseVersion()

// Logic: Migrates an API response from one version to another. Applies migration rules in this order: Rename → Add → Remove → Transform.

function migrateResponseVersion(
    response,
    fromVersion,
    toVersion,
    migrationRules
) {

    // --- STEP 1: VALIDATION ---
    // Response and migration rules must be valid objects.

    if (
        typeof response !== "object" ||
        response === null ||
        Array.isArray(response) ||
        typeof fromVersion !== "string" ||
        fromVersion.trim() === "" ||
        typeof toVersion !== "string" ||
        toVersion.trim() === "" ||
        typeof migrationRules !== "object" ||
        migrationRules === null ||
        Array.isArray(migrationRules)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: FIND MIGRATION RULE ---
    // Build the migration key and check if it exists.

    const migrationKey = `${fromVersion}_to_${toVersion}`;

    if (!(migrationKey in migrationRules)) {

        return {
            migrated: false,
            reason: "No migration path found"
        };

    }

    const {
        renameFields,
        addFields,
        removeFields,
        transformFields
    } = migrationRules[migrationKey];

    // Create a copy so the original response remains unchanged.

    const migratedResponse = { ...response };

    // --- STEP 3: RENAME FIELDS ---

    for (const oldField in renameFields) {

        if (oldField in migratedResponse) {

            const newField = renameFields[oldField];

            migratedResponse[newField] = migratedResponse[oldField];

            delete migratedResponse[oldField];

        }

    }

    // --- STEP 4: ADD NEW FIELDS ---

    for (const field in addFields) {

        migratedResponse[field] = addFields[field];

    }

    // --- STEP 5: REMOVE FIELDS ---

    for (const field of removeFields) {

        delete migratedResponse[field];

    }

    // --- STEP 6: TRANSFORM VALUES ---

    for (const field in transformFields) {

        if (!(field in migratedResponse)) {
            continue;
        }

        switch (transformFields[field]) {

            case "uppercase":
                migratedResponse[field] =
                    String(migratedResponse[field]).toUpperCase();
                break;

            case "lowercase":
                migratedResponse[field] =
                    String(migratedResponse[field]).toLowerCase();
                break;

            case "stringify":
                migratedResponse[field] =
                    String(migratedResponse[field]);
                break;

        }

    }

    // --- STEP 7: RETURN RESULT ---

    return {
        migrated: true,
        fromVersion,
        toVersion,
        data: migratedResponse
    };

}

// --- EXAMPLE USAGE ---
console.log(
    migrateResponseVersion(
        {
            user_id: "U1",
            user_name: "Rahim",
            age: 25
        },
        "v1",
        "v2",
        {
            v1_to_v2: {
                renameFields: {
                    user_id: "id",
                    user_name: "name"
                },
                addFields: {
                    version: "v2",
                    verified: false
                },
                removeFields: [
                    "age"
                ],
                transformFields: {
                    name: "uppercase"
                }
            }
        }
    )
);