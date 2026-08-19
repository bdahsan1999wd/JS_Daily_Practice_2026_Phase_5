// 🧩 PROBLEM–02: createResponseDTO()

// Logic: Implements a Response DTO Transformer. Transforms raw entity records into clean response DTOs.

// Methods:
//   fromEntity(entity)       — transform a single entity
//   fromEntityList(entities) — transform an array of entities
//   getOutputFields()        — included target field names

function createResponseDTO(dtoConfig) {

    // --- STEP 1: VALIDATE dtoConfig ---

    if (
        typeof dtoConfig !== "object" ||
        dtoConfig === null ||
        Array.isArray(dtoConfig)
    ) {
        return "Invalid Input";
    }

    const { dtoName, fields } = dtoConfig;

    if (
        typeof dtoName !== "string" || dtoName.trim() === "" ||
        !Array.isArray(fields) || fields.length === 0
    ) {
        return "Invalid Input";
    }

    const validTypes = ["string", "number", "boolean", "array", "object"];
    const validFormats = ["currency", "uppercase", "date"];

    for (const field of fields) {
        if (
            typeof field !== "object" || field === null ||
            typeof field.source !== "string" ||
            typeof field.target !== "string" ||
            !validTypes.includes(field.type) ||
            typeof field.include !== "boolean" ||
            typeof field.mask !== "boolean"
        ) {
            return "Invalid Input";
        }

        if (field.format !== null && !validFormats.includes(field.format)) {
            return "Invalid Input";
        }
    }

    // --- STEP 2: FORMAT HELPER ---

    function formatValue(value, format) {
        switch (format) {
            case "currency": return "৳" + Number(value).toFixed(2);
            case "uppercase": return String(value).toUpperCase();
            case "date": return value; // label only — value used as-is
            default: return value;
        }
    }

    // --- STEP 3: TRANSFORM A SINGLE ENTITY ---

    function transformEntity(entity) {

        if (typeof entity !== "object" || entity === null || Array.isArray(entity)) {
            return "Invalid Input";
        }

        const output = {};

        for (const field of fields) {

            // Excluded fields are skipped entirely.

            if (!field.include) continue;

            let value = entity[field.source] === undefined ? null : entity[field.source];

            // Mask sensitive values.

            if (field.mask) {
                value = "***";
            } else if (field.format) {
                value = formatValue(value, field.format);
            }

            output[field.target] = value;
        }

        return output;
    }

    // --- STEP 4: DTO FACTORY METHODS ---

    return {
        // fromEntity(entity): single entity → DTO.
        fromEntity(entity) {
            return transformEntity(entity);
        },

        // fromEntityList(entities): array → DTO list.
        fromEntityList(entities) {

            if (!Array.isArray(entities)) return "Invalid Input";

            const dtos = entities.map(transformEntity);

            return { dtos, count: dtos.length };
        },

        // getOutputFields(): included target field names.
        getOutputFields() {

            return fields
                .filter(field => field.include)
                .map(field => field.target);
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build a User response DTO ---
const UserResponseDTO = createResponseDTO({
    dtoName: "UserResponseDTO",
    fields: [
        { source: "user_id", target: "id", type: "string", include: true, mask: false, format: null },
        { source: "user_name", target: "name", type: "string", include: true, mask: false, format: "uppercase" },
        { source: "email", target: "email", type: "string", include: true, mask: false, format: null },
        { source: "password_hash", target: "password", type: "string", include: false, mask: true, format: null },
        { source: "salary", target: "salary", type: "number", include: true, mask: false, format: "currency" }
    ]
});


// --- fromEntity ---
console.log(UserResponseDTO.fromEntity({
    user_id: "U1",
    user_name: "rahim",
    email: "rahim@mail.com",
    password_hash: "hashed_secret",
    salary: 50000
}));


// --- fromEntityList ---
console.log(UserResponseDTO.fromEntityList([
    { user_id: "U1", user_name: "rahim", email: "r@mail.com", password_hash: "h1", salary: 50000 },
    { user_id: "U2", user_name: "karim", email: "k@mail.com", password_hash: "h2", salary: 60000 }
]));


// --- getOutputFields ---
console.log(UserResponseDTO.getOutputFields());


// --- INVALID: bad format ---
console.log(createResponseDTO({
    dtoName: "Bad",
    fields: [{ source: "a", target: "b", type: "string", include: true, mask: false, format: "xml" }]
}));