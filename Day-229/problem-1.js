// 🧩 PROBLEM–01: createModel()

// Logic: Implements the Model layer of a Mini MVC framework.

// Builds a model object from a modelConfig with these methods:

//   create(data)    — validate + insert a new record (auto id: modelName_autoIndex)
//   findById(id)    — find record by id
//   findAll()       — return all records
//   update(id,data) — merge fields into an existing record
//   delete(id)      — remove a record by id
//   count()         — total record count

function createModel(modelConfig) {

    // --- STEP 1: VALIDATE modelConfig ---

    if (
        typeof modelConfig !== "object" ||
        modelConfig === null ||
        Array.isArray(modelConfig)
    ) {
        return "Invalid Input";
    }

    const { modelName, schema } = modelConfig;

    // modelName must be a non-empty string.

    if (
        typeof modelName !== "string" ||
        modelName.trim() === ""
    ) {
        return "Invalid Input";
    }

    // schema must be a non-null plain object.
    // Each field definition: { type, required, default }
    // Supported types: "string", "number", "boolean"

    if (
        typeof schema !== "object" ||
        schema === null ||
        Array.isArray(schema)
    ) {
        return "Invalid Input";
    }

    const supportedTypes = ["string", "number", "boolean"];

    for (const fieldName of Object.keys(schema)) {
        const def = schema[fieldName];

        if (
            typeof def !== "object" ||
            def === null ||
            Array.isArray(def)
        ) {
            return "Invalid Input";
        }

        if (!supportedTypes.includes(def.type)) {
            return "Invalid Input";
        }
    }

    // --- STEP 2: INTERNAL RECORD STORE ---

    const records = [];
    let autoIndex = 0;

    // Helper: validate a candidate record against the schema.

    // - required fields must be present in data
    // - type of each provided value must match schema type
    // - missing optional fields get their default value
    // Returns { record } on success, or { error } on failure.

    function buildRecord(data) {

        if (
            typeof data !== "object" ||
            data === null ||
            Array.isArray(data)
        ) {
            return { error: "Invalid Input" };
        }

        const record = {};

        for (const fieldName of Object.keys(schema)) {

            const def = schema[fieldName];
            let value = data[fieldName];

            // Required field missing?

            if (value === undefined) {
                if (def.required) {
                    return { error: "Missing required field: " + fieldName };
                }
                value = def.default;
            }

            // Type check (skip null values so defaults like null are allowed).

            if (value !== null && typeof value !== def.type) {
                return { error: "Invalid type for field: " + fieldName };
            }

            record[fieldName] = value;
        }

        return { record };
    }

    // Helper: locate a record by its id (returns index or -1).

    function findIndexById(id) {
        return records.findIndex(r => r.id === id);
    }

    // --- STEP 3: MODEL METHODS ---

    return {
        // create(data): validate, auto-id, store.
        create(data) {

            const built = buildRecord(data);

            if (built.error) return { error: built.error };

            autoIndex++;

            const record = { id: modelName + "_" + autoIndex, ...built.record };
            records.push(record);

            return { created: true, record };
        },

        // findById(id): find record by id.
        findById(id) {

            const index = findIndexById(id);

            if (index === -1) return { found: false, id };

            return { found: true, record: records[index] };
        },

        // findAll(): return all records and count.
        findAll() {
            return { records, count: records.length };
        },

        // update(id, data): merge allowed schema fields into the record.
        update(id, data) {

            const index = findIndexById(id);

            if (index === -1) return { error: "Record not found" };

            // Only merge fields declared in the schema.

            for (const fieldName of Object.keys(schema)) {
                if (data[fieldName] !== undefined) {
                    records[index][fieldName] = data[fieldName];
                }
            }

            return { updated: true, record: records[index] };
        },

        // delete(id): remove record by id.
        delete(id) {

            const index = findIndexById(id);

            if (index === -1) return { error: "Record not found" };

            records.splice(index, 1);

            return { deleted: true, id };
        },

        // count(): total record count.
        count() {
            return records.length;
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build a User model ---
const UserModel = createModel({
    modelName: "User",
    schema: {
        name: { type: "string", required: true, default: null },
        age: { type: "number", required: false, default: 0 },
        active: { type: "boolean", required: false, default: true }
    }
});

// --- create: valid ---
console.log(UserModel.create({ name: "Rahim", age: 25 }));

// --- create: missing required field ---
console.log(UserModel.create({ age: 30 }));

// --- create: defaults applied ---
console.log(UserModel.create({ name: "Karim" }));

// --- create: wrong type ---
console.log(UserModel.create({ name: "Sadia", age: "twenty" }));

// --- findAll ---
console.log(UserModel.findAll());



// --- findById: found ---
console.log(UserModel.findById("User_1"));

// --- findById: not found ---
console.log(UserModel.findById("User_99"));

// --- update ---
console.log(UserModel.update("User_1", { age: 26 }));

// --- delete ---
console.log(UserModel.delete("User_2"));

// --- count ---
console.log(UserModel.count());

// --- INVALID: bad modelConfig ---
console.log(createModel({ modelName: "", schema: {} }));