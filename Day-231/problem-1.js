// 🧩 PROBLEM–01: createRequestDTO()

// Logic: Implements a Request DTO Transformer. Extracts, validates, and transforms raw request data into a clean DTO.

// Methods:
//   fromRequest(rawData) — extract + validate + transform
//   validate(data)       — validate already-extracted data
//   getSchema()          — return field definitions

function createRequestDTO(dtoConfig) {

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
    const validTransforms = ["trim", "lowercase", "uppercase", "toNumber", "toBoolean"];

    for (const field of fields) {
        if (
            typeof field !== "object" || field === null ||
            typeof field.name !== "string" || field.name.trim() === "" ||
            !validTypes.includes(field.type) ||
            typeof field.required !== "boolean"
        ) {
            return "Invalid Input";
        }

        if (field.transform !== null && !validTransforms.includes(field.transform)) {
            return "Invalid Input";
        }
    }

    // --- STEP 2: TYPE CHECK HELPER ---

    function matchesType(value, type) {
        switch (type) {
            case "string": return typeof value === "string";
            case "number": return typeof value === "number" && !Number.isNaN(value);
            case "boolean": return typeof value === "boolean";
            case "array": return Array.isArray(value);
            case "object": return typeof value === "object" && value !== null && !Array.isArray(value);
            default: return false;
        }
    }

    // --- STEP 3: APPLY TRANSFORM ---

    function applyTransform(value, transform) {
        switch (transform) {
            case "trim": return typeof value === "string" ? value.trim() : value;
            case "lowercase": return typeof value === "string" ? value.toLowerCase() : value;
            case "uppercase": return typeof value === "string" ? value.toUpperCase() : value;
            case "toNumber": return Number(value);
            case "toBoolean": return value === "true" || value === true;
            default: return value;
        }
    }

    // --- STEP 4: VALIDATE EXTRACTED DATA ---
    // Shared by both fromRequest and validate.

    function validateFields(dto) {

        const errors = [];

        for (const field of fields) {

            const value = dto[field.name];

            // Required field missing?

            if (value === undefined || value === null) {
                if (field.required) {
                    errors.push(field.name + ": required field missing");
                }
                continue;
            }

            // Type check.

            if (!matchesType(value, field.type)) {
                errors.push(field.name + ": invalid type");
            }
        }

        return errors;
    }

    // --- STEP 5: DTO FACTORY METHODS ---

    return {
        // fromRequest(rawData): extract, transform, validate.
        fromRequest(rawData) {

            if (typeof rawData !== "object" || rawData === null || Array.isArray(rawData)) {
                return { valid: false, errors: ["Invalid Input"], dto: null };
            }

            const dto = {};
            const errors = [];

            for (const field of fields) {

                let value = rawData[field.name];

                // Missing required field.

                if (value === undefined) {
                    if (field.required) {
                        errors.push(field.name + ": required field missing");
                        continue;
                    }
                    value = field.default;
                }

                // Apply transform when the value is present.

                if (value !== undefined && field.transform) {
                    value = applyTransform(value, field.transform);
                }

                dto[field.name] = value;
            }

            // Validate extracted values (types).

            const typeErrors = validateFields(dto);
            errors.push(...typeErrors);

            if (errors.length > 0) {
                return { valid: false, errors, dto: null };
            }

            return { valid: true, errors: [], dto };
        },

        // validate(data): same validation without extraction/transform.
        validate(data) {

            if (typeof data !== "object" || data === null || Array.isArray(data)) {
                return "Invalid Input";
            }

            const errors = validateFields(data);

            if (errors.length > 0) {
                return { valid: false, errors };
            }

            return { valid: true, errors: [] };
        },

        // getSchema(): return field definitions.
        getSchema() {
            return { dtoName, fields };
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build a CreateUser DTO ---
const CreateUserDTO = createRequestDTO({
    dtoName: "CreateUserDTO",
    fields: [
        { name: "username", type: "string", required: true, default: null, transform: "trim" },
        { name: "email", type: "string", required: true, default: null, transform: "lowercase" },
        { name: "age", type: "number", required: false, default: 18, transform: "toNumber" },
        { name: "active", type: "boolean", required: false, default: true, transform: "toBoolean" }
    ]
});


// --- fromRequest: all valid ---
console.log(CreateUserDTO.fromRequest({ username: "  Rahim  ", email: "RAHIM@MAIL.COM", age: "25" }));


// --- getSchema ---
console.log(CreateUserDTO.getSchema());


// --- validate: already-extracted data ---
console.log(CreateUserDTO.validate({ username: "Rahim", email: "rahim@mail.com", age: 25, active: true }));


// --- INVALID: bad field type ---
console.log(createRequestDTO({
    dtoName: "Bad",
    fields: [{ name: "x", type: "date", required: true, default: null, transform: null }]
}));